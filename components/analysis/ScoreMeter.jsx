/**
 * components/analysis/ScoreMeter.jsx — Clean light-mode score display
 */
'use client';

import { useEffect, useState } from 'react';

function getConfig(score) {
  if (score >= 70) return { color: 'text-red-600', bar: 'bg-red-500', badge: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', label: 'High Risk' };
  if (score >= 40) return { color: 'text-yellow-600', bar: 'bg-yellow-500', badge: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', label: 'Suspicious' };
  return { color: 'text-green-600', bar: 'bg-green-500', badge: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', label: 'Reliable' };
}

export default function ScoreMeter({ score = 0, breakdown = {} }) {
  const [animated, setAnimated] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setAnimated(score), 120);
    return () => clearTimeout(t);
  }, [score]);

  const cfg = getConfig(score);

  return (
    <div className="space-y-4">
      {/* Score header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Hallucination Risk</h3>
        <div className="flex items-center gap-2.5">
          <span className={`text-4xl font-bold ${cfg.color}`}>{animated}%</span>
          <span className={`text-sm font-medium px-3 py-1 rounded-full ${cfg.badge}`}>
            {cfg.label}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${cfg.bar} rounded-full transition-all duration-1000 ease-out`}
          style={{ width: `${animated}%` }}
        />
      </div>

      {/* Scale legend */}
      <div className="grid grid-cols-3 gap-4 text-center text-sm">
        {[
          { dot: 'bg-green-500', label: '0–30% Reliable' },
          { dot: 'bg-yellow-500', label: '30–60% Suspicious' },
          { dot: 'bg-red-500', label: '60–100% High Risk' },
        ].map((item, i) => (
          <div key={i}>
            <div className={`w-3 h-3 ${item.dot} rounded-full mx-auto mb-1`} />
            <div className="text-gray-500 dark:text-gray-400">{item.label}</div>
          </div>
        ))}
      </div>

      {/* Breakdown pills */}
      {breakdown && Object.values(breakdown).some(v => v > 0) && (
        <div className="flex gap-3 flex-wrap pt-1">
          {[
            { key: 'hallucinated', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', label: 'Hallucinated' },
            { key: 'uncertain',    color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', label: 'Uncertain' },
            { key: 'reliable',     color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', label: 'Reliable' },
          ].map(item => (
            <span key={item.key} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${item.color}`}>
              {item.label}: {breakdown[item.key] || 0}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
