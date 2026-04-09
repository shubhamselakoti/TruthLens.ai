/**
 * components/analysis/ExportReport.jsx — Light mode export buttons
 */
'use client';

import { useState } from 'react';
import { Copy, Download, Check, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ExportReport({ result, question, answer }) {
  const [copied, setCopied] = useState(false);

  function buildReport() {
    const lines = [
      'TruthLens AI — Hallucination Analysis Report',
      `Generated: ${new Date().toLocaleString()}`,
      `Mode: ${result.mode?.toUpperCase()}`,
      '',
      `HALLUCINATION SCORE: ${result.score}%`,
      `Status: ${result.score < 30 ? 'RELIABLE' : result.score < 60 ? 'SUSPICIOUS' : 'HIGH RISK'}`,
      '',
    ];
    if (question) lines.push('QUESTION:', question, '');
    lines.push('ANSWER:', answer, '');
    if (result.explanations?.length) {
      lines.push('SUMMARY:');
      result.explanations.forEach((e, i) => lines.push(`${i + 1}. ${e}`));
      lines.push('');
    }
    if (result.flagged_sentences?.length) {
      lines.push('FLAGGED SENTENCES:');
      result.flagged_sentences.forEach((s, i) => {
        lines.push(`${i + 1}. [${s.type?.toUpperCase()}] ${s.score}%`);
        lines.push(`   "${s.text}"`);
        if (s.reason) lines.push(`   Reason: ${s.reason}`);
      });
    }
    if (result.sources?.length) {
      lines.push('', 'SOURCES:');
      result.sources.forEach(s => lines.push(`• ${s.title} — ${s.url}`));
    }
    return lines.join('\n');
  }

  function handleCopy() {
    navigator.clipboard.writeText(buildReport()).then(() => {
      setCopied(true);
      toast.success('Report copied!');
      setTimeout(() => setCopied(false), 2500);
    });
  }

  function handleDownloadTxt() {
    const blob = new Blob([buildReport()], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `truthlens-${Date.now()}.txt`; a.click();
    URL.revokeObjectURL(url);
    toast.success('Downloaded!');
  }

  function handleDownloadJSON() {
    const blob = new Blob([JSON.stringify({ question, answer, ...result }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `truthlens-${Date.now()}.json`; a.click();
    URL.revokeObjectURL(url);
    toast.success('Downloaded!');
  }

  const btnBase = "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors";

  return (
    <div className="flex gap-2 flex-wrap">
      <button onClick={handleCopy} className={btnBase}>
        {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
        {copied ? 'Copied!' : 'Copy Report'}
      </button>
      <button onClick={handleDownloadTxt} className={btnBase}>
        <FileText className="w-3.5 h-3.5" /> .txt
      </button>
      <button onClick={handleDownloadJSON} className={btnBase}>
        <Download className="w-3.5 h-3.5" /> JSON
      </button>
    </div>
  );
}
