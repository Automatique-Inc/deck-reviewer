# Deck Reviewer: Architecture Review & Scaling to 100+ Insights

**Review Date**: January 2025
**Current Status**: ✅ Working MVP with 1 Actor
**Goal**: Scale to 100-150 unique insights per deck

---

## Executive Summary

You've built a **solid, production-ready foundation** using the actor pattern from listicle-v2. The architecture is clean, well-documented, and already demonstrates the complete flow from PDF upload → extraction → AI analysis → real-time UI updates.

**Current Capability**: 1 insight per page (problem statement critique)
**Target Capability**: 100-150 insights per deck across 20+ dimensions
**Assessment**: Architecture is perfectly positioned to scale 🚀

---

## Part 1: What's Been Built (Architecture Review)

### ✅ Strengths of Current Implementation

#### 1. **Clean Actor Pattern**
```
Extractor → Critic → (Future Actors)
    ↓         ↓
  Pages   Insights
```

**Why this is excellent**:
- **Single Responsibility**: Each actor does one thing well
- **Loose Coupling**: Actors communicate via Firestore, not direct calls
- **Independent Scaling**: Can run actors on different machines/schedules
- **Easy to Debug**: Session-based logging shows exact flow
- **No Deadlocks**: No complex dependency management (yet)

#### 2. **Robust Utilities**

**Logger** (`utils/logger.ts`):
- ✅ Session-based logging (atomic writes)
- ✅ Console + Firestore dual output
- ✅ Automatic error tracking
- ✅ Deck context threading
- **Rating**: 10/10 - Production ready

**Cost Tracker** (`utils/costTracker.ts`):
- ✅ Tracks every AI call
- ✅ Stores token counts + USD cost
- ✅ Queryable by deck/actor/time
- ✅ Console output for debugging
- **Rating**: 10/10 - Critical for production

**Firebase Singleton** (`utils/firebase/firebaseAdminSingleton.ts`):
- ✅ Auto-detects emulator vs production
- ✅ Properly initializes Admin SDK
- ✅ Single source of truth
- **Rating**: 10/10 - Perfect

#### 3. **Smart Scheduler**

**Overlap Prevention**:
```typescript
function preventOverlap(jobName: string, jobFn: () => Promise<void>) {
  if (runningJobs.get(jobName)) {
    console.log(`⏭️  Skipping ${jobName}`);
    return;
  }
  // Run job...
}
```

**Why this matters**:
- Prevents resource exhaustion
- Avoids duplicate processing
- Graceful handling when jobs run long
- **Critical for scaling** - without this, 25 actors would pile up

#### 4. **Real-Time UI**

**Streaming Insights** (`src/pages/decks/[id].tsx`):
```typescript
onSnapshot(insightsQuery, (snapshot) => {
  const newInsights = [];
  snapshot.forEach((doc) => {
    newInsights.push({ id: doc.id, ...doc.data() });
  });
  setInsights(newInsights);
});
```

**Why this is beautiful**:
- Users see insights as they're generated
- No polling, no refresh needed
- Feels magical ("it just works")
- **Keeps users engaged** during 5-10 min analysis

#### 5. **Type Safety**

**TypeScript Interfaces** (`types/types.ts`):
- Well-defined data models
- Shared between actors
- IDE autocomplete works
- Catch bugs at compile time
- **Rating**: 9/10 - Could add Zod validation

---

### 🔍 Current Limitations

#### 1. **Single Critique Type**
- Only "problem statement" critique is active
- **Impact**: ~1 insight per page = 10-20 insights total
- **Easy Fix**: Add more actor types (planned in prompts.ts)

#### 2. **PDF Extraction is Approximate**
```typescript
// Current approach (line 67 in extractor/index.ts):
const avgCharsPerPage = Math.ceil(fullText.length / pageCount);
```

**Issues**:
- Splits text evenly, not by actual pages
- May split mid-sentence
- Headers/footers might be misaligned

**Impact**: Medium - Insights may reference wrong page numbers

