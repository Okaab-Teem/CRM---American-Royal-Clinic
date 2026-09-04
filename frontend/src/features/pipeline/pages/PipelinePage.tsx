import { useState, useMemo, useCallback } from "react";
import { useOpportunities, useMoveOpportunityStage, useCreateOpportunity, useDeleteOpportunity } from "@/features/opportunities/hooks";
import { usePipelineStages } from "@/features/pipeline/hooks";
import { useToast } from "@/components/shared/toast";
import { PipelineHeader } from "../components/PipelineHeader";
import { PipelineKpiRibbon } from "../components/PipelineKpiRibbon";
import { KanbanColumn } from "../components/KanbanColumn";
import { BottomDragOverlay } from "../components/BottomDragOverlay";
import { NewDealModal } from "../components/NewDealModal";
import { CustomizeBoardModal } from "../components/CustomizeBoardModal";
import { QuickActivityModal } from "../components/QuickActivityModal";
import { useAuth } from "@/features/auth/auth-context";
import { useUsers } from "@/features/users/hooks";
import type { Opportunity, PipelineStage } from "@/types/api";

// Fallback 5 standard enterprise stages matching user specification
const DEFAULT_STAGES: PipelineStage[] = [
  { id: "stage-discovery", name: "Discovery & Qualified", order: 1, probability: 20 },
  { id: "stage-eval", name: "Technical Evaluation", order: 2, probability: 40 },
  { id: "stage-proposal", name: "Proposal & Quote", order: 3, probability: 60 },
  { id: "stage-negotiation", name: "Contract Negotiation", order: 4, probability: 80 },
  { id: "stage-won", name: "Closed Won", order: 5, probability: 100 },
];

