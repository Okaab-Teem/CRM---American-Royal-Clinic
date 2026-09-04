import { Badge } from "@/components/ui/badge";
import type { BadgeProps } from "@/components/ui/badge";

const toneMap: Record<string, BadgeProps["tone"]> = {
  New: "info",
  Contacted: "warning",
  Qualified: "success",
  Unqualified: "danger",
  Converted: "success",
  Active: "success",
  Prospect: "info",
  Pending: "warning",
  InProgress: "info",
  Completed: "success",
  Cancelled: "danger",
  Won: "success",
  Lost: "danger",
};

export function StatusBadge({ value }: { value: string }) {
  return <Badge tone={toneMap[value] ?? "neutral"}>{value}</Badge>;
}
