import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Calendar,
  Check,
  CheckCircle2,
  CheckSquare,
  Clock,
  Edit2,
  Loader2,
  Mail,
  NotebookPen,
  Phone,
  Plus,
  X,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/PageHeader";
import { Skeleton } from "@/components/shared/Skeleton";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useOpportunity, useMoveOpportunityStage } from "@/features/opportunities/hooks";
import { usePipelineStages } from "@/features/pipeline/hooks";
import { useTasks, useCreateTask, useCompleteTask } from "@/features/tasks/hooks";
import { useCreateActivity } from "@/features/activities/hooks";
import { useAuth } from "@/features/auth/auth-context";
import { useToast } from "@/components/shared/toast";
import { formatDate, formatMoney } from "@/lib/formatters";
import type { ActivityType, TaskPriority } from "@/types/api";

export function OpportunityDetailsPage() {
  const { id = "" } = useParams();
  const { user } = useAuth();
  const { showToast } = useToast();

  const opportunity = useOpportunity(id);
  const stages = usePipelineStages(opportunity.data?.pipelineId);
  const tasksQuery = useTasks({ opportunityId: id, pageSize: 50 });

  const createActivityMutation = useCreateActivity();
  const createTaskMutation = useCreateTask();
  const completeTaskMutation = useCompleteTask();
  const moveStageMutation = useMoveOpportunityStage();

  // Modals
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  // Activity Form
  const [activityType, setActivityType] = useState<ActivityType>("Call");
  const [activitySubject, setActivitySubject] = useState("");
  const [activityDate, setActivityDate] = useState(() => new Date().toISOString().slice(0, 16));
  const [activityDescription, setActivityDescription] = useState("");

  // Task Form
  const [taskTitle, setTaskTitle] = useState("");
  const [taskPriority, setTaskPriority] = useState<TaskPriority>("High");
  const [taskDueDate, setTaskDueDate] = useState(() => new Date(Date.now() + 86400000 * 3).toISOString().split("T")[0]);
  const [taskDescription, setTaskDescription] = useState("");

  if (opportunity.isLoading) return <Skeleton className="h-96" />;
  if (!opportunity.data) return <PageHeader title="Opportunity not found" />;

  const tasks = tasksQuery.data?.items ?? [];

  async function handleLogActivity(e: React.FormEvent) {
    e.preventDefault();
    if (!activitySubject.trim()) {
      showToast("Activity subject is required.", "error");
      return;
    }

    try {
      await createActivityMutation.mutateAsync({
        type: activityType,
        subject: activitySubject.trim(),
        description: activityDescription.trim() || undefined,
        activityDate: new Date(activityDate).toISOString(),
        customerId: opportunity.data?.customerId,
        opportunityId: opportunity.data?.id,
      });
      showToast("Activity logged successfully.", "success");
      setIsActivityModalOpen(false);
      setActivitySubject("");
      setActivityDescription("");
    } catch {
      showToast("Failed to log activity.", "error");
    }
  }

  async function handleCreateTask(e: React.FormEvent) {
    e.preventDefault();
    if (!taskTitle.trim()) {
      showToast("Task title is required.", "error");
      return;
    }

    try {
      await createTaskMutation.mutateAsync({
        title: taskTitle.trim(),
        description: taskDescription.trim() || undefined,
        dueDate: new Date(taskDueDate).toISOString(),
        priority: taskPriority,
        assignedUserId: user?.id ?? "usr-admin",
        customerId: opportunity.data?.customerId,
        opportunityId: opportunity.data?.id,
      });
      showToast("Task created successfully.", "success");
      setIsTaskModalOpen(false);
      setTaskTitle("");
      setTaskDescription("");
      tasksQuery.refetch();
    } catch {
      showToast("Failed to create task.", "error");
    }
  }

  async function handleCompleteTask(taskId: string) {
    try {
      await completeTaskMutation.mutateAsync(taskId);
      showToast("Task completed.", "success");
      tasksQuery.refetch();
    } catch {
      showToast("Failed to complete task.", "error");
    }
  }

  async function handleSelectStage(stageId: string, stageName: string) {
    if (!opportunity.data) return;
    if (stageId === opportunity.data.pipelineStageId) return;

    try {
      await moveStageMutation.mutateAsync({
        id: opportunity.data.id,
        pipelineStageId: stageId,
      });
      showToast(`Deal moved to "${stageName}".`, "success");
      opportunity.refetch();
    } catch {
      showToast("Failed to update stage. Please try again.", "error");
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title={opportunity.data.name}
        description={`${formatMoney(opportunity.data.value)} · Owner: ${opportunity.data.assignedUser.firstName} ${opportunity.data.assignedUser.lastName}`}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={() => setIsActivityModalOpen(true)}
              className="gap-2 border border-border hover:border-primary/40 hover:bg-muted"
            >
              <NotebookPen className="h-4 w-4 text-primary" />
              <span>Add Activity</span>
            </Button>
            <Button
              variant="secondary"
              onClick={() => setIsTaskModalOpen(true)}
              className="gap-2 border border-border hover:border-primary/40 hover:bg-muted"
            >
              <CheckSquare className="h-4 w-4 text-primary" />
              <span>Add Task</span>
            </Button>
            <Link to={`/opportunities/${opportunity.data.id}/edit`}>
              <Button className="gap-2">
                <Edit2 className="h-4 w-4" />
                <span>Edit</span>
              </Button>
            </Link>
          </div>
        }
      />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle>Stage Progress</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Click any stage to transition this deal across the sales pipeline.
            </p>
          </div>
          {moveStageMutation.isPending && (
            <span className="flex items-center gap-1.5 text-xs text-primary font-medium animate-pulse">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Moving deal...
            </span>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
            {stages.data?.map((stage, index) => {
              const isCurrent = stage.id === opportunity.data?.pipelineStageId;
              const currentIndex = stages.data?.findIndex((s) => s.id === opportunity.data?.pipelineStageId) ?? -1;
              const isPast = currentIndex > -1 && index < currentIndex;

              return (
                <button
                  key={stage.id}
                  type="button"
                  disabled={moveStageMutation.isPending}
                  onClick={() => handleSelectStage(stage.id, stage.name)}
                  className={`group relative flex flex-col items-start p-3 rounded-lg border text-left transition-all duration-150 cursor-pointer ${
                    isCurrent
                      ? "bg-primary text-primary-foreground border-primary shadow-sm ring-2 ring-primary/30"
                      : isPast
                      ? "bg-primary/10 text-foreground border-primary/30 hover:bg-primary/20 hover:border-primary/50"
                      : "bg-card text-muted-foreground border-border hover:bg-muted/70 hover:text-foreground hover:border-border/80"
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span
                      className={`text-[11px] font-bold uppercase tracking-wider ${
                        isCurrent ? "text-primary-foreground/90" : isPast ? "text-primary font-semibold" : "text-muted-foreground"
                      }`}
                    >
                      Step {index + 1}
                    </span>
                    {isCurrent ? (
                      <span className="flex h-2 w-2 rounded-full bg-white animate-ping" />
                    ) : isPast ? (
                      <Check className="h-3.5 w-3.5 text-primary" />
                    ) : (
                      <span className="text-[10px] font-medium opacity-70">{stage.probability}%</span>
                    )}
                  </div>
                  <div className={`text-xs sm:text-sm font-semibold leading-tight line-clamp-2 w-full ${isCurrent ? "text-white" : ""}`}>
                    {stage.name}
                  </div>
                  <div
                    className={`mt-1.5 text-[11px] ${
                      isCurrent ? "text-primary-foreground/80 font-medium" : "text-muted-foreground"
                    }`}
                  >
                    {isCurrent ? "Active Stage" : `Click to move (${stage.probability}%)`}
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Opportunity Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Info label="Customer" value={opportunity.data.customerName} />
          <Info label="Stage" value={<StatusBadge value={opportunity.data.stageName} />} />
          <Info label="Value" value={formatMoney(opportunity.data.value)} />
          <Info label="Probability" value={`${opportunity.data.probability}%`} />
          <Info label="Expected Close" value={formatDate(opportunity.data.expectedCloseDate)} />
          <Info label="Description" value={opportunity.data.description ?? "No description."} />
        </CardContent>
      </Card>

      {/* Deal Tasks */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Deal Tasks & Milestones</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">Tasks required to progress and close this deal</p>
          </div>
          <Button onClick={() => setIsTaskModalOpen(true)} className="h-8 gap-1 text-xs">
            <Plus className="h-3.5 w-3.5" /> Add Task
          </Button>
        </CardHeader>
        <CardContent>
          {tasks.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              No tasks linked to this deal yet.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {tasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between py-2.5">
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => handleCompleteTask(task.id)}
                      disabled={task.status === "Completed"}
                      className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded-md border transition ${
                        task.status === "Completed"
                          ? "border-emerald-500 bg-emerald-500 text-white"
                          : "border-border hover:border-primary hover:bg-primary/10"
                      }`}
                    >
                      {task.status === "Completed" ? <CheckCircle2 className="h-3.5 w-3.5" /> : null}
                    </button>
                    <div>
                      <div
                        className={`text-sm font-medium ${
                          task.status === "Completed" ? "line-through text-muted-foreground" : "text-foreground"
                        }`}
                      >
                        {task.title}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                        <span>Due: {formatDate(task.dueDate)}</span>
                        <span>•</span>
                        <span>{task.priority} Priority</span>
                      </div>
                    </div>
                  </div>
                  <StatusBadge value={task.status} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Log Activity Modal */}
      {isActivityModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <NotebookPen className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-bold text-foreground">Log Activity for {opportunity.data.name}</h2>
              </div>
              <button
                onClick={() => setIsActivityModalOpen(false)}
                className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleLogActivity} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Activity Type *
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(["Call", "Meeting", "Email", "Note"] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setActivityType(type)}
                      className={`flex flex-col items-center justify-center rounded-lg border p-2 text-xs font-medium transition ${
                        activityType === type
                          ? "border-primary bg-primary/10 text-primary font-semibold"
                          : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      {type === "Call" && <Phone className="h-4 w-4 mb-1" />}
                      {type === "Meeting" && <Calendar className="h-4 w-4 mb-1" />}
                      {type === "Email" && <Mail className="h-4 w-4 mb-1" />}
                      {type === "Note" && <NotebookPen className="h-4 w-4 mb-1" />}
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Subject *
                </label>
                <input
                  type="text"
                  required
                  value={activitySubject}
                  onChange={(e) => setActivitySubject(e.target.value)}
                  placeholder="e.g. Discuss supplement payment terms and delivery timeline"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Date & Time *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={activityDate}
                  onChange={(e) => setActivityDate(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Description / Notes
                </label>
                <textarea
                  rows={3}
                  value={activityDescription}
                  onChange={(e) => setActivityDescription(e.target.value)}
                  placeholder="Summarize key takeaways, commitments, or next steps..."
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-border pt-4">
                <Button type="button" variant="secondary" onClick={() => setIsActivityModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createActivityMutation.isPending}>
                  {createActivityMutation.isPending ? "Logging..." : "Save Activity"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Task Modal */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <CheckSquare className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-bold text-foreground">Create Task for {opportunity.data.name}</h2>
              </div>
              <button
                onClick={() => setIsTaskModalOpen(false)}
                className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="e.g. Finalize contract and invoice for supplement batch"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Due Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Priority *
                  </label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value as TaskPriority)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  placeholder="Specify task instructions..."
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-border pt-4">
                <Button type="button" variant="secondary" onClick={() => setIsTaskModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createTaskMutation.isPending}>
                  {createTaskMutation.isPending ? "Creating..." : "Create Task"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs font-medium uppercase text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm">{value}</div>
    </div>
  );
}

