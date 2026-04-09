/**
 * lib/geminiAnalyzer.js
 * Deep analysis using Google Gemini API.
 * Used in "Deep Mode" to get LLM-powered hallucination detection.
 */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-flash-latest'; // Cost-efficient, fast

/**
 * Run deep hallucination analysis via Gemini.
 * @param {string} question - Original question (optional)
 * @param {string} answer - AI-generated answer to check
 * @param {string[]} sentences - Pre-extracted sentences to analyze
 * @returns {Promise<{ results: object[], token_usage: object }>}
 */
export async function analyzeWithGemini(question, answer, sentences) {
  if (!GEMINI_API_KEY) {
    console.warn('GEMINI_API_KEY not set — skipping deep analysis');
    return { results: [], token_usage: { input_tokens: 0, output_tokens: 0, cost_usd: 0 } };
  }

  const prompt = buildPrompt(question, answer, sentences);

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1,        // Low temp for factual analysis
            maxOutputTokens: 2048,
            responseMimeType: 'application/json',
          },
        }),
        signal: AbortSignal.timeout(300000),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      console.error('Gemini API error:', err);
      return { results: [], token_usage: { input_tokens: 0, output_tokens: 0, cost_usd: 0 } };
    }

    const data = await response.json();
    const content = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    const usageMetadata = data?.usageMetadata || {};

    let parsed;
    try {
      const cleaned = content.replace(/```json\n?|\n?```/g, '').trim();
      parsed = JSON.parse(cleaned);
    } catch {
      return { results: [], token_usage: { input_tokens: 0, output_tokens: 0, cost_usd: 0 } };
    }

    // Gemini Flash pricing: $0.075/M input, $0.30/M output tokens
    const inputCost = ((usageMetadata.promptTokenCount || 0) / 1_000_000) * 0.075;
    const outputCost = ((usageMetadata.candidatesTokenCount || 0) / 1_000_000) * 0.30;

    return {
      results: parsed.sentences || [],
      token_usage: {
        input_tokens: usageMetadata.promptTokenCount || 0,
        output_tokens: usageMetadata.candidatesTokenCount || 0,
        cost_usd: Number((inputCost + outputCost).toFixed(6)),
      },
    };
  } catch (err) {
    console.error('Gemini analysis failed:', err.message);
    return { results: [], token_usage: { input_tokens: 0, output_tokens: 0, cost_usd: 0 } };
  }
}

/**
 * Build the Gemini analysis prompt.
 */
function buildPrompt(question, answer, sentences) {
  return `You are a hallucination detection expert. Analyze the following AI-generated answer for factual errors, hallucinations, and unverifiable claims.

${question ? `ORIGINAL QUESTION:\n${question}\n\n` : ''}ANSWER TO ANALYZE:\n${answer}

SENTENCES TO EVALUATE:
${sentences.map((s, i) => `${i + 1}. "${s}"`).join('\n')}

For each sentence, evaluate:
1. Is it likely hallucinated? (score 0.0–1.0, where 1.0 = definitely hallucinated)
2. What type? ("hallucination" | "uncertain" | "reliable")
3. Why? (brief, specific reason)

Respond ONLY with this JSON structure (no markdown, no extra text):
{
  "sentences": [
    {
      "sentence": "exact sentence text",
      "score": 0.0,
      "type": "reliable",
      "reason": "explanation"
    }
  ],
  "overall_assessment": "brief overall assessment"
}

Be conservative — only flag something as hallucination if you're confident it's wrong or unverifiable.`;
}

/**
 * Merge Gemini results with heuristic results.
 * Gemini results take priority if available.
 * @param {object[]} heuristicResults
 * @param {object[]} geminiResults
 * @returns {object[]}
 */
export function mergeResults(heuristicResults, geminiResults) {
  if (!geminiResults || geminiResults.length === 0) return heuristicResults;

  const geminiMap = new Map(
    geminiResults.map(r => [r.sentence?.trim().slice(0, 50), r])
  );

  return heuristicResults.map(h => {
    const key = h.sentence?.trim().slice(0, 50);
    const gemini = geminiMap.get(key);

    if (!gemini) return h;

    // Average scores, weighting Gemini at 70%
    const blendedScore = gemini.score * 0.7 + h.score * 0.3;
    const type =
      blendedScore >= 0.55 ? 'hallucination' :
      blendedScore >= 0.3  ? 'uncertain' :
      'reliable';

    return {
      ...h,
      score: blendedScore,
      type,
      reason: gemini.reason || h.reason,
    };
  });
}