**Fix Options**:
- A) Use `pdf.js` for proper page-by-page extraction
- B) Use `pdfium` or Python's `PyPDF2` via subprocess
- C) Accept approximate pages (works for most decks)

**Recommendation**: Start with (C), upgrade to (A) if users complain

#### 3. **No Cross-Page Analysis**
- Each page analyzed independently
- No "narrative flow" or "deck structure" insights
- No "slide X contradicts slide Y" detection

**Impact**: High - Misses ~30% of potential insights

**Fix**: Add "aggregator actors" that run after page-level actors

#### 4. **No Vision Analysis**
- Only text extraction, no image analysis
- Misses: charts, design quality, branding, layout

**Impact**: High - Visual design is 50% of a deck's impact

**Fix**: Add vision actors using OpenAI Vision API or Claude with image input

#### 5. **Completion Logic is Simplistic**
```typescript
const expectedInsights = pageCount * 1; // Only 1 insight type
if (insightCount >= expectedInsights) {
  status = 'complete';
}
```

**Impact**: Won't scale when you have 20+ insight types

**Fix**: Track expected insight count per actor type

---

## Part 2: Scaling Strategy to 100+ Insights

### Architecture Evolution

#### Phase 1: Current (1 Actor = ~15 insights)
```
Upload → Extractor → Critic (Problem) → Complete
                         ↓
                    1 insight per page
```

#### Phase 2: Multi-Critique (5 Actors = ~75 insights)
```
Upload → Extractor → [Parallel Actors]
                     ├─ Problem Critic
                     ├─ Solution Critic
                     ├─ Market Critic
                     ├─ Design Critic
                     └─ Traction Critic
                         ↓
                    5 insights per page
```

#### Phase 3: Multi-Dimensional (15 Actors = ~150 insights)
```
Upload → Extractor → [Page-Level Actors] → [Deck-Level Actors] → Complete
                            ↓                       ↓
                     Page insights (5-7 per page)  Deck insights (20-30 total)
```

---

### Specific Actor Proposals

#### Category A: Page-Level Critiques (Add 6 Actors)

**Already Have**:
1. ✅ Problem Statement Critic

**Add Next** (Priority Order):

2. **Solution/Product Critic**
   - File: `actors/solution-critic/index.ts`
   - Prompt: `promptCritiqueSolution()` (already stubbed!)
   - Evaluates: Clarity, feasibility, differentiation, value prop
   - Schedule: Every 20 seconds
   - Output: 1 insight per page (type: 'solution')

3. **Market Analysis Critic**
   - File: `actors/market-critic/index.ts`
   - Prompt: `promptCritiqueMarket()` (already stubbed!)
   - Evaluates: TAM/SAM/SOM, sources, growth rate, market trends
   - Schedule: Every 20 seconds
   - Output: 1 insight per page (type: 'market')

4. **Traction/Metrics Critic**
   - File: `actors/traction-critic/index.ts`
   - Evaluates: Metrics shown, growth, credibility, benchmarks
   - Schedule: Every 20 seconds
   - Output: 1 insight per page (type: 'traction')

5. **Team Critic**
   - File: `actors/team-critic/index.ts`
   - Evaluates: Relevant experience, completeness, credibility
   - Schedule: Every 20 seconds
   - Output: 1 insight per page (type: 'team')

6. **Design Quality Critic** (Vision-based)
   - File: `actors/design-critic/index.ts`
   - Evaluates: Layout, typography, color, hierarchy, professionalism
   - **Requires**: Slide images (not just text)
   - Schedule: Every 30 seconds (vision API is slower)
   - Output: 1 insight per page (type: 'design')

7. **Copy Quality Critic**
   - File: `actors/copy-critic/index.ts`
   - Evaluates: Clarity, grammar, jargon, persuasiveness
   - Schedule: Every 20 seconds
   - Output: 1 insight per page (type: 'copy')

**Result**: 7 actors × 15 pages = **~105 page-level insights**

---

#### Category B: Deck-Level Critiques (Add 8 Actors)

These run **after** all pages are extracted, analyze the **entire deck**.

