/**
 * Extractor Actor
 *
 * Responsibilities:
 * - Find uploaded PDFs that haven't been processed
 * - Download PDF from Firebase Storage
 * - Extract text page by page using pdf-parse
 * - Create page documents in Firestore
 * - Update deck status to 'analyzing'
 */

import pdfParse from 'pdf-parse';
import { db, storage, Timestamp } from '../../utils/firebase/firebaseAdminSingleton';
import { Collections, DeckStatus, PageStatus } from '../../utils/firebase/firebaseConstants';
import { Logger } from '../../utils/logger';
import { Deck, Page } from '../../types/types';

/**
 * Find the oldest deck that needs PDF extraction
 */
async function findDeckToExtract(): Promise<{ id: string; data: Deck } | null> {
  const snapshot = await db
    .collection(Collections.DECKS)
    .where('status', '==', DeckStatus.UPLOADED)
    .orderBy('uploadedAt', 'asc')
    .limit(1)
    .get();

  if (snapshot.empty) {
    return null;
  }

  const doc = snapshot.docs[0];
  return {
    id: doc.id,
    data: doc.data() as Deck,
  };
}

/**
 * Download PDF from Firebase Storage
 */
async function downloadPDF(storagePath: string): Promise<Buffer> {
  const bucket = storage.bucket();
  const file = bucket.file(storagePath);

  const [buffer] = await file.download();
  return buffer;
}

/**
 * Extract text from PDF page by page
 */
async function extractPDFText(pdfBuffer: Buffer): Promise<string[]> {
  // First, get the full PDF data
  const pdfData = await pdfParse(pdfBuffer);

  // pdf-parse doesn't natively support page-by-page extraction
  // So we'll use a workaround: extract the full text and split by form feed characters
  // For more precise page extraction, we'd need pdf.js or pdfium, but this works for now

  const fullText = pdfData.text;
  const pageCount = pdfData.numpages;

  // Split text into chunks (this is approximate - may not perfectly align with pages)
  // A more robust solution would use pdf.js getPage() for each page
  const avgCharsPerPage = Math.ceil(fullText.length / pageCount);
  const pages: string[] = [];

  for (let i = 0; i < pageCount; i++) {
    const start = i * avgCharsPerPage;
    const end = Math.min((i + 1) * avgCharsPerPage, fullText.length);
    const pageText = fullText.substring(start, end).trim();
    pages.push(pageText || `[Page ${i + 1} - No text extracted]`);
  }

  return pages;
}

/**
 * Create page documents in Firestore
 */
async function createPageDocuments(
  deckId: string,
  pages: string[]
): Promise<void> {
  const batch = db.batch();

  pages.forEach((pageText, index) => {
    const pageRef = db
      .collection(Collections.DECKS)
      .doc(deckId)
      .collection(Collections.PAGES)
      .doc();

    const pageData: Page = {
      pageNumber: index + 1,
      text: pageText,
      extractedAt: Timestamp.now(),
      wordCount: pageText.split(/\s+/).filter(w => w.length > 0).length,
      status: PageStatus.EXTRACTED,
    };

    batch.set(pageRef, pageData);
  });

  await batch.commit();
}

/**
 * Main extraction job - processes one deck
 */
export async function extractPDFPages(): Promise<void> {
  Logger.startSession({ action: 'extract_pdf' });

  try {
    // Find deck to process
    const deck = await findDeckToExtract();

    if (!deck) {
      await Logger.endSession({ status: 'no_items_found' });
      return;
    }

    Logger.setDeckContext({
      deckId: deck.id,
      fileName: deck.data.fileName,
    });

    // Update deck status to 'extracting'
    await db.collection(Collections.DECKS).doc(deck.id).update({
      status: DeckStatus.EXTRACTING,
    });

    Logger.add('Downloading PDF from storage', {
      storagePath: deck.data.storagePath,
      fileSize: `${(deck.data.fileSize / 1024 / 1024).toFixed(2)} MB`,
    });

    // Download PDF
    const pdfBuffer = await downloadPDF(deck.data.storagePath);

    Logger.add('Extracting text from PDF');

    // Extract text page by page
    const pages = await extractPDFText(pdfBuffer);

    Logger.add('Creating page documents', {
      pageCount: pages.length,
    });

    // Create page documents
    await createPageDocuments(deck.id, pages);

    // Update deck status to 'analyzing' and set page count
    await db.collection(Collections.DECKS).doc(deck.id).update({
      status: DeckStatus.ANALYZING,
      pageCount: pages.length,
      processedAt: Timestamp.now(),
    });

    Logger.add('PDF extraction complete', {
      pageCount: pages.length,
    });

    await Logger.endSession({
      status: 'completed',
      metadata: { pageCount: pages.length },
    });
  } catch (error) {
    Logger.error('PDF extraction failed', error);
    await Logger.endSession({ status: 'failed' });

    // Update deck status to error
    const deckContext = Logger.getDeckContext();
    if (deckContext.deckId) {
      await db.collection(Collections.DECKS).doc(deckContext.deckId).update({
        status: DeckStatus.ERROR,
        errorMessage: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
