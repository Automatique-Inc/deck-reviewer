/**
 * Critic Actor
 *
 * Responsibilities:
 * - Find extracted pages that haven't been critiqued
 * - Analyze page for problem statement quality
 * - Create insight document with rating and feedback
 * - Track AI costs
 */

import { db, Timestamp } from '../../utils/firebase/firebaseAdminSingleton';
import { Collections, DeckStatus, InsightType } from '../../utils/firebase/firebaseConstants';
import { Logger } from '../../utils/logger';
import { Deck, Page, Insight } from '../../types/types';
import { promptCritiqueProblem } from '../prompter/prompts';
import { critiquePage } from '../servicer';

const ACTOR_NAME = 'Critic';

/**
 * Find a page that needs problem statement critique
 */
async function findPageToCritique(): Promise<{
  deckId: string;
  pageId: string;
  page: Page;
  deck: Deck;
} | null> {
  // Get all decks that are in 'analyzing' status
  const decksSnapshot = await db
    .collection(Collections.DECKS)
    .where('status', '==', DeckStatus.ANALYZING)
    .orderBy('processedAt', 'asc')
    .limit(10)
    .get();

  if (decksSnapshot.empty) {
    return null;
  }

  // Check each deck for pages that need critique
  for (const deckDoc of decksSnapshot.docs) {
    const deckId = deckDoc.id;
    const deck = deckDoc.data() as Deck;

    // Get pages from this deck
    const pagesSnapshot = await db
      .collection(Collections.DECKS)
      .doc(deckId)
      .collection(Collections.PAGES)
      .orderBy('pageNumber', 'asc')
      .get();

    // Check each page for existing problem critique
    for (const pageDoc of pagesSnapshot.docs) {
      const pageId = pageDoc.id;
      const page = pageDoc.data() as Page;

      // Check if this page already has a problem critique
      const insightsSnapshot = await db
        .collection(Collections.DECKS)
        .doc(deckId)
        .collection(Collections.INSIGHTS)
        .where('pageNumber', '==', page.pageNumber)
        .where('type', '==', InsightType.PROBLEM)
        .limit(1)
        .get();

      if (insightsSnapshot.empty) {
        // Found a page that needs critique!
        return { deckId, pageId, page, deck };
      }
    }
  }

  return null;
}

/**
 * Main critique job - analyzes one page
 */
export async function critiqueProblemStatement(): Promise<void> {
  Logger.startSession({ action: 'critique_problem' });

  try {
    // Find page to critique
    const item = await findPageToCritique();

    if (!item) {
      await Logger.endSession({ status: 'no_items_found' });
      return;
    }

    const { deckId, pageId, page, deck } = item;

    Logger.setDeckContext({
      deckId,
      fileName: deck.fileName,
    });

    Logger.add('Analyzing page', {
      pageNumber: page.pageNumber,
      wordCount: page.wordCount,
    });

    // Generate critique prompt
    const prompt = promptCritiqueProblem(page.text, {
      pageNumber: page.pageNumber,
      totalPages: deck.pageCount,
      fileName: deck.fileName,
    });

    // Call OpenAI
    const response = await critiquePage(prompt, {
      deckId,
      pageNumber: page.pageNumber,
      actorName: ACTOR_NAME,
      action: 'critique_problem',
    });

    const { rating, feedback, reasoning } = response.result;

    Logger.add('Critique complete', {
      rating,
      cost: `$${response.usage.costUSD.toFixed(4)}`,
    });

    // Create insight document
    const insightData: Insight = {
      type: InsightType.PROBLEM,
      pageNumber: page.pageNumber,
      rating,
      feedback,
      reasoning,
      actorName: ACTOR_NAME,
      generatedAt: Timestamp.now(),
    };

    await db
      .collection(Collections.DECKS)
      .doc(deckId)
      .collection(Collections.INSIGHTS)
      .add(insightData);

    Logger.add('Insight saved to Firestore');

    // Check if all pages have been analyzed
    await checkIfDeckComplete(deckId, deck.pageCount);

    await Logger.endSession({
      status: 'completed',
      metadata: {
        pageNumber: page.pageNumber,
        rating,
        costUSD: response.usage.costUSD,
      },
    });
  } catch (error) {
    Logger.error('Critique failed', error);
    await Logger.endSession({ status: 'failed' });
  }
}

/**
 * Check if all pages in a deck have been analyzed
 * If yes, update deck status to 'complete'
 */
async function checkIfDeckComplete(deckId: string, pageCount: number): Promise<void> {
  // Count total insights for this deck
  const insightsSnapshot = await db
    .collection(Collections.DECKS)
    .doc(deckId)
    .collection(Collections.INSIGHTS)
    .get();

  const insightCount = insightsSnapshot.size;

  // For now, we only have 1 insight type (problem)
  // So complete = pageCount * 1
  const expectedInsights = pageCount * 1;

  if (insightCount >= expectedInsights) {
    await db.collection(Collections.DECKS).doc(deckId).update({
      status: DeckStatus.COMPLETE,
    });

    Logger.add('Deck analysis complete! 🎉', {
      totalInsights: insightCount,
    });
  }
}
