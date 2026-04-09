/**
 * app/page.js — Landing page matching the reference UI style:
 * white/gray-50 bg, blue-600/purple-600 accents, clean shadcn cards
 */
'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import {
  Shield, Zap, Brain, CheckCircle, ArrowRight, Target, TrendingUp, Moon, Sun
} from 'lucide-react';

function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'));
  }, []);
  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    try { localStorage.setItem('theme', next ? 'dark' : 'light'); } catch {}
  }
  return (
    <button
      onClick={toggle}
      className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      aria-label="Toggle theme"
    >
      {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  );
}

const FEATURES = [
  {
    icon: <Zap className="w-6 h-6 text-blue-600" />,
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    title: 'Fast Detection',
    desc: 'Instant heuristic analysis using advanced pattern recognition and linguistic markers. Get results in under a second.',
  },
  {
    icon: <Brain className="w-6 h-6 text-purple-600" />,
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    title: 'Deep Analysis',
    desc: 'Gemini-powered fact-checking with Wikipedia source verification and detailed explanations for every flagged claim.',
  },
  {
    icon: <Target className="w-6 h-6 text-green-600" />,
    bg: 'bg-green-100 dark:bg-green-900/30',
    title: 'Precision Scoring',
    desc: 'Get detailed confidence scores for each sentence with color-coded highlighting and exportable reports.',
  },
];

const CHECKLIST = [
  'Instant heuristic detection',
  'Gemini-powered deep analysis',
  'Sentence-level highlighting',
  'Detailed explanations',
  'Wikipedia source verification',
  'Exportable reports (TXT / JSON)',
  'Analysis history (MongoDB)',
  'Token usage & cost estimates',
];

const HOW_IT_WORKS = [
  { num: '1', title: 'Paste Text', desc: 'Copy the AI-generated answer you want to verify' },
  { num: '2', title: 'Choose Mode', desc: 'Select Fast for instant results or Deep for AI-powered analysis' },
  { num: '3', title: 'Get Results', desc: 'Review highlighted issues, scores, and detailed explanations' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* ── Nav ── */}
      <nav className="border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-7 h-7 text-blue-600" />
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              TruthLens AI
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/history" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors hidden sm:block">
              History
            </Link>
            <ThemeToggle />
            <Link href="/analyzer" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              Try Analyzer <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </nav>

      <main>
        {/* ── Hero ── */}
        <section className="max-w-7xl mx-auto px-6 py-24">
          <div className="text-center max-w-4xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-full text-sm font-medium text-blue-700 dark:text-blue-300">
              <Zap className="w-4 h-4" />
              Powered by Gemini AI + Wikipedia Fact-Check
            </div>

            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-gray-900 dark:text-white">
              Detect AI{' '}
              <span className="bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
                Hallucinations
              </span>
              <br />
              Instantly
            </h1>

            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
              Verify AI-generated content with confidence. TruthLens analyzes text for false claims,
              fabricated facts, and unreliable information using advanced detection algorithms.
            </p>

            <div className="flex items-center justify-center gap-4 pt-4 flex-wrap">
              <Link href="/analyzer" className="inline-flex items-center gap-2 h-14 px-8 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold transition-colors shadow-md hover:shadow-lg">
                Start Analyzing <ArrowRight className="w-5 h-5" />
              </Link>
              <Link href="/history" className="inline-flex items-center gap-2 h-14 px-8 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 text-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                View History
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 pt-12 max-w-3xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">99%</div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Claim Coverage</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">&lt;2s</div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Fast Mode</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">Free</div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Basic Analysis</div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Feature Cards ── */}
        <section className="max-w-7xl mx-auto px-6 py-20">
          <div className="grid md:grid-cols-3 gap-8">
            {FEATURES.map((f, i) => (
              <div key={i} className="p-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl hover:shadow-lg dark:hover:shadow-gray-900 transition-shadow">
                <div className={`w-12 h-12 ${f.bg} rounded-xl flex items-center justify-center mb-4`}>
                  {f.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">{f.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── How It Works ── */}
        <section className="max-w-7xl mx-auto px-6 py-20">
          <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-3xl p-12 text-white">
            <div className="max-w-3xl mx-auto text-center space-y-6">
              <h2 className="text-4xl font-bold">How It Works</h2>
              <p className="text-xl text-blue-100">Three simple steps to verify AI-generated content</p>

              <div className="grid md:grid-cols-3 gap-8 pt-8">
                {HOW_IT_WORKS.map((step) => (
                  <div key={step.num} className="text-center">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <span className="text-3xl font-bold">{step.num}</span>
                    </div>
                    <h4 className="font-semibold text-lg mb-2">{step.title}</h4>
                    <p className="text-blue-100 text-sm">{step.desc}</p>
                  </div>
                ))}
              </div>

              <Link href="/analyzer" className="inline-flex items-center gap-2 mt-8 h-14 px-8 rounded-xl bg-white text-blue-600 text-lg font-semibold hover:bg-blue-50 transition-colors">
                Try It Now <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </section>

        {/* ── Feature Checklist ── */}
        <section className="max-w-7xl mx-auto px-6 py-20">
          <div className="text-center space-y-6">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white">Key Features</h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Everything you need to detect and prevent AI hallucinations
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 pt-8">
              {CHECKLIST.map((feat, i) => (
                <div key={i} className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-blue-200 dark:hover:border-blue-800 transition-colors">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{feat}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            <span className="font-semibold text-gray-900 dark:text-white">TruthLens AI</span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Detect hallucinations in AI-generated content with confidence
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            © 2026 TruthLens AI. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
