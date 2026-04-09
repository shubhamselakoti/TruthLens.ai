/**
 * app/api/analyze/route.js
 * POST /api/analyze
 * Main hallucination detection endpoint.
 *
 * Request:  { question: string, answer: string, mode: 'fast' | 'deep' }
 * Response: { score, flagged_sentences, explanations, sources, token_usage, processing_time_ms }
 */

import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Analysis from '@/models/Analysis';
import { extractClaims } from '@/lib/claimExtractor';
import { verifyClaims } from '@/lib/factChecker';
import { computeScore, generateExplanations, highlightText } from '@/lib/scoreComputer';
import { analyzeWithGemini, mergeResults } from '@/lib/geminiAnalyzer';

export async function POST(request) {
  const startTime = Date.now();

  try {
    const body = await request.json();
    const { question = '', answer, mode = 'fast' } = body;

    // --- Validation ---
    if (!answer || typeof answer !== 'string' || answer.trim().length < 20) {
      return NextResponse.json(
        { error: 'Answer must be at least 20 characters.' },
        { status: 400 }
      );
    }

    if (answer.length > 10000) {
      return NextResponse.json(
        { error: 'Answer exceeds maximum length of 10,000 characters.' },
        { status: 400 }
      );
    }

    // --- Step 1: Extract claims ---
    const claims = extractClaims(answer);

    if (claims.length === 0) {
      return NextResponse.json({
        score: 0,
        flagged_sentences: [],
        explanations: ['No verifiable claims found in the text.'],
        sources: [],
        token_usage: { input_tokens: 0, output_tokens: 0, cost_usd: 0 },
        processing_time_ms: Date.now() - startTime,
      });
    }

    // --- Step 2: Verify claims (heuristic + Wikipedia) ---
    const heuristicResults = await verifyClaims(claims);

    // --- Step 3: Deep mode — Gemini analysis ---
    let tokenUsage = { input_tokens: 0, output_tokens: 0, cost_usd: 0 };
    let finalResults = heuristicResults;

    if (mode === 'deep' && process.env.GEMINI_API_KEY) {
      const sentences = claims.map(c => c.sentence);
      const { results: geminiResults, token_usage } = await analyzeWithGemini(
        question,
        answer,
        sentences
      );
      finalResults = mergeResults(heuristicResults, geminiResults);
      tokenUsage = token_usage;
    }

    // --- Step 4: Compute overall score ---
    const { score, breakdown } = computeScore(finalResults);

    // --- Step 5: Generate explanations ---
    const explanations = generateExplanations(score, breakdown, finalResults);

    // --- Step 6: Collect unique sources ---
    const sourcesMap = new Map();
    for (const result of finalResults) {
      for (const src of (result.sources || [])) {
        if (src?.url && !sourcesMap.has(src.url)) {
          sourcesMap.set(src.url, {
            title: src.title,
            url: src.url,
            snippet: src.snippet?.slice(0, 200),
            relevance: src.relevance || result.wikiSimilarity || 0,
          });
        }
      }
    }
    const sources = [...sourcesMap.values()].slice(0, 8);

    // --- Step 7: Prepare flagged sentences for response ---
    const flagged_sentences = finalResults
      .filter(r => r.type !== 'reliable' || r.score > 0.2)
      .map(r => ({
        text: r.sentence,
        score: Math.round(r.score * 100),
        type: r.type,
        reason: r.reason,
        sources: (r.sources || []).map(s => s.url || '').filter(Boolean),
      }));

    const processingTime = Date.now() - startTime;

    // --- Step 8: Persist to MongoDB (non-blocking) ---
    connectDB()
      .then(() =>
        Analysis.create({
          question,
          answer,
          mode,
          score,
          flagged_sentences,
          explanations,
          sources,
          token_usage: tokenUsage,
          processing_time_ms: processingTime,
        })
      )
      .catch(err => console.error('DB save error:', err.message));

    // --- Response ---
    return NextResponse.json({
      score,
      breakdown,
      flagged_sentences,
      explanations,
      sources,
      token_usage: tokenUsage,
      processing_time_ms: processingTime,
      mode,
      analyzed_claims: claims.length,
    });
  } catch (err) {
    console.error('Analysis error:', err);
    return NextResponse.json(
      { error: 'Internal server error. Please try again.' },
      { status: 500 }
    );
  }
}

// Allow GET for health check
export async function GET() {
  return NextResponse.json({ status: 'ok', service: 'TruthLens AI' });
}
