import { useState, useMemo } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, Td, Th } from "@/components/ui/table";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTableShell } from "@/components/shared/DataTable";
import { ListToolbar } from "@/components/shared/ListToolbar";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useCompleteTask, useCreateTask, useTasks } from "@/features/tasks/hooks";
import { formatDate } from "@/lib/formatters";
import { useToast } from "@/components/shared/toast";
import { useAuth } from "@/features/auth/auth-context";
import type { TaskPriority } from "@/types/api";

export function TasksPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Pending" | "Completed">("All");
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);

  // Form states
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("High");
  const [dueDate, setDueDate] = useState(() => new Date(Date.now() + 86400000 * 3).toISOString().split("T")[0]);
  const [description, setDescription] = useState("");

  const tasks = useTasks({ search, pageSize: 50 });
  const completeTask = useCompleteTask();
  const createTaskMutation = useCreateTask();
  const { showToast } = useToast();

  async function complete(id: string) {
    await completeTask.mutateAsync(id);
    showToast("Task completed successfully.", "success");
  }

  async function handleCreateTask(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      await createTaskMutation.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
        dueDate: new Date(dueDate).toISOString(),
        priority,
        assignedUserId: user?.id ?? "usr-admin",
      });
      showToast("Task created successfully.", "success");
      setIsNewTaskOpen(false);
      setTitle("");
      setDescription("");
    } catch {
      showToast("Failed to create task.", "error");
    }
  }

  const filteredTasks = useMemo(() => {
    const items = tasks.data?.items ?? [];
    if (statusFilter === "All") return items;
    return items.filter((t) => t.status === statusFilter);
  }, [tasks.data?.items, statusFilter]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Tasks"
        description="Track follow-ups, supplement replenishment calls, and team to-dos."
        actions={
          <Button onClick={() => setIsNewTaskOpen(true)}>
            <Plus className="h-4 w-4" /> New Task
          </Button>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex-1 min-w-[240px]">
          <ListToolbar value={search} onChange={setSearch} />
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1">
          {(["All", "Pending", "Completed"] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                statusFilter === filter
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      <DataTableShell>
        <Table>
          <thead>
            <tr>
              <Th>Task</Th>
              <Th>Customer</Th>
              <Th>Opportunity</Th>
              <Th>Due Date</Th>
              <Th>Priority</Th>
              <Th>Assignee</Th>
              <Th>Status</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {filteredTasks.length === 0 ? (
              <tr>
                <Td colSpan={8} className="text-center py-8 text-muted-foreground">
                  No tasks match your current filter.
                </Td>
              </tr>
            ) : (
              filteredTasks.map((task) => (
                <tr key={task.id}>
                  <Td className="font-medium">{task.title}</Td>
                  <Td>{task.customerName ?? "Not set"}</Td>
                  <Td>{task.opportunityName ?? "Not set"}</Td>
                  <Td>{formatDate(task.dueDate)}</Td>
                  <Td>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                        task.priority === "Urgent"
                          ? "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
                          : task.priority === "High"
                          ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                          : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300"
                      }`}
                    >
                      {task.priority}
                    </span>
                  </Td>
                  <Td>
                    {task.assignedUser ? `${task.assignedUser.firstName} ${task.assignedUser.lastName}` : "Unassigned"}
                  </Td>
                  <Td>
                    <StatusBadge value={task.status} />
                  </Td>
                  <Td>
                    {task.status !== "Completed" ? (
                      <button
                        className="text-primary hover:underline font-medium text-xs"
                        onClick={() => complete(task.id)}
                        disabled={completeTask.isPending}
                      >
                        Complete
                      </button>
                    ) : (
                      <span className="text-muted-foreground text-xs">Done</span>
                    )}
                  </Td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </DataTableShell>

      {/* New Task Modal */}
      {isNewTaskOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <h2 className="text-lg font-semibold">Create New Task</h2>
              <button
                onClick={() => setIsNewTaskOpen(false)}
                className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Follow-up: 30-Day Creatine Replenishment"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as TaskPriority)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                  </input>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Description / Notes
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Additional context or customer requirements..."
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="secondary" onClick={() => setIsNewTaskOpen(false)}>
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
