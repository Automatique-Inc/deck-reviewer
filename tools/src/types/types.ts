import { Timestamp } from 'firebase-admin/firestore';

/**
 * Deck document in Firestore
 */
export interface Deck {
  fileName: string;
  fileSize: number;
  fileType: string;
  storagePath: string;
  uploadedAt: Timestamp;
  processedAt?: Timestamp;
  status: 'uploaded' | 'extracting' | 'analyzing' | 'complete' | 'error';
  pageCount: number;
  uploadedBy: string | null; // null for anonymous uploads
  errorMessage?: string;
}

/**
 * Page subcollection document
 */
export interface Page {
  pageNumber: number;
  text: string;
  extractedAt: Timestamp;
  wordCount: number;
  status: 'pending' | 'extracted' | 'analyzed';
}

/**
 * Insight subcollection document
 */
export interface Insight {
  type: 'problem' | 'solution' | 'market' | 'traction' | 'team' | 'design' | 'monetization' | 'narrative';
  pageNumber: number;
  rating: number; // 1-10
  feedback: string;
  reasoning: string;
  actorName: string;
  generatedAt: Timestamp;
}

/**
 * Automation log document
 */
export interface AutomationLog {
  action: string;
  deckId?: string;
  status: 'completed' | 'failed' | 'no_items_found';
  startedAt: Timestamp;
  completedAt?: Timestamp;
  logs: LogEntry[];
  errors?: string[];
  metadata?: Record<string, any>;
}

export interface LogEntry {
  timestamp: Timestamp;
  message: string;
  data?: Record<string, any>;
}

/**
 * AI cost tracking document
 */
export interface AICost {
  model: string;
  tokensPrompt: number;
  tokensCompletion: number;
  totalTokens: number;
  costUSD: number;
  action: string;
  actorName: string;
  deckId?: string;
  pageNumber?: number;
  timestamp: Timestamp;
}

/**
 * OpenAI pricing configuration
 */
export interface ModelPricing {
  input: number;   // cost per 1M tokens
  output: number;  // cost per 1M tokens
}

/**
 * AI service response
 */
export interface AIResponse<T> {
  result: T;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    costUSD: number;
  };
}

/**
 * Critique result from AI
 */
export interface CritiqueResult {
  rating: number;
  feedback: string;
  reasoning: string;
}
