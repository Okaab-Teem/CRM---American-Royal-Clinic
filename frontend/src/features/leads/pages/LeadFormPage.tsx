import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useParams } from "react-router-dom";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/shared/PageHeader";
import { leadSchema } from "@/features/leads/schemas";
import { useCreateLead, useLead, useUpdateLead } from "@/features/leads/hooks";
import { useToast } from "@/components/shared/toast";

type InputValues = z.input<typeof leadSchema>;
type Values = z.output<typeof leadSchema>;

export function LeadFormPage({ mode }: { mode: "create" | "edit" }) {
  const { id } = useParams();
  const existing = useLead(mode === "edit" ? id : undefined);
  const createLead = useCreateLead();
  const updateLead = useUpdateLead();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const form = useForm<InputValues, unknown, Values>({
    resolver: zodResolver(leadSchema),
    values: existing.data ? {
      firstName: existing.data.firstName,
      lastName: existing.data.lastName,
      companyName: existing.data.companyName,
      email: existing.data.email ?? "",
      phone: existing.data.phone ?? "",
      sourceName: existing.data.sourceName ?? "",
      estimatedValue: existing.data.estimatedValue ?? 0,
      notes: existing.data.notes ?? "",
    } : undefined,
    defaultValues: { firstName: "", lastName: "", companyName: "", email: "", phone: "", sourceName: "Website", estimatedValue: 0, notes: "" },
  });

  async function onSubmit(values: Values) {
    if (mode === "edit" && id) {
      await updateLead.mutateAsync({ id, input: values });
      showToast("Lead saved successfully.", "success");
      navigate(`/leads/${id}`);
    } else {
      const lead = await createLead.mutateAsync(values);
      showToast("Lead created successfully.", "success");
      navigate(`/leads/${lead.id}`);
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader title={mode === "create" ? "New Lead" : "Edit Lead"} />
      <form className="max-w-3xl space-y-4 rounded-lg border border-border bg-card p-4" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="First Name" error={form.formState.errors.firstName?.message}><Input {...form.register("firstName")} /></Field>
          <Field label="Last Name" error={form.formState.errors.lastName?.message}><Input {...form.register("lastName")} /></Field>
          <Field label="Company Name" error={form.formState.errors.companyName?.message}><Input {...form.register("companyName")} /></Field>
          <Field label="Email" error={form.formState.errors.email?.message}><Input {...form.register("email")} /></Field>
          <Field label="Phone" error={form.formState.errors.phone?.message}><Input {...form.register("phone")} /></Field>
          <Field label="Lead Source" error={form.formState.errors.sourceName?.message}><Input {...form.register("sourceName")} /></Field>
          <Field label="Estimated Value" error={form.formState.errors.estimatedValue?.message}><Input type="number" {...form.register("estimatedValue")} /></Field>
        </div>
        <Field label="Notes" error={form.formState.errors.notes?.message}><Textarea {...form.register("notes")} /></Field>
        <div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={() => navigate(-1)}>Cancel</Button><Button disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? "Saving..." : mode === "create" ? "Create Lead" : "Save Lead"}</Button></div>
      </form>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return <label className="block text-sm font-medium">{label}<div className="mt-1">{children}</div>{error ? <span className="mt-1 block text-xs text-danger">{error}</span> : null}</label>;
}
