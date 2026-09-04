import { useState } from "react";
import { Plus, MoreVertical } from "lucide-react";
import { formatMoney } from "@/lib/formatters";
import { DealCard } from "./DealCard";
import type { Opportunity, PipelineStage } from "@/types/api";

interface KanbanColumnProps {
  stage: PipelineStage;
  deals: Opportunity[];
  activeDragDealId: string | null;
  onDragStart: (e: React.DragEvent, deal: Opportunity) => void;
  onDragEnd: (e: React.DragEvent) => void;
  onDropOnStage: (stageId: string) => void;
  onMoveToStage: (dealId: string, stageId: string) => void;
  onDeleteDeal: (dealId: string) => void;
  onActivityClick: (deal: Opportunity) => void;
  onQuickAddDeal: (stageId: string) => void;
}

// Stage accent dot colors
const STAGE_COLORS: Record<string, { dot: string; glow: string; tint?: string; border?: string }> = {
  "stage-discovery": {
    dot: "bg-blue-500",
    glow: "shadow-[0_0_8px_rgba(59,130,246,0.5)]",
  },
  "stage-eval": {
    dot: "bg-indigo-500",
    glow: "shadow-[0_0_8px_rgba(99,102,241,0.5)]",
  },
  "stage-proposal": {
    dot: "bg-amber-500",
    glow: "shadow-[0_0_8px_rgba(245,158,11,0.5)]",
  },
  "stage-negotiation": {
    dot: "bg-teal-500",
    glow: "shadow-[0_0_8px_rgba(20,184,166,0.5)]",
  },
  "stage-won": {
    dot: "bg-emerald-500",
    glow: "shadow-[0_0_8px_rgba(16,185,129,0.5)]",
    tint: "bg-emerald-50/40 dark:bg-emerald-950/20",
    border: "border-emerald-200/80 dark:border-emerald-900/60",
  },
};

export function KanbanColumn({
  stage,
  deals,
  activeDragDealId,
  onDragStart,
  onDragEnd,
  onDropOnStage,
  onMoveToStage,
  onDeleteDeal,
  onActivityClick,
  onQuickAddDeal,
}: KanbanColumnProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const stageTotalValue = deals.reduce((sum, d) => sum + d.value, 0);
  const isWonStage = stage.name.toLowerCase().includes("won") || stage.probability === 100;
  const stageVisual = STAGE_COLORS[stage.id] ?? {
    dot: "bg-slate-400",
    glow: "",
    tint: isWonStage ? "bg-emerald-50/40 dark:bg-emerald-950/20" : undefined,
    border: isWonStage ? "border-emerald-200/80 dark:border-emerald-900/60" : undefined,
  };

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (!isDragOver) setIsDragOver(true);
  }

  function handleDragLeave() {
    setIsDragOver(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(false);
    onDropOnStage(stage.id);
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex h-full min-w-[310px] max-w-[330px] flex-1 flex-col rounded-2xl border transition-colors duration-150 ${
        stageVisual.border ?? "border-slate-200 dark:border-slate-800"
      } ${
        isDragOver
          ? "border-indigo-500 bg-indigo-50/40 ring-2 ring-indigo-500/20 dark:bg-indigo-950/30"
          : stageVisual.tint ?? "bg-slate-100/70 dark:bg-slate-900/40"
      }`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between border-b border-slate-200/80 px-3.5 py-3 dark:border-slate-800/80">
        <div className="flex items-center gap-2">
          {/* Stage dot */}
          <span className={`h-2.5 w-2.5 rounded-full ${stageVisual.dot} ${stageVisual.glow}`} />
          <h2 className="text-xs font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {stage.name}
          </h2>
          <span className="rounded bg-slate-200/70 px-1.5 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {stage.probability}%
          </span>
        </div>

        {/* Quick add "+" button */}
        <button
          onClick={() => onQuickAddDeal(stage.id)}
          title={`Add deal to ${stage.name}`}
          className="rounded p-1 text-slate-400 transition hover:bg-slate-200/80 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* Subheader: Deal count badge and column total sum */}
      <div className="flex items-center justify-between bg-white/50 px-3.5 py-1.5 text-[11px] font-medium text-slate-500 border-b border-slate-100 dark:bg-slate-900/30 dark:border-slate-800/50">
        <span>
          {deals.length} {deals.length === 1 ? "deal" : "deals"}
        </span>
        <span className="font-bold text-slate-700 dark:text-slate-300">
          {formatMoney(stageTotalValue)}
        </span>
      </div>

      {/* Deals Card List (Scrollable) */}
      <div className="flex-1 space-y-2.5 overflow-y-auto p-2.5 scrollbar-thin">
        {deals.map((deal) => (
          <DealCard
            key={deal.id}
            deal={deal}
            isDragging={activeDragDealId === deal.id}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onMoveToStage={onMoveToStage}
            onDeleteDeal={onDeleteDeal}
            onActivityClick={onActivityClick}
          />
        ))}

        {deals.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300/80 p-8 text-center dark:border-slate-700/80">
            <p className="text-xs font-medium text-slate-400">No deals in this stage</p>
            <button
              onClick={() => onQuickAddDeal(stage.id)}
              className="mt-2 text-[11px] font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
            >
              + Add a deal
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
