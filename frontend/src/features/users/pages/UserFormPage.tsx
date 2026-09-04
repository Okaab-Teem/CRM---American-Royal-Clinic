import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft, Check, Shield, User, Key, Mail, Info, Loader2 } from "lucide-react";
import { useCreateUser, useUpdateUser, useUser } from "@/features/users/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/PageHeader";
import { Skeleton } from "@/components/shared/Skeleton";
import { useToast } from "@/components/shared/toast";
import type { UserRole } from "@/types/common";

const ROLE_DETAILS: Record<UserRole, { title: string; desc: string; badgeColor: string }> = {
  Admin: {
    title: "Administrator",
    desc: "Full unrestricted access: Manage users, system settings, financial reports, supplements catalog, deals, and customers.",
    badgeColor: "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300",
  },
  Manager: {
    title: "Manager",
    desc: "Team leadership: Pipeline oversight, deal management, task assignment, revenue reports, and customer supervision.",
    badgeColor: "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300",
  },
  SalesRepresentative: {
    title: "Sales Representative",
    desc: "Direct sales: Lead capture, deal progression, customer logging, supplements ordering, activities, and daily tasks.",
    badgeColor: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300",
  },
  Viewer: {
    title: "Viewer",
    desc: "Read-only access to customer records and public pipeline data.",
    badgeColor: "bg-muted text-muted-foreground",
  },
};

export function UserFormPage({ mode }: { mode: "create" | "edit" }) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { showToast } = useToast();

  const { data: existingUser, isLoading: isLoadingUser } = useUser(mode === "edit" ? id : undefined);
  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("SalesRepresentative");
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (existingUser && mode === "edit") {
      setFirstName(existingUser.firstName || "");
      setLastName(existingUser.lastName || "");
      setEmail(existingUser.email || "");
      setRole(existingUser.role || "SalesRepresentative");
      setIsActive(existingUser.isActive ?? true);
    }
  }, [existingUser, mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      setErrorMessage("First name, last name, and email are required.");
      return;
    }

    if (mode === "create" && !password.trim()) {
      setErrorMessage("Password is required for new users.");
      return;
    }

    if (password && password.length < 6) {
      setErrorMessage("Password must be at least 6 characters long.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === "create") {
        await createMutation.mutateAsync({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          password: password.trim(),
          role,
        });
        showToast(`${firstName} ${lastName} has been created.`, "success");
      } else if (id) {
        await updateMutation.mutateAsync({
          id,
          input: {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email.trim(),
            role,
            isActive,
            ...(password.trim() ? { password: password.trim() } : {}),
          },
        });
        showToast(`Account changes for ${firstName} saved.`, "success");
      }
      navigate("/users");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save user account.";
      setErrorMessage(msg);
      showToast(msg, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (mode === "edit" && isLoadingUser) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/users">
          <Button variant="ghost" className="h-9 w-9 p-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <PageHeader
          title={mode === "create" ? "Create New User" : `Edit User: ${existingUser?.firstName ?? ""} ${existingUser?.lastName ?? ""}`}
          description="Configure staff account credentials, system role, and access boundaries"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left 2 Cols: Form */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4 text-primary" /> Account Details
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Enter personal information and credentials</p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {errorMessage ? (
                  <div className="rounded-md border border-danger/20 bg-danger/10 p-3 text-sm text-danger">
                    {errorMessage}
                  </div>
                ) : null}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase text-muted-foreground">First Name *</label>
                    <Input
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="e.g. Maya"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase text-muted-foreground">Last Name *</label>
                    <Input
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="e.g. Hassan"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" /> Email Address *
                  </label>
                  <Input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@flowcrm.local"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1.5">
                    <Key className="h-3.5 w-3.5 text-muted-foreground" />
                    {mode === "create" ? "Password *" : "New Password (Optional)"}
                  </label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={mode === "create" ? "Enter a secure password..." : "Leave blank to keep existing..."}
                    required={mode === "create"}
                  />
                  <p className="text-xs text-muted-foreground">
                    {mode === "create"
                      ? "Must be at least 6 characters."
                      : "Only fill this if you want to reset the user's password."}
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1.5">
                    <Shield className="h-3.5 w-3.5 text-muted-foreground" /> System Role *
                  </label>
                  <Select value={role} onChange={(e) => setRole(e.target.value as UserRole)}>
                    <option value="SalesRepresentative">Sales Representative</option>
                    <option value="Manager">Manager</option>
                    <option value="Admin">Administrator</option>
                  </Select>
                </div>

                {mode === "edit" ? (
                  <div className="pt-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-foreground cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isActive}
                        onChange={(e) => setIsActive(e.target.checked)}
                        className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                      />
                      Active Account (uncheck to suspend user login)
                    </label>
                  </div>
                ) : null}

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                  <Link to="/users">
                    <Button type="button" variant="secondary">
                      Cancel
                    </Button>
                  </Link>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4" />
                        {mode === "create" ? "Create User" : "Save Changes"}
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right 1 Col: Role Info Card */}
        <div className="space-y-4">
          <Card className="border-primary/20 bg-primary/[0.02]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-primary">
                <Info className="h-4 w-4" /> Role Permissions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="rounded-lg border border-border/60 bg-card p-3 shadow-xs">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`inline-block px-2 py-0.5 rounded font-semibold text-[10px] ${ROLE_DETAILS[role].badgeColor}`}>
                    {ROLE_DETAILS[role].title}
                  </span>
                </div>
                <p className="text-muted-foreground leading-relaxed mt-1.5">
                  {ROLE_DETAILS[role].desc}
                </p>
              </div>

              <div className="pt-2 text-[11px] text-muted-foreground space-y-1.5">
                <div className="font-semibold text-foreground">Permission Summary:</div>
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  <span><strong>Admin:</strong> Users, Settings, Finance, Catalog</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                  <span><strong>Manager:</strong> Reports, Pipelines, Tasks</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span><strong>Sales Rep:</strong> Deals, Contacts, Supplements</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
