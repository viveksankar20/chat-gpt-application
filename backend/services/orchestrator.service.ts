import { detectIntent, IntentType } from './intent.service'
import { getCapabilityForIntent, ProviderName } from './modelSelector.service'
import { providerRegistry, providerOrder } from './providerRegistry'
import { modelConfigs, ModelConfig } from './models.config'
import { CacheService } from './cache.service'
import { logger } from './logger.service'
import { PerformanceTracker } from './performance.service'

function getModelByCapability(capability: string): ModelConfig | null {
  // Feature 2: Cost Optimization Engine
  // Sort by a dynamic performance score (fastest + least failures) instead of static priority.
  // We filter to ONLY freeTier models (Prefer FREE models always)
  const candidates = modelConfigs
    .filter((m) => m.freeTier && m.capabilities.includes(capability as any))
    .sort((a, b) => {
      const scoreA = PerformanceTracker.getScore(a.id, a.priority);
      const scoreB = PerformanceTracker.getScore(b.id, b.priority);
      return scoreA - scoreB; // Lower score (faster/reliable) wins
    })

  return candidates.length > 0 ? candidates[0] : null
}

async function invokeProvider(provider: ProviderName, prompt: string, modelId?: string): Promise<{response: string, isCached: boolean, durationMs: number}> {
  const service = providerRegistry[provider]
  if (!service) {
    throw new Error(`Orchestrator provider '${provider}' not configured`)
  }

  // Feature 8: API Hardening - Timeout protection (Generic wrapper)
  const TIMEOUT_MS = 30000;
  
  if (!modelId) {
    throw new Error("[orchestrator] modelId is required to generate cache key");
  }

  // Feature 1: Check Cache Before Calling AI
  const startTime = Date.now();
  const cachedResponse = await CacheService.get(prompt, modelId);
  if (cachedResponse) {
    logger.info('Cache hit in orchestrator', { provider, modelId });
    return { response: cachedResponse, isCached: true, durationMs: Date.now() - startTime };
  }

  logger.info(`Invoking provider: ${provider}`, { modelId });

  // Add timeout wrapper
  const timeoutPromise = new Promise<never>((_, reject) => 
    setTimeout(() => reject(new Error(`Provider timeout after ${TIMEOUT_MS}ms`)), TIMEOUT_MS)
  );

  const providerCall = service.generateResponse(prompt, modelId);
  
  try {
    const result = await Promise.race([providerCall, timeoutPromise]) as string;
    const durationMs = Date.now() - startTime;
    
    // Feature 6: Log performance and cache result
    PerformanceTracker.recordSuccess(modelId, durationMs);
    await CacheService.set(prompt, modelId, result);

    logger.info('Provider call successful', { provider, modelId, durationMs });
    return { response: result, isCached: false, durationMs };
  } catch (err: any) {
    // Feature 6 & 5: Record failure
    PerformanceTracker.recordFailure(modelId);
    logger.error('Provider call failed', { provider, modelId, error: err.message });
    throw err;
  }
}

async function invokeProviderStream(provider: ProviderName, prompt: string, modelId?: string): Promise<{stream: ReadableStream<string>, isCached: boolean, provider: ProviderName, modelId: string}> {
  const service = providerRegistry[provider]
  if (!service) {
    throw new Error(`Orchestrator provider '${provider}' not configured`)
  }

  if (!modelId) {
    throw new Error("[orchestrator] modelId is required");
  }

  // Check Cache first (Non-streaming for cached results is fine, we just wrap it)
  const cachedResponse = await CacheService.get(prompt, modelId);
  if (cachedResponse) {
    logger.info('Cache hit in orchestrator (stream context)', { provider, modelId });
    const s = new ReadableStream({
      start(controller) {
        controller.enqueue(cachedResponse);
        controller.close();
      }
    });
    return { stream: s, isCached: true, provider, modelId };
  }

  if (!service.generateStream) {
    // Fallback to non-streaming if provider doesn't support it (should not happen for Groq now)
    const response = await service.generateResponse(prompt, modelId);
    const s = new ReadableStream({
      start(controller) {
        controller.enqueue(response);
        controller.close();
      }
    });
    return { stream: s, isCached: false, provider, modelId };
  }

  const stream = await service.generateStream(prompt, modelId);
  
  // Create a combined stream that also caches the result
  let fullContent = "";
  const transformStream = new TransformStream({
     transform(chunk, controller) {
       fullContent += chunk;
       controller.enqueue(chunk);
     },
     flush() {
       if (fullContent) {
          CacheService.set(prompt, modelId, fullContent).catch(e => console.error("Failed to cache stream result", e));
       }
     }
  });

  return { 
    stream: stream.pipeThrough(transformStream), 
    isCached: false, 
    provider, 
    modelId 
  };
}

