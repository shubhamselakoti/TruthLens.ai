/**
 * models/Analysis.js
 * Mongoose schema for storing analysis results.
 */

import mongoose from 'mongoose';

const FlaggedSentenceSchema = new mongoose.Schema({
  text: String,
  score: Number,          // 0–1 confidence this sentence is hallucinated
  reason: String,
  sources: [String],
  type: String,           // 'hallucination' | 'uncertain' | 'reliable'
}, { _id: false });

const SourceSchema = new mongoose.Schema({
  title: String,
  url: String,
  snippet: String,
  relevance: Number,
}, { _id: false });

const AnalysisSchema = new mongoose.Schema(
  {
    question: { type: String, default: '' },
    answer: { type: String, required: true },
    mode: { type: String, enum: ['fast', 'deep'], default: 'fast' },
    score: { type: Number, required: true },          // 0–100 hallucination %
    flagged_sentences: [FlaggedSentenceSchema],
    explanations: [String],
    sources: [SourceSchema],
    token_usage: {
      input_tokens: { type: Number, default: 0 },
      output_tokens: { type: Number, default: 0 },
      cost_usd: { type: Number, default: 0 },
    },
    processing_time_ms: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// TTL index — auto-delete analyses older than 30 days
AnalysisSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

export default mongoose.models.Analysis || mongoose.model('Analysis', AnalysisSchema);
