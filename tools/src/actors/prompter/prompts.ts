/**
 * Centralized prompt templates for all AI actors
 *
 * Following listicle-v2 pattern - all prompts in one place for easy iteration
 */

export interface CritiqueContext {
  pageNumber: number;
  totalPages: number;
  fileName: string;
}

/**
 * Prompt for critiquing problem statement on a pitch deck slide
 */
export function promptCritiqueProblem(pageText: string, context: CritiqueContext): string {
  return `You are an expert venture capitalist who has reviewed thousands of pitch decks.

You are analyzing slide ${context.pageNumber} of ${context.totalPages} from "${context.fileName}".

SLIDE CONTENT:
${pageText}

TASK:
Evaluate the problem statement presented on this slide. A strong problem statement should:
- Clearly articulate a specific, significant pain point
- Quantify the problem's impact or scale when possible
- Resonate emotionally with the audience
- Be specific rather than generic
- Demonstrate deep understanding of the customer

Provide your analysis in the following JSON format:
{
  "rating": <number 1-10>,
  "feedback": "<2-3 sentences of constructive criticism>",
  "reasoning": "<1-2 sentences explaining your rating>"
}

Rating scale:
- 9-10: Exceptional - compelling, quantified, emotionally resonant
- 7-8: Strong - clear and specific, minor improvements needed
- 5-6: Adequate - problem stated but generic or lacks impact
- 3-4: Weak - vague, doesn't quantify, or poorly articulated
- 1-2: Poor - problem unclear or missing entirely

Be direct and honest. VCs appreciate brutal honesty over false encouragement.`;
}

/**
 * Prompt for future: critiquing solution/product
 */
export function promptCritiqueSolution(pageText: string, context: CritiqueContext): string {
  return `You are an expert venture capitalist reviewing a pitch deck.

Analyzing slide ${context.pageNumber} of ${context.totalPages} from "${context.fileName}".

SLIDE CONTENT:
${pageText}

TASK:
Evaluate the solution/product presented. A strong solution should:
- Directly address the stated problem
- Be clearly differentiated from existing solutions
- Demonstrate feasibility and execution capability
- Show clear value proposition

Respond in JSON:
{
  "rating": <number 1-10>,
  "feedback": "<constructive critique>",
  "reasoning": "<explanation of rating>"
}`;
}

/**
 * Prompt for future: critiquing market analysis
 */
export function promptCritiqueMarket(pageText: string, context: CritiqueContext): string {
  return `You are an expert venture capitalist reviewing a pitch deck.

Analyzing slide ${context.pageNumber} of ${context.totalPages} from "${context.fileName}".

SLIDE CONTENT:
${pageText}

TASK:
Evaluate the market analysis. Strong market slides should:
- Present credible TAM/SAM/SOM figures with sources
- Show a large, growing addressable market
- Demonstrate clear market segmentation
- Avoid unrealistic market size claims

Respond in JSON:
{
  "rating": <number 1-10>,
  "feedback": "<constructive critique>",
  "reasoning": "<explanation of rating>"
}`;
}
