/**
 * components/analysis/SourcesPanel.jsx — Light mode sources list
 */
'use client';

import { ExternalLink, BookOpen } from 'lucide-react';

export default function SourcesPanel({ sources = [] }) {
  if (!sources || sources.length === 0) return null;

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
        Verification Sources
      </h3>
      <div className="space-y-2">
        {sources.map((src, i) => (
          <a
            key={i}
            href={src.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-gray-300 dark:hover:border-gray-500 hover:shadow-sm transition-all group"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                {src.url?.includes('wikipedia') && (
                  <img src="https://en.wikipedia.org/static/favicon/wikipedia.ico" width={13} height={13} alt="W" className="rounded-sm" />
                )}
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {src.title || 'Source'}
                </p>
              </div>
              {src.snippet && (
                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mb-1">{src.snippet}</p>
              )}
              <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{src.url}</p>
            </div>
            <div className="ml-3 flex items-center gap-2 flex-shrink-0">
              {src.relevance != null && (
                <div className="flex items-center gap-1">
                  <div className="w-14 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.round((src.relevance || 0) * 100)}%` }} />
                  </div>
                  <span className="text-xs text-gray-500 w-8 text-right">
                    {Math.round((src.relevance || 0) * 100)}%
                  </span>
                </div>
              )}
              <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
