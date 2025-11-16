/**
 * AI integration types
 */

export type AIProvider = 'openai' | 'anthropic' | 'gemini' | 'local';

export interface AIConfig {
  provider: AIProvider;
  enabled: boolean;
  apiKey?: string;
  model?: string;
  baseURL?: string; // For local models
}

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIChatRequest {
  messages: AIMessage[];
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface AIChatResponse {
  content: string;
  tokens?: number;
  cost?: number;
}

export interface AIRecipe {
  id: string;
  name: string;
  description: string;
  provider?: AIProvider;
  systemPrompt: string;
  userPromptTemplate: string;
  defaultParams?: {
    temperature?: number;
    maxTokens?: number;
  };
}
