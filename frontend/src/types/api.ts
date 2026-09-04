import type { UserSummary } from "@/types/common";

export type LeadStatus = "New" | "Contacted" | "Qualified" | "Unqualified" | "Converted";
export type TaskPriority = "Low" | "Medium" | "High" | "Urgent";
export type TaskStatus = "Pending" | "InProgress" | "Completed" | "Cancelled";
export type ActivityType = "Call" | "Email" | "Meeting" | "Note" | "FollowUp" | "StageChange" | "TaskCompleted" | "LeadConverted";

export interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  companyName: string;
  email?: string;
  phone?: string;
  sourceId?: number;
  sourceName?: string;
  status: LeadStatus;
  assignedUserId?: string;
  assignedUser?: UserSummary;
  estimatedValue?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  companyName: string;
  industry?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  assignedUserId?: string;
  assignedUser?: UserSummary;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface Contact {
  id: string;
  customerId: string;
  firstName: string;
  lastName: string;
  jobTitle?: string;
  email?: string;
  phone?: string;
  isPrimary: boolean;
}

export interface Opportunity {
  id: string;
  name: string;
  customerId: string;
  customerName: string;
  leadId?: string;
  pipelineId: string;
  pipelineName: string;
  pipelineStageId: string;
  stageName: string;
  assignedUserId: string;
  assignedUser: UserSummary;
  value: number;
  expectedCloseDate?: string;
  probability: number;
  description?: string;
  contactName?: string;
  healthBadge?: {
    type: "hot" | "warning" | "velocity" | "track" | "danger";
    text: string;
  };
  nextActivity?: {
    text: string;
    type?: "call" | "email" | "meeting" | "task" | "review";
    isOverdue?: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export interface PipelineStage {
  id: string;
  name: string;
  order: number;
  probability: number;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate: string;
  priority: TaskPriority;
  status: TaskStatus;
  assignedUserId: string;
  assignedUser: UserSummary;
  customerId?: string;
  customerName?: string;
  opportunityId?: string;
  opportunityName?: string;
  createdById: string;
  completedAt?: string;
}

export interface Activity {
  id: string;
  type: ActivityType;
  subject: string;
  description?: string;
  activityDate: string;
  user: UserSummary;
  customerId?: string;
  customerName?: string;
  opportunityId?: string;
  opportunityName?: string;
}

export interface Notification {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  isRead: boolean;
}

export interface Dashboard {
  totalLeads: number;
  activeOpportunities: number;
  pipelineValue: number;
  wonRevenue: number;
  tasksDueToday: number;
  pipelineStages: Array<{ name: string; count: number; value: number }>;
  leadsBySource: Array<{ source: string; count: number }>;
  revenueByMonth: Array<{ month: string; revenue: number }>;
  recentActivities: Activity[];
}

export interface Product {
  id: string;
  name: string;
  category: string;
  sku: string;
  flavorOrSize?: string;
  unitPrice: number;
  costPrice: number;
  stockQuantity: number;
  lowStockThreshold: number;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
