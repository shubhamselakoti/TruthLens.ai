/**
 * lib/scoreComputer.js
 * Aggregates individual claim scores into an overall hallucination score.
 * Also handles text highlighting markup.
 */

/**
 * Compute overall hallucination score from per-sentence results.
 * Weights verifiable sentences more heavily.
 * @param {object[]} verificationResults
 * @returns {{ score: number, breakdown: object }}
 */
export function computeScore(verificationResults) {
  if (!verificationResults || verificationResults.length === 0) {
    return { score: 0, breakdown: { hallucinated: 0, uncertain: 0, reliable: 0 } };
  }

  const breakdown = { hallucinated: 0, uncertain: 0, reliable: 0 };

  let weightedSum = 0;
  let totalWeight = 0;

  for (const result of verificationResults) {
    // Higher-confidence sentences get more weight in final score
    const weight = 1 + (result.wikiSimilarity > 0 ? 0.5 : 0);
    weightedSum += result.score * weight;
    totalWeight += weight;

    if (result.type === 'hallucination') breakdown.hallucinated++;
    else if (result.type === 'uncertain') breakdown.uncertain++;
    else breakdown.reliable++;
  }

  const rawScore = totalWeight > 0 ? weightedSum / totalWeight : 0;

  // Scale to 0–100 and round
  const score = Math.round(rawScore * 100);

  return { score, breakdown };
}

/**
 * Generate human-readable explanations for the analysis.
 * @param {number} score
 * @param {object} breakdown
 * @param {object[]} results
 * @returns {string[]}
 */
export function generateExplanations(score, breakdown, results) {
  const explanations = [];
  const total = results.length;

  if (score >= 70) {
    explanations.push(`This response has a HIGH hallucination risk (${score}%). ${breakdown.hallucinated} of ${total} analyzed sentences contain claims that could not be verified or contradict available sources.`);
  } else if (score >= 40) {
    explanations.push(`This response has a MODERATE hallucination risk (${score}%). Some claims appear unverifiable or loosely supported.`);
  } else {
    explanations.push(`This response has a LOW hallucination risk (${score}%). Most claims align with available reference sources.`);
  }

  // Specific flags
  const heuristicIssues = results.filter(r => r.reason && !r.reason.includes('Wikipedia'));
  if (heuristicIssues.length > 0) {
    explanations.push(`${heuristicIssues.length} sentence(s) use linguistic patterns common in hallucinated text (vague attribution, unsupported statistics, or universal claims).`);
  }

  const unverified = results.filter(r => r.sources.length === 0);
  if (unverified.length > 0) {
    explanations.push(`${unverified.length} claim(s) returned no matching Wikipedia articles, suggesting they may be fabricated, too obscure, or incorrectly stated.`);
  }

  if (breakdown.reliable > 0) {
    explanations.push(`${breakdown.reliable} sentence(s) appear factually grounded and align with reference sources.`);
  }

  return explanations;
}

/**
 * Annotate the original text with highlight metadata.
 * Returns an array of segments: { text, type, score, reason }
 * @param {string} originalText
 * @param {object[]} results - per-sentence verification results
 * @returns {{ text: string, type: string, score: number, reason: string }[]}
 */
export function highlightText(originalText, results) {
  if (!results || results.length === 0) {
    return [{ text: originalText, type: 'neutral', score: 0, reason: '' }];
  }

  const segments = [];
  let remaining = originalText;

  // Build a lookup map for quick sentence → result access
  const resultMap = new Map(results.map(r => [r.sentence.trim(), r]));

  // Sort results by their order of appearance in the original text
  const orderedResults = [...results].sort((a, b) => {
    const posA = originalText.indexOf(a.sentence.trim().slice(0, 30));
    const posB = originalText.indexOf(b.sentence.trim().slice(0, 30));
    return posA - posB;
  });

  let position = 0;

  for (const result of orderedResults) {
    const searchStr = result.sentence.trim().slice(0, 60); // use prefix to locate
    const idx = remaining.indexOf(searchStr);

    if (idx === -1) continue;

    // Text before this sentence
    if (idx > 0) {
      segments.push({
        text: remaining.slice(0, idx),
        type: 'neutral',
        score: 0,
        reason: '',
      });
    }

    // The sentence itself
    const fullSentenceEnd = remaining.indexOf(result.sentence.trim()) + result.sentence.trim().length;
    const sentenceText = remaining.slice(idx, Math.min(fullSentenceEnd + 10, remaining.length));

    segments.push({
      text: sentenceText.length > 0 ? sentenceText : result.sentence,
      type: result.type,
      score: result.score,
      reason: result.reason,
      sources: result.sources,
    });

    remaining = remaining.slice(Math.min(fullSentenceEnd + 10, remaining.length));
    position++;
  }

  // Any leftover text
  if (remaining.trim().length > 0) {
    segments.push({ text: remaining, type: 'neutral', score: 0, reason: '' });
  }

  // Fallback: if we couldn't parse segments, return chunked by sentence
  if (segments.length === 0) {
    return results.map(r => ({
      text: r.sentence,
      type: r.type,
      score: r.score,
      reason: r.reason,
      sources: r.sources,
    }));
  }

  return segments;
}
