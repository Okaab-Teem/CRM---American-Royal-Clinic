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
import { useCustomers } from "@/features/customers/hooks";
import { formatDate, formatMoney } from "@/lib/formatters";
import { opportunities } from "@/features/mock/data";

export function CustomersPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const customers = useCustomers({ search, page, pageSize });

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1);
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Customers" actions={<Link to="/customers/new"><Button><Plus className="h-4 w-4" /> New Customer</Button></Link>} />
      <ListToolbar value={search} onChange={handleSearchChange} />
      <DataTableShell>
        <Table>
          <thead><tr><Th>Company</Th><Th>Industry</Th><Th>Email</Th><Th>Phone</Th><Th>Owner</Th><Th>Open Opportunities</Th><Th>Opportunity Value</Th><Th>Status</Th><Th>Actions</Th></tr></thead>
          <tbody>
            {customers.data?.items.map((customer) => {
              const customerOpps = opportunities.filter((item) => item.customerId === customer.id && !["Won", "Lost"].includes(item.stageName));
              return (
                <tr key={customer.id}>
                  <Td className="font-medium">{customer.companyName}</Td>
                  <Td>{customer.industry ?? "Not set"}</Td>
                  <Td>{customer.email ?? "Not set"}</Td>
                  <Td>{customer.phone ?? "Not set"}</Td>
                  <Td>{customer.assignedUser ? `${customer.assignedUser.firstName} ${customer.assignedUser.lastName}` : "Unassigned"}</Td>
                  <Td>{customerOpps.length}</Td>
                  <Td>{formatMoney(customerOpps.reduce((sum, item) => sum + item.value, 0))}</Td>
                  <Td><StatusBadge value={customer.status} /></Td>
                  <Td><Link className="text-primary hover:underline" to={`/customers/${customer.id}`}>Open</Link></Td>
                </tr>
              );
            })}
          </tbody>
        </Table>
        {customers.data ? (
          <PaginationSummary
            result={customers.data}
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
