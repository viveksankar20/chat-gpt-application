import { Groq } from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.OPENAI_API_KEY });

// Define the message type for Groq chat completions
export interface GroqChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface StreamGroqChatCompletionParams {
  messages: GroqChatMessage[];
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  stop?: string | string[] | null;
  model?: string;
}

export async function streamGroqChatCompletion({ messages, temperature = 1, maxTokens = 4096, topP = 1, stop = null, model }: StreamGroqChatCompletionParams) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not set in environment variables');
  }

  // Ensure minimum max tokens for code generation
  const adjustedMaxTokens = Math.max(maxTokens, 4096);

  const chatCompletion = await groq.chat.completions.create({
    messages,
    model: model || 'deepseek-r1-distill-llama-70b',
    temperature,
    max_completion_tokens: adjustedMaxTokens,
    top_p: topP,
    stream: true,
    stop,
  });

  // This returns an async iterator for streaming
  return chatCompletion;
}

// Non-streaming version for simpler use cases
export async function getGroqChatCompletion({ messages, temperature = 1, maxTokens = 4096, topP = 1, stop = null, model }: StreamGroqChatCompletionParams) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not set in environment variables');
  }

  const adjustedMaxTokens = Math.max(maxTokens, 4096);

  const chatCompletion = await groq.chat.completions.create({
    messages,
    model: model || 'deepseek-r1-distill-llama-70b',
    temperature,
    max_completion_tokens: adjustedMaxTokens,
    top_p: topP,
    stream: false,
    stop,
  });

  return chatCompletion;
} 