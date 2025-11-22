# Deck Reviewer: Actor-Tool Framework Proposal
## Comprehensive Architecture for 100+ AI Insights per Deck

---

## Executive Summary

**Current State**: Clean slate with solid foundation (Next.js, Firebase, Auth, Storage)
**Goal**: Build a scalable actor-tool framework that generates hundreds of insightful AI inferences per uploaded pitch deck
**Approach**: Multi-actor orchestration with composable tool layer and parallel processing

---

## 1. Current Architecture Assessment

### ✅ What's Working
- **Solid Foundation**: Next.js 14, Firebase (Auth, Storage, Firestore), Stripe
- **Upload Mechanism**: Basic PDF upload to Firebase Storage (50MB limit)
- **Multi-tenancy**: Organization-based access control
- **UI/UX**: Tailwind + Radix components, "Russ Hanneman" branding

### ❌ Critical Gaps
- **No AI Integration**: No Anthropic/OpenAI SDK
- **No Processing Pipeline**: Uploads end in storage, no analysis triggered
- **No Actor System**: No orchestration or workflow management
- **No Tool Layer**: No PDF parsing, extraction, or inference tools
- **No Data Models**: Missing `decks`, `analyses`, `insights` collections
- **No Results Dashboard**: Can't view or interact with analysis results

---

## 2. Proposed Actor-Tool Framework Architecture

### Philosophy: Multi-Layer Intelligence

```
┌─────────────────────────────────────────────────────────────────┐
│                    ORCHESTRATION LAYER                          │
│  (Routes, triggers analysis, aggregates results)                │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                      ACTOR LAYER                                │
│  (Specialized AI agents with specific domains of expertise)     │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Content    │  │   Market     │  │  Financial   │          │
│  │   Actor      │  │   Actor      │  │   Actor      │  + 20 more│
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
└─────────┼──────────────────┼──────────────────┼──────────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                       TOOL LAYER                                │
│  (Reusable functions actors can invoke)                         │
│                                                                  │
│  • extractText()      • analyzeImage()     • searchMarket()     │
│  • parseStructure()   • scoreClarity()     • evaluateMetrics()  │
│  • detectBrand()      • assessFlow()       • benchmark()        │
│  └─────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DATA LAYER                                 │
│  (Firestore collections, Storage, caching)                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Core Components

### 3.1 Orchestration Layer

**Purpose**: Coordinate analysis workflow, manage state, aggregate results

**Key Files**:
```
src/lib/orchestration/
├── deck-analyzer.ts          # Main orchestration class
├── actor-registry.ts         # Register and discover actors
├── execution-graph.ts        # Dependency management between actors
└── result-aggregator.ts      # Combine insights from all actors
```

**Workflow**:
1. Deck uploaded → Trigger analysis
2. Run "Quick Pass" actors in parallel (1-2 min)
3. Run "Deep Analysis" actors in parallel (5-10 min)
4. Run "Synthesis" actors that depend on earlier results
5. Aggregate all insights into final report
6. Generate overall score and verdict

**Benefits**:
- **Parallel Processing**: Run independent actors simultaneously
- **Dependency Management**: Some actors need others' results first
- **Graceful Degradation**: If one actor fails, others continue
- **Progressive Results**: Show quick insights first, deep analysis streams in

---

### 3.2 Actor Layer

**Definition**: An actor is a specialized AI agent with:
- A specific domain of expertise
- Access to relevant tools
- A clear output schema
- Execution time budget

**Actor Categories**:

#### Category A: Content Analysis (7 actors)
1. **Story Flow Actor**: Analyzes narrative arc, hooks, transitions
2. **Visual Design Actor**: Evaluates layout, color, typography, brand consistency
3. **Copy Quality Actor**: Assesses clarity, persuasiveness, grammar
4. **Data Visualization Actor**: Reviews charts, graphs, data integrity
5. **Slide Structure Actor**: Checks logical flow, information hierarchy
6. **Branding Actor**: Evaluates brand consistency, professional polish
7. **Accessibility Actor**: Checks readability, contrast, font sizes

#### Category B: Business Substance (8 actors)
8. **Problem-Solution Fit Actor**: Validates problem statement and solution
9. **Market Analysis Actor**: Evaluates TAM/SAM/SOM, market dynamics
10. **Competitive Landscape Actor**: Assesses competitive positioning
11. **Business Model Actor**: Evaluates revenue model, unit economics
12. **Financial Projections Actor**: Reviews financial assumptions, realism
13. **Traction Actor**: Analyzes metrics, growth, milestones
14. **Team Actor**: Evaluates team composition, relevant experience
15. **Go-to-Market Actor**: Assesses distribution, customer acquisition

#### Category C: Investor Psychology (5 actors)
16. **FOMO Generator Actor**: Evaluates scarcity, urgency, momentum signals
17. **Social Proof Actor**: Analyzes logos, testimonials, credibility markers
18. **Risk Assessment Actor**: Identifies red flags, concerns
19. **Clarity Actor**: Measures how quickly investor "gets it"
20. **Memorability Actor**: Assesses uniqueness, stickiness of pitch

#### Category D: Deep Insights (5 actors)
21. **Benchmarking Actor**: Compares against successful decks in same industry
22. **Sentiment Actor**: Emotional tone analysis (confident vs desperate)
23. **Jargon Detector Actor**: Identifies buzzword overuse, unclear language
24. **Ask Analysis Actor**: Evaluates funding ask, use of funds, timeline
25. **Exit Potential Actor**: Assesses acquisition potential, market exits

#### Category E: Slide-Specific (Variable)
26-N. **Per-Slide Actors**: Each slide gets micro-analysis
  - Problem slide actor
  - Solution slide actor
  - Market slide actor
  - etc.

**Actor Interface**:
```typescript
interface Actor {
  id: string;
  name: string;
  description: string;
  category: ActorCategory;

