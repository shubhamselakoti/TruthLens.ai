/**
 * components/analysis/TokenUsage.jsx — Light mode token/cost display
 */
'use client';

export default function TokenUsage({ tokenUsage = {}, processingTime = 0, mode = 'fast', claimsCount = 0 }) {
  const { input_tokens = 0, output_tokens = 0, cost_usd = 0 } = tokenUsage;
  const isDeep = mode === 'deep';

  const stats = [
    { label: 'Mode', value: isDeep ? 'Deep (Gemini)' : 'Fast (Heuristic)' },
    { label: 'Processing Time', value: processingTime >= 1000 ? `${(processingTime / 1000).toFixed(1)}s` : `${processingTime}ms` },
    { label: 'Claims Analyzed', value: claimsCount || '—' },
    ...(isDeep ? [
      { label: 'Input Tokens', value: input_tokens.toLocaleString() },
      { label: 'Output Tokens', value: output_tokens.toLocaleString() },
      { label: 'Est. Cost', value: `$${cost_usd.toFixed(5)}` },
    ] : []),
  ];

  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Analysis Metrics</h3>
      <div className="grid grid-cols-3 gap-3 text-sm">
        {stats.map(s => (
          <div key={s.label}>
            <p className="text-gray-500 dark:text-gray-400 text-xs mb-0.5">{s.label}</p>
            <p className="font-medium text-gray-900 dark:text-gray-100">{s.value}</p>
          </div>
        ))}
      </div>
      {isDeep && input_tokens > 0 && (
        <p className="mt-3 text-xs text-gray-500 dark:text-gray-400 pt-3 border-t border-gray-200 dark:border-gray-700">
          💡 Uses Gemini 1.5 Flash — $0.075/M input, $0.30/M output tokens
        </p>
      )}
    </div>
  );
}
