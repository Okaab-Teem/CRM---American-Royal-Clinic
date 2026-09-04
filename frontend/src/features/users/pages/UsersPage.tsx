import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, Trash2, Edit2, Shield, Loader2 } from "lucide-react";
import { useUsers, useDeleteUser } from "@/features/users/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, Td, Th } from "@/components/ui/table";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTableShell } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Skeleton } from "@/components/shared/Skeleton";
import { ErrorState } from "@/components/shared/ErrorState";
import { EmptyState } from "@/components/shared/EmptyState";
import { useToast } from "@/components/shared/toast";
import type { UserRole } from "@/types/common";

function getRoleBadge(role: UserRole) {
  switch (role) {
    case "Admin":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-semibold text-purple-800 dark:bg-purple-950/60 dark:text-purple-300">
          <Shield className="h-3 w-3" /> Admin
        </span>
      );
    case "Manager":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
          Manager
        </span>
      );
    case "SalesRepresentative":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
          Sales Rep
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
          {role}
        </span>
      );
  }
}

export function UsersPage() {
  const { data: users, isLoading, isError, refetch } = useUsers();
  const deleteMutation = useDeleteUser();
  const { showToast } = useToast();
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredUsers = (users ?? []).filter((user) => {
    const query = search.toLowerCase();
    return (
      user.firstName.toLowerCase().includes(query) ||
      user.lastName.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      user.role.toLowerCase().includes(query)
    );
  });

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete user "${name}"? This action cannot be undone.`)) {
      return;
    }
    setDeletingId(id);
    try {
      await deleteMutation.mutateAsync(id);
      showToast(`${name} was deleted successfully.`, "success");
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to delete user.";
      showToast(errorMsg, "error");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="User Management"
        description="Manage system users, credentials, and access roles"
        actions={
          <Link to="/users/new">
            <Button>
              <Plus className="h-4 w-4" /> New User
            </Button>
          </Link>
        }
      />

      <div className="flex items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or role..."
            className="pl-9"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : isError ? (
        <ErrorState title="Could not load users list." onRetry={() => { void refetch(); }} />
      ) : filteredUsers.length === 0 ? (
        <EmptyState
          title="No users found"
          description={search ? `No user matches "${search}".` : "No users exist in the system yet."}
          action={
            <Link to="/users/new">
              <Button variant="secondary">
                <Plus className="h-4 w-4" /> Create User
              </Button>
            </Link>
          }
        />
      ) : (
        <DataTableShell>
          <Table>
            <thead>
              <tr>
                <Th>User</Th>
                <Th>Email</Th>
                <Th>Role</Th>
                <Th>Status</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-muted/40 transition">
                  <Td>
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary text-xs">
                        {user.firstName.charAt(0).toUpperCase()}
                        {user.lastName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-foreground">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-xs text-muted-foreground lg:hidden">{user.email}</div>
                      </div>
                    </div>
                  </Td>
                  <Td className="text-muted-foreground">{user.email}</Td>
                  <Td>{getRoleBadge(user.role)}</Td>
                  <Td>
                    <StatusBadge value={user.isActive ? "Active" : "Cancelled"} />
                  </Td>
                  <Td className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link to={`/users/${user.id}/edit`}>
                        <Button variant="secondary" className="h-8 px-2.5 text-xs">
                          <Edit2 className="h-3.5 w-3.5" /> Edit
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        onClick={() => handleDelete(user.id, `${user.firstName} ${user.lastName}`)}
                        disabled={deletingId === user.id}
                        className="h-8 px-2.5 text-xs text-danger hover:bg-danger/10 hover:text-danger"
                      >
                        {deletingId === user.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </DataTableShell>
      )}
    </div>
  );
}