8. **Narrative Flow Analyzer**
   - File: `actors/narrative-analyzer/index.ts`
   - Input: All page texts
   - Evaluates: Story arc, transitions, hooks, CTA
   - Schedule: Runs once when status == 'analyzing' AND all pages extracted
   - Output: **5-8 insights** about overall narrative
   - Examples:
     - "Opening lacks a compelling hook"
     - "Transition from slide 3→4 is abrupt"
     - "Missing a clear call-to-action at end"

9. **Slide Structure Analyzer**
   - File: `actors/structure-analyzer/index.ts`
   - Input: All page texts + page count
   - Evaluates: Deck length, slide order, information architecture
   - Output: **3-5 insights**
   - Examples:
     - "Deck is too long (25 slides, ideal is 10-15)"
     - "Market slide should come before solution slide"
     - "Missing a competition slide"

10. **Jargon Detector**
    - File: `actors/jargon-detector/index.ts`
    - Input: All page texts
    - Evaluates: Buzzwords, unclear terms, acronyms
    - Output: **5-10 insights** (one per jargon instance)
    - Examples:
      - "Replace 'synergistic' with 'works together' on slide 4"
      - "Acronym 'CAC' not defined on slide 7"

11. **Sentiment Analyzer**
    - File: `actors/sentiment-analyzer/index.ts`
    - Input: All page texts
    - Evaluates: Tone (confident vs desperate), urgency, emotion
    - Output: **2-4 insights**
    - Examples:
      - "Tone is overly apologetic on slides 2-3"
      - "Strong confidence signals on traction slide"

12. **Benchmarking Analyzer** (Advanced)
    - File: `actors/benchmarking-analyzer/index.ts`
    - Input: Deck metadata + extracted entities
    - Evaluates: Compare to successful decks in same industry
    - **Requires**: Database of reference decks
    - Output: **5-10 insights**
    - Examples:
      - "Top SaaS decks spend 20% more slides on traction"
      - "Your market size claim is 2x industry average"

13. **Financial Model Validator** (Advanced)
    - File: `actors/financial-validator/index.ts`
    - Input: Pages with numbers/projections
    - Evaluates: Consistency, realism, unit economics
    - Output: **3-5 insights**
    - Examples:
      - "Growth rate of 300% YoY is unrealistic without traction"
      - "Slide 8 claims $1M ARR but slide 12 shows $500K"

14. **Ask/Use-of-Funds Analyzer**
    - File: `actors/ask-analyzer/index.ts`
    - Input: Pages mentioning funding/capital/raise
    - Evaluates: Clarity of ask, use of funds, timeline
    - Output: **2-3 insights**
    - Examples:
      - "Funding ask is unclear (no specific amount stated)"
      - "Use of funds is too vague ('growth and operations')"

15. **Completeness Checker**
    - File: `actors/completeness-checker/index.ts`
    - Input: All pages
    - Evaluates: Missing critical slides
    - Output: **3-5 insights**
    - Examples:
      - "Missing a slide about competition"
      - "No clear business model explained"
      - "Team slide is missing"

**Result**: 8 deck-level actors × avg 5 insights = **~40 deck-level insights**

---

### Grand Total: 15 Actors = ~145 Insights per Deck

| Category | Actors | Insights per Deck |
|----------|--------|-------------------|
| Page-Level Critiques | 7 | ~105 (7 × 15 pages) |
| Deck-Level Analysis | 8 | ~40 (varied) |
| **TOTAL** | **15** | **~145 insights** |

---

## Part 3: Implementation Plan

### Milestone 1: Add 3 Page-Level Critics (Week 1)
**Goal**: Prove the pattern scales, reach ~60 insights per deck

**Tasks**:
1. Copy `critic/index.ts` to `solution-critic/index.ts`
2. Update to use `promptCritiqueSolution()` and `InsightType.SOLUTION`
3. Add to scheduler: `cron.schedule('*/20 * * * * *', critiqueSolution)`
4. Repeat for `market-critic` and `traction-critic`
5. Update completion logic to expect 4 insight types per page
6. Test with sample deck

