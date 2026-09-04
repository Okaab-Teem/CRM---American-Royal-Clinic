import { api, useMocks } from "@/lib/api-client";
import { tasks } from "@/features/mock/data";
import { filterAndPage } from "@/features/common/listing";
import type { Task, TaskPriority } from "@/types/api";
import type { PagedResult, QueryParams } from "@/types/common";

export interface CreateTaskInput {
  title: string;
  description?: string;
  dueDate: string;
  priority: TaskPriority;
  assignedUserId: string;
  customerId?: string;
  opportunityId?: string;
}

export async function getTasks(params: QueryParams = {}): Promise<PagedResult<Task>> {
  if (useMocks) {
    return filterAndPage(tasks, params, (task, search) =>
      `${task.title} ${task.customerName ?? ""} ${task.opportunityName ?? ""} ${task.status}`.toLowerCase().includes(search),
    );
  }
  const response = await api.get<PagedResult<Task>>("/tasks", { params });
  return response.data;
}

export async function completeTask(id: string): Promise<Task> {
  if (useMocks) {
    const task = tasks.find((item) => item.id === id);
    if (!task) throw new Error("Task not found.");
    return { ...task, status: "Completed", completedAt: new Date().toISOString() };
  }
  const response = await api.patch<Task>(`/tasks/${id}/status`, { status: "Completed" });
  return response.data;
}

export async function createTask(input: CreateTaskInput): Promise<Task> {
  if (useMocks) {
    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: input.title,
      description: input.description,
      dueDate: input.dueDate,
      priority: input.priority,
      status: "Pending",
      assignedUserId: input.assignedUserId,
      assignedUser: { id: input.assignedUserId, firstName: "Admin", lastName: "User", email: "admin@flowcrm.local", role: "Admin" },
      customerId: input.customerId,
      opportunityId: input.opportunityId,
      createdById: input.assignedUserId,
      completedAt: undefined,
    };
    tasks.unshift(newTask);
    return newTask;
  }
  const response = await api.post<Task>("/tasks", input);
  return response.data;
}
