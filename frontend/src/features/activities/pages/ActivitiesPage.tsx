import { useState } from "react";
import { Calendar, Mail, NotebookPen, Phone, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, Td, Th } from "@/components/ui/table";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTableShell } from "@/components/shared/DataTable";
import { ListToolbar } from "@/components/shared/ListToolbar";
import { useActivities, useCreateActivity } from "@/features/activities/hooks";
import { useCustomers } from "@/features/customers/hooks";
import { useToast } from "@/components/shared/toast";
import { formatDate } from "@/lib/formatters";
import type { ActivityType } from "@/types/api";

const icons = {
  Call: Phone,
  Email: Mail,
  Meeting: Calendar,
  Note: NotebookPen,
  FollowUp: Calendar,
  StageChange: Calendar,
  TaskCompleted: Calendar,
  LeadConverted: Calendar,
};

export function ActivitiesPage() {
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activityType, setActivityType] = useState<ActivityType>("Call");
  const [subject, setSubject] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [activityDate, setActivityDate] = useState(() => new Date().toISOString().slice(0, 16));
  const [description, setDescription] = useState("");

  const activities = useActivities({ search, pageSize: 50 });
  const customers = useCustomers({ pageSize: 100 });
  const createActivityMutation = useCreateActivity();
  const { showToast } = useToast();

  async function handleCreateActivity(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim()) {
      showToast("Subject is required.", "error");
      return;
    }

    try {
      await createActivityMutation.mutateAsync({
        type: activityType,
        subject: subject.trim(),
        description: description.trim() || undefined,
        activityDate: new Date(activityDate).toISOString(),
        customerId: customerId || undefined,
      });
      showToast("Activity logged successfully.", "success");
      setIsModalOpen(false);
      setSubject("");
      setDescription("");
      setCustomerId("");
    } catch {
      showToast("Failed to log activity.", "error");
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Activities"
        description="Audit log of client phone calls, meetings, supplement consultations, and internal notes."
        actions={
          <Button onClick={() => setIsModalOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Add Activity
          </Button>
        }
      />
      <ListToolbar value={search} onChange={setSearch} />
      <DataTableShell>
        <Table>
          <thead>
            <tr>
              <Th>Type</Th>
              <Th>Subject</Th>
              <Th>Customer</Th>
              <Th>Opportunity</Th>
              <Th>User</Th>
              <Th>Date</Th>
            </tr>
          </thead>
          <tbody>
            {(activities.data?.items ?? []).map((activity) => {
              const Icon = icons[activity.type] ?? NotebookPen;
              return (
                <tr key={activity.id}>
                  <Td>
                    <span className="inline-flex items-center gap-2">
                      <Icon className="h-4 w-4 text-primary" />
                      {activity.type}
                    </span>
                  </Td>
                  <Td className="font-medium">{activity.subject}</Td>
                  <Td>{activity.customerName ?? "Not set"}</Td>
                  <Td>{activity.opportunityName ?? "Not set"}</Td>
                  <Td>
                    {activity.user.firstName} {activity.user.lastName}
                  </Td>
                  <Td>{formatDate(activity.activityDate)}</Td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </DataTableShell>

      {/* Log Activity Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <NotebookPen className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-bold text-foreground">Log New Activity</h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateActivity} className="space-y-4">
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
                  Customer Account (Optional)
                </label>
                <select
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">-- Unassigned / General --</option>
                  {(customers.data?.items ?? []).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.companyName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Subject *
                </label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Discuss whey protein bulk order & payment terms"
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
                  Notes / Details
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Summarize key takeaways, commitments, or next steps..."
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-border pt-4">
                <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
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
    </div>
  );
}
