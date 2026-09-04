import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, Td, Th } from "@/components/ui/table";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTableShell } from "@/components/shared/DataTable";
import { ListToolbar } from "@/components/shared/ListToolbar";
import { PaginationSummary } from "@/components/shared/PaginationSummary";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useOpportunities } from "@/features/opportunities/hooks";
import { formatDate, formatMoney } from "@/lib/formatters";

export function OpportunitiesPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const opportunities = useOpportunities({ search, page, pageSize });

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1);
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Opportunities" actions={<Link to="/opportunities/new"><Button><Plus className="h-4 w-4" /> New Opportunity</Button></Link>} />
      <ListToolbar value={search} onChange={handleSearchChange} />
      <DataTableShell>
        <Table>
          <thead><tr><Th>Opportunity</Th><Th>Customer</Th><Th>Stage</Th><Th>Value</Th><Th>Probability</Th><Th>Expected Close</Th><Th>Owner</Th><Th>Actions</Th></tr></thead>
          <tbody>{opportunities.data?.items.map((opp) => <tr key={opp.id}><Td className="font-medium">{opp.name}</Td><Td>{opp.customerName}</Td><Td><StatusBadge value={opp.stageName} /></Td><Td>{formatMoney(opp.value)}</Td><Td>{opp.probability}%</Td><Td>{formatDate(opp.expectedCloseDate)}</Td><Td>{opp.assignedUser.firstName} {opp.assignedUser.lastName}</Td><Td><Link className="text-primary hover:underline" to={`/opportunities/${opp.id}`}>View</Link></Td></tr>)}</tbody>
        </Table>
        {opportunities.data ? (
          <PaginationSummary
            result={opportunities.data}
            onPageChange={setPage}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setPage(1);
            }}
            pageSizeOptions={[5, 10, 20, 50]}
          />
        ) : null}
      </DataTableShell>
    </div>
  );
}
