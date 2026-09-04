import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Calendar,
  CheckCircle2,
  CheckSquare,
  Clock,
  Edit2,
  Mail,
  NotebookPen,
  Phone,
  Plus,
  X,
  Briefcase,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/PageHeader";
import { Skeleton } from "@/components/shared/Skeleton";
import { Table, Td, Th } from "@/components/ui/table";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useCustomer, useCustomerTimeline, useUpdateCustomer } from "@/features/customers/hooks";
import { useOpportunities } from "@/features/opportunities/hooks";
import { useTasks, useCreateTask, useCompleteTask } from "@/features/tasks/hooks";
import { useCreateActivity } from "@/features/activities/hooks";
import { useUsers } from "@/features/users/hooks";
import { useAuth } from "@/features/auth/auth-context";
import { useToast } from "@/components/shared/toast";
import { formatDate, formatMoney } from "@/lib/formatters";
import type { ActivityType, TaskPriority } from "@/types/api";

const activityIcons: Record<string, typeof Phone> = {
  Call: Phone,
  Email: Mail,
  Meeting: Calendar,
  Note: NotebookPen,
  FollowUp: Clock,
  StageChange: Layers,
  TaskCompleted: CheckCircle2,
  LeadConverted: Briefcase,
};

export function CustomerDetailsPage() {
  const { id = "" } = useParams();
  const { user } = useAuth();
  const { showToast } = useToast();

  const isManagerOrAdmin = user?.role === "Admin" || user?.role === "Manager";
  const usersQuery = useUsers({ enabled: isManagerOrAdmin });

  const customer = useCustomer(id);
  const timeline = useCustomerTimeline(id);
  const opportunitiesQuery = useOpportunities({ customerId: id, pageSize: 50 });
  const tasksQuery = useTasks({ customerId: id, pageSize: 50 });

  const updateCustomerMutation = useUpdateCustomer();
  const createActivityMutation = useCreateActivity();
  const createTaskMutation = useCreateTask();
  const completeTaskMutation = useCompleteTask();

  // Modal States
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  // Activity Form State
  const [activityType, setActivityType] = useState<ActivityType>("Call");
  const [activitySubject, setActivitySubject] = useState("");
  const [activityDate, setActivityDate] = useState(() => new Date().toISOString().slice(0, 16));
  const [activityDescription, setActivityDescription] = useState("");

  // Task Form State
  const [taskTitle, setTaskTitle] = useState("");
  const [taskPriority, setTaskPriority] = useState<TaskPriority>("High");
  const [taskDueDate, setTaskDueDate] = useState(() => new Date(Date.now() + 86400000 * 3).toISOString().split("T")[0]);
  const [taskDescription, setTaskDescription] = useState("");

  if (customer.isLoading) return <Skeleton className="h-96" />;
  if (!customer.data) return <PageHeader title="Customer not found" />;

  const opportunities = opportunitiesQuery.data?.items ?? [];
  const tasks = tasksQuery.data?.items ?? [];
  const timelineItems = timeline.data ?? [];

  const openValue = opportunities
    .filter((item) => !["Won", "Lost"].includes(item.stageName))
    .reduce((sum, item) => sum + item.value, 0);
  const pendingTasks = tasks.filter((item) => item.status !== "Completed");
  const lastActivityDate = timelineItems[0]?.activityDate ?? customer.data.updatedAt;

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
        customerId: customer.data?.id,
      });
      showToast("Activity logged successfully.", "success");
      setIsActivityModalOpen(false);
      setActivitySubject("");
      setActivityDescription("");
      timeline.refetch();
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
        customerId: customer.data?.id,
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
      showToast("Task marked as completed.", "success");
      tasksQuery.refetch();
    } catch {
      showToast("Failed to complete task.", "error");
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title={customer.data.companyName}
        description={`${customer.data.industry ?? "General"} · Owner: ${
          customer.data.assignedUser
            ? `${customer.data.assignedUser.firstName} ${customer.data.assignedUser.lastName}`
            : "Unassigned"
        }`}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={() => setIsActivityModalOpen(true)}
              className="gap-2 border border-border hover:border-primary/40 hover:bg-muted"
            >
              <NotebookPen className="h-4 w-4 text-primary" />
              <span>Activity</span>
            </Button>
            <Button
              variant="secondary"
              onClick={() => setIsTaskModalOpen(true)}
              className="gap-2 border border-border hover:border-primary/40 hover:bg-muted"
            >
              <CheckSquare className="h-4 w-4 text-primary" />
              <span>Task</span>
            </Button>
            <Link to={`/customers/${customer.data.id}/edit`}>
              <Button className="gap-2">
                <Edit2 className="h-4 w-4" />
                <span>Edit</span>
              </Button>
            </Link>
          </div>
        }
      />

      {/* KPI Stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Open Opportunities" value={formatMoney(openValue)} />
        <Stat label="Pending Tasks" value={pendingTasks.length.toString()} />
        <Stat label="Total Deals" value={opportunities.length.toString()} />
        <Stat label="Last Activity" value={formatDate(lastActivityDate)} />
      </div>

      {/* Company Info & Open Opportunities */}
      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Company Information</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Info label="Company" value={customer.data.companyName} />
            <Info label="Industry" value={customer.data.industry ?? "Not set"} />
            <Info label="Website" value={customer.data.website ?? "Not set"} />
            <Info label="Email" value={customer.data.email ?? "Not set"} />
            <Info label="Phone" value={customer.data.phone ?? "Not set"} />
            <Info label="Address" value={customer.data.address ?? "Not set"} />
            <div>
              <div className="text-xs font-medium uppercase text-muted-foreground">Account Status</div>
              <div className="mt-1">
                <StatusBadge value={customer.data.status} />
              </div>
            </div>
            <div>
              <div className="text-xs font-medium uppercase text-muted-foreground flex items-center justify-between">
                <span>Assigned Representative</span>
                {updateCustomerMutation.isPending && (
                  <span className="text-[10px] text-primary animate-pulse">Saving...</span>
                )}
              </div>
              {isManagerOrAdmin ? (
                <div className="mt-1">
                  <select
                    aria-label="Assigned Representative"
                    value={customer.data.assignedUserId ?? ""}
                    disabled={updateCustomerMutation.isPending}
                    onChange={async (e) => {
                      const newUserId = e.target.value;
                      try {
                        await updateCustomerMutation.mutateAsync({
                          id: customer.data!.id,
                          input: {
                            companyName: customer.data!.companyName,
                            industry: customer.data!.industry,
                            email: customer.data!.email,
                            phone: customer.data!.phone,
                            website: customer.data!.website,
                            address: customer.data!.address,
                            status: customer.data!.status,
                            assignedUserId: newUserId || undefined,
                          },
                        });
                        showToast(
                          newUserId
                            ? "Assigned representative updated successfully."
                            : "Account moved to unassigned pool.",
                          "success"
                        );
                      } catch {
                        showToast("Failed to update assigned representative.", "error");
                      }
                    }}
                    className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                  >
                    <option value="">-- Unassigned (General Pool) --</option>
                    {usersQuery.data?.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.firstName} {u.lastName} ({u.role})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="mt-1 text-sm font-medium text-foreground">
                  {customer.data.assignedUser
                    ? `${customer.data.assignedUser.firstName} ${customer.data.assignedUser.lastName}`
                    : "Unassigned"}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle>Open Opportunities</CardTitle>
            <Link to={`/opportunities/new?customerId=${id}`}>
              <Button variant="ghost" className="h-8 gap-1 text-xs text-primary">
                <Plus className="h-3.5 w-3.5" /> New Deal
              </Button>
            </Link>

          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            {opportunities.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                No opportunities logged for this customer yet.
              </div>
            ) : (
              <Table>
                <thead>
                  <tr>
                    <Th>Opportunity</Th>
                    <Th>Stage</Th>
                    <Th>Value</Th>
                    <Th>Close</Th>
                  </tr>
                </thead>
                <tbody>
                  {opportunities.map((opp) => (
                    <tr key={opp.id}>
                      <Td>
                        <Link className="font-medium text-primary hover:underline" to={`/opportunities/${opp.id}`}>
                          {opp.name}
                        </Link>
                      </Td>
                      <Td>
                        <StatusBadge value={opp.stageName} />
                      </Td>
                      <Td>{formatMoney(opp.value)}</Td>
                      <Td>{formatDate(opp.expectedCloseDate)}</Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tasks & Action Items */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Tasks & Action Items</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Assigned follow-ups, supplement proposals, and customer meetings
            </p>
          </div>
          <Button onClick={() => setIsTaskModalOpen(true)} className="h-8 gap-1 text-xs">
            <Plus className="h-3.5 w-3.5" /> Add Task
          </Button>
        </CardHeader>
        <CardContent>
          {tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <CheckSquare className="h-9 w-9 text-muted-foreground/50 mb-2" />
              <p className="text-sm font-medium text-foreground">No tasks scheduled</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                Keep track of follow-ups, nutrition consultations, or contract renewals by adding a task.
              </p>
              <Button variant="secondary" onClick={() => setIsTaskModalOpen(true)} className="mt-3 h-8 gap-1 text-xs">
                <Plus className="h-3.5 w-3.5" /> Create First Task
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {tasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between py-3">
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => handleCompleteTask(task.id)}
                      disabled={task.status === "Completed"}
                      className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded-md border transition ${
                        task.status === "Completed"
                          ? "border-emerald-500 bg-emerald-500 text-white"
                          : "border-border hover:border-primary hover:bg-primary/10"
                      }`}
                      title={task.status === "Completed" ? "Completed" : "Click to complete"}
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
                      {task.description ? (
                        <p className="text-xs text-muted-foreground mt-0.5">{task.description}</p>
                      ) : null}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                        <span>Due: {formatDate(task.dueDate)}</span>
                        <span>•</span>
                        <span
                          className={`font-medium ${
                            task.priority === "Urgent"
                              ? "text-red-500"
                              : task.priority === "High"
                              ? "text-amber-500"
                              : "text-muted-foreground"
                          }`}
                        >
                          {task.priority} Priority
                        </span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <StatusBadge value={task.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Timeline Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Timeline & Activity History</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">Calls, meetings, emails, and notes logged with this account</p>
          </div>
          <Button variant="secondary" onClick={() => setIsActivityModalOpen(true)} className="h-8 gap-1 text-xs">
            <Plus className="h-3.5 w-3.5" /> Log Activity
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {timelineItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <Clock className="h-9 w-9 text-muted-foreground/50 mb-2" />
              <p className="text-sm font-medium text-foreground">No activities recorded</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                Log calls, meetings, or notes with this customer to build an audit trail of your client relationship.
              </p>
              <Button variant="secondary" onClick={() => setIsActivityModalOpen(true)} className="mt-3 h-8 gap-1 text-xs">
                <Plus className="h-3.5 w-3.5" /> Log First Activity
              </Button>
            </div>
          ) : (
            <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
              {timelineItems.map((item) => {
                const IconComponent = activityIcons[item.type] ?? NotebookPen;
                return (
                  <div key={item.id} className="relative group">
                    <div className="absolute -left-[27px] top-0 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card shadow-xs group-hover:border-primary">
                      <IconComponent className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div className="rounded-lg border border-border/60 bg-muted/20 p-3.5 transition hover:bg-muted/40">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                            {item.type}
                          </span>
                          <span className="text-sm font-semibold text-foreground">{item.subject}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{formatDate(item.activityDate)}</span>
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        Logged by {item.user.firstName} {item.user.lastName}
                      </div>
                      {item.description ? (
                        <p className="mt-2 text-sm text-foreground/90 whitespace-pre-wrap">{item.description}</p>
                      ) : null}
                    </div>
                  </div>
                );
              })}
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
                <h2 className="text-lg font-bold text-foreground">Log Activity</h2>
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
                      className={`flex flex-col items-center justify-center rounded-lg border p-2.5 text-xs font-medium transition ${
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
                  placeholder="e.g. Call regarding supplement wholesale agreement"
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
                  Details / Notes
                </label>
                <textarea
                  rows={3}
                  value={activityDescription}
                  onChange={(e) => setActivityDescription(e.target.value)}
                  placeholder="Summarize discussion points, agreements, or feedback..."
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
                <h2 className="text-lg font-bold text-foreground">Create Task for {customer.data.companyName}</h2>
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
                  placeholder="e.g. Send updated wholesale supplement catalog and discount tiers"
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
                  placeholder="Add specifics on products, pricing, or next steps..."
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent>
        <div className="text-sm text-muted-foreground">{label}</div>
        <div className="mt-2 text-xl font-semibold">{value}</div>
      </CardContent>
    </Card>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs font-medium uppercase text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm font-medium">{value}</div>
    </div>
  );
}

