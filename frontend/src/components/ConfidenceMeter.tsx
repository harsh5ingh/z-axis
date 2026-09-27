import React from 'react';
import { ConfidenceScore } from '../types';
import { Gauge, Info } from 'lucide-react';

interface ConfidenceMeterProps {
  confidence?: ConfidenceScore;
}

export const ConfidenceMeter: React.FC<ConfidenceMeterProps> = ({ confidence }) => {
  if (!confidence) {
    return (
      <div className="p-4 text-center text-xs text-slate-400 dark:text-slate-500">
        Calculating confidence...
      </div>
    );
  }

  const score = confidence.overall_score;

  const getColor = (val: number) => {
    if (val >= 85) {
      return 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:text-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-800';
    }

    if (val >= 65) {
      return 'text-amber-600 bg-amber-50 border-amber-200 dark:text-amber-300 dark:bg-amber-950/40 dark:border-amber-800';
    }

    return 'text-rose-600 bg-rose-50 border-rose-200 dark:text-rose-300 dark:bg-rose-950/40 dark:border-rose-800';
  };

  const getBarColor = (val: number) => {
    if (val >= 85) return 'bg-emerald-500';
    if (val >= 65) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  return (
    <div className="confidence-meter-card p-4 rounded-xl border border-slate-200 bg-white shadow-sm space-y-3">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Gauge className="h-5 w-5 text-blue-900 dark:text-blue-300" />

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-100">
              Technical Confidence Score
            </h4>

            <span className="text-[10px] text-slate-400 dark:text-slate-400">
              Prototype Multi-Factor Spatial Index
            </span>
          </div>
        </div>

        <div
          className={`rounded-lg border px-3 py-1 text-base font-extrabold ${getColor(score)}`}
        >
          {score}%
        </div>
      </div>

      {/* Main Bar */}
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div
          className={`h-2.5 rounded-full transition-all duration-500 ${getBarColor(score)}`}
          style={{ width: `${score}%` }}
        />
      </div>

      {/* 5 Factors */}
      <div className="grid grid-cols-5 gap-2 pt-1 text-center">

        <div className="rounded border border-slate-100 bg-slate-50 p-1.5 dark:border-slate-700 dark:bg-[#14243a]">
          <span className="block text-[10px] text-slate-500 dark:text-slate-300">
            Evidence (25%)
          </span>
          <span className="text-xs font-bold text-slate-800 dark:text-white">
            {confidence.evidence_completeness}%
          </span>
        </div>

        <div className="rounded border border-slate-100 bg-slate-50 p-1.5 dark:border-slate-700 dark:bg-[#14243a]">
          <span className="block text-[10px] text-slate-500 dark:text-slate-300">
            Geometry (25%)
          </span>
          <span className="text-xs font-bold text-slate-800 dark:text-white">
            {confidence.geometry_quality}%
          </span>
        </div>

        <div className="rounded border border-slate-100 bg-slate-50 p-1.5 dark:border-slate-700 dark:bg-[#14243a]">
          <span className="block text-[10px] text-slate-500 dark:text-slate-300">
            Position (20%)
          </span>
          <span className="text-xs font-bold text-slate-800 dark:text-white">
            {confidence.positional_quality}%
          </span>
        </div>

        <div className="rounded border border-slate-100 bg-slate-50 p-1.5 dark:border-slate-700 dark:bg-[#14243a]">
          <span className="block text-[10px] text-slate-500 dark:text-slate-300">
            Agreement (20%)
          </span>
          <span className="text-xs font-bold text-slate-800 dark:text-white">
            {confidence.cross_source_agreement}%
          </span>
        </div>

        <div className="rounded border border-slate-100 bg-slate-50 p-1.5 dark:border-slate-700 dark:bg-[#14243a]">
          <span className="block text-[10px] text-slate-500 dark:text-slate-300">
            Rules (10%)
          </span>
          <span className="text-xs font-bold text-slate-800 dark:text-white">
            {confidence.validation_score}%
          </span>
        </div>

      </div>

      {/* Disclaimer */}
      <div className="flex items-start space-x-1.5 rounded-lg border border-blue-100 bg-blue-50/70 p-2 text-[11px] text-slate-500 dark:border-blue-900/70 dark:bg-blue-950/30 dark:text-slate-300">

        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-600 dark:text-blue-300" />

        <p className="leading-tight">
          <strong className="text-slate-700 dark:text-slate-200">
            Notice:
          </strong>{' '}
          This score indicates spatial data consistency and sensor evidence completeness. It does not certify legal ownership or title registry.
        </p>

      </div>
    </div>
  );
};