function getFallbackSequence(primary: ProviderName): ProviderName[] {
  return providerOrder.filter((provider) => provider !== primary)
}

export interface OrchestratorResult {
  intent: IntentType
  provider: ProviderName
  modelId: string
  fallbackUsed?: ProviderName
  response: string
  durationMs: number
  isCached: boolean
}

export async function orchestrate(prompt: string, modelSelection?: { modelId?: string; mode?: 'smart' | 'advanced' }): Promise<OrchestratorResult> {
  // Feature 8: API Hardening - Strict Input Validation
  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    logger.warn('Invalid prompt received', { promptLength: prompt?.length });
    throw new Error('[orchestrator] invalid prompt provided')
  }

  const intent = detectIntent(prompt)

  // Model Selection Logic
  let selectedModel: ModelConfig | null = null
  if (modelSelection?.modelId) {
    selectedModel = modelConfigs.find((m) => m.id === modelSelection.modelId && m.freeTier) || null
  }

  if (!selectedModel) {
    const capability = getCapabilityForIntent(intent)
    selectedModel = getModelByCapability(capability)
  }

  if (!selectedModel) {
    logger.error('No free model available', { intent });
    throw new Error('[orchestrator] no free model available for request')
  }

  const primaryProvider = selectedModel.provider
  const modelId = selectedModel.id

  logger.info('Routing request', { intent, selectedModel: modelId, provider: primaryProvider });

  // Feature 4: Retry + Failover
  const attemptProvider = async (provider: ProviderName, modelIdParam: string) => {
    return await invokeProvider(provider, prompt, modelIdParam);
  }

  // 1. First attempt with selected model provider
  try {
    const result = await attemptProvider(primaryProvider, modelId)
    return {
      intent,
      provider: primaryProvider,
      modelId,
      ...result
    }
  } catch (primaryError) {
    logger.warn('Primary attempt failed; retrying once', { provider: primaryProvider, modelId });
  }

  // 2. Retry once with primary provider
  try {
    const result = await attemptProvider(primaryProvider, modelId)
    return {
      intent,
      provider: primaryProvider,
      modelId,
      ...result
    }
  } catch (retryError) {
    logger.warn('Primary retry failed; initiating failover sequence', { provider: primaryProvider });
  }

  // 3. Failover
  const fallbackProviders = getFallbackSequence(primaryProvider)
  for (const fallbackProvider of fallbackProviders) {
    // Pick the highest performing free model for the fallback provider
    const fallbackModel = modelConfigs
      .filter((m) => m.freeTier && m.provider === fallbackProvider)
      .sort((a, b) => PerformanceTracker.getScore(a.id, a.priority) - PerformanceTracker.getScore(b.id, b.priority))[0]

    if (!fallbackModel) continue;

    try {
      const result = await attemptProvider(fallbackProvider, fallbackModel.id)
      return {
        intent,
        provider: fallbackProvider,
        modelId: fallbackModel.id,
        fallbackUsed: fallbackProvider,
        ...result
      }
    } catch (fallbackError) {
      logger.warn('Fallback provider failed', { provider: fallbackProvider });
    }
  }

  logger.error('CRITICAL: All providers failed');
  throw new Error('[orchestrator] all providers failed, unable to fulfill request')
}

export async function orchestrateStream(prompt: string, modelSelection?: { modelId?: string; mode?: 'smart' | 'advanced' }): Promise<{stream: ReadableStream<string>, isCached: boolean, provider: ProviderName, modelId: string}> {
  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    throw new Error('[orchestrator] invalid prompt provided')
  }

  const intent = detectIntent(prompt)
  let selectedModel: ModelConfig | null = null
  if (modelSelection?.modelId) {
    selectedModel = modelConfigs.find((m) => m.id === modelSelection.modelId && m.freeTier) || null
  }

  if (!selectedModel) {
    const capability = getCapabilityForIntent(intent)
    selectedModel = getModelByCapability(capability)
  }

  if (!selectedModel) {
    throw new Error('[orchestrator] no free model available for request')
  }

  const primaryProvider = selectedModel.provider
  const modelId = selectedModel.id

  try {
    return await invokeProviderStream(primaryProvider, prompt, modelId);
  } catch (err) {
    logger.warn('Primary stream attempt failed; attempting fallback', { provider: primaryProvider });
    // Minimal fallback: try first fallback provider
    const fallbackProviders = getFallbackSequence(primaryProvider);
    for (const fallback of fallbackProviders) {
       const fallbackModel = modelConfigs.find(m => m.provider === fallback && m.freeTier);
       if (fallbackModel) {
          try {
             return await invokeProviderStream(fallback, prompt, fallbackModel.id);
          } catch (e) {
             continue;
          }
       }
    }
    throw err;
  }
}
