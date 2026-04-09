/**
 * components/ui/LoadingSkeleton.jsx — Clean light-mode loading state
 */
'use client';

import { useEffect, useState } from 'react';
import { Shield } from 'lucide-react';

const STEPS = [
  'Extracting verifiable claims…',
  'Cross-referencing Wikipedia…',
  'Running semantic analysis…',
  'Computing hallucination scores…',
  'Generating explanations…',
];

export default function LoadingSkeleton({ mode = 'fast' }) {
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const iv = setInterval(() => {
      setStep(s => (s + 1) % STEPS.length);
      setProgress(p => Math.min(p + Math.random() * 18 + 8, 92));
    }, mode === 'deep' ? 1800 : 1200);
    return () => clearInterval(iv);
  }, [mode]);

  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 gap-8">
      {/* Animated icon */}
      <div className="relative">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg animate-pulse">
          <Shield className="w-8 h-8 text-white" />
        </div>
        {[1, 2].map(i => (
          <div key={i} style={{
            position: 'absolute', inset: -i * 10,
            border: '1.5px solid',
            borderColor: `rgba(99,102,241,${0.25 / i})`,
            borderRadius: 16 + i * 10,
            animation: `ping ${1.2 + i * 0.4}s ease-out infinite`,
            animationDelay: `${i * 0.3}s`,
          }} />
        ))}
      </div>

      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Analyzing{mode === 'deep' ? ' (Deep Mode)' : ''}…
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 min-h-5 transition-all">
          {STEPS[step]}
        </p>
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-xs">
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-700 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between mt-1.5 text-xs text-gray-400">
          <span>Processing</span>
          <span>{Math.round(progress)}%</span>
        </div>
      </div>

      {/* Skeleton rows */}
      <div className="w-full max-w-md space-y-2.5">
        {[85, 65, 75, 45].map((w, i) => (
          <div key={i} className="skeleton h-4" style={{ width: `${w}%`, animationDelay: `${i * 0.12}s` }} />
        ))}
      </div>

      <style>{`@keyframes ping { 75%, 100% { transform: scale(2); opacity: 0; } }`}</style>
    </div>
  );
}
