import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { User, Lock, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/shared/PageHeader";
import { useToast } from "@/components/shared/toast";
import { getApiErrorMessage } from "@/lib/api-client";
import { useAuth } from "@/features/auth/auth-context";
import { useUsers } from "@/features/users/hooks";
import { useCustomer, useCreateCustomer, useUpdateCustomer } from "@/features/customers/hooks";

export function CustomerFormPage({ mode }: { mode: "create" | "edit" }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user: currentUser } = useAuth();
  const isSalesRep = currentUser?.role === "SalesRepresentative";

  const customerQuery = useCustomer(mode === "edit" ? id : undefined);
  const usersQuery = useUsers({ enabled: !isSalesRep });
  const createCustomerMutation = useCreateCustomer();
  const updateCustomerMutation = useUpdateCustomer();

  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("Gym & Fitness Center");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [address, setAddress] = useState("");
  const [assignedUserId, setAssignedUserId] = useState(currentUser?.id ?? "");
  const [status, setStatus] = useState("Active");

  useEffect(() => {
    if (mode === "edit" && customerQuery.data) {
      const c = customerQuery.data;
      setCompanyName(c.companyName || "");
      setIndustry(c.industry || "Gym & Fitness Center");
      setEmail(c.email || "");
      setPhone(c.phone || "");
      setWebsite(c.website || "");
      setAddress(c.address || "");
      setAssignedUserId(c.assignedUserId || "");
      setStatus(c.status || "Active");
    } else if (mode === "create" && isSalesRep && currentUser?.id) {
      setAssignedUserId(currentUser.id);
    }
  }, [mode, customerQuery.data, isSalesRep, currentUser]);

  const isSubmitting = createCustomerMutation.isPending || updateCustomerMutation.isPending;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!companyName.trim()) {
      showToast("Company Name is required.", "error");
      return;
    }

    if (phone.trim()) {
      const phoneDigits = phone.replace(/\D/g, "");
      if (phoneDigits.length > 11) {
        showToast("Client phone number cannot exceed 11 digits (e.g. 01012345678).", "error");
        return;
      }
    }

    const payload = {
      companyName: companyName.trim(),
      industry: industry.trim() || undefined,
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      website: website.trim() || undefined,
      address: address.trim() || undefined,
      assignedUserId: isSalesRep ? currentUser?.id ?? assignedUserId : (assignedUserId || undefined),
      status,
    };

    try {
      if (mode === "edit" && id) {
        await updateCustomerMutation.mutateAsync({ id, input: payload });
        showToast("Customer account updated successfully.", "success");
        navigate(`/customers/${id}`);
      } else {
        const created = await createCustomerMutation.mutateAsync(payload);
        showToast("Customer account created successfully.", "success");
        navigate(`/customers/${created.id}`);
      }
    } catch (err: unknown) {
      showToast(getApiErrorMessage(err), "error");
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title={mode === "create" ? "New Customer Account" : `Edit ${customerQuery.data?.companyName ?? "Customer"}`}
        description={
          mode === "create"
            ? "Create a new commercial gym, supplement retailer, or fitness club account."
            : "Update account details, contact information, operating status, and assigned sales representative."
        }
      />

      <form onSubmit={handleSubmit} className="max-w-3xl space-y-5 rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-primary" /> Company / Gym Name *
            </label>
            <Input
              required
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g. FitZone Platinum Gym & Health Club"
              className="text-base"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              Industry / Sector
            </label>
            <select
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="Gym & Fitness Center">Gym & Fitness Center</option>
              <option value="Sports Nutrition Retailer">Sports Nutrition Retailer</option>
              <option value="CrossFit Box">CrossFit Box</option>
              <option value="Personal Training Studio">Personal Training Studio</option>
              <option value="Health Club & Spa">Health Club & Spa</option>
              <option value="Wholesale Distributor">Wholesale Distributor</option>
              <option value="General Commercial">General Commercial</option>
            </select>
          </div>

          {/* Assigned Sales Representative / Account Owner */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-primary" /> Assigned Sales Representative
            </label>
            {isSalesRep ? (
              <div className="flex items-center justify-between rounded-md border border-border bg-muted/50 px-3 py-2 text-sm text-foreground">
                <span className="font-medium flex items-center gap-2">
                  <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                  {currentUser?.firstName} {currentUser?.lastName}
                </span>
                <span className="text-xs text-primary font-medium bg-primary/10 px-2 py-0.5 rounded">
                  You (Representative)
                </span>
              </div>
            ) : (
              <select
                value={assignedUserId}
                onChange={(e) => setAssignedUserId(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">-- Unassigned (General Pool) --</option>
                {usersQuery.data?.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.firstName} {u.lastName} ({u.role})
                  </option>
                ))}
              </select>
            )}
            <p className="mt-1 text-[11px] text-muted-foreground">
              {isSalesRep
                ? "Customer accounts created by sales representatives are assigned to your portfolio."
                : "Managers & Administrators can assign any sales team member to manage this gym/customer account."}
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              Account Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="Active">Active</option>
              <option value="Prospect">Prospect</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Contact Phone (WhatsApp)
              </label>
              <span className={`text-[11px] font-mono ${phone.replace(/\D/g, "").length > 11 ? "text-red-500 font-bold" : "text-muted-foreground"}`}>
                {phone.replace(/\D/g, "").length}/11 digits
              </span>
            </div>
            <Input
              type="tel"
              maxLength={11}
              value={phone}
              onChange={(e) => {
                const val = e.target.value;
                const digits = val.replace(/\D/g, "");
                if (digits.length <= 11) {
                  setPhone(val);
                }
              }}
              placeholder="e.g. 01012345678 (max 11 digits)"
            />
            {phone.replace(/\D/g, "").length > 11 && (
              <p className="mt-1 text-xs text-red-500 font-medium">
                Phone number cannot exceed 11 digits.
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              Direct Email
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="purchasing@fitzonegym.com"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              Website
            </label>
            <Input
              type="text"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://fitzonegym.com"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              Address / City
            </label>
            <Input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="New Cairo, District 5, Cairo, Egypt"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
          <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : mode === "create" ? "Create Account" : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}