  // What tools this actor can use
  tools: ToolDefinition[];

  // What other actors must run first (if any)
  dependencies: string[];

  // Execution settings
  timeout: number; // ms
  priority: 'quick' | 'standard' | 'deep';

  // Main execution method
  execute(context: DeckContext): Promise<ActorResult>;
}

interface ActorResult {
  actorId: string;
  insights: Insight[];
  score: number; // 0-100
  confidence: number; // 0-1
  metadata: {
    tokensUsed: number;
    executionTime: number;
    toolCalls: ToolCall[];
  };
}

interface Insight {
  id: string;
  type: 'praise' | 'concern' | 'suggestion' | 'question' | 'observation';
  severity: 'critical' | 'important' | 'minor' | 'neutral';
  title: string;
  description: string;
  slideNumbers?: number[];
  evidence?: string; // Quote from deck
  recommendation?: string;
  impact: 'high' | 'medium' | 'low';
}
```

---

### 3.3 Tool Layer

**Purpose**: Reusable functions that actors invoke to perform specific tasks

**Tool Categories**:

#### PDF Processing Tools
```typescript
extractTextFromPDF(deckId: string): Promise<{pages: PageText[]}>
extractSlidesAsImages(deckId: string): Promise<{slides: ImageData[]}>
detectSlideLayout(slideImage: ImageData): Promise<LayoutAnalysis>
extractMetadata(deckId: string): Promise<PDFMetadata>
```

#### Vision/OCR Tools
```typescript
analyzeSlideImage(image: ImageData, prompt: string): Promise<VisionResult>
detectCharts(image: ImageData): Promise<ChartData[]>
extractTableData(image: ImageData): Promise<TableData>
detectBrandColors(image: ImageData): Promise<ColorPalette>
```

#### Text Analysis Tools
```typescript
scoreClarity(text: string): Promise<ClarityScore>
detectJargon(text: string): Promise<JargonReport>
analyzeSentiment(text: string): Promise<SentimentScore>
checkGrammar(text: string): Promise<GrammarIssue[]>
extractEntities(text: string): Promise<Entity[]> // companies, people, numbers
```

#### Market Intelligence Tools
```typescript
searchMarketSize(industry: string): Promise<MarketData>
findCompetitors(companyDescription: string): Promise<Competitor[]>
benchmarkMetrics(metrics: Metrics, industry: string): Promise<BenchmarkResult>
getIndustryTrends(industry: string): Promise<Trend[]>
```

#### Business Analysis Tools
```typescript
validateFinancialModel(projections: number[][]): Promise<ValidationResult>
assessUnitEconomics(ltv: number, cac: number): Promise<EconomicsScore>
evaluateGrowthRate(metrics: TimeSeriesData): Promise<GrowthAnalysis>
```

#### Comparative Tools
```typescript
compareToSuccessfulDecks(deckFeatures: Features): Promise<ComparisonResult>
findSimilarDecks(deckId: string): Promise<SimilarDeck[]>
```

**Tool Interface**:
```typescript
interface Tool {
  name: string;
  description: string;
  parameters: ToolParameter[];
  returns: ToolReturnSchema;