**Expected Outcome**: 4 insights/page × 15 pages = 60 insights

---

### Milestone 2: Add Vision-Based Design Critic (Week 2)
**Goal**: Unlock visual analysis, critical for deck quality

**New Challenge**: Need slide images, not just text

**Solution A: Extract Images from PDF**
```typescript
// In extractor/index.ts
import { fromPath } from 'pdf2pic';

async function extractSlideImages(
  pdfPath: string,
  pageCount: number
): Promise<Buffer[]> {
  const converter = fromPath(pdfPath, {
    density: 100,
    saveFilename: 'slide',
    savePath: './temp',
    format: 'png',
    width: 1920,
    height: 1080,
  });

  const images: Buffer[] = [];
  for (let i = 1; i <= pageCount; i++) {
    const result = await converter(i, { responseType: 'buffer' });
    images.push(result.buffer);
  }
  return images;
}
```

**Storage Strategy**:
- Option A: Store images in Firebase Storage (`/decks/{id}/slides/{pageNum}.png`)
- Option B: Store base64 in Firestore page documents
- **Recommendation**: Option A (cleaner, cheaper)

**Design Critic Implementation**:
```typescript
// actors/design-critic/index.ts
import { analyzeImageWithVision } from '../servicer/intelligence/openai.service';

export async function critiqueDesign(): Promise<void> {
  // Find page without design insight
  const item = await findPageToCritique();

  // Download slide image from storage
  const imageBuffer = await downloadSlideImage(item.deckId, item.page.pageNumber);

  // Call OpenAI Vision API
  const prompt = `Analyze the visual design of this pitch deck slide...`;
  const response = await analyzeImageWithVision(imageBuffer, prompt);

  // Save insight
  await saveInsight({ type: 'design', ...response });
}
```

**Expected Outcome**: 5 insights/page × 15 pages = 75 insights (adds design to existing 4)

---

### Milestone 3: Add First Deck-Level Actor (Week 3)
**Goal**: Prove deck-level analysis works

**Pick**: Narrative Flow Analyzer (high impact, no external deps)

**New Pattern**: Triggered when all pages extracted

```typescript
// actors/narrative-analyzer/index.ts
async function findDeckToAnalyze(): Promise<Deck | null> {
  const snapshot = await db
    .collection('decks')
    .where('status', '==', 'analyzing')
    .get();

  for (const deckDoc of snapshot.docs) {
    const deck = deckDoc.data();

    // Check if narrative analysis already exists
    const narrativeInsight = await db
      .collection('decks')
      .doc(deckDoc.id)
      .collection('insights')
      .where('type', '==', 'narrative')
      .limit(1)
      .get();

    if (narrativeInsight.empty) {
      // Check if all pages are extracted
      const pagesSnapshot = await db
        .collection('decks')
        .doc(deckDoc.id)
        .collection('pages')
        .get();

      if (pagesSnapshot.size === deck.pageCount) {
        // Ready to analyze!
        return { id: deckDoc.id, ...deck };
      }
    }
  }

  return null;
}

export async function analyzeNarrative(): Promise<void> {
  const deck = await findDeckToAnalyze();
  if (!deck) return;

  // Get all pages in order
  const pages = await getAllPages(deck.id);
  const fullText = pages.map(p => p.text).join('\n\n---\n\n');

  // Call AI with full deck context
  const prompt = promptAnalyzeNarrative(fullText, deck.pageCount);
  const response = await analyzeNarrative(prompt);

  // Response should be an array of insights
  const insights = response.result.insights; // [{rating, feedback, reasoning, slideNumbers}, ...]

  // Save all narrative insights
  for (const insight of insights) {
    await db
      .collection('decks')
      .doc(deck.id)
      .collection('insights')
      .add({
        type: 'narrative',
        ...insight,
        actorName: 'NarrativeAnalyzer',
        generatedAt: Timestamp.now(),
      });
  }
}
```

**Prompt Example**:
```typescript
export function promptAnalyzeNarrative(
  fullText: string,
  pageCount: number
): string {
  return `You are analyzing the narrative flow of a ${pageCount}-slide pitch deck.

