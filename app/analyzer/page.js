/**
 * app/analyzer/page.js
 * Matches reference UI exactly: sticky nav, 2/3+1/3 grid layout,
 * white card inputs, sidebar tips panel.
 * All backend logic (API calls, modes, segmenting) untouched.
 */
'use client';

import { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  Shield, ArrowLeft, History, Zap, Sparkles, Send,
  X, Upload, Loader2, CheckCircle, AlertTriangle, XCircle,
  Copy, Download, Check, FileText, Moon, Sun
} from 'lucide-react';

import Navbar from '@/components/ui/Navbar';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import ScoreMeter from '@/components/analysis/ScoreMeter';
import HighlightedText from '@/components/analysis/HighlightedText';
import ExplanationPanel from '@/components/analysis/ExplanationPanel';
import SourcesPanel from '@/components/analysis/SourcesPanel';
import TokenUsage from '@/components/analysis/TokenUsage';
import ExportReport from '@/components/analysis/ExportReport';

const EXAMPLE = {
  question: 'Tell me about the Eiffel Tower',
  answer: `The Eiffel Tower is a famous iron lattice tower located in Berlin, Germany. It was built in 1885 by the renowned architect Leonardo da Vinci as a permanent structure. The tower stands approximately 600 meters tall, making it the tallest structure in the world. It was originally constructed as a symbol of French democracy and was universally loved by Parisians from the moment it was unveiled. The tower attracts about 70 million visitors each year, generating over $50 billion in tourism revenue annually.`,
};

/** Build highlighted segments from API flagged_sentences + original text */
function buildSegments(flagged, originalAnswer) {
  if (!flagged || flagged.length === 0)
    return [{ text: originalAnswer, type: 'neutral', score: 0, reason: '' }];

  const segs = [];
  let remaining = originalAnswer;

  for (const item of flagged) {
    if (!item.text) continue;
    const prefix = item.text.slice(0, 50);
    const idx = remaining.indexOf(prefix);
    if (idx === -1) continue;

    if (idx > 0) segs.push({ text: remaining.slice(0, idx), type: 'neutral', score: 0, reason: '' });

    const end = idx + item.text.length;
    segs.push({
      text: remaining.slice(idx, end),
      type: item.type,
      score: (item.score || 0) / 100,
      reason: item.reason,
      sources: item.sources?.map(url => ({ url, title: url.split('/').pop()?.replace(/_/g, ' ') })),
    });
    remaining = remaining.slice(end);
  }

  if (remaining.trim()) segs.push({ text: remaining, type: 'neutral', score: 0, reason: '' });
  return segs.length > 0 ? segs : [{ text: originalAnswer, type: 'neutral', score: 0, reason: '' }];
}

const TIPS = [
  { color: 'text-blue-600', label: 'Fast Mode', desc: 'Uses heuristic analysis for instant results. Best for quick checks.' },
  { color: 'text-purple-600', label: 'Deep Mode', desc: 'Uses Gemini for comprehensive fact-checking. More accurate, takes ~5–10s.' },
  { color: 'text-green-600', label: 'Add Context', desc: 'Providing the original question improves accuracy significantly.' },
  { color: 'text-orange-600', label: 'Highlights', desc: 'Red = high-risk hallucination, Yellow = uncertain, Green = reliable.' },
];