  // Rate limiting
  rateLimit?: {
    maxCallsPerMinute: number;
    maxConcurrent: number;
  };

  // Cost tracking
  cost?: {
    perCall: number;
    perToken?: number;
  };

  execute(params: any): Promise<any>;
}
```

---

### 3.4 Data Models

#### Firestore Collections

**`decks`**:
```typescript
{
  id: string;
  userId: string;
  organizationId: string;
  fileName: string;
  storagePath: string;
  uploadedAt: Timestamp;
  status: 'uploaded' | 'queued' | 'processing' | 'analyzed' | 'error';
  metadata: {
    pageCount: number;
    fileSize: number;
    version: number;
  };
  processing: {
    startedAt?: Timestamp;
    completedAt?: Timestamp;
    progress: number; // 0-100
    currentStage?: string;
  };
}
```

**`deck_analyses`**:
```typescript
{
  id: string;
  deckId: string;
  createdAt: Timestamp;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';

  // Overall results
  overallScore: number; // 0-100
  verdict: 'fucks' | 'kinda-fucks' | 'virgin';

  // Per-category scores
  categoryScores: {
    content: number;
    business: number;
    psychology: number;
  };

  // Aggregated insights
  insights: Insight[];

  // Actor execution tracking
  actorResults: {
    [actorId: string]: ActorResult;
  };

  // Summary
  strengths: string[];
  weaknesses: string[];
  topRecommendations: string[];

  // Metadata
  totalInsights: number;
  executionTime: number;
  tokensUsed: number;
  cost: number;
}
```

**`actor_executions`** (for debugging/analytics):
```typescript
{
  id: string;
  analysisId: string;
  actorId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt: Timestamp;
  completedAt?: Timestamp;
  error?: string;

  // Resource usage
  tokensUsed: number;
  toolCallCount: number;
  executionTime: number;

  // Results
  result?: ActorResult;
}
```

---

## 4. Execution Flow: From Upload to 100+ Insights

### Phase 1: Upload & Preprocessing (30-60 seconds)
```
1. User uploads PDF
2. Store in Firebase Storage
3. Create `decks` document
4. Trigger analysis via Cloud Function or API route
5. Extract text from all slides
6. Extract images of all slides
7. Extract metadata (page count, fonts, colors, etc.)
8. Update status to 'queued'
```

### Phase 2: Quick Pass Analysis (1-2 minutes)
Run "quick" priority actors in parallel:
- Slide Structure Actor
- Copy Quality Actor
- Branding Actor
- Clarity Actor

**Result**: User sees initial 20-30 insights within 2 minutes

### Phase 3: Deep Analysis (5-10 minutes)
Run "standard" and "deep" priority actors in parallel batches:

**Batch 1** (no dependencies):
- Story Flow Actor
- Visual Design Actor
- Data Visualization Actor
- Problem-Solution Fit Actor
- Competitive Landscape Actor
- Team Actor
- Risk Assessment Actor
- Sentiment Actor
- Jargon Detector Actor

**Batch 2** (depends on Batch 1):
- Market Analysis Actor (needs Problem-Solution results)
- Financial Projections Actor (needs Business Model context)
- Benchmarking Actor (needs Market + Traction data)
- Exit Potential Actor (needs Market + Competitive data)

**Result**: User sees 80-120 insights total

### Phase 4: Synthesis (1-2 minutes)
- Aggregate all insights
- Identify themes and patterns
- Prioritize top recommendations
- Generate overall score and verdict
- Create executive summary

**Result**: Complete analysis with 100-150+ insights

### Phase 5: Presentation
- Store all results in `deck_analyses`
- Send completion notification
- Redirect user to results dashboard

---

## 5. Scaling to Hundreds of Insights

### 5.1 Insight Explosion Strategies

#### Strategy A: Slide-Level Granularity
- Each actor can produce multiple insights per slide
- 20 slides × 5 actors = 100 potential insights
- Example: Visual Design Actor produces:
  - Layout assessment per slide
  - Color scheme feedback per slide
  - Typography issues per slide
  - Spacing/alignment notes per slide

#### Strategy B: Multi-Dimensional Analysis
- Each actor examines multiple dimensions
- Example: Copy Quality Actor checks:
  - Clarity (7 insights)
  - Persuasiveness (5 insights)
  - Grammar (3 insights)
  - Tone (4 insights)
  - Specificity (6 insights)
  **Total**: 25 insights from one actor

#### Strategy C: Cross-Slide Patterns
- Actors look for patterns across slides
- Example: Story Flow Actor identifies:
  - Narrative gaps between slides
  - Repetitive content
  - Missing transitions
  - Information out of sequence

#### Strategy D: Comparative Insights
- Benchmarking against similar decks
- "Top decks in your industry spend 2x more slides on traction"
- "Your market size is 50% smaller than average Series A decks"

#### Strategy E: Generative Suggestions
- Each weakness → 2-3 specific recommendations
- "Change X to Y because Z"
- "Add a slide about [topic] here"
- "Remove jargon: replace 'synergistic' with 'works together'"

---

### 5.2 Quality over Quantity

**Insight Filtering**:
```typescript
interface InsightQuality {
  actionability: number; // Can founder act on this?
  specificity: number;   // Is it specific vs generic?
  impact: number;        // How much does fixing this matter?
  confidence: number;    // How sure is the actor?
}

