import { ModelPricing } from '../types/types';

/**
 * OpenAI API pricing as of January 2025
 * Prices are in USD per 1M tokens
 *
 * Source: https://openai.com/api/pricing/
 */
export const MODEL_PRICING: Record<string, ModelPricing> = {
  // GPT-4o (Latest flagship)
  'gpt-4o': {
    input: 2.50,
    output: 10.00,
  },
  'gpt-4o-2024-11-20': {
    input: 2.50,
    output: 10.00,
  },

  // GPT-4o Mini (Cost-efficient)
  'gpt-4o-mini': {
    input: 0.150,
    output: 0.600,
  },
  'gpt-4o-mini-2024-07-18': {
    input: 0.150,
    output: 0.600,
  },

  // GPT-4 Turbo
  'gpt-4-turbo': {
    input: 10.00,
    output: 30.00,
  },
  'gpt-4-turbo-2024-04-09': {
    input: 10.00,
    output: 30.00,
  },

  // GPT-3.5 Turbo
  'gpt-3.5-turbo': {
    input: 0.50,
    output: 1.50,
  },
  'gpt-3.5-turbo-0125': {
    input: 0.50,
    output: 1.50,
  },
};

/**
 * Calculate cost for an API call
 */
export function calculateCost(
  model: string,
  promptTokens: number,
  completionTokens: number
): number {
  const pricing = MODEL_PRICING[model];

  if (!pricing) {
    console.warn(`⚠️  No pricing data for model: ${model}. Using gpt-4o-mini pricing.`);
    return calculateCost('gpt-4o-mini', promptTokens, completionTokens);
  }

  const inputCost = (promptTokens / 1_000_000) * pricing.input;
  const outputCost = (completionTokens / 1_000_000) * pricing.output;

  return inputCost + outputCost;
}

/**
 * Format cost as USD string
 */
export function formatCost(costUSD: number): string {
  if (costUSD < 0.01) {
    return `$${(costUSD * 1000).toFixed(4)}‰`; // Show in thousandths
  }
  return `$${costUSD.toFixed(4)}`;
}

/**
 * Get model display name
 */
export function getModelDisplayName(model: string): string {
  const names: Record<string, string> = {
    'gpt-4o': 'GPT-4o',
    'gpt-4o-mini': 'GPT-4o Mini',
    'gpt-4-turbo': 'GPT-4 Turbo',
    'gpt-3.5-turbo': 'GPT-3.5 Turbo',
  };

  return names[model] || model;
}
