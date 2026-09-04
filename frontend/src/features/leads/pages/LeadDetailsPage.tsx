import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/PageHeader";
import { Skeleton } from "@/components/shared/Skeleton";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useConvertLead, useLead } from "@/features/leads/hooks";
import { useToast } from "@/components/shared/toast";
import { formatDate, formatMoney } from "@/lib/formatters";

export function LeadDetailsPage() {
  const { id } = useParams();
  const lead = useLead(id);
  const convertLead = useConvertLead();
  const navigate = useNavigate();
  const { showToast } = useToast();

  if (lead.isLoading) return <Skeleton className="h-96" />;
  if (!lead.data) return <PageHeader title="Lead not found" />;

  async function handleConvert() {
    if (!lead.data) return;
    if (lead.data.status === "Converted") {
      showToast("This lead is already converted.", "error");
      return;
    }
    try {
      const result = await convertLead.mutateAsync({ id: lead.data.id });
      showToast("Lead converted to Customer and Opportunity successfully!", "success");
      if (result.customerId) {
        navigate(`/customers/${result.customerId}`);
      }
    } catch {
      showToast("Failed to convert lead.", "error");
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title={`${lead.data.firstName} ${lead.data.lastName}`}
        description={lead.data.companyName}
        actions={
          <>
            {lead.data.phone ? (
              <a
                href={`https://wa.me/${lead.data.phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                  `Hi ${lead.data.firstName}, this is regarding your sports nutrition and supplements inquiry for ${lead.data.companyName} with FlowCRM.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="secondary" className="border border-emerald-500/30 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700">
                  📱 WhatsApp
                </Button>
              </a>
            ) : null}
            <Link to={`/leads/${lead.data.id}/edit`}>
              <Button variant="secondary">Edit</Button>
            </Link>
            <Button
              disabled={lead.data.status === "Converted" || convertLead.isPending}
              onClick={handleConvert}
            >
              {convertLead.isPending ? "Converting..." : lead.data.status === "Converted" ? "Converted" : "Convert"}
            </Button>
          </>
        }
      />
      {lead.data.status === "Converted" && (
        <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100">
          <div className="flex items-center gap-2">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <span className="text-sm font-medium">
              This lead has been successfully converted into an active customer account and deal.
            </span>
          </div>
          <Link to="/customers">
            <Button variant="secondary">
              View Customers
            </Button>
          </Link>
        </div>
      )}
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <Card><CardHeader><CardTitle>Lead Information</CardTitle></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2">
            <Info label="Name" value={`${lead.data.firstName} ${lead.data.lastName}`} />
            <Info label="Company" value={lead.data.companyName} />
            <Info label="Email" value={lead.data.email ?? "Not set"} />
            <Info label="Phone" value={lead.data.phone ?? "Not set"} />
            <Info label="Notes" value={lead.data.notes ?? "No notes yet."} />
          </CardContent></Card>
          <Card><CardHeader><CardTitle>Activities</CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground">Record calls, meetings, notes, and follow-ups once the backend activity API is available.</CardContent></Card>
          <Card><CardHeader><CardTitle>Tasks</CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground">Create follow-up tasks for this lead from the task drawer in the next sprint.</CardContent></Card>
        </div>
        <Card><CardHeader><CardTitle>Summary</CardTitle></CardHeader><CardContent className="space-y-3 text-sm">
          <Info label="Status" value={<StatusBadge value={lead.data.status} />} />
          <Info label="Source" value={lead.data.sourceName ?? "Not set"} />
          <Info label="Owner" value={lead.data.assignedUser ? `${lead.data.assignedUser.firstName} ${lead.data.assignedUser.lastName}` : "Unassigned"} />
          <Info label="Estimated Value" value={formatMoney(lead.data.estimatedValue)} />
          <Info label="Created" value={formatDate(lead.data.createdAt)} />
        </CardContent></Card>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return <div><div className="text-xs font-medium uppercase text-muted-foreground">{label}</div><div className="mt-1 text-sm">{value}</div></div>;
}