FULL DECK TEXT:
${fullText}

Analyze:
1. Does it have a compelling hook in the opening?
2. Is there a clear story arc (problem → solution → opportunity)?
3. Are transitions between slides smooth?
4. Does each slide build on the previous?
5. Is there a strong closing/call-to-action?

Respond with JSON:
{
  "insights": [
    {
      "rating": <1-10>,
      "feedback": "<specific issue or praise>",
      "reasoning": "<why this matters>",
      "slideNumbers": [<affected slides>]
    },
    // ... 5-8 insights total
  ]
}`;
}
```

**Schedule**: Every 30 seconds (deck-level is slower, uses more tokens)

**Expected Outcome**: +8 narrative insights per deck = **83 total insights**

---

### Milestone 4: Scaling to 10+ Actors (Week 4-6)

**Parallel Implementation**:
- Add 2-3 actors per week
- Test each individually before scheduling
- Monitor costs (deck-level actors use 10x more tokens)

**Actors to Add** (Priority Order):
1. ✅ Narrative Flow (M3)
2. Slide Structure Analyzer
3. Jargon Detector
4. Copy Quality Critic (page-level)
5. Team Critic (page-level)
6. Completeness Checker
7. Sentiment Analyzer
8. Ask/Use-of-Funds Analyzer

**At End of M4**: 13 actors, ~120 insights per deck

---

### Milestone 5: Advanced Features (Week 7-8)

**1. Benchmarking Actor**
- Requires: Database of reference decks
- Build: Scrape 50-100 successful pitch decks (YC, 500 Startups, etc.)
- Store: Metadata in Firestore (industry, stage, outcome, key metrics)
- Compare: User's deck to similar decks

**2. Financial Model Validator**
- Extract numbers using regex or entity extraction
- Cross-reference claims across slides
- Flag inconsistencies or unrealistic assumptions

**3. Insight Deduplication**
- Problem: Multiple actors may find same issue
- Solution: Use semantic similarity (OpenAI embeddings)
- Keep most specific version, discard duplicates

**4. Insight Prioritization**
- Add `severity` field: 'critical' | 'important' | 'minor'
- Add `impact` score: 1-10
- Sort by `severity × impact × rating`
- Show top 20 in summary, rest in details

---

## Part 4: Cost & Performance Projections

### Current Cost (1 Actor)

**Per Deck** (15 pages):
- Extractor: $0 (pdf-parse is local)
- Problem Critic: 15 pages × $0.0005 = **$0.0075**
- **Total**: ~$0.01 per deck

**With 15 Actors**:

| Actor Type | Count | Cost per Call | Calls per Deck | Subtotal |
|------------|-------|---------------|----------------|----------|
| Page-Level | 7 | $0.0005 | 7 × 15 = 105 | $0.05 |
| Deck-Level (text) | 6 | $0.005 | 6 | $0.03 |
| Deck-Level (vision) | 1 | $0.02 | 15 images | $0.30 |
| Advanced (benchmarking) | 1 | $0.01 | 1 | $0.01 |
| **TOTAL** | **15** | - | - | **$0.39** |

**Target**: Keep under $0.50 per deck for profitability

