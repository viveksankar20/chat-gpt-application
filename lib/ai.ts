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

export async function streamGroqChatCompletion({ messages, temperature = 1, maxTokens = 1024, topP = 1, stop = null, model }: StreamGroqChatCompletionParams) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('GROQ_API_KEY is not set in environment variables');
  }

  const chatCompletion = await groq.chat.completions.create({
    messages,
    model: model || 'deepseek-r1-distill-llama-70b',
    temperature,
    max_completion_tokens: maxTokens,
    top_p: topP,
    stream: true,
    stop,
  });

  // This returns an async iterator for streaming
  return chatCompletion;
} 