// Only keep insights where:
// actionability >= 0.6 AND specificity >= 0.5 AND impact >= 0.4
```

**Deduplication**:
- Multiple actors may find the same issue
- Use semantic similarity to cluster duplicate insights
- Keep the most specific/actionable version

**Prioritization**:
- Tag insights as: 🔴 Critical | 🟡 Important | 🔵 Nice-to-have
- Sort by: impact × confidence
- Show top 20 in summary, rest in detailed view

---

## 6. Implementation Roadmap

### Milestone 1: Foundation (Week 1-2)
- [ ] Install AI SDK (@anthropic-ai/sdk)
- [ ] Create tool layer base classes
- [ ] Implement PDF extraction tools
- [ ] Build actor base class and registry
- [ ] Create data models and Firestore schema
- [ ] Set up orchestration framework

### Milestone 2: MVP Actors (Week 3-4)
- [ ] Implement 5 core actors:
  1. Copy Quality Actor
  2. Visual Design Actor
  3. Story Flow Actor
  4. Market Analysis Actor
  5. Financial Projections Actor
- [ ] Build result aggregation
- [ ] Create basic results dashboard

### Milestone 3: Scale to 15 Actors (Week 5-6)
- [ ] Add 10 more actors across categories
- [ ] Implement parallel execution with dependency graph
- [ ] Build progressive results UI (show quick insights first)
- [ ] Add insight filtering and deduplication

### Milestone 4: Full Framework (Week 7-8)
- [ ] Complete all 25+ actors
- [ ] Implement benchmarking tools
- [ ] Add per-slide micro-analysis
- [ ] Build comparison to successful decks
- [ ] Create "Russ Hanneman" voice synthesis layer
- [ ] Performance optimization

### Milestone 5: Polish (Week 9-10)
- [ ] Error handling and retry logic
- [ ] Cost tracking and optimization
- [ ] Admin dashboard for monitoring
- [ ] Export to PDF/PPT with annotations
- [ ] Email summaries
- [ ] Slack/webhook notifications

---

## 7. Technical Implementation Details

### 7.1 File Structure

```
src/
├── lib/
│   ├── actors/
│   │   ├── base/
│   │   │   ├── actor.interface.ts
│   │   │   ├── actor.base.ts
│   │   │   └── actor-registry.ts
│   │   ├── content/
│   │   │   ├── story-flow.actor.ts
│   │   │   ├── visual-design.actor.ts
│   │   │   ├── copy-quality.actor.ts
│   │   │   ├── data-viz.actor.ts
│   │   │   ├── slide-structure.actor.ts
│   │   │   ├── branding.actor.ts
│   │   │   └── accessibility.actor.ts
│   │   ├── business/
│   │   │   ├── problem-solution.actor.ts
│   │   │   ├── market-analysis.actor.ts
│   │   │   ├── competitive.actor.ts
│   │   │   ├── business-model.actor.ts
│   │   │   ├── financials.actor.ts
│   │   │   ├── traction.actor.ts
│   │   │   ├── team.actor.ts
│   │   │   └── gtm.actor.ts
│   │   ├── psychology/
│   │   │   ├── fomo.actor.ts
│   │   │   ├── social-proof.actor.ts
│   │   │   ├── risk.actor.ts
│   │   │   ├── clarity.actor.ts
│   │   │   └── memorability.actor.ts
│   │   └── insights/
│   │       ├── benchmarking.actor.ts
│   │       ├── sentiment.actor.ts
│   │       ├── jargon.actor.ts
│   │       ├── ask-analysis.actor.ts
│   │       └── exit-potential.actor.ts
│   ├── tools/
│   │   ├── base/
│   │   │   ├── tool.interface.ts
│   │   │   ├── tool.base.ts
│   │   │   └── tool-registry.ts
│   │   ├── pdf/
│   │   │   ├── extract-text.tool.ts
│   │   │   ├── extract-images.tool.ts
│   │   │   ├── extract-metadata.tool.ts
│   │   │   └── detect-layout.tool.ts
│   │   ├── vision/
│   │   │   ├── analyze-image.tool.ts
│   │   │   ├── detect-charts.tool.ts
│   │   │   ├── extract-table.tool.ts
│   │   │   └── detect-colors.tool.ts
│   │   ├── text/
│   │   │   ├── score-clarity.tool.ts
│   │   │   ├── detect-jargon.tool.ts
│   │   │   ├── sentiment.tool.ts
│   │   │   ├── grammar.tool.ts
│   │   │   └── extract-entities.tool.ts
│   │   ├── market/
│   │   │   ├── search-market.tool.ts
│   │   │   ├── find-competitors.tool.ts
│   │   │   ├── benchmark.tool.ts
│   │   │   └── trends.tool.ts
│   │   └── analysis/
│   │       ├── validate-financials.tool.ts
│   │       ├── unit-economics.tool.ts
│   │       └── growth-rate.tool.ts
│   ├── orchestration/
│   │   ├── deck-analyzer.ts
│   │   ├── execution-graph.ts
│   │   ├── result-aggregator.ts
│   │   └── insight-filter.ts
│   ├── ai/
│   │   ├── anthropic-client.ts
│   │   ├── prompt-templates/
│   │   │   ├── actor-prompts.ts
│   │   │   └── tool-prompts.ts
│   │   └── token-counter.ts
│   └── deck/
│       ├── deck.service.ts
│       ├── analysis.service.ts
│       └── insight.service.ts
├── pages/
│   └── api/
│       ├── decks/
│       │   ├── upload.ts
│       │   ├── [id]/
│       │   │   ├── index.ts
│       │   │   ├── analyze.ts
│       │   │   └── analysis.ts
│       └── actors/
│           └── execute.ts
└── components/
    └── decks/
        ├── upload-form.tsx
        ├── analysis-dashboard.tsx
        ├── insight-card.tsx
        ├── insight-filter.tsx
        ├── category-scores.tsx
        └── recommendations-list.tsx
```

### 7.2 Example Actor Implementation

```typescript
// src/lib/actors/content/story-flow.actor.ts

import { Actor, ActorResult, DeckContext, Insight } from '../base/actor.interface';
import { extractTextTool } from '../../tools/pdf/extract-text.tool';
import { anthropicClient } from '../../ai/anthropic-client';

export class StoryFlowActor implements Actor {
  id = 'story-flow';
  name = 'Story Flow Analyzer';
  description = 'Analyzes narrative arc, hooks, and transitions between slides';
  category = 'content';
  tools = [extractTextTool];
  dependencies = [];
  timeout = 120000; // 2 minutes
  priority = 'standard';

  async execute(context: DeckContext): Promise<ActorResult> {
    const startTime = Date.now();
    const insights: Insight[] = [];

    // Get text from all slides
    const slideTexts = await extractTextTool.execute({ deckId: context.deckId });

    // Analyze narrative flow
    const prompt = `
You are analyzing a pitch deck's story flow. Here are the slides:

${slideTexts.pages.map((p, i) => `Slide ${i + 1}:\n${p.text}`).join('\n\n')}

Analyze:
1. Does it have a compelling hook on slide 1?
2. Is there a clear narrative arc (problem → solution → opportunity)?
3. Are transitions smooth between slides?
4. Does each slide build on the previous?
5. Is there a strong closing/CTA?

For each issue or strength, provide:
- Type: praise/concern/suggestion
- Severity: critical/important/minor
- Title: short headline
- Description: 2-3 sentences
- Slide numbers affected
- Specific recommendation

Format as JSON array of insights.
`;

    const response = await anthropicClient.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    });

    const aiInsights = JSON.parse(response.content[0].text);
    insights.push(...aiInsights);

    // Calculate score based on insights
    const criticalIssues = insights.filter(i => i.severity === 'critical').length;
    const importantIssues = insights.filter(i => i.severity === 'important').length;
    const score = Math.max(0, 100 - (criticalIssues * 20) - (importantIssues * 10));

    return {
      actorId: this.id,
      insights,
      score,
      confidence: 0.85,
      metadata: {
        tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
        executionTime: Date.now() - startTime,
        toolCalls: [{ tool: 'extractText', timestamp: Date.now() }],
      },
    };
  }
}
```

### 7.3 Example Tool Implementation

```typescript
// src/lib/tools/pdf/extract-text.tool.ts

