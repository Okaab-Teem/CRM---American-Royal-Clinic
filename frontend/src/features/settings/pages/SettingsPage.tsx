import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/PageHeader";
import { stages } from "@/features/mock/data";

export function SettingsPage() {
  return (
    <div className="space-y-5">
      <PageHeader title="Settings" description="Profile, pipeline configuration, lead sources, and preferences." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card><CardHeader><CardTitle>Pipeline Configuration</CardTitle></CardHeader><CardContent className="space-y-2">{stages.map((stage) => <div key={stage.id} className="rounded-md border border-border px-3 py-2 text-sm">{stage.name} · {stage.probability}%</div>)}</CardContent></Card>
        <Card><CardHeader><CardTitle>Lead Sources</CardTitle></CardHeader><CardContent className="grid gap-2 sm:grid-cols-2">{["Website", "Referral", "Advertisement", "Social Media", "Phone", "Other"].map((source) => <div key={source} className="rounded-md bg-muted px-3 py-2 text-sm">{source}</div>)}</CardContent></Card>
      </div>
    </div>
  );
}
