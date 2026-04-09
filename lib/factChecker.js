/**
 * lib/factChecker.js
 * Verifies claims against Wikipedia and computes semantic overlap.
 * Uses Wikipedia's public API — no key required.
 */

const WIKI_API = process.env.WIKIPEDIA_API_URL || 'https://en.wikipedia.org/w/api.php';

/**
 * Search Wikipedia for a query and return top snippets + URLs.
 * @param {string} query
 * @returns {Promise<{ title: string, snippet: string, url: string }[]>}
 */
export async function searchWikipedia(query) {
  try {
    const params = new URLSearchParams({
      action: 'query',
      list: 'search',
      srsearch: query,
      format: 'json',
      srlimit: '3',
      srprop: 'snippet|titlesnippet',
      origin: '*',
    });

    const res = await fetch(`${WIKI_API}?${params}`, {
      headers: { 'User-Agent': 'TruthLensAI/1.0 (fact-checking tool)' },
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) return [];

    const data = await res.json();
    const results = data?.query?.search || [];

    return results.map(r => ({
      title: r.title,
      snippet: r.snippet.replace(/<[^>]+>/g, ''), // strip HTML
      url: `https://en.wikipedia.org/wiki/${encodeURIComponent(r.title.replace(/ /g, '_'))}`,
    }));
  } catch {
    return [];
  }
}

/**
 * Compute simple word-overlap similarity between two strings.
 * Returns 0–1 (1 = identical vocabulary).
 * @param {string} a
 * @param {string} b
 * @returns {number}
 */
export function computeTextSimilarity(a, b) {
  const stopwords = new Set(['the','a','an','is','in','of','to','and','or','for','on','at','by','with','that','this','it','as','be','was','are','were','has','have','had']);

  const tokenize = str =>
    str.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 2 && !stopwords.has(w));

  const setA = new Set(tokenize(a));
  const setB = new Set(tokenize(b));
  if (setA.size === 0 || setB.size === 0) return 0;

  const intersection = new Set([...setA].filter(w => setB.has(w)));
  const union = new Set([...setA, ...setB]);

  return intersection.size / union.size; // Jaccard similarity
}

/**
 * Detect hallucination signals in a sentence via heuristics.
 * Returns { suspicious: boolean, reasons: string[] }
 * @param {string} sentence
 */
export function detectHeuristicFlags(sentence) {
  const reasons = [];

  // Vague but confident language
  if (/\b(studies show|research suggests|experts say|scientists believe|it is known)\b/i.test(sentence) &&
      !/according to|source:|cited by/i.test(sentence)) {
    reasons.push('Uses vague authority without citing sources');
  }

  // Suspiciously precise statistics
  if (/\b\d{1,3}(\.\d+)?%\b/.test(sentence) && !/according to|from|source|study/i.test(sentence)) {
    reasons.push('Contains precise statistic without attribution');
  }

  // Absolute/universal claims
  if (/\b(always|never|everyone|nobody|all countries|every country|worldwide|universally)\b/i.test(sentence)) {
    reasons.push('Makes broad universal claim that is rarely accurate');
  }

  // Future predictions stated as fact
  if (/\b(will|shall)\b.{0,30}\b(certainly|definitely|guaranteed|inevitably)\b/i.test(sentence)) {
    reasons.push('States uncertain future as guaranteed fact');
  }

  // Contradictory hedging + certainty
  if (/\b(might|may|could|possibly|perhaps)\b.{0,20}\b(is|are|was|were)\b/i.test(sentence)) {
    reasons.push('Mixes uncertain language with definitive assertions');
  }

  return {
    suspicious: reasons.length > 0,
    reasons,
  };
}

/**
 * Verify a single claim sentence against Wikipedia.
 * Returns a verification result object.
 * @param {string} sentence
 * @returns {Promise<object>}
 */
export async function verifyClaim(sentence) {
  // Extract key phrase for search (first 6 meaningful words)
  const searchQuery = sentence
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3)
    .slice(0, 6)
    .join(' ');

  const [wikiResults, heuristics] = await Promise.all([
    searchWikipedia(searchQuery),
    Promise.resolve(detectHeuristicFlags(sentence)),
  ]);

  // Compute best similarity across wiki snippets
  let maxSimilarity = 0;
  let bestSource = null;

  for (const result of wikiResults) {
    const sim = computeTextSimilarity(sentence, result.snippet);
    if (sim > maxSimilarity) {
      maxSimilarity = sim;
      bestSource = result;
    }
  }

  // Build confidence that this IS hallucinated (0 = reliable, 1 = hallucinated)
  let hallucinationConfidence = 0;

  // No Wikipedia coverage → suspect
  if (wikiResults.length === 0) hallucinationConfidence += 0.3;

  // Low semantic overlap → suspect
  if (maxSimilarity < 0.05) hallucinationConfidence += 0.25;
  else if (maxSimilarity < 0.15) hallucinationConfidence += 0.1;
  else if (maxSimilarity > 0.3) hallucinationConfidence -= 0.2; // supported

  // Heuristic flags
  hallucinationConfidence += heuristics.reasons.length * 0.15;

  hallucinationConfidence = Math.max(0, Math.min(1, hallucinationConfidence));

  const type =
    hallucinationConfidence >= 0.55 ? 'hallucination' :
    hallucinationConfidence >= 0.3  ? 'uncertain' :
    'reliable';

  return {
    sentence,
    score: hallucinationConfidence,
    type,
    reason: heuristics.reasons.length > 0
      ? heuristics.reasons.join('; ')
      : maxSimilarity > 0.2
        ? `Partially supported by Wikipedia (${Math.round(maxSimilarity * 100)}% overlap)`
        : wikiResults.length === 0
          ? 'No Wikipedia coverage found for this claim'
          : 'Low factual overlap with available sources',
    sources: bestSource ? [bestSource] : wikiResults.slice(0, 2),
    wikiSimilarity: maxSimilarity,
  };
}

/**
 * Verify an array of claims in parallel (max 5 concurrent).
 * @param {{ sentence: string, verifiability: number }[]} claims
 * @returns {Promise<object[]>}
 */
export async function verifyClaims(claims) {
  // Batch in groups of 5 to avoid rate limiting
  const results = [];
  const batchSize = 5;

  for (let i = 0; i < claims.length; i += batchSize) {
    const batch = claims.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(({ sentence }) => verifyClaim(sentence))
    );
    results.push(...batchResults);
  }

  return results;
}