import { Tool, ToolParameter } from '../base/tool.interface';
import { getStorage } from 'firebase-admin/storage';
import * as pdfParse from 'pdf-parse';

export const extractTextTool: Tool = {
  name: 'extractText',
  description: 'Extracts text content from all slides in a PDF',
  parameters: [
    {
      name: 'deckId',
      type: 'string',
      required: true,
      description: 'The ID of the deck to extract text from',
    },
  ],
  returns: {
    type: 'object',
    schema: {
      pages: [
        {
          pageNumber: 'number',
          text: 'string',
        },
      ],
    },
  },

  async execute(params: { deckId: string }) {
    const { deckId } = params;

    // Get deck from Firestore
    const deckDoc = await getFirestore().collection('decks').doc(deckId).get();
    if (!deckDoc.exists) {
      throw new Error(`Deck ${deckId} not found`);
    }

    const deck = deckDoc.data();
    const storagePath = deck.storagePath;

    // Download PDF from Storage
    const storage = getStorage();
    const file = storage.bucket().file(storagePath);
    const [buffer] = await file.download();

    // Parse PDF
    const pdfData = await pdfParse(buffer);

    // Extract text per page (simplified - real impl would be more sophisticated)
    const pages = pdfData.text.split('\f').map((text, index) => ({
      pageNumber: index + 1,
      text: text.trim(),
    }));

    return { pages };
  },
};
```

### 7.4 Orchestration Example

```typescript
// src/lib/orchestration/deck-analyzer.ts

import { ActorRegistry } from '../actors/base/actor-registry';
import { DeckContext, ActorResult } from '../actors/base/actor.interface';
import { ResultAggregator } from './result-aggregator';
import { ExecutionGraph } from './execution-graph';

export class DeckAnalyzer {
  private actorRegistry = new ActorRegistry();
  private resultAggregator = new ResultAggregator();

