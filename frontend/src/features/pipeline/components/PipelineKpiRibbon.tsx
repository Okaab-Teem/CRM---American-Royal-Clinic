import { DollarSign, TrendingUp, Briefcase, Award, ArrowUpRight } from "lucide-react";
import { formatMoney } from "@/lib/formatters";

interface PipelineKpiRibbonProps {
  totalPipelineValue: number;
  weightedForecastValue: number;
  openDealsCount: number;
  winRate: number;
}

export function PipelineKpiRibbon({
  totalPipelineValue,
  weightedForecastValue,
  openDealsCount,
  winRate,
}: PipelineKpiRibbonProps) {
  const avgDealSize = openDealsCount > 0 ? totalPipelineValue / openDealsCount : 0;

  return (
    <div className="grid grid-cols-2 gap-3 border-b border-slate-200 bg-slate-50/70 px-6 py-3.5 lg:grid-cols-4 dark:border-slate-800 dark:bg-slate-900/50">
      {/* 1. Total Pipeline */}
      <div className="flex items-center gap-3.5 rounded-xl border border-slate-200/80 bg-white p-3 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
          <DollarSign className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Total Pipeline
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {formatMoney(totalPipelineValue)}
            </span>
            <span className="flex items-center text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
              <ArrowUpRight className="h-3 w-3" />
              14.8%
            </span>
          </div>
          <div className="text-[11px] text-slate-500">Unweighted active gross value</div>
        </div>
      </div>

      {/* 2. Weighted Forecast */}
      <div className="flex items-center gap-3.5 rounded-xl border border-slate-200/80 bg-white p-3 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
          <TrendingUp className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Weighted Forecast
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {formatMoney(weightedForecastValue)}
            </span>
            <span className="rounded-sm bg-emerald-100 px-1 py-0.2 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              Prob-Adjusted
            </span>
          </div>
          <div className="text-[11px] text-slate-500">Based on stage conversion rates</div>
        </div>
      </div>

      {/* 3. Open Deals */}
      <div className="flex items-center gap-3.5 rounded-xl border border-slate-200/80 bg-white p-3 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
          <Briefcase className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Open Deals
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {openDealsCount}
            </span>
            <span className="text-[11px] text-slate-500">
              Avg {formatMoney(avgDealSize)}
            </span>
          </div>
          <div className="text-[11px] text-slate-500">Active opportunities in flight</div>
        </div>
      </div>

      {/* 4. Win Rate */}
      <div className="flex items-center gap-3.5 rounded-xl border border-slate-200/80 bg-white p-3 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
          <Award className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Win Rate
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {winRate.toFixed(1)}%
            </span>
            <span className="text-[11px] font-medium text-slate-500">
              (Benchmark: 22%)
            </span>
          </div>
          <div className="text-[11px] text-slate-500">Trailing 90-day win ratio</div>
        </div>
      </div>
    </div>
  );
}
