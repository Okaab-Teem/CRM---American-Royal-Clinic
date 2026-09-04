import { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams, Link } from "react-router-dom";
import {
  Sparkles,
  Building2,
  DollarSign,
  Percent,
  Calendar,
  User,
  Layers,
  FileText,
  ArrowLeft,
  CheckCircle2,
  Lock,
  PlusCircle,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/shared/Skeleton";
import { useToast } from "@/components/shared/toast";
import { useAuth } from "@/features/auth/auth-context";
import { useOpportunity, useCreateOpportunity, useUpdateOpportunity } from "@/features/opportunities/hooks";
import { useCustomers } from "@/features/customers/hooks";
import { usePipelineStages } from "@/features/pipeline/hooks";
import { useUsers } from "@/features/users/hooks";

export function OpportunityFormPage({ mode }: { mode: "create" | "edit" }) {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const preselectedCustomerId = searchParams.get("customerId") ?? "";

  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user: currentUser } = useAuth();
  const isSalesRep = currentUser?.role === "SalesRepresentative";

  // Data Queries
  const existingQuery = useOpportunity(mode === "edit" ? id : undefined);
  const customersQuery = useCustomers({ pageSize: 100 });
  const stagesQuery = usePipelineStages();
  // Sales Rep cannot list all users (API restricted to Manager/Admin)
  const usersQuery = useUsers({ enabled: !isSalesRep });


  const createMutation = useCreateOpportunity();
  const updateMutation = useUpdateOpportunity();

  // Form State
  const [name, setName] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [pipelineStageId, setPipelineStageId] = useState("");
  const [value, setValue] = useState("25000");
  const [probability, setProbability] = useState("20");
  const [expectedCloseDate, setExpectedCloseDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split("T")[0];
  });
  const [assignedUserId, setAssignedUserId] = useState(currentUser?.id ?? "");
  const [description, setDescription] = useState("");
  // Set customerId when preselected or when customers load in create mode
  useEffect(() => {
    if (mode === "create") {
      if (preselectedCustomerId) {
        setCustomerId(preselectedCustomerId);
      } else if (!customerId && customersQuery.data?.items?.length) {
        setCustomerId(customersQuery.data.items[0].id);
      }
    }
  }, [mode, preselectedCustomerId, customersQuery.data, customerId]);

  // Set pipelineStageId when stages load in create mode
  useEffect(() => {
    if (mode === "create" && !pipelineStageId && stagesQuery.data?.length) {
      const firstStage = stagesQuery.data[0];
      setPipelineStageId(firstStage.id);
      setProbability(firstStage.probability.toString());
    }
  }, [mode, stagesQuery.data, pipelineStageId]);

  // Edit mode initialization
  useEffect(() => {
    if (mode === "edit" && existingQuery.data) {
      const opp = existingQuery.data;
      setName(opp.name || "");
      setCustomerId(opp.customerId || "");
      setPipelineStageId(opp.pipelineStageId || "");
      setValue(opp.value?.toString() || "0");
      setProbability(opp.probability?.toString() || "0");
      if (opp.expectedCloseDate) {
        setExpectedCloseDate(opp.expectedCloseDate.split("T")[0]);
      }
      setAssignedUserId(opp.assignedUserId || currentUser?.id || "");
      setDescription(opp.description || "");
    }
  }, [mode, existingQuery.data, currentUser]);

  // Update assignedUserId if currentUser becomes available in create mode
  useEffect(() => {
    if (mode === "create" && currentUser?.id && !assignedUserId) {
      setAssignedUserId(currentUser.id);
    }
  }, [mode, currentUser, assignedUserId]);


  // Handle stage change: auto-sync probability
  const handleStageChange = (newStageId: string) => {
    setPipelineStageId(newStageId);
    const matched = stagesQuery.data?.find((s) => s.id === newStageId);
    if (matched) {
      setProbability(matched.probability.toString());
    }
  };

  // Auto-fill deal name recommendation if empty and customer is selected
  const handleCustomerChange = (newCustomerId: string) => {
    setCustomerId(newCustomerId);
    if (!name.trim() || name.includes("Supplements Order")) {
      const cust = customersQuery.data?.items?.find((c) => c.id === newCustomerId);
      if (cust) {
        setName(`${cust.companyName} - Supplements Order`);
      }
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim()) {
      showToast("Deal Name is required.", "error");
      return;
    }
    if (!customerId) {
      showToast("Please select a Customer for this deal.", "error");
      return;
    }
    if (!pipelineStageId) {
      showToast("Please select a Pipeline Stage.", "error");
      return;
    }

    const numericValue = parseFloat(value);
    if (isNaN(numericValue) || numericValue < 0) {
      showToast("Deal Value must be a valid non-negative number.", "error");
      return;
    }

    const numericProb = parseInt(probability, 10);
    if (isNaN(numericProb) || numericProb < 0 || numericProb > 100) {
      showToast("Win Probability must be between 0% and 100%.", "error");
      return;
    }

    // Determine target owner: Sales reps can only assign to themselves
    const effectiveOwnerId = isSalesRep ? currentUser?.id ?? assignedUserId : assignedUserId;

    // Find selected customer & stage for client state
    const selectedCustomer = customersQuery.data?.items?.find((c) => c.id === customerId);
    const selectedStage = stagesQuery.data?.find((s) => s.id === pipelineStageId);

    const payload = {
      name: name.trim(),
      customerId,
      customerName: selectedCustomer?.companyName,
      pipelineId: existingQuery.data?.pipelineId ?? "pipe-default",
      pipelineStageId,
      stageName: selectedStage?.name,
      assignedUserId: effectiveOwnerId,
      value: numericValue,
      probability: numericProb,
      expectedCloseDate: expectedCloseDate ? new Date(expectedCloseDate).toISOString() : undefined,
      description: description.trim() || undefined,
    };

    try {
      if (mode === "edit" && id) {
        await updateMutation.mutateAsync({ id, input: payload });
        showToast("Opportunity updated successfully.", "success");
        navigate(`/opportunities/${id}`);
      } else {
        const created = await createMutation.mutateAsync(payload);
        showToast("Opportunity created successfully.", "success");
        navigate(created.id ? `/opportunities/${created.id}` : "/opportunities");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An error occurred while saving.";
      showToast(msg, "error");
    }
  }

  if (mode === "edit" && existingQuery.isLoading) {
    return (
      <div className="space-y-5">
        <PageHeader title="Loading Opportunity..." />
        <Skeleton className="h-96" />
      </div>
    );
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title={mode === "create" ? "Create New Opportunity" : `Edit Opportunity: ${name || existingQuery.data?.name}`}
          description="Log and manage supplement wholesale deals, contract terms, and expected revenue."
        />
        <Button variant="secondary" onClick={() => navigate(-1)} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-primary/10 p-2 text-primary">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>{mode === "create" ? "Deal Specifications" : "Update Deal Details"}</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Enter client account, supplement products order scope, stage progression, and expected close date.
                </p>

              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Deal Title */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                Deal / Opportunity Name <span className="text-danger">*</span>
              </label>
              <Input
                placeholder="e.g. FitZone Platinum Gym - 100x Whey Protein + Creatine Wholesale"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                A descriptive title identifying the client and the wholesale supplement package.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Customer Selection */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Building2 className="h-4 w-4 text-primary" /> Customer Account <span className="text-danger">*</span>
                  </span>
                  <Link to="/customers/new" className="text-xs text-primary hover:underline flex items-center gap-1">
                    <PlusCircle className="h-3 w-3" /> New Customer
                  </Link>
                </label>
                {customersQuery.isLoading ? (
                  <Skeleton className="h-9 w-full" />
                ) : (
                  <Select
                    value={customerId}
                    onChange={(e) => handleCustomerChange(e.target.value)}
                    required
                  >
                    <option value="" disabled>
                      Select a gym, club, or retail customer...
                    </option>
                    {customersQuery.data?.items?.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.companyName} ({c.industry || "Gym & Fitness"})
                      </option>
                    ))}
                  </Select>
                )}
              </div>

              {/* Pipeline Stage */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <Layers className="h-4 w-4 text-primary" /> Sales Pipeline Stage <span className="text-danger">*</span>
                </label>
                {stagesQuery.isLoading ? (
                  <Skeleton className="h-9 w-full" />
                ) : (
                  <Select
                    value={pipelineStageId}
                    onChange={(e) => handleStageChange(e.target.value)}
                    required
                  >
                    <option value="" disabled>
                      Select active stage...
                    </option>
                    {stagesQuery.data?.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.probability}%)
                      </option>
                    ))}
                  </Select>
                )}
                <p className="text-xs text-muted-foreground">
                  Selecting a stage automatically aligns the probability percentage.
                </p>
              </div>

              {/* Deal Value */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <DollarSign className="h-4 w-4 text-primary" /> Deal Value (EGP / USD) <span className="text-danger">*</span>
                </label>
                <div className="relative">
                  <Input
                    type="number"
                    min="0"
                    step="500"
                    placeholder="25000"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    required
                    className="pl-8"
                  />
                  <span className="absolute left-3 top-2.5 text-xs font-bold text-muted-foreground">$</span>
                </div>
              </div>

              {/* Win Probability */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <Percent className="h-4 w-4 text-primary" /> Win Probability (%) <span className="text-danger">*</span>
                </label>
                <div className="flex items-center gap-3">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={probability}
                    onChange={(e) => setProbability(e.target.value)}
                    required
                  />
                  <span className="text-xs font-semibold px-2.5 py-1.5 rounded-md bg-muted text-foreground border border-border">
                    {probability}%
                  </span>
                </div>
              </div>

              {/* Expected Close Date */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-primary" /> Expected Close Date
                </label>
                <Input
                  type="date"
                  value={expectedCloseDate}
                  onChange={(e) => setExpectedCloseDate(e.target.value)}
                />
              </div>

              {/* Assigned Rep / Owner */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <User className="h-4 w-4 text-primary" /> Deal Owner (Sales Rep) <span className="text-danger">*</span>
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
                  <Select
                    value={assignedUserId}
                    onChange={(e) => setAssignedUserId(e.target.value)}
                    required
                  >
                    <option value="" disabled>
                      Assign to team member...
                    </option>
                    {usersQuery.data?.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.firstName} {u.lastName} ({u.role})
                      </option>
                    ))}
                  </Select>
                )}
                <p className="text-xs text-muted-foreground">
                  {isSalesRep
                    ? "Sales Representatives can only create and manage deals in their personal pipeline."
                    : "Managers & Administrators can assign this deal to any sales team representative."}
                </p>
              </div>
            </div>

            {/* Description / Supplement Order Notes */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-primary" /> Supplements Order Details & Deal Notes
              </label>
              <Textarea
                rows={4}
                placeholder="Include details such as: 50 tubs Gold Standard 100% Whey 5lbs, 30 bottles Creatine Micronized 300g, shipment batch terms, discount agreements..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate(-1)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving} className="gap-2">
                <CheckCircle2 className="h-4 w-4" />
                {isSaving
                  ? "Saving Deal..."
                  : mode === "create"
                  ? "Create Opportunity"
                  : "Save Changes"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
