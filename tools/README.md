# DeckCheck Tools

Actor-based automation system for analyzing pitch decks.

## Architecture

The system follows the **Actor Model** pattern from listicle-v2:

- **Actors**: Independent workers with single responsibilities
- **Communication**: Through Firebase collections (shared data layer)
- **Scheduling**: Cron-based with overlap prevention
- **Logging**: Session-based logging to Firestore

## Actors

### 1. Extractor
- **Job**: Extract text from uploaded PDFs page by page
- **Schedule**: Every 30 seconds
- **Input**: Decks with `status === 'uploaded'`
- **Output**: Page documents in `decks/{id}/pages/` subcollection

### 2. Critic
- **Job**: Analyze pages for problem statement quality
- **Schedule**: Every 20 seconds
- **Input**: Pages that haven't been critiqued
- **Output**: Insight documents in `decks/{id}/insights/` subcollection

## Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment**:
   ```bash
   cp .env.template .env
   # Edit .env and add your OPENAI_API_KEY
   ```

3. **Start Firebase emulators** (from project root):
   ```bash
   npm run firebase:emulators
   ```

4. **Start the scheduler**:
   ```bash
   npm run scheduler
   ```

## Development

### Running all services together

From project root:
```bash
npm run dev:all
```

This runs:
- Firebase emulators
- Next.js dev server
- Actor scheduler

### Testing individual actors

```bash
npm run test:extractor
npm run test:critic
```

### Type checking

```bash
npm run typecheck
```

### Building

```bash
npm run build
```

## Firebase Collections

### decks/
```typescript
{
  fileName, fileSize, fileType, storagePath
  uploadedAt, processedAt
  status: 'uploaded' | 'extracting' | 'analyzing' | 'complete' | 'error'
  pageCount, uploadedBy
}
```

### decks/{id}/pages/
```typescript
{
  pageNumber, text
  extractedAt, wordCount
  status: 'pending' | 'extracted' | 'analyzed'
}
```

### decks/{id}/insights/
```typescript
{
  type: 'problem' | 'solution' | 'market' | ...
  pageNumber, rating (1-10)
  feedback, reasoning
  actorName, generatedAt
}
```

### automationLogs/
```typescript
{
  action, deckId, status
  startedAt, completedAt
  logs[], errors[], metadata
}
```

### aiCosts/
```typescript
{
  model, tokensPrompt, tokensCompletion
  costUSD, action, actorName
  deckId, pageNumber, timestamp
}
```

## Adding New Actors

1. Create `/src/actors/{name}/index.ts`
2. Export async function for the job
3. Add to scheduler in `/src/actors/scheduler/index.ts`
4. Add prompt template to `/src/actors/prompter/prompts.ts`
5. Update insight types if needed

## Cost Tracking

All OpenAI API calls are tracked in the `aiCosts` collection.

View costs:
- Per deck: Query `aiCosts` where `deckId == X`
- Per actor: Group by `actorName`
- Over time: Order by `timestamp`

## Logging

Session-based logging pattern:

```typescript
Logger.startSession({ action: 'my_action', deckId });
Logger.add('Processing started');
Logger.add('Step complete', { data: 123 });
await Logger.endSession({ status: 'completed' });
```

All logs are written atomically to `automationLogs` collection.
