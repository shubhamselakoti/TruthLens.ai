/**
 * lib/claimExtractor.js
 * Extracts factual claims from text using NLP heuristics.
 * Splits sentences and identifies ones containing verifiable assertions.
 */

// Sentence splitting regex — handles common abbreviations
const SENTENCE_RE = /(?<!\b(?:Mr|Mrs|Ms|Dr|Prof|Sr|Jr|vs|etc|e\.g|i\.e)\.)(?<=[.!?])\s+(?=[A-Z])|(?<=\n)/g;

/**
 * Split text into individual sentences.
 * @param {string} text
 * @returns {string[]}
 */
export function splitSentences(text) {
  const raw = text.replace(/\n{2,}/g, ' ').trim();
  const sentences = raw.split(SENTENCE_RE).map(s => s.trim()).filter(s => s.length > 15);
  return sentences;
}

/**
 * Score a sentence on how "verifiable" it is (0–1).
 * Sentences with named entities, numbers, dates, etc. score higher.
 * @param {string} sentence
 * @returns {number}
 */
function verifiabilityScore(sentence) {
  let score = 0;

  // Contains a year (1900–2100)
  if (/\b(19|20)\d{2}\b/.test(sentence)) score += 0.2;

  // Contains numbers/stats
  if (/\b\d+(\.\d+)?\s*(%|million|billion|thousand|km|kg|mph|°|degrees?)\b/i.test(sentence)) score += 0.2;

  // Contains a proper noun (capitalized word not at start)
  const words = sentence.split(' ');
  const properNouns = words.slice(1).filter(w => /^[A-Z][a-z]/.test(w));
  if (properNouns.length > 0) score += Math.min(properNouns.length * 0.1, 0.3);

  // Contains definitive language
  if (/\b(is|was|are|were|has|have|did|does|invented|discovered|founded|born|died|located|created|wrote|won|became)\b/i.test(sentence)) score += 0.15;

  // Contains superlatives or absolute claims
  if (/\b(first|last|only|largest|smallest|highest|lowest|most|least|best|worst|always|never|all|none)\b/i.test(sentence)) score += 0.15;

  return Math.min(score, 1);
}

/**
 * Extract verifiable claims from a text block.
 * Returns sentences sorted by verifiability score.
 * @param {string} text
 * @returns {{ sentence: string, verifiability: number }[]}
 */
export function extractClaims(text) {
  const sentences = splitSentences(text);

  const claims = sentences.map(sentence => ({
    sentence,
    verifiability: verifiabilityScore(sentence),
  }));

  // Sort: most verifiable first, take top 10 for performance
  return claims
    .sort((a, b) => b.verifiability - a.verifiability)
    .slice(0, 10);
}

/**
 * Extract named entities (simple heuristic, no heavy NLP library).
 * @param {string} text
 * @returns {string[]}
 */
export function extractNamedEntities(text) {
  const words = text.split(/\s+/);
  const entities = new Set();
  let phrase = '';

  for (let i = 0; i < words.length; i++) {
    const word = words[i].replace(/[^a-zA-Z'-]/g, '');
    if (i > 0 && /^[A-Z]/.test(words[i]) && word.length > 2) {
      phrase = phrase ? `${phrase} ${word}` : word;
    } else {
      if (phrase && phrase.split(' ').length <= 4) entities.add(phrase);
      phrase = '';
    }
  }
  if (phrase) entities.add(phrase);

  return [...entities].filter(e => e.length > 2);
}
