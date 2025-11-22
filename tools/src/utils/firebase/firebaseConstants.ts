/**
 * Firebase collection names used across the actor system
 */

export const Collections = {
  DECKS: 'decks',
  PAGES: 'pages',           // subcollection of decks
  INSIGHTS: 'insights',     // subcollection of decks
  AUTOMATION_LOGS: 'automationLogs',
  AI_COSTS: 'aiCosts',
} as const;

export const DeckStatus = {
  UPLOADED: 'uploaded',
  EXTRACTING: 'extracting',
  ANALYZING: 'analyzing',
  COMPLETE: 'complete',
  ERROR: 'error',
} as const;

export const PageStatus = {
  PENDING: 'pending',
  EXTRACTED: 'extracted',
  ANALYZED: 'analyzed',
} as const;

export const InsightType = {
  PROBLEM: 'problem',
  SOLUTION: 'solution',
  MARKET: 'market',
  TRACTION: 'traction',
  TEAM: 'team',
  DESIGN: 'design',
  MONETIZATION: 'monetization',
  NARRATIVE: 'narrative',
} as const;
