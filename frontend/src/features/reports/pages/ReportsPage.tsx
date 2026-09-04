import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/PageHeader";
import { opportunities } from "@/features/mock/data";
import { formatMoney } from "@/lib/formatters";

export function ReportsPage() {
  const grouped = opportunities.reduce<Record<string, typeof opportunities>>((acc, item) => {
    acc[item.stageName] = [...(acc[item.stageName] ?? []), item];
    return acc;
  }, {});
  const rows = Object.values(grouped).map((safeItems) => {
    return {
      stage: safeItems[0]?.stageName ?? "Unknown",
      count: safeItems.length,
      value: safeItems.reduce((sum, item) => sum + item.value, 0),
      weighted: safeItems.reduce((sum, item) => sum + item.value * (item.probability / 100), 0),
    };
  });
  return (
    <div className="space-y-5">
      <PageHeader title="Reports" description="Pipeline, conversion, revenue, and sales performance." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card><CardHeader><CardTitle>Pipeline Report</CardTitle></CardHeader><CardContent className="space-y-3">{rows.map((row) => <div key={row.stage} className="grid grid-cols-4 gap-3 text-sm"><span className="font-medium">{row.stage}</span><span>{row.count}</span><span>{formatMoney(row.value)}</span><span>{formatMoney(row.weighted)}</span></div>)}</CardContent></Card>
        <Card><CardHeader><CardTitle>Lead Conversion</CardTitle></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2"><Metric label="Total Leads" value="126" /><Metric label="Qualified" value="38" /><Metric label="Converted" value="24" /><Metric label="Conversion Rate" value="19%" /></CardContent></Card>
        <Card><CardHeader><CardTitle>Revenue</CardTitle></CardHeader><CardContent className="grid gap-3 sm:grid-cols-3"><Metric label="Won Revenue" value={formatMoney(192000)} /><Metric label="Average Deal Size" value={formatMoney(24000)} /><Metric label="Deals Won" value="8" /></CardContent></Card>
        <Card><CardHeader><CardTitle>Sales Performance</CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground">Manager-only team performance report will read from GET /api/reports/sales-performance.</CardContent></Card>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-md bg-muted p-3"><div className="text-xs text-muted-foreground">{label}</div><div className="mt-1 text-lg font-semibold">{value}</div></div>;
}
