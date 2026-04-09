/**
 * app/history/page.js — Light mode history page matching reference style
 */
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Clock, AlertTriangle, ArrowRight, Zap, Brain, Shield
} from 'lucide-react';
import Navbar from '@/components/ui/Navbar';

function ScoreBadge({ score }) {
  const cfg =
    score >= 70 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
    score >= 40 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
  const label = score >= 70 ? 'High Risk' : score >= 40 ? 'Suspicious' : 'Reliable';

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {score}% — {label}
    </span>
  );
}

function HistoryCard({ item }) {
  const preview = item.answer?.slice(0, 130) || '';
  const date = new Date(item.createdAt);

  return (
    <Link href="/analyzer" className="block no-underline group">
      <div className="p-5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm transition-all">
        {item.question && (
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 truncate">
            Q: {item.question.slice(0, 90)}{item.question.length > 90 ? '…' : ''}
          </p>
        )}
        <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed mb-3">
          {preview}{preview.length === 130 ? '…' : ''}
        </p>
        <div className="flex items-center gap-2.5 flex-wrap">
          <ScoreBadge score={item.score} />
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400`}>
            {item.mode === 'deep' ? <Brain className="w-3 h-3" /> : <Zap className="w-3 h-3" />}
            {item.mode === 'deep' ? 'Deep' : 'Fast'}
          </span>
          <span className="text-xs text-gray-400 ml-auto">
            {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          <ArrowRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
        </div>
      </div>
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
      <Clock className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No analyses yet</h3>
      <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 max-w-xs mx-auto">
        Your analysis history will appear here after your first check.
      </p>
      <Link href="/analyzer" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors">
        Analyze Now <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}

export default function HistoryPage() {
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  useEffect(() => {
    fetch('/api/history')
      .then(r => r.json())
      .then(d => { setAnalyses(d.analyses || []); setLoading(false); })
      .catch(() => { setError('Failed to load history.'); setLoading(false); });
  }, []);

  const avgScore  = analyses.length > 0 ? Math.round(analyses.reduce((s, a) => s + a.score, 0) / analyses.length) : 0;
  const highRisk  = analyses.filter(a => a.score >= 70).length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />

      <main className="max-w-4xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Analysis History</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Your 20 most recent analyses. All data auto-expires after 30 days.
          </p>
        </div>

        {/* Stats row */}
        {analyses.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { label: 'Total Analyses', value: analyses.length, color: 'text-blue-600' },
              { label: 'Average Score',  value: `${avgScore}%`,  color: avgScore >= 70 ? 'text-red-600' : avgScore >= 40 ? 'text-yellow-600' : 'text-green-600' },
              { label: 'High Risk',      value: highRisk,         color: 'text-red-600' },
            ].map(s => (
              <div key={s.label} className="p-5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-center">
                <div className={`text-3xl font-bold ${s.color} mb-1`}>{s.value}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="space-y-3">
            {[1,2,3,4].map(i => (
              <div key={i} className="skeleton h-24 rounded-xl" style={{ animationDelay: `${i * 0.08}s` }} />
            ))}
          </div>
        ) : error ? (
          <div className="p-6 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/40 rounded-xl text-center">
            <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-3" />
            <p className="text-red-800 dark:text-red-300 font-semibold">{error}</p>
            <p className="text-red-600 dark:text-red-400 text-xs mt-1">Make sure MongoDB is connected in .env.local</p>
          </div>
        ) : analyses.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-3">
            {analyses.map((item, i) => (
              <div key={item._id || i} className="animate-fade-in-up stagger-{i}">
                <HistoryCard item={item} />
              </div>
            ))}
          </div>
        )}
      </main>

      <footer className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 mt-16">
        <div className="max-w-4xl mx-auto px-6 py-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            <span className="font-semibold text-sm text-gray-900 dark:text-white">TruthLens AI</span>
          </div>
          <p className="text-xs text-gray-400">History auto-purges after 30 days</p>
        </div>
      </footer>
    </div>
  );
}