  async analyze(deckId: string): Promise<string> {
    // Create analysis document
    const analysisRef = await getFirestore().collection('deck_analyses').add({
      deckId,
      status: 'pending',
      createdAt: FieldValue.serverTimestamp(),
    });

    const context: DeckContext = {
      deckId,
      analysisId: analysisRef.id,
      metadata: {},
    };

    try {
      // Update status
      await analysisRef.update({ status: 'in_progress' });

      // Get all actors
      const actors = this.actorRegistry.getAllActors();

      // Build execution graph based on dependencies
      const graph = new ExecutionGraph(actors);
      const batches = graph.getBatches();

      // Execute in batches (parallel within batch, sequential across batches)
      const allResults: ActorResult[] = [];

      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        console.log(`Executing batch ${i + 1}/${batches.length} with ${batch.length} actors`);

        // Run actors in parallel
        const batchPromises = batch.map(actor =>
          this.executeActorSafely(actor, context)
        );

        const batchResults = await Promise.allSettled(batchPromises);

        // Collect successful results
        batchResults.forEach((result, index) => {
          if (result.status === 'fulfilled' && result.value) {
            allResults.push(result.value);
          } else if (result.status === 'rejected') {
            console.error(`Actor ${batch[index].id} failed:`, result.reason);
          }
        });

        // Add results to context for next batch
        context.previousResults = allResults;
      }

      // Aggregate all insights
      const finalResult = await this.resultAggregator.aggregate(allResults);

      // Save to Firestore
      await analysisRef.update({
        status: 'completed',
        completedAt: FieldValue.serverTimestamp(),
        ...finalResult,
      });

      return analysisRef.id;
    } catch (error) {
      await analysisRef.update({
        status: 'failed',
        error: error.message,
      });
      throw error;
    }
  }

  private async executeActorSafely(actor: Actor, context: DeckContext): Promise<ActorResult | null> {
    try {
      const result = await Promise.race([
        actor.execute(context),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), actor.timeout)
        ),
      ]);
      return result;
    } catch (error) {
      console.error(`Actor ${actor.id} failed:`, error);
      return null;
    }
  }
}
```

---

## 8. Cost & Performance Optimization

### 8.1 Cost Considerations

**Per-Deck Cost Estimate**:
- Text extraction: $0
- 25 actor executions @ $0.50 each: $12.50
- Vision analysis for 20 slides @ $0.30 each: $6.00
- Market intelligence API calls: $2.00
- **Total per deck**: ~$20-25

**Optimization Strategies**:
1. **Caching**: Cache PDF text/images, reuse across actor executions
2. **Batching**: Combine multiple tool calls in single AI request
3. **Tiered Analysis**: Offer "Quick" (5 actors, $5) vs "Deep" (25 actors, $25)
4. **Incremental**: Run quick pass first, let user approve deep analysis
5. **Token Limits**: Cap max tokens per actor

### 8.2 Performance Optimization

**Target Latency**:
- Quick Pass (5 actors): < 2 minutes
- Full Analysis (25 actors): < 10 minutes

**Strategies**:
1. **Parallel Execution**: Run independent actors simultaneously
2. **Streaming Results**: Show insights as they arrive, don't wait for all
3. **Edge Functions**: Use Vercel Edge for preprocessing
4. **Firestore Listeners**: Real-time updates to UI as actors complete
5. **Precompute**: Extract PDF on upload, before analysis starts

---

## 9. User Experience: Results Dashboard

### 9.1 Dashboard Layout

```
┌─────────────────────────────────────────────────────────────┐
│  DeckCheck Analysis: "Series A Pitch - Jan 2025"            │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Overall Verdict: KINDA FUCKS                       │   │
│  │  Score: 68/100                                       │   │
│  │  ────────────────────────────────────────────       │   │
│  │  Content: 72  Business: 65  Psychology: 70          │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  🔴 Critical Issues (3)                                     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ⚠️  Market size claims unsupported (slides 5-6)     │   │
│  │ ⚠️  Financials assume 300% growth with no traction  │   │
│  │ ⚠️  Team slide missing key roles                    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  🟡 Important Suggestions (12)  [Show All]                  │
│  🔵 Minor Improvements (47)     [Show All]                  │
│                                                              │
│  ✅ Strengths (8)                                           │
│  • Strong problem statement on slide 2                      │
│  • Clear visual hierarchy throughout                        │
│  • Compelling customer testimonials                         │
│  [Show All]                                                  │
│                                                              │
│  📊 Detailed Analysis by Category                           │
│  [Content] [Business] [Psychology] [Slide-by-Slide]        │
│                                                              │
│  💡 Top Recommendations                                     │
│  1. Add case study or pilot metrics to slide 7              │
│  2. Replace market size claims with cited sources           │
│  3. Reduce jargon in problem statement (3 terms flagged)    │
│  [See all 23 recommendations]                               │
└─────────────────────────────────────────────────────────────┘
```

### 9.2 Insight Detail View

```
┌─────────────────────────────────────────────────────────────┐
│  🟡 Market Size Claims Unsupported                          │
│                                                              │
│  Severity: Important                                        │
│  Category: Business Substance                               │
│  Affected Slides: 5, 6                                      │
│  Confidence: 89%                                             │
│                                                              │
│  Analysis:                                                   │
│  Your deck claims a "$50B TAM" but provides no source.      │
│  The Market Analysis Actor found conflicting data:          │
│  - Gartner: $32B (2024)                                     │
│  - IDC: $41B (2024)                                         │
│  - Your claim: $50B                                         │
│                                                              │
│  Evidence from your deck:                                   │
│  > "The market for AI-powered analytics is $50B and        │
│  > growing at 25% annually"                                 │
│                                                              │
│  Recommendation:                                             │
│  Replace with: "Gartner estimates the market at $32B       │
│  (2024), growing to $50B by 2026 at 25% CAGR"              │
│                                                              │
│  Impact: High - Investors will fact-check this              │
│                                                              │
│  [Mark as Fixed] [Dismiss] [Ask AI for more context]       │
└─────────────────────────────────────────────────────────────┘
```

---

## 10. Advanced Features (Future)

### 10.1 Deck Comparison
- Upload multiple versions, see what improved/regressed
- A/B test different approaches
- Track progress over iterations

### 10.2 Industry Benchmarking
- "Your deck vs. 100 successful SaaS Series A decks"
- Percentile scores per category
- What's working in your vertical right now

### 10.3 Interactive Editing
- Click "Fix this" → AI generates rewritten slide
- Export annotated PDF with inline comments
- Export PowerPoint with suggested edits as speaker notes

### 10.4 Investor Persona Simulation
- "How would a VC focused on climate tech react?"
- "How would a corporate venture arm react?"
- Different actors for different investor types

### 10.5 Predictive Scoring
- "This deck has a 68% similarity to decks that raised $5M+"
- "Decks with this profile typically raise in 4-6 months"

---

## 11. Success Metrics

### Product Metrics
- **Insights per Deck**: Target 100-150
- **Actionable Insights**: >60% rated "actionable" by users
- **Analysis Time**: <10 minutes for full deep analysis
- **User Satisfaction**: NPS >50

### Technical Metrics
- **Actor Success Rate**: >95% complete without errors
- **Cost per Analysis**: <$25
- **Latency P95**: <12 minutes
- **Insight Uniqueness**: <10% duplicates after deduplication

### Business Metrics
- **Deck Upload Rate**: Users upload avg 3 decks/month
- **Return Rate**: 70% of users return for 2nd analysis
- **Upgrade Rate**: 40% upgrade from "Quick" to "Deep" analysis
- **Referrals**: Users share results → 20% referral rate

---

## 12. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| AI hallucinates insights | High | Cross-reference with tools, confidence scoring, human review samples |
| Analysis takes too long | Medium | Progressive results, tiered analysis, parallel execution |
| Cost spirals | High | Token limits per actor, caching, cost tracking dashboard |
| Insights not actionable | High | Insight quality filter, user feedback loop, A/B test prompts |
| PDF parsing fails | Medium | Fallback to image-only analysis, support more formats |
| Actor dependencies deadlock | Low | Dependency graph validation, timeout handling |

---

## 13. Next Steps

### Immediate Actions (This Week)
1. **Install Dependencies**: Add `@anthropic-ai/sdk`, `pdf-parse`, vision libraries
2. **Create Base Classes**: Actor, Tool interfaces and base implementations
3. **Build 2 Actors**: Copy Quality + Visual Design (prove the pattern)
4. **Update Data Models**: Add Firestore collections
5. **Simple Results Page**: Show insights from 2 actors

### Short Term (Next 2 Weeks)
6. **Orchestration Layer**: Build execution graph and parallel processing
7. **Add 3 More Actors**: Story Flow, Market Analysis, Financial
8. **Results Dashboard**: Full UI with filtering, categories, recommendations
9. **Cost Tracking**: Monitor token usage and per-deck cost

### Medium Term (Next Month)
10. **Scale to 15 Actors**: Cover all major categories
11. **Insight Quality System**: Deduplication, filtering, prioritization
12. **Benchmarking**: Compare to successful decks database
13. **Export Features**: PDF annotations, PPT comments

### Long Term (Next Quarter)
14. **Full 25+ Actor Framework**: Complete coverage
15. **Advanced Features**: Deck comparison, persona simulation
16. **Performance Optimization**: Get analysis under 5 minutes
17. **Go-to-Market**: Launch beta, gather feedback, iterate

---

## Conclusion

This actor-tool framework provides a **scalable, extensible architecture** for generating hundreds of insightful AI inferences about pitch decks. By separating concerns into:

1. **Orchestration** (workflow management)
2. **Actors** (specialized AI agents)
3. **Tools** (reusable functions)
4. **Data** (structured storage)

We can:
- ✅ Scale from 5 actors to 50+ actors without architectural changes
- ✅ Run analyses in parallel for speed
- ✅ Generate 100-150+ unique, actionable insights per deck
- ✅ Maintain code quality through separation of concerns
- ✅ Track costs and optimize resource usage
- ✅ Provide progressive results (quick insights → deep analysis)

The key to reaching "hundreds of insights" is **multi-dimensional analysis** where each actor examines multiple aspects, each slide is analyzed individually, patterns are detected across slides, and comparative benchmarking adds contextual insights.

**This framework transforms DeckCheck from a simple upload tool into a comprehensive pitch deck intelligence platform.**
