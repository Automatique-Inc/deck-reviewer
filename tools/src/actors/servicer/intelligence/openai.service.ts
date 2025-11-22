import OpenAI from 'openai';
import { encoding_for_model, TiktokenModel } from 'tiktoken';
import { env } from '../../../utils/env';
import { trackAICost } from '../../../utils/costTracker';
import { AIResponse, CritiqueResult } from '../../../types/types';
import { CritiqueContext } from '../../prompter/prompts';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
});

// Default model for critiques
const DEFAULT_MODEL = 'gpt-4o-mini';
const DEFAULT_TEMPERATURE = 0.3;

/**
 * Call OpenAI API with a prompt and return structured JSON response
 */
async function callOpenAI<T>(
  prompt: string,
  options: {
    model?: string;
    temperature?: number;
    systemMessage?: string;
  } = {}
): Promise<AIResponse<T>> {
  const model = options.model || DEFAULT_MODEL;
  const temperature = options.temperature ?? DEFAULT_TEMPERATURE;
  const systemMessage = options.systemMessage || 'You are a helpful assistant that responds in JSON format.';

  try {
    const response = await openai.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature,
    });

    const usage = response.usage!;
    const content = response.choices[0].message.content || '{}';

    return {
      result: JSON.parse(content) as T,
      usage: {
        promptTokens: usage.prompt_tokens,
        completionTokens: usage.completion_tokens,
        totalTokens: usage.total_tokens,
        costUSD: 0, // Will be calculated by trackAICost
      },
    };
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw error;
  }
}

/**
 * Critique a page of a pitch deck
 */
export async function critiquePage(
  prompt: string,
  context: {
    deckId: string;
    pageNumber: number;
    actorName: string;
    action: string;
  }
): Promise<AIResponse<CritiqueResult>> {
  const response = await callOpenAI<CritiqueResult>(prompt, {
    systemMessage: 'You are an expert venture capitalist reviewing pitch decks. Respond in JSON format.',
  });

  // Track cost
  const costData = await trackAICost(
    DEFAULT_MODEL,
    {
      prompt_tokens: response.usage.promptTokens,
      completion_tokens: response.usage.completionTokens,
      total_tokens: response.usage.totalTokens,
    },
    context.action,
    {
      actorName: context.actorName,
      deckId: context.deckId,
      pageNumber: context.pageNumber,
    }
  );

  response.usage.costUSD = costData.costUSD;

  return response;
}

/**
 * Count tokens in a string (useful for pre-flight cost estimation)
 */
export function countTokens(text: string, model: string = DEFAULT_MODEL): number {
  try {
    const encoder = encoding_for_model(model as TiktokenModel);
    const tokens = encoder.encode(text);
    const count = tokens.length;
    encoder.free();
    return count;
  } catch (error) {
    console.warn(`Failed to count tokens for model ${model}:`, error);
    // Rough estimate: ~4 characters per token
    return Math.ceil(text.length / 4);
  }
}
