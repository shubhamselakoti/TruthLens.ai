/**
 * components/analysis/HighlightedText.jsx — Light mode highlighted text viewer
 */
'use client';

import { useState } from 'react';
import { AlertTriangle, CheckCircle, XCircle, Info } from 'lucide-react';

function Tooltip({ data, x, y }) {
  if (!data || data.type === 'neutral') return null;

  const configs = {
    hallucination: { icon: <XCircle className="w-3.5 h-3.5" />, color: 'text-red-600', bg: 'border-red-200', label: 'Likely Hallucinated' },
    uncertain:     { icon: <AlertTriangle className="w-3.5 h-3.5" />, color: 'text-yellow-600', bg: 'border-yellow-200', label: 'Uncertain' },
    reliable:      { icon: <CheckCircle className="w-3.5 h-3.5" />, color: 'text-green-600', bg: 'border-green-200', label: 'Reliable' },
  };
  const cfg = configs[data.type] || configs.reliable;

  return (
    <div style={{
      position: 'fixed',
      left: Math.min(x + 12, window.innerWidth - 300),
      top: y - 8,
      transform: 'translateY(-100%)',
      width: 280, zIndex: 9999,
      background: 'white',
      border: `1px solid`,
      borderRadius: 10,
      padding: 12,
      boxShadow: '0 10px 40px rgba(0,0,0,0.12)',
      pointerEvents: 'none',
    }}
      className={`${cfg.bg} dark:bg-gray-800 dark:border-gray-700`}
    >
      <div className={`flex items-center gap-1.5 mb-2 ${cfg.color} font-semibold text-xs`}>
        {cfg.icon} {cfg.label.toUpperCase()}
        {data.score != null && (
          <span className="ml-auto opacity-70">{Math.round(data.score * 100)}% confidence</span>
        )}
      </div>
      {data.reason && (
        <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">{data.reason}</p>
      )}
      {data.sources?.length > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Sources</p>
          {data.sources.slice(0, 2).map((src, i) => (
            <p key={i} className="text-xs text-blue-600 dark:text-blue-400 truncate">
              • {src.title || src.url || src}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

export default function HighlightedText({ segments = [], originalText = '' }) {
  const [tooltip, setTooltip] = useState(null);

  if (!segments || segments.length === 0) {
    return (
      <div className="p-5 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 leading-relaxed text-sm">
        {originalText}
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-3 text-xs font-medium">
        <span className="flex items-center gap-1.5 text-gray-500"><Info className="w-3 h-3" /> Hover for details</span>
        <span className="highlight-hallucination px-1.5 py-0.5 text-red-700">Hallucinated</span>
        <span className="highlight-uncertain px-1.5 py-0.5 text-yellow-700">Uncertain</span>
        <span className="highlight-reliable px-1.5 py-0.5 text-green-700">Reliable</span>
      </div>

      <div className="p-5 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700 leading-relaxed text-sm text-gray-800 dark:text-gray-200">
        {segments.map((seg, i) => {
          const cls =
            seg.type === 'hallucination' ? 'highlight-hallucination' :
            seg.type === 'uncertain'     ? 'highlight-uncertain' :
            seg.type === 'reliable'      ? 'highlight-reliable' : '';

          if (!cls) return <span key={i}>{seg.text}</span>;

          return (
            <span
              key={i}
              className={cls}
              onMouseMove={e => setTooltip({ ...seg, x: e.clientX, y: e.clientY })}
              onMouseLeave={() => setTooltip(null)}
            >
              {seg.text}
              {seg.type === 'hallucination' && (
                <AlertTriangle className="inline w-3 h-3 ml-0.5 text-red-500 opacity-70" />
              )}
            </span>
          );
        })}
      </div>

      {tooltip && <Tooltip data={tooltip} x={tooltip.x} y={tooltip.y} />}
    </div>
  );
}
