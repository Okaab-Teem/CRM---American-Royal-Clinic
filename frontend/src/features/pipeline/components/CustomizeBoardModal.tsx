import { useState } from "react";
import { X, SlidersHorizontal, Check, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PipelineStage } from "@/types/api";

interface CustomizeBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
  stages: PipelineStage[];
  onSaveSettings: (settings: { density: "compact" | "comfortable"; highlightOverdue: boolean }) => void;
}

export function CustomizeBoardModal({
  isOpen,
  onClose,
  stages,
  onSaveSettings,
}: CustomizeBoardModalProps) {
  const [density, setDensity] = useState<"compact" | "comfortable">("compact");
  const [highlightOverdue, setHighlightOverdue] = useState(true);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
              <SlidersHorizontal className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Customize Kanban Board
              </h2>
              <p className="text-xs text-slate-500">Configure visual layout and deal display preferences</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4 text-xs">
          {/* Information Density */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300">
              Card Information Density
            </label>
            <div className="mt-1.5 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDensity("compact")}
                className={`rounded-xl border p-3 text-left transition ${
                  density === "compact"
                    ? "border-indigo-500 bg-indigo-50/60 text-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-200 ring-1 ring-indigo-500"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                }`}
              >
                <div className="font-bold">Enterprise Compact</div>
                <div className="text-[11px] text-slate-500">Maximum visibility, HubSpot / Pipedrive dense layout</div>
              </button>

              <button
                type="button"
                onClick={() => setDensity("comfortable")}
                className={`rounded-xl border p-3 text-left transition ${
                  density === "comfortable"
                    ? "border-indigo-500 bg-indigo-50/60 text-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-200 ring-1 ring-indigo-500"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                }`}
              >
                <div className="font-bold">Comfortable</div>
                <div className="text-[11px] text-slate-500">Spaced padding and larger fonts</div>
              </button>
            </div>
          </div>

          {/* Highlight overdue toggle */}
          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-700 dark:bg-slate-800/60">
            <div>
              <div className="font-semibold text-slate-800 dark:text-slate-200">
                Highlight Overdue Close Dates
              </div>
              <div className="text-[11px] text-slate-500">
                Show warning tags on deals past their target close date
              </div>
            </div>
            <input
              type="checkbox"
              checked={highlightOverdue}
              onChange={(e) => setHighlightOverdue(e.target.checked)}
              className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500"
            />
          </div>

          {/* Active Stages Overview */}
          <div>
            <div className="font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Active Pipeline Stages ({stages.length})
            </div>
            <div className="space-y-1.5 rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 dark:border-slate-700 dark:bg-slate-800/40">
              {stages.map((stage) => (
                <div
                  key={stage.id}
                  className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 py-0.5"
                >
                  <span className="font-medium">{stage.name}</span>
                  <span className="font-bold text-slate-500">{stage.probability}% weight</span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="mt-6 flex items-center justify-end gap-2.5 border-t border-slate-100 pt-4 dark:border-slate-800">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="h-9 px-4 text-xs font-medium"
            >
              Close
            </Button>
            <Button
              type="button"
              onClick={() => {
                onSaveSettings({ density, highlightOverdue });
                onClose();
              }}
              className="h-9 bg-indigo-600 px-5 text-xs font-semibold text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
            >
              Apply Settings
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
