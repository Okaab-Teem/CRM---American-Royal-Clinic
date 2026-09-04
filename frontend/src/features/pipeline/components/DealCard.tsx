import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Calendar,
  MoreHorizontal,
  Clock,
  User,
  ExternalLink,
  Award,
  XCircle,
  Trash2,
  Edit2,
  CalendarDays,
} from "lucide-react";
import { formatMoney } from "@/lib/formatters";
import type { Opportunity } from "@/types/api";

interface DealCardProps {
  deal: Opportunity;
  isDragging: boolean;
  onDragStart: (e: React.DragEvent, deal: Opportunity) => void;
  onDragEnd: (e: React.DragEvent) => void;
  onMoveToStage: (dealId: string, stageId: string) => void;
  onDeleteDeal: (dealId: string) => void;
  onActivityClick: (deal: Opportunity) => void;
}

export function DealCard({
  deal,
  isDragging,
  onDragStart,
  onDragEnd,
  onMoveToStage,
  onDeleteDeal,
  onActivityClick,
}: DealCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Determine if close date is past due
  const closeDate = deal.expectedCloseDate ? new Date(deal.expectedCloseDate) : null;
  const isPastDue = closeDate ? closeDate.getTime() < Date.now() : false;
  const formattedCloseDate = closeDate
    ? closeDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : "No date";

  // Health badge styling
  const healthBadge = deal.healthBadge ?? { type: "track", text: "🟢 On Track" };
  const badgeClasses = {
    hot: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800",
    warning: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800",
    velocity: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800",
    track: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800",
    danger: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800",
  }[healthBadge.type] ?? "bg-slate-50 text-slate-700 border-slate-200";

  // Assigned rep initials and background
  const repInitials = deal.assignedUser
    ? `${deal.assignedUser.firstName?.[0] ?? ""}${deal.assignedUser.lastName?.[0] ?? ""}`
    : "UN";
  const repName = deal.assignedUser
    ? `${deal.assignedUser.firstName} ${deal.assignedUser.lastName}`
    : "Unassigned";

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, deal)}
      onDragEnd={onDragEnd}
      className={`group relative rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-xs transition-all duration-150 select-none cursor-grab active:cursor-grabbing hover:border-slate-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700 ${
        isDragging
          ? "rotate-2 scale-[1.02] shadow-2xl opacity-80 border-indigo-500 ring-2 ring-indigo-500/20"
          : ""
      }`}
    >
      {/* Card Header: Health Tag + Hover Menu */}
      <div className="flex items-center justify-between gap-2 pb-1.5">
        <span
          className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold tracking-tight ${badgeClasses}`}
        >
          {healthBadge.text}
        </span>

        {/* Hover Menu Icon */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsMenuOpen(!isMenuOpen);
            }}
            className="rounded p-1 text-slate-400 opacity-0 transition group-hover:opacity-100 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            title="Deal options"
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
          </button>

          {isMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMenuOpen(false);
                }}
              />
              <div className="absolute right-0 top-full z-40 mt-1 w-44 rounded-xl border border-slate-200 bg-white p-1 text-xs shadow-xl dark:border-slate-700 dark:bg-slate-800">
                <Link
                  to={`/opportunities/${deal.id}`}
                  className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
                  <span>View Details</span>
                </Link>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMenuOpen(false);
                    onMoveToStage(deal.id, "stage-won");
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 font-medium text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                >
                  <Award className="h-3.5 w-3.5 text-emerald-500" />
                  <span>Mark Closed Won</span>
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMenuOpen(false);
                    onMoveToStage(deal.id, "stage-lost");
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                >
                  <XCircle className="h-3.5 w-3.5 text-rose-500" />
                  <span>Mark Closed Lost</span>
                </button>

                <div className="my-1 border-t border-slate-100 dark:border-slate-700" />

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMenuOpen(false);
                    onDeleteDeal(deal.id);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                >
                  <Trash2 className="h-3.5 w-3.5 text-red-500" />
                  <span>Delete Deal</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Company Name: Muted uppercase text */}
      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
        {deal.customerName || "ACME CORP"}
      </div>

      {/* Deal Title: Bold 14px text */}
      <Link
        to={`/opportunities/${deal.id}`}
        className="mt-0.5 block text-sm font-semibold leading-snug text-slate-900 transition hover:text-indigo-600 dark:text-slate-100 dark:hover:text-indigo-400"
      >
        {deal.name}
      </Link>

      {/* Deal Amount & Close Date */}
      <div className="mt-2.5 flex items-center justify-between">
        {/* Deal Amount: Bold prominent formatted currency */}
        <span className="text-base font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
          {formatMoney(deal.value)}
        </span>

        {/* Target Close Date: Inline calendar icon with date badge */}
        <div
          className={`flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium ${
            isPastDue
              ? "bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 font-bold"
              : "text-slate-500 bg-slate-100/80 dark:bg-slate-800 dark:text-slate-400"
          }`}
          title={isPastDue ? "Target close date past due!" : "Target close date"}
        >
          <Calendar className="h-3 w-3" />
          <span>{formattedCloseDate}</span>
        </div>
      </div>

      {/* Activity Button Pill */}
      <div className="mt-2.5">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onActivityClick(deal);
          }}
          className={`group/act flex w-full items-center justify-between rounded-lg border px-2.5 py-1.5 text-left text-xs font-medium transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800 ${
            deal.nextActivity?.isOverdue
              ? "border-amber-200 bg-amber-50/70 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
              : "border-slate-200 bg-slate-50 text-slate-700 dark:bg-slate-800/60 dark:text-slate-300"
          }`}
        >
          <span className="truncate pr-1 text-[11px]">
            {deal.nextActivity?.text ?? "📅 Schedule next activity"}
          </span>
          <Clock className="h-3 w-3 shrink-0 text-slate-400 group-hover/act:text-indigo-500" />
        </button>
      </div>

      {/* Card Footer: Primary contact name badge on left, assigned sales rep avatar on right */}
      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-xs dark:border-slate-800/80">
        {/* Contact Badge */}
        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
          <User className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-[11px] font-semibold truncate max-w-[130px]">
            {deal.contactName ?? "David Miller"}
          </span>
        </div>

        {/* Assigned Rep Avatar */}
        <div
          className="relative flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white shadow-2xs"
          title={`Assigned to ${repName}`}
        >
          {repInitials}
        </div>
      </div>
    </div>
  );
}