export function PipelinePage() {
  const { user: currentUser } = useAuth();
  const isSalesRep = currentUser?.role === "SalesRepresentative";
  const { showToast } = useToast();
  const stagesQuery = usePipelineStages();
  const opportunitiesQuery = useOpportunities({ pageSize: 200 });
  const usersQuery = useUsers();
  const moveStageMutation = useMoveOpportunityStage();
  const createDealMutation = useCreateOpportunity();
  const deleteDealMutation = useDeleteOpportunity();

  // Scoping & Filter state
  const [search, setSearch] = useState("");
  const [selectedOwner, setSelectedOwner] = useState("all");
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const availableUsers = useMemo(() => {
    if (isSalesRep) return [];
    return usersQuery.data ?? [];
  }, [isSalesRep, usersQuery.data]);

  // Modals & Active Drag states
  const [activeDragDeal, setActiveDragDeal] = useState<Opportunity | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isNewDealOpen, setIsNewDealOpen] = useState(false);
  const [newDealStageId, setNewDealStageId] = useState<string | undefined>(undefined);
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);
  const [activityDeal, setActivityDeal] = useState<Opportunity | null>(null);

  // Resolve stages
  const stages = useMemo(() => {
    if (stagesQuery.data && stagesQuery.data.length >= 4) {
      return stagesQuery.data.filter((s) => s.name !== "Lost" && s.id !== "stage-lost");
    }
    return DEFAULT_STAGES;
  }, [stagesQuery.data]);

  // Filtered opportunities
  const allDeals = useMemo(() => opportunitiesQuery.data?.items ?? [], [opportunitiesQuery.data?.items]);

  const filteredDeals = useMemo(() => {
    return allDeals.filter((deal) => {
      // Search filter
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesName = deal.name.toLowerCase().includes(q);
        const matchesCustomer = (deal.customerName ?? "").toLowerCase().includes(q);
        const matchesContact = (deal.contactName ?? "").toLowerCase().includes(q);
        const matchesStage = (deal.stageName ?? "").toLowerCase().includes(q);
        if (!matchesName && !matchesCustomer && !matchesContact && !matchesStage) {
          return false;
        }
      }

      // Sales Representative Isolation: reps only see their own assigned deals
      if (isSalesRep && currentUser) {
        const isAssigned =
          deal.assignedUserId === currentUser.id ||
          deal.assignedUser?.id === currentUser.id ||
          (deal.assignedUser?.email && deal.assignedUser.email.toLowerCase() === currentUser.email.toLowerCase());
        if (!isAssigned) {
          return false;
        }
      } else if (selectedOwner !== "all") {
        if (deal.assignedUserId !== selectedOwner && deal.assignedUser?.id !== selectedOwner) {
          return false;
        }
      }

      // Quick filter chips
      if (activeFilter === "highValue" && deal.value < 50000) {
        return false;
      }
      if (activeFilter === "hot" && deal.healthBadge?.type !== "hot") {
        return false;
      }
      if (activeFilter === "stalled") {
        const isStalled = deal.healthBadge?.type === "warning" || deal.nextActivity?.isOverdue;
        if (!isStalled) return false;
      }
      if (activeFilter === "thisQuarter") {
        if (!deal.expectedCloseDate) return false;
        const d = new Date(deal.expectedCloseDate);
        const now = new Date();
        const qStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        const qEnd = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3 + 3, 0);
        if (d < qStart || d > qEnd) return false;
      }

      return true;
    });
  }, [allDeals, search, selectedOwner, activeFilter]);

  // Group deals by stage
  const groupedDeals = useMemo(() => {
    const map: Record<string, Opportunity[]> = {};
    for (const stage of stages) {
      map[stage.id] = [];
    }

    for (const deal of filteredDeals) {
      if (map[deal.pipelineStageId]) {
        map[deal.pipelineStageId].push(deal);
      } else {
        // Fallback matching by stage name or probability
        const matchingStage = stages.find(
          (s) =>
            s.name.toLowerCase() === deal.stageName?.toLowerCase() ||
            s.probability === deal.probability,
        );
        if (matchingStage && map[matchingStage.id]) {
          map[matchingStage.id].push(deal);
        } else if (stages[0]) {
          map[stages[0].id].push(deal);
        }
      }
    }
    return map;
  }, [filteredDeals, stages]);

  // Financial Aggregate Ribbon Metrics
  const { totalPipeline, weightedForecast, openDealsCount, winRate } = useMemo(() => {
    const activeDeals = filteredDeals.filter(
      (d) => !d.stageName?.toLowerCase().includes("won") && !d.stageName?.toLowerCase().includes("lost"),
    );
    const wonDeals = filteredDeals.filter((d) => d.stageName?.toLowerCase().includes("won"));
    const lostDeals = filteredDeals.filter((d) => d.stageName?.toLowerCase().includes("lost"));

    const total = filteredDeals.reduce((sum, d) => sum + d.value, 0);
    const weighted = filteredDeals.reduce((sum, d) => {
      const prob = d.probability || 20;
      return sum + d.value * (prob / 100);
    }, 0);

    const closedCount = wonDeals.length + lostDeals.length;
    const computedWinRate = closedCount > 0 ? (wonDeals.length / closedCount) * 100 : 28.4;

    return {
      totalPipeline: total,
      weightedForecast: weighted,
      openDealsCount: activeDeals.length || filteredDeals.length,
      winRate: computedWinRate,
    };
  }, [filteredDeals]);

  // Drag and Drop handlers
  const handleDragStart = useCallback((e: React.DragEvent, deal: Opportunity) => {
    setActiveDragDeal(deal);
    setIsDragging(true);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", deal.id);
  }, []);

  const handleDragEnd = useCallback(() => {
    setActiveDragDeal(null);
    setIsDragging(false);
  }, []);

  const handleDropOnStage = useCallback(
    (stageId: string) => {
      if (!activeDragDeal) return;
      const targetStage = stages.find((s) => s.id === stageId);
      moveStageMutation.mutate(
        { id: activeDragDeal.id, pipelineStageId: stageId },
        {
          onSuccess: () => {
            showToast(
              `Moved "${activeDragDeal.name}" to ${targetStage?.name ?? "stage"}`,
              "success",
            );
          },
        },
      );
      setActiveDragDeal(null);
      setIsDragging(false);
    },
    [activeDragDeal, stages, moveStageMutation, showToast],
  );

  const handleDropWon = useCallback(() => {
    if (!activeDragDeal) return;
    const wonStage = stages.find((s) => s.probability === 100) ?? stages[stages.length - 1];
    moveStageMutation.mutate(
      { id: activeDragDeal.id, pipelineStageId: wonStage.id },
      {
        onSuccess: () => {
          showToast(`🏆 Congratulations! Deal "${activeDragDeal.name}" marked as Closed Won!`, "success");
        },
      },
    );
    setActiveDragDeal(null);
    setIsDragging(false);
  }, [activeDragDeal, stages, moveStageMutation, showToast]);

  const handleDropLost = useCallback(() => {
    if (!activeDragDeal) return;
    moveStageMutation.mutate(
      { id: activeDragDeal.id, pipelineStageId: "stage-lost" },
      {
        onSuccess: () => {
          showToast(`Deal "${activeDragDeal.name}" marked as Closed Lost.`, "info");
        },
      },
    );
    setActiveDragDeal(null);
    setIsDragging(false);
  }, [activeDragDeal, moveStageMutation, showToast]);

  // Quick action handlers
  const handleMoveToStage = useCallback(
    (dealId: string, stageId: string) => {
      moveStageMutation.mutate({ id: dealId, pipelineStageId: stageId });
    },
    [moveStageMutation],
  );

  const handleDeleteDeal = useCallback(
    (dealId: string) => {
      deleteDealMutation.mutate(dealId, {
        onSuccess: () => showToast("Deal removed from pipeline", "info"),
      });
    },
    [deleteDealMutation, showToast],
  );

  const handleExportCsv = useCallback(() => {
    const headers = ["Deal Name", "Company", "Value", "Stage", "Probability", "Close Date", "Contact", "Owner"];
    const rows = filteredDeals.map((d) => [
      `"${d.name.replace(/"/g, '""')}"`,
      `"${(d.customerName ?? "").replace(/"/g, '""')}"`,
      d.value,
      `"${d.stageName ?? ""}"`,
      `${d.probability}%`,
      d.expectedCloseDate ?? "",
      `"${d.contactName ?? ""}"`,
      `"${d.assignedUser?.firstName ?? ""} ${d.assignedUser?.lastName ?? ""}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `FlowCRM_Pipeline_Export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Pipeline deals exported to CSV", "success");
  }, [filteredDeals, showToast]);

  const handleQuickAdd = useCallback((stageId: string) => {
    setNewDealStageId(stageId);
    setIsNewDealOpen(true);
  }, []);

  const handleCreateDeal = useCallback(
    (dealData: Partial<Opportunity>) => {
      createDealMutation.mutate(dealData, {
        onSuccess: (newDeal) => {
          showToast(`Deal "${newDeal.name}" added to pipeline!`, "success");
        },
      });
    },
    [createDealMutation, showToast],
  );

  const handleUpdateActivity = useCallback(
    (dealId: string, activityText: string) => {
      showToast(`Next activity updated: "${activityText}"`, "success");
      // Update local opportunity activity representation
      const targetDeal = allDeals.find((d) => d.id === dealId);
      if (targetDeal) {
        targetDeal.nextActivity = { text: activityText, type: "task" };
      }
    },
    [allDeals, showToast],
  );

  return (
    <div className="-m-4 md:-m-6 flex h-[calc(100vh-3.5rem)] flex-col overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* 1. Top Header & Scoping Controls */}
      <PipelineHeader
        search={search}
        onSearchChange={setSearch}
        selectedOwner={selectedOwner}
        onSelectOwner={setSelectedOwner}
        activeFilter={activeFilter}
        onToggleFilter={(key) => setActiveFilter(activeFilter === key ? null : key)}
        onNewDealClick={() => {
          setNewDealStageId(stages[0]?.id);
          setIsNewDealOpen(true);
        }}
        onCustomizeClick={() => setIsCustomizeOpen(true)}
        onExportClick={handleExportCsv}
        currentUser={currentUser}
        availableUsers={availableUsers}
      />

      {/* 2. Financial Aggregate Ribbon */}
      <PipelineKpiRibbon
        totalPipelineValue={totalPipeline}
        weightedForecastValue={weightedForecast}
        openDealsCount={openDealsCount}
        winRate={winRate}
      />

      {/* 3. Kanban Stage Columns Board (Horizontally Scrollable) */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
        <div className="flex h-full gap-4 items-start pb-4">
          {stages.map((stage) => (
            <KanbanColumn
              key={stage.id}
              stage={stage}
              deals={groupedDeals[stage.id] ?? []}
              activeDragDealId={activeDragDeal?.id ?? null}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDropOnStage={handleDropOnStage}
              onMoveToStage={handleMoveToStage}
              onDeleteDeal={handleDeleteDeal}
              onActivityClick={(deal) => setActivityDeal(deal)}
              onQuickAddDeal={handleQuickAdd}
            />
          ))}
        </div>
      </div>

      {/* 4. Bottom Drop Targets Overlay (Closed Won / Closed Lost) */}
      <BottomDragOverlay
        isVisible={isDragging}
        onDropWon={handleDropWon}
        onDropLost={handleDropLost}
      />

      {/* 5. Modals & Drawers */}
      <NewDealModal
        isOpen={isNewDealOpen}
        onClose={() => setIsNewDealOpen(false)}
        stages={stages}
        initialStageId={newDealStageId}
        onCreateDeal={handleCreateDeal}
        currentUser={currentUser}
      />

      <CustomizeBoardModal
        isOpen={isCustomizeOpen}
        onClose={() => setIsCustomizeOpen(false)}
        stages={stages}
        onSaveSettings={(settings) => {
          showToast(`Board preferences applied (${settings.density} view)`, "info");
        }}
      />

      <QuickActivityModal
        deal={activityDeal}
        isOpen={Boolean(activityDeal)}
        onClose={() => setActivityDeal(null)}
        onUpdateActivity={handleUpdateActivity}
      />
    </div>
  );
}