**Optimization Strategies**:
1. Use `gpt-4o-mini` for most actors (current default ✅)
2. Use `gpt-4o` only for complex deck-level analysis
3. Batch vision API calls (analyze 3 slides in 1 call)
4. Cache results (don't re-analyze if user re-uploads same deck)
5. Offer tiered pricing:
   - **Quick Pass** ($1): 3 actors, 45 insights, 2 min
   - **Deep Analysis** ($5): 15 actors, 145 insights, 10 min
   - **Ultra Deep** ($15): 25 actors + human review, 200+ insights

---

### Performance Projections

**Current** (1 actor):
- Extraction: 30 seconds
- Analysis: 15 pages × 3 sec = 45 seconds
- **Total**: ~75 seconds (1.25 min)

**With 15 Actors**:

**Scenario A: Sequential (slow)**
- 15 actors × 45 sec = 675 seconds = **11.25 minutes** ❌

**Scenario B: Parallel (fast)**
- Page-level actors run in parallel: 45 seconds
- Deck-level actors run in parallel: 60 seconds
- **Total**: ~2 minutes ✅

**How to Achieve Parallel**:

**Option 1: Multiple Scheduler Processes**
```bash
# Run 3 instances of scheduler on different ports
npm run scheduler:instance1 &
npm run scheduler:instance2 &
npm run scheduler:instance3 &
```

**Option 2: Batch Processing in Actors**
```typescript
async function critiqueProblem(): Promise<void> {
  // Instead of processing 1 page at a time:
  const pages = await findPagesToCritique(5); // Get 5 pages

  // Process in parallel
  await Promise.all(pages.map(page => processPage(page)));
}
```

**Recommendation**: Start with Option 2 (simpler), move to Option 1 for production scale

---

## Part 5: Advanced Scaling Techniques

### Technique 1: Multi-Dimensional Insights

**Instead of**: 1 insight per actor per page
**Do**: Each actor produces 2-5 insights per page

**Example**: Design Critic produces:
```typescript
{
  insights: [
    {
      type: 'design',
      subtype: 'layout',
      rating: 7,
      feedback: 'Left-aligned text is good, but too much whitespace on right',
    },
    {
      type: 'design',
      subtype: 'typography',
      rating: 5,
      feedback: 'Font size is too small (< 18pt), hard to read from distance',
    },
    {
      type: 'design',
      subtype: 'color',
      rating: 8,
      feedback: 'Color scheme is professional, but low contrast on slide 3',
    },
  ]
}
```

**Result**: 7 page-level actors × 3 insights/actor × 15 pages = **315 insights!**

**Trade-off**: More insights = harder to filter/prioritize

**Mitigation**: Add quality filter (only keep insights with rating ≤ 6 or ≥ 9)

---

### Technique 2: Generative Recommendations

**Current**: Insights identify problems
**Next**: Insights suggest specific fixes

**Example**:
```typescript
{
  type: 'problem',
  rating: 4,
  feedback: 'Problem statement is too vague',
  reasoning: 'Lacks specificity and quantification',

  // NEW FIELDS:
  recommendation: 'Replace "Many people struggle with X" with "47% of SMBs report X as their #1 pain point (Source: Gartner 2024)"',
  exampleFrom: 'Successful SaaS decks typically quantify the problem with industry data',
  impactIfFixed: 'high', // how much this would improve the deck
}
```

**Result**: Each insight becomes more actionable, feels like 2-3 insights

---

### Technique 3: Cross-Slide Pattern Detection

**Example**: Inconsistency Detector Actor

```typescript
async function detectInconsistencies(): Promise<void> {
  const pages = await getAllPages(deckId);

  // Extract all numbers mentioned
  const numbersPerPage = pages.map(p => extractNumbers(p.text));

  // Look for contradictions
  const insights = [];

  // Example: Slide 3 says "$1M ARR", Slide 8 says "$500K ARR"
  const arrMentions = findMentionsOf('ARR', numbersPerPage);
  if (arrMentions.length > 1 && arrMentions[0] !== arrMentions[1]) {
    insights.push({
      type: 'inconsistency',
      rating: 2,
      feedback: `ARR is stated as ${arrMentions[0].value} on slide ${arrMentions[0].page} but ${arrMentions[1].value} on slide ${arrMentions[1].page}`,
      reasoning: 'Inconsistent metrics damage credibility',
      slideNumbers: [arrMentions[0].page, arrMentions[1].page],
    });
  }

  // Save all inconsistency insights
  await saveInsights(insights);
}
```

**Result**: +10-15 cross-slide insights per deck

---

### Technique 4: Investor Persona Simulation

**Concept**: Run analysis from different investor perspectives

**Personas**:
- **VC (Series A)**: Cares about market size, traction, team
- **Angel**: Cares about vision, founder background, scrappiness
- **Corporate VC**: Cares about strategic fit, integration potential
- **Impact Investor**: Cares about social impact, sustainability

**Implementation**:
```typescript
const personas = ['vc-series-a', 'angel', 'corporate-vc', 'impact'];

for (const persona of personas) {
  const prompt = `You are a ${persona} investor. Analyze this deck from your perspective...`;
  const response = await analyzeWithPersona(prompt, persona);

  await saveInsight({
    type: 'persona-feedback',
    persona,
    ...response,
  });
}
```

**Result**: 4 personas × 5 insights = +20 insights, gives founder diverse perspectives

---

## Part 6: UI/UX Improvements for 100+ Insights

### Problem: Information Overload
**145 insights is overwhelming!**

### Solution: Progressive Disclosure

#### View 1: Executive Summary (Default)
```
┌─────────────────────────────────────────────────────┐
│  Overall Score: 68/100                              │
│  Verdict: KINDA FUCKS                               │
│                                                      │
│  🔴 Critical Issues (3)                             │
│    • Market size unsupported                        │
│    • Financial projections unrealistic              │
│    • Team slide missing CTO                         │
│                                                      │
│  🟡 Important Fixes (8)   [Expand]                  │
│  🟢 Strengths (5)         [Expand]                  │
│  💡 Quick Wins (12)       [Expand]                  │
│                                                      │
│  [See Full Analysis (145 insights)]                 │
└─────────────────────────────────────────────────────┘
```

#### View 2: By Category
```
Content Quality (47 insights)
  Problem Statement    ⭐ 7.2/10  [12 insights]
  Solution Clarity     ⭐ 6.8/10  [11 insights]
  Copy Quality         ⭐ 8.1/10  [9 insights]
  ...

Business Substance (52 insights)
  Market Analysis      ⭐ 5.4/10  [15 insights]  ⚠️ Needs work
  Traction Evidence    ⭐ 7.9/10  [13 insights]
  ...

Design & Polish (31 insights)
  Visual Design        ⭐ 8.5/10  [18 insights]
  Branding             ⭐ 9.1/10  [7 insights]
  ...

Overall Narrative (15 insights)
  Story Flow           ⭐ 6.3/10  [8 insights]
  Completeness         ⭐ 7.0/10  [4 insights]
  ...
```

#### View 3: By Slide
```
Slide 1: Title
  ✅ Strong visual design (8/10)
  ⚠️  Missing founder name
  💡 Add tagline under title

Slide 2: Problem
  ⚠️  Problem statement too vague (4/10)
  💡 Quantify the problem with data
  ❌ No emotional resonance (3/10)

Slide 3: Solution
  ✅ Clear value proposition (8/10)
  ⚠️  Differentiation unclear (5/10)
  ...
```

#### View 4: Actionable Checklist
```
[ ] Fix market size claim (add source)
[ ] Revise financial projections
[ ] Add CTO to team slide
[ ] Replace jargon: "synergistic" → "works together"
[ ] Increase font size on slides 4, 7, 9
[ ] Add transition between slides 5 and 6
...

[Export as TODO list]  [Share with team]
```

---

## Part 7: Production Deployment Checklist

### Infrastructure

- [ ] **Cloud Functions**: Deploy actors as separate Cloud Functions
  - `extractPDF` - Triggered on deck upload
  - `critiqueProblem` - Triggered when page added
  - `critiqueSolution` - Triggered when page added
  - ... (one function per actor)

- [ ] **Alternative: Cloud Run**: Single container running scheduler
  - Cheaper if running 24/7
  - Easier than managing 15 Cloud Functions
  - **Recommended for MVP**

- [ ] **Rate Limiting**: Prevent abuse
  - Max 5 uploads per user per day (free tier)
  - Max 20 uploads per user per month (paid tier)
  - Implement in `src/pages/index.tsx` before upload

- [ ] **Authentication**: Require login for uploads
  - Already have Firebase Auth ✅
  - Update storage rules to check `request.auth != null`

### Monitoring

- [ ] **Cost Alerts**: Alert if daily AI costs > $50
- [ ] **Error Tracking**: Sentry or similar
- [ ] **Performance Monitoring**: Track analysis time per deck
- [ ] **Dashboard**: Admin view showing:
  - Decks processed today/week/month
  - Total AI costs
  - Average insights per deck
  - Actor success rates

### Optimization

- [ ] **Firestore Indexes**: Create composite indexes for common queries
  ```
  decks: status, uploadedAt
  insights: type, pageNumber, generatedAt
  aiCosts: deckId, timestamp
  ```

- [ ] **Caching**: Cache PDF extraction for duplicate uploads
  - Hash PDF content, check if already processed
  - Reuse existing insights

- [ ] **Batching**: Process multiple pages in single AI call
  - Instead of 15 calls for 15 pages, make 3 calls for 5 pages each
  - Reduces API latency overhead

---

## Part 8: Next Steps (Prioritized)

### Week 1: Quick Wins
1. Add `solution-critic` actor (copy/paste from problem-critic)
2. Add `market-critic` actor
3. Update completion logic to expect 3 insight types
4. Test with 3 real pitch decks
5. **Expected Result**: 45 insights per deck

### Week 2: Vision Unlock
1. Add image extraction to `extractor` actor
2. Store slide images in Firebase Storage
3. Create `design-critic` actor using OpenAI Vision
4. Test visual analysis quality
5. **Expected Result**: 60 insights per deck

### Week 3: Deck-Level Intelligence
1. Implement `narrative-analyzer` actor
2. Implement `jargon-detector` actor
3. Implement `completeness-checker` actor
4. **Expected Result**: 85 insights per deck

### Week 4: Scale to 10 Actors
1. Add remaining page-level critics (traction, team, copy)
2. Add sentiment analyzer
3. Add slide structure analyzer
4. **Expected Result**: 120 insights per deck

### Week 5-6: Polish
1. Add insight deduplication
2. Add severity/impact scoring
3. Build UI filtering and categorization
4. Add export features (PDF, Notion, etc.)
5. **Expected Result**: Production-ready, 145 high-quality insights

---

## Conclusion

### What You've Built: A+ Foundation ✅

Your current implementation has:
- ✅ **Solid architecture** (actor pattern, perfect for scaling)
- ✅ **Robust utilities** (logging, cost tracking, Firebase)
- ✅ **Real-time UI** (streaming insights, great UX)
- ✅ **Type safety** (TypeScript throughout)
- ✅ **Production patterns** (error handling, overlap prevention)

**Rating**: 9.5/10 - This is better than most MVP codebases

### Scaling Path: Clear & Achievable 🚀

**To reach 100-150 insights**:
1. Add 6 page-level critics (Week 1-2) → 105 insights
2. Add vision-based design critic (Week 2) → 120 insights
3. Add 8 deck-level actors (Week 3-4) → 145 insights

**No architectural changes needed** - just more actors following the same pattern.

### Key Success Factors

1. **Cost Management**: Keep costs under $0.50/deck
   - Use gpt-4o-mini for most actors ✅
   - Batch vision API calls
   - Cache results for duplicate uploads

2. **Quality over Quantity**:
   - Filter low-quality insights (confidence < 0.6)
   - Deduplicate similar insights
   - Prioritize by impact

3. **UX Design**:
   - Don't overwhelm users with 145 insights at once
   - Progressive disclosure (summary → categories → details)
   - Actionable checklist format

4. **Performance**:
   - Run actors in parallel
   - Target < 5 min for full analysis
   - Stream results as they arrive

### Bottom Line

You're **perfectly positioned** to scale to 100+ insights. The architecture is sound, the patterns are proven, and the path forward is clear.

**Recommendation**: Execute Week 1 plan (add 2 more actors), validate the pattern works at scale, then accelerate through Week 2-4.

You'll have a production-ready system generating 120+ insights per deck within a month. 🚀

---

**Questions? Let's discuss**:
- Which actors to prioritize?
- Vision API integration details?
- Cost optimization strategies?
- UI/UX mockups?
- Deployment architecture?
