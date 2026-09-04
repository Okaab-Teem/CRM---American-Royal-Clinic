import { useState, useEffect, useRef } from "react";
import {
  Search,
  Plus,
  SlidersHorizontal,
  Download,
  ChevronDown,
  Building2,
  Calendar,
  Sparkles,
  Flame,
  AlertTriangle,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";

import type { CurrentUser } from "@/types/common";

interface PipelineHeaderProps {
  search: string;
  onSearchChange: (value: string) => void;
  selectedOwner: string;
  onSelectOwner: (ownerId: string) => void;
  activeFilter: string | null;
  onToggleFilter: (filterKey: string) => void;
  onNewDealClick: () => void;
  onCustomizeClick: () => void;
  onExportClick: () => void;
  currentUser?: CurrentUser | null;
  availableUsers?: CurrentUser[];
}

const PIPELINES = [
  { id: "pipe-enterprise-v2", name: "Enterprise Software Pipeline v2", count: "12 active" },
  { id: "pipe-mid-market", name: "Mid-Market Growth Q4", count: "8 active" },
  { id: "pipe-renewals", name: "Enterprise Expansion & Renewals", count: "15 active" },
];

const REPS = [
  { id: "all", name: "All Reps", initials: "ALL", bg: "bg-slate-700" },
  { id: "u-sara", name: "Sara Ahmed", initials: "SA", bg: "bg-indigo-600" },
  { id: "u-omar", name: "Omar Hassan", initials: "OH", bg: "bg-emerald-600" },
  { id: "u-manager", name: "Mariam Saleh", initials: "MS", bg: "bg-purple-600" },
  { id: "u-admin", name: "Flow Admin", initials: "FA", bg: "bg-amber-600" },
];

export function PipelineHeader({
  search,
  onSearchChange,
  selectedOwner,
  onSelectOwner,
  activeFilter,
  onToggleFilter,
  onNewDealClick,
  onCustomizeClick,
  onExportClick,
  currentUser,
  availableUsers = [],
}: PipelineHeaderProps) {
  const isSalesRep = currentUser?.role === "SalesRepresentative";
  const [isPipelineMenuOpen, setIsPipelineMenuOpen] = useState(false);
  const [selectedPipeline, setSelectedPipeline] = useState(PIPELINES[0]);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Global ⌘K / Ctrl+K keyboard shortcut
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="space-y-3.5 border-b border-slate-200 bg-white px-6 py-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
      {/* Top row: Breadcrumb + Pipeline Switcher + Actions */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
            <span>Deals</span>
            <span>/</span>
            <span>Pipelines</span>
            <span>/</span>
          </div>

          {/* Pipeline Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsPipelineMenuOpen(!isPipelineMenuOpen)}
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-100 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
            >
              <Building2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <span>{selectedPipeline.name}</span>
              <span className="rounded-full bg-slate-200 px-1.5 py-0.5 text-[10px] font-bold text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                {selectedPipeline.count}
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
            </button>

            {isPipelineMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setIsPipelineMenuOpen(false)}
                />
                <div className="absolute left-0 top-full z-30 mt-1 w-72 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-slate-700 dark:bg-slate-800">
                  <div className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Switch Sales Pipeline
                  </div>
                  {PIPELINES.map((pipe) => (
                    <button
                      key={pipe.id}
                      onClick={() => {
                        setSelectedPipeline(pipe);
                        setIsPipelineMenuOpen(false);
                      }}
                      className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs font-medium transition hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-slate-100">
                          {pipe.name}
                        </div>
                        <div className="text-[11px] text-slate-500">{pipe.count}</div>
                      </div>
                      {selectedPipeline.id === pipe.id && (
                        <Check className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right header actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={onCustomizeClick}
            className="h-9 gap-1.5 text-xs font-medium border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>Customize Board</span>
          </Button>

          <Button
            variant="secondary"
            onClick={onExportClick}
            className="h-9 gap-1.5 text-xs font-medium border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export</span>
          </Button>

          <Button
            onClick={onNewDealClick}
            className="h-9 gap-1.5 bg-indigo-600 px-3.5 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700 active:scale-95 dark:bg-indigo-500 dark:hover:bg-indigo-600"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            <span>New Deal</span>
          </Button>
        </div>
      </div>

      {/* Middle row: Live Search + Owner Avatar Group + Quick Filter Chips */}
      <div className="flex flex-col gap-3 pt-1 md:flex-row md:items-center md:justify-between">
        {/* Left: Search input with ⌘K badge */}
        <div className="relative w-full md:w-80">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search deals, accounts, contacts..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-14 text-xs text-slate-900 transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:bg-slate-900"
          />
          <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 shadow-2xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
            ⌘K
          </div>
        </div>

        {/* Center/Right: Owner Filter Avatars + Filter Chips */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Owner Avatar Group Filter */}
          {isSalesRep ? (
            <div className="flex items-center gap-1.5 border-r border-slate-200 pr-2.5 dark:border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 mr-1 hidden sm:inline">
                Owner:
              </span>
              <div className="flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 border border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800 shadow-xs">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white">
                  {currentUser?.firstName?.charAt(0) ?? "S"}{currentUser?.lastName?.charAt(0) ?? "A"}
                </span>
                <span>{currentUser?.firstName} {currentUser?.lastName}</span>
                <span className="rounded bg-indigo-200/70 px-1.5 py-0.5 text-[9px] uppercase font-bold text-indigo-900 dark:bg-indigo-900 dark:text-indigo-200">
                  My Pipeline
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-1 border-r border-slate-200 pr-2.5 dark:border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 mr-1 hidden sm:inline">
                Owner:
              </span>
              <button
                key="all"
                onClick={() => onSelectOwner("all")}
                title="All Team Deals"
                className={`relative flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold text-white transition-all bg-slate-700 ${
                  selectedOwner === "all"
                    ? "ring-2 ring-indigo-500 ring-offset-2 scale-110 shadow-sm"
                    : "opacity-75 hover:opacity-100 hover:scale-105"
                }`}
              >
                ALL
              </button>
              {(availableUsers.length > 0
                ? availableUsers
                : REPS.filter((r) => r.id !== "all").map((r) => ({
                    id: r.id,
                    firstName: r.name.split(" ")[0],
                    lastName: r.name.split(" ")[1] ?? "",
                    role: "SalesRepresentative" as const,
                  }))
              ).map((rep, idx) => {
                const isSelected = selectedOwner === rep.id;
                const initials = `${rep.firstName.charAt(0)}${rep.lastName.charAt(0)}`.toUpperCase();
                const colors = ["bg-indigo-600", "bg-emerald-600", "bg-purple-600", "bg-amber-600", "bg-rose-600"];
                const bg = colors[idx % colors.length];
                return (
                  <button
                    key={rep.id}
                    onClick={() => onSelectOwner(rep.id)}
                    title={`${rep.firstName} ${rep.lastName} (${rep.role})`}
                    className={`relative flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold text-white transition-all ${bg} ${
                      isSelected
                        ? "ring-2 ring-indigo-500 ring-offset-2 scale-110 shadow-sm"
                        : "opacity-75 hover:opacity-100 hover:scale-105"
                    }`}
                  >
                    {initials}
                  </button>
                );
              })}
            </div>
          )}

          {/* Quick Filter Chips */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => onToggleFilter("thisQuarter")}
              className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium transition ${
                activeFilter === "thisQuarter"
                  ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              }`}
            >
              <Calendar className="h-3 w-3" />
              <span>Close Date: This Quarter</span>
            </button>

            <button
              onClick={() => onToggleFilter("highValue")}
              className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium transition ${
                activeFilter === "highValue"
                  ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              }`}
            >
              <Sparkles className="h-3 w-3 text-amber-500" />
              <span>Value &gt; $50k</span>
            </button>

            <button
              onClick={() => onToggleFilter("hot")}
              className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium transition ${
                activeFilter === "hot"
                  ? "border-red-500 bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              }`}
            >
              <Flame className="h-3 w-3 text-red-500" />
              <span>Hot Deals</span>
            </button>

            <button
              onClick={() => onToggleFilter("stalled")}
              className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium transition ${
                activeFilter === "stalled"
                  ? "border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              }`}
            >
              <AlertTriangle className="h-3 w-3 text-amber-500" />
              <span>Needs Activity</span>
            </button>

            {activeFilter && (
              <button
                onClick={() => onToggleFilter("")}
                className="text-[11px] font-semibold text-slate-500 underline hover:text-slate-900 dark:hover:text-slate-100 ml-1"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
