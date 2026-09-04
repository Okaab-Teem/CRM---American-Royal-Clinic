import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, Td, Th } from "@/components/ui/table";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTableShell } from "@/components/shared/DataTable";
import { EmptyState } from "@/components/shared/EmptyState";
import { ListToolbar } from "@/components/shared/ListToolbar";
import { PaginationSummary } from "@/components/shared/PaginationSummary";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useLeads } from "@/features/leads/hooks";
import { formatDate, formatMoney } from "@/lib/formatters";
import { usePermissions } from "@/hooks/use-permissions";

export function LeadsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const { can } = usePermissions();
  const leads = useLeads({ search, page, pageSize });

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1);
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Leads"
        description="Manage and track potential customers."
        actions={can("lead.create") ? <Link to="/leads/new"><Button><Plus className="h-4 w-4" /> New Lead</Button></Link> : null}
      />
      <ListToolbar value={search} onChange={handleSearchChange} />
      {leads.data?.items.length === 0 ? (
        <EmptyState title="No leads match your filters." description="Try changing your search or filters." />
      ) : (
        <DataTableShell>
          <Table>
            <thead><tr><Th>Name</Th><Th>Company</Th><Th>Email</Th><Th>Source</Th><Th>Status</Th><Th>Assigned To</Th><Th>Estimated Value</Th><Th>Created</Th><Th>Actions</Th></tr></thead>
            <tbody>
              {leads.data?.items.map((lead) => (
                <tr key={lead.id}>
                  <Td>{lead.firstName} {lead.lastName}</Td>
                  <Td className="font-medium">{lead.companyName}</Td>
                  <Td>{lead.email ?? "Not set"}</Td>
                  <Td>{lead.sourceName ?? "Not set"}</Td>
                  <Td><StatusBadge value={lead.status} /></Td>
                  <Td>{lead.assignedUser ? `${lead.assignedUser.firstName} ${lead.assignedUser.lastName}` : "Unassigned"}</Td>
                  <Td>{formatMoney(lead.estimatedValue)}</Td>
                  <Td>{formatDate(lead.createdAt)}</Td>
                  <Td><Link className="text-primary hover:underline" to={`/leads/${lead.id}`}>View</Link></Td>
                </tr>
              ))}
            </tbody>
          </Table>
          {leads.data ? (
            <PaginationSummary
              result={leads.data}
              onPageChange={setPage}
              onPageSizeChange={(newSize) => {
                setPageSize(newSize);
                setPage(1);
              }}
              pageSizeOptions={[5, 10, 20, 50]}
            />
          ) : null}
        </DataTableShell>
      )}
    </div>
  );
}