const HALLUCINATION_TYPES = [
  { bg: 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900/40', titleColor: 'text-red-900 dark:text-red-300', descColor: 'text-red-700 dark:text-red-400', title: 'Fabricated Facts', desc: 'Completely made-up information that sounds plausible' },
  { bg: 'bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-900/40', titleColor: 'text-yellow-900 dark:text-yellow-300', descColor: 'text-yellow-700 dark:text-yellow-400', title: 'Misattributions', desc: 'Real facts attributed to wrong sources or people' },
  { bg: 'bg-orange-50 dark:bg-orange-900/10 border-orange-200 dark:border-orange-900/40', titleColor: 'text-orange-900 dark:text-orange-300', descColor: 'text-orange-700 dark:text-orange-400', title: 'Unfounded Claims', desc: 'Statements without verifiable evidence or sources' },
];

export default function AnalyzerPage() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer]     = useState('');
  const [mode, setMode]         = useState('fast');
  const [loading, setLoading]   = useState(false);
  const [result, setResult]     = useState(null);
  const [segments, setSegments] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  const resultRef   = useRef(null);
  const fileInputRef = useRef(null);

  const charLimit = 10000;

  /* ── File upload ── */
  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 100_000) { toast.error('File too large (max 100 KB)'); return; }
    const reader = new FileReader();
    reader.onload = evt => {
      setAnswer((evt.target.result || '').slice(0, charLimit));
      toast.success(`Loaded "${file.name}"`);
    };
    reader.readAsText(file);
  }

  /* ── Analyze ── */
  const handleAnalyze = useCallback(async () => {
    if (!answer.trim()) { toast.error('Please enter an answer to analyze.'); return; }
    if (answer.trim().length < 20) { toast.error('Answer too short (min 20 chars).'); return; }

    setLoading(true);
    setResult(null);
    setSegments([]);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: question.trim(), answer: answer.trim(), mode }),
      });

      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Analysis failed.'); return; }

      setResult(data);
      setSegments(buildSegments(data.flagged_sentences, answer.trim()));
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);

      if (data.score >= 70) toast.error(`High risk: ${data.score}% hallucination`, { duration: 5000 });
      else if (data.score >= 40) toast(`Moderate risk: ${data.score}%`, { icon: '⚠️' });
      else toast.success(`Analysis complete — ${data.score}% risk`);
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [answer, question, mode]);

  function handleKey(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') handleAnalyze();
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-8">

          {/* ── LEFT: 2/3 column ── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Input card */}
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-8">
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  AI Hallucination Analyzer
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Paste AI-generated text below to detect potential hallucinations,
                  false claims, and unreliable information.
                </p>
              </div>

              <div className="space-y-5">
                {/* Optional question */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Original Question <span className="text-gray-400">(Optional)</span>
                  </label>
                  <textarea
                    value={question}
                    onChange={e => setQuestion(e.target.value)}
                    placeholder="e.g., What are the health benefits of exercise?"
                    rows={2}
                    disabled={loading}
                    className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:opacity-60 transition-colors"
                  />
                  <p className="text-xs text-gray-400">Providing the question improves accuracy</p>
                </div>

                {/* Main answer textarea */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    AI-Generated Answer to Analyze <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <textarea
                      value={answer}
                      onChange={e => setAnswer(e.target.value.slice(0, charLimit))}
                      onKeyDown={handleKey}
                      placeholder="Paste the AI-generated text you want to analyze for hallucinations...&#10;&#10;Tip: Press Ctrl+Enter to analyze instantly."
                      rows={8}
                      required
                      disabled={loading}
                      className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:opacity-60 transition-colors pr-8"
                    />
                    {answer && (
                      <button
                        onClick={() => setAnswer('')}
                        className="absolute top-2.5 right-2.5 p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-400">{answer.length.toLocaleString()} / {charLimit.toLocaleString()} characters</p>
                    <div className="flex gap-2">
                      <input ref={fileInputRef} type="file" accept=".txt,.md" onChange={handleFile} className="hidden" />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={loading}
                        className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-50 transition-colors"
                      >
                        Upload .txt
                      </button>
                      <span className="text-gray-300 dark:text-gray-600">·</span>
                      <button
                        onClick={() => { setQuestion(EXAMPLE.question); setAnswer(EXAMPLE.answer); toast('Example loaded!', { icon: '💡' }); }}
                        disabled={loading}
                        className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-50 transition-colors"
                      >
                        Use Example
                      </button>
                    </div>
                  </div>
                </div>

                {/* Mode selector */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Detection Mode</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: 'fast', icon: <Zap className="w-5 h-5 text-blue-600" />, label: 'Fast Mode', sub: 'Quick heuristic analysis using pattern matching', cost: 'Free · Instant', costColor: 'text-green-600 dark:text-green-400', activeBorder: 'border-blue-500', activeBg: 'bg-blue-50 dark:bg-blue-900/20' },
                      { id: 'deep', icon: <Sparkles className="w-5 h-5 text-purple-600" />, label: 'Deep Mode', sub: 'Gemini-powered fact-checking & analysis', cost: '~$0.001 · 5–10s', costColor: 'text-orange-600 dark:text-orange-400', activeBorder: 'border-purple-500', activeBg: 'bg-purple-50 dark:bg-purple-900/20' },
                    ].map(m => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setMode(m.id)}
                        disabled={loading}
                        className={`p-4 border-2 rounded-xl text-left transition-all hover:border-gray-300 dark:hover:border-gray-500 disabled:opacity-50 ${
                          mode === m.id
                            ? `${m.activeBorder} ${m.activeBg}`
                            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          {m.icon}
                          <span className="font-semibold text-sm text-gray-900 dark:text-white">{m.label}</span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{m.sub}</p>
                        <p className={`text-xs font-semibold ${m.costColor}`}>{m.cost}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Submit */}
                <button
                  onClick={handleAnalyze}
                  disabled={loading || !answer.trim()}
                  className="w-full h-12 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 dark:disabled:bg-gray-700 text-white disabled:text-gray-400 font-semibold text-base flex items-center justify-center gap-2 transition-colors shadow-sm disabled:shadow-none disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Analyzing…</>
                  ) : (
                    <>{mode === 'fast' ? <Zap className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />} Analyze for Hallucinations</>
                  )}
                </button>
              </div>
            </div>

            {/* Loading */}
            {loading && (
              <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800">
                <LoadingSkeleton mode={mode} />
              </div>
            )}

            {/* Results card */}
            {result && !loading && (
              <div ref={resultRef} className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-8 animate-fade-in-up">
                {/* Results header */}
                <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Analysis Results</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                      {result.analyzed_claims} claims · {result.processing_time_ms}ms · {result.mode} mode
                    </p>
                  </div>
                  <ExportReport result={result} question={question} answer={answer} />
                </div>

                <div className="space-y-8">
                  {/* Score meter */}
                  <ScoreMeter score={result.score} breakdown={result.breakdown} />

                  <hr className="border-gray-100 dark:border-gray-800" />

                  {/* Highlighted text */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Analyzed Text</h3>
                    <HighlightedText segments={segments} originalText={answer} />
                  </div>

                  <hr className="border-gray-100 dark:border-gray-800" />

                  {/* Explanations */}
                  <ExplanationPanel
                    explanations={result.explanations}
                    flagged_sentences={result.flagged_sentences}
                  />

                  {/* Sources */}
                  {result.sources?.length > 0 && (
                    <>
                      <hr className="border-gray-100 dark:border-gray-800" />
                      <SourcesPanel sources={result.sources} />
                    </>
                  )}

                  {/* Metrics */}
                  <TokenUsage
                    tokenUsage={result.token_usage}
                    processingTime={result.processing_time_ms}
                    mode={result.mode}
                    claimsCount={result.analyzed_claims}
                  />
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT: 1/3 sidebar ── */}
          <div className="lg:col-span-1 space-y-5">

            {/* Tips card */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl border border-blue-200 dark:border-blue-800/50 p-6">
              <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-4">Detection Tips</h3>
              <ul className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                {TIPS.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className={`font-bold mt-0.5 flex-shrink-0 ${tip.color}`}>•</span>
                    <span>
                      <strong className="text-gray-900 dark:text-white">{tip.label}:</strong>{' '}
                      {tip.desc}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Hallucination types card */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
              <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-4">
                Common Hallucination Types
              </h3>
              <div className="space-y-2.5">
                {HALLUCINATION_TYPES.map((t, i) => (
                  <div key={i} className={`p-3 border rounded-lg ${t.bg}`}>
                    <p className={`text-sm font-semibold ${t.titleColor}`}>{t.title}</p>
                    <p className={`text-xs mt-0.5 ${t.descColor}`}>{t.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick stats (shown when result available) */}
            {result && (
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 animate-fade-in-up">
                <h3 className="font-semibold text-base text-gray-900 dark:text-white mb-4">Quick Stats</h3>
                <div className="space-y-3">
                  {[
                    { label: 'Overall Score', value: `${result.score}%`, color: result.score >= 70 ? 'text-red-600' : result.score >= 40 ? 'text-yellow-600' : 'text-green-600' },
                    { label: 'Claims Checked', value: result.analyzed_claims, color: 'text-blue-600' },
                    { label: 'Hallucinated', value: result.breakdown?.hallucinated || 0, color: 'text-red-600' },
                    { label: 'Uncertain', value: result.breakdown?.uncertain || 0, color: 'text-yellow-600' },
                    { label: 'Reliable', value: result.breakdown?.reliable || 0, color: 'text-green-600' },
                  ].map((s, i) => (
                    <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-100 dark:border-gray-800 last:border-0">
                      <span className="text-sm text-gray-600 dark:text-gray-400">{s.label}</span>
                      <span className={`text-sm font-bold ${s.color}`}>{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 mt-16">
        <div className="max-w-7xl mx-auto px-6 py-8 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            TruthLens AI helps you verify AI-generated content with confidence.
            Always cross-reference important information with trusted sources.
          </p>
        </div>
      </footer>
    </div>
  );
}
