import { useState } from "react";
import { X, Clock, Calendar, CheckCircle2, Phone, Mail, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Opportunity } from "@/types/api";

interface QuickActivityModalProps {
  deal: Opportunity | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateActivity: (dealId: string, activityText: string) => void;
}

export function QuickActivityModal({
  deal,
  isOpen,
  onClose,
  onUpdateActivity,
}: QuickActivityModalProps) {
  const [activityText, setActivityText] = useState(deal?.nextActivity?.text ?? "");
  const [activityType, setActivityType] = useState<"meeting" | "call" | "email" | "task">("meeting");

  if (!isOpen || !deal) return null;

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!activityText.trim()) return;
    onUpdateActivity(deal!.id, activityText.trim());
    onClose();
  }

  function handleMarkCompleted() {
    onUpdateActivity(deal!.id, "✅ Activity completed — schedule follow-up");
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Next Required Activity
              </h2>
              <p className="text-xs text-slate-500 font-medium">{deal.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="mt-4 space-y-4 text-xs">
          {/* Quick Type Selection */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Activity Type
            </label>
            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => {
                  setActivityType("meeting");
                  setActivityText("📅 Demo Meeting: Tomorrow 2pm");
                }}
                className={`flex flex-col items-center gap-1 rounded-xl border p-2 text-center transition ${
                  activityType === "meeting"
                    ? "border-indigo-500 bg-indigo-50/60 text-indigo-700 dark:bg-indigo-950/40"
                    : "border-slate-200 hover:bg-slate-50 dark:border-slate-700 text-slate-600"
                }`}
              >
                <Calendar className="h-4 w-4" />
                <span className="text-[10px] font-semibold">Demo Call</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActivityType("call");
                  setActivityText("📞 Follow-up phone call with decision maker");
                }}
                className={`flex flex-col items-center gap-1 rounded-xl border p-2 text-center transition ${
                  activityType === "call"
                    ? "border-indigo-500 bg-indigo-50/60 text-indigo-700 dark:bg-indigo-950/40"
                    : "border-slate-200 hover:bg-slate-50 dark:border-slate-700 text-slate-600"
                }`}
              >
                <Phone className="h-4 w-4" />
                <span className="text-[10px] font-semibold">Phone Call</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActivityType("email");
                  setActivityText("✉️ Executive summary follow-up email");
                }}
                className={`flex flex-col items-center gap-1 rounded-xl border p-2 text-center transition ${
                  activityType === "email"
                    ? "border-indigo-500 bg-indigo-50/60 text-indigo-700 dark:bg-indigo-950/40"
                    : "border-slate-200 hover:bg-slate-50 dark:border-slate-700 text-slate-600"
                }`}
              >
                <Mail className="h-4 w-4" />
                <span className="text-[10px] font-semibold">Send Email</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActivityType("task");
                  setActivityText("📝 Review security & legal markup");
                }}
                className={`flex flex-col items-center gap-1 rounded-xl border p-2 text-center transition ${
                  activityType === "task"
                    ? "border-indigo-500 bg-indigo-50/60 text-indigo-700 dark:bg-indigo-950/40"
                    : "border-slate-200 hover:bg-slate-50 dark:border-slate-700 text-slate-600"
                }`}
              >
                <FileText className="h-4 w-4" />
                <span className="text-[10px] font-semibold">Legal / Doc</span>
              </button>
            </div>
          </div>

          {/* Activity Description */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300">
              Next Action Description
            </label>
            <input
              type="text"
              required
              value={activityText}
              onChange={(e) => setActivityText(e.target.value)}
              placeholder="e.g. 📅 Exec demo call scheduled for Thursday 3pm"
              className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>

          {/* Mark completed shortcut */}
          <div className="pt-1">
            <button
              type="button"
              onClick={handleMarkCompleted}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50/60 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300"
            >
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>Mark Current Activity Completed</span>
            </button>
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
              Save Activity
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
