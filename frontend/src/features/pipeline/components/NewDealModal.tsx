import { useState } from "react";
import { X, Building2, DollarSign, Calendar, User, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Opportunity, PipelineStage } from "@/types/api";
import type { CurrentUser } from "@/types/common";

interface NewDealModalProps {
  isOpen: boolean;
  onClose: () => void;
  stages: PipelineStage[];
  initialStageId?: string;
  onCreateDeal: (dealData: Partial<Opportunity>) => void;
  currentUser?: CurrentUser | null;
}

export function NewDealModal({
  isOpen,
  onClose,
  stages,
  initialStageId,
  onCreateDeal,
  currentUser,
}: NewDealModalProps) {
  const [name, setName] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [value, setValue] = useState("50000");
  const [stageId, setStageId] = useState(initialStageId ?? stages[0]?.id ?? "stage-discovery");
  const [closeDate, setCloseDate] = useState("2026-11-30");
  const [contactName, setContactName] = useState("");
  const [healthType, setHealthType] = useState<"hot" | "velocity" | "track" | "warning">("track");
  const [owner, setOwner] = useState("sara");

  if (!isOpen) return null;

  const healthLabels = {
    hot: "🔥 Hot Deal",
    velocity: "⚡ High Velocity",
    track: "🟢 On Track",
    warning: "⚠️ Inactive Warning",
  };

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !customerName.trim()) return;

    const selectedStage = stages.find((s) => s.id === stageId) ?? stages[0];

    onCreateDeal({
      name: name.trim(),
      customerName: customerName.trim().toUpperCase(),
      value: parseFloat(value) || 25000,
      pipelineStageId: stageId,
      stageName: selectedStage?.name ?? "Discovery & Qualified",
      expectedCloseDate: new Date(closeDate).toISOString(),
      contactName: contactName.trim() || "Primary Contact",
      healthBadge: {
        type: healthType,
        text: healthLabels[healthType],
      },
      nextActivity: {
        text: "📅 Initial Discovery Call",
        type: "meeting",
      },
      assignedUserId: currentUser?.id ?? (owner === "sara" ? "u-sara" : "u-omar"),
      assignedUser: {
        id: currentUser?.id ?? (owner === "sara" ? "u-sara" : "u-omar"),
        firstName: currentUser?.firstName ?? (owner === "sara" ? "Sara" : "Omar"),
        lastName: currentUser?.lastName ?? (owner === "sara" ? "Ahmed" : "Hassan"),
        email: currentUser?.email ?? (owner === "sara" ? "sara@flowcrm.local" : "omar@flowcrm.local"),
        role: currentUser?.role ?? "SalesRepresentative",
      },
    });

    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Create New Deal
              </h2>
              <p className="text-xs text-slate-500">
                Add an enterprise opportunity to your active sales pipeline
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          {/* Deal Name */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300">
              Deal Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 500 User Enterprise Migration"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>

          {/* Company Name */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300">
              Company Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. ACME LOGISTICS"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs uppercase focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>

          {/* Value & Close Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300">
                Deal Value ($ USD) *
              </label>
              <div className="relative mt-1">
                <DollarSign className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  type="number"
                  required
                  min="1000"
                  step="1000"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-3 text-xs font-semibold focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300">
                Target Close Date *
              </label>
              <div className="relative mt-1">
                <Calendar className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  type="date"
                  required
                  value={closeDate}
                  onChange={(e) => setCloseDate(e.target.value)}
                  className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-3 text-xs focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>
            </div>
          </div>

          {/* Stage & Health Badge */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300">
                Initial Pipeline Stage
              </label>
              <select
                value={stageId}
                onChange={(e) => setStageId(e.target.value)}
                className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs font-medium focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                {stages.map((stage) => (
                  <option key={stage.id} value={stage.id}>
                    {stage.name} ({stage.probability}%)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300">
                Priority / Health
              </label>
              <select
                value={healthType}
                onChange={(e) => setHealthType(e.target.value as any)}
                className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs font-medium focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                <option value="hot">🔥 Hot Deal</option>
                <option value="velocity">⚡ High Velocity</option>
                <option value="track">🟢 On Track</option>
                <option value="warning">⚠️ Needs Attention</option>
              </select>
            </div>
          </div>

          {/* Primary Contact & Rep */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300">
                Primary Contact Name
              </label>
              <input
                type="text"
                placeholder="e.g. David Miller"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300">
                Assigned Sales Rep
              </label>
              <select
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs font-medium focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                <option value="sara">Sara Ahmed (Enterprise Lead)</option>
                <option value="omar">Omar Hassan (Growth Rep)</option>
              </select>
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
              Cancel
            </Button>
            <Button
              type="submit"
              className="h-9 bg-indigo-600 px-5 text-xs font-semibold text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
            >
              Create Deal
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
