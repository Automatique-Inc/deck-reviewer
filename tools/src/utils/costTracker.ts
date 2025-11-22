import { db, Timestamp } from './firebase/firebaseAdminSingleton';
import { Collections } from './firebase/firebaseConstants';
import { calculateCost, formatCost, getModelDisplayName } from '../config/openai-pricing';
import { AICost } from '../types/types';

/**
 * Track AI API call costs in Firestore
 */
export async function trackAICost(
  model: string,
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  },
  action: string,
  context: {
    actorName: string;
    deckId?: string;
    pageNumber?: number;
  }
): Promise<AICost> {
  const costUSD = calculateCost(model, usage.prompt_tokens, usage.completion_tokens);

  const costData: AICost = {
    model,
    tokensPrompt: usage.prompt_tokens,
    tokensCompletion: usage.completion_tokens,
    totalTokens: usage.total_tokens,
    costUSD,
    action,
    actorName: context.actorName,
    deckId: context.deckId,
    pageNumber: context.pageNumber,
    timestamp: Timestamp.now(),
  };

  // Write to Firestore
  await db.collection(Collections.AI_COSTS).add(costData);

  // Log to console
  console.log(
    `   💰 ${getModelDisplayName(model)}: ${usage.total_tokens} tokens = ${formatCost(costUSD)}`
  );

  return costData;
}

/**
 * Get total cost for a deck
 */
export async function getDeckTotalCost(deckId: string): Promise<number> {
  const snapshot = await db
    .collection(Collections.AI_COSTS)
    .where('deckId', '==', deckId)
    .get();

  let total = 0;
  snapshot.forEach(doc => {
    const cost = doc.data() as AICost;
    total += cost.costUSD;
  });

  return total;
}

/**
 * Get costs grouped by actor
 */
export async function getCostsByActor(deckId: string): Promise<Record<string, number>> {
  const snapshot = await db
    .collection(Collections.AI_COSTS)
    .where('deckId', '==', deckId)
    .get();

  const costs: Record<string, number> = {};

  snapshot.forEach(doc => {
    const cost = doc.data() as AICost;
    costs[cost.actorName] = (costs[cost.actorName] || 0) + cost.costUSD;
  });

  return costs;
}
