/**
 * components/analysis/ExplanationPanel.jsx — Light mode explanation list
 */
'use client';

import { AlertCircle, CheckCircle, Info, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { useState } from 'react';

const SEVERITY = {
  hallucination: {
    icon: <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />,
    card: 'border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-900/10',
  },
  uncertain: {
    icon: <Info className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />,
    card: 'border-yellow-200 bg-yellow-50 dark:border-yellow-900/50 dark:bg-yellow-900/10',
  },
  reliable: {
    icon: <CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />,
    card: 'border-blue-200 bg-blue-50 dark:border-blue-900/50 dark:bg-blue-900/10',
  },
};

function FlaggedItem({ item }) {
  const [open, setOpen] = useState(false);
  const cfg = SEVERITY[item.type] || SEVERITY.reliable;

  return (
    <div className={`border rounded-lg overflow-hidden ${cfg.card}`}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full text-left flex items-start gap-3 p-4 bg-transparent hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
      >
        {cfg.icon}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 leading-relaxed">
            "{item.text?.slice(0, 100)}{item.text?.length > 100 ? '…' : ''}"
          </p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-xs font-semibold capitalize text-gray-500 dark:text-gray-400">
              {item.type}
            </span>
            <span className="text-xs text-gray-400">·</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">{item.score}% risk</span>
          </div>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
      </button>
      {open && (
        <div className="px-4 pb-4 pt-0 border-t border-black/5 dark:border-white/5 space-y-2">
          {item.reason && (
            <p className="text-sm text-gray-700 dark:text-gray-300">{item.reason}</p>
          )}
          {item.sources?.length > 0 && (
            <div className="space-y-1 pt-1">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Sources</p>
              {item.sources.map((src, i) => (
                <a key={i} href={src} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline">
                  <ExternalLink className="w-3 h-3" />
                  {src.replace('https://en.wikipedia.org/wiki/', 'Wikipedia: ').slice(0, 60)}
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ExplanationPanel({ explanations = [], flagged_sentences = [] }) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? flagged_sentences : flagged_sentences.slice(0, 4);
  const hallucCount = flagged_sentences.filter(f => f.type === 'hallucination').length;

  return (
    <div className="space-y-6">
      {/* Summary explanations */}
      {explanations.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Detailed Analysis
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({flagged_sentences.length} issue{flagged_sentences.length !== 1 ? 's' : ''} found)
            </span>
          </h3>

          {flagged_sentences.length === 0 ? (
            <div className="p-5 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-900/50 rounded-lg flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-green-900 dark:text-green-300">No major issues detected</p>
                <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                  The analyzed text appears reliable with no obvious hallucinations detected.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
              {explanations.map((exp, i) => (
                <div key={i} className="flex gap-2.5 text-sm text-gray-700 dark:text-gray-300">
                  <span className="text-blue-500 font-bold flex-shrink-0 mt-0.5">{i + 1}.</span>
                  {exp}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Flagged sentence list */}
      {flagged_sentences.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Flagged Sentences</h3>
            {hallucCount > 0 && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                {hallucCount} hallucinated
              </span>
            )}
          </div>
          <div className="space-y-2">
            {visible.map((item, i) => <FlaggedItem key={i} item={item} />)}
          </div>
          {flagged_sentences.length > 4 && (
            <button
              onClick={() => setShowAll(s => !s)}
              className="mt-2 w-full py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              {showAll ? 'Show Less ↑' : `Show ${flagged_sentences.length - 4} More ↓`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
