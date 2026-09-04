import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/PageHeader";
import { Skeleton } from "@/components/shared/Skeleton";
import { ErrorState } from "@/components/shared/ErrorState";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useDashboard } from "@/features/dashboard/hooks";
import { useTasks } from "@/features/tasks/hooks";
import { formatDate, formatMoney } from "@/lib/formatters";
import { StatusBadge } from "@/components/shared/StatusBadge";

export function DashboardPage() {
  const user = useCurrentUser();
  const dashboard = useDashboard();
  const tasks = useTasks({ pageSize: 5 });

  if (dashboard.isLoading) return <Skeleton className="h-[560px]" />;
  if (dashboard.isError || !dashboard.data) return <ErrorState title="We couldn't load your dashboard." onRetry={() => dashboard.refetch()} />;

  const kpis = [
    { label: "Total Leads", value: dashboard.data.totalLeads.toString(), meta: "Current lead pool" },
    { label: "Active Opportunities", value: dashboard.data.activeOpportunities.toString(), meta: formatMoney(dashboard.data.pipelineValue) },
    { label: "Pipeline Value", value: formatMoney(dashboard.data.pipelineValue), meta: "Open stages" },
    { label: "Won Revenue", value: formatMoney(dashboard.data.wonRevenue), meta: "Closed won" },
    { label: "Tasks Due Today", value: dashboard.data.tasksDueToday.toString(), meta: "Needs attention" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description={`Good morning, ${user?.firstName ?? "there"}.`} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {kpis.map((item) => (
          <Card key={item.label}>
            <CardContent>
              <div className="text-sm text-muted-foreground">{item.label}</div>
              <div className="mt-2 text-2xl font-semibold">{item.value}</div>
              <div className="mt-1 text-xs text-muted-foreground">{item.meta}</div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader><CardTitle>Sales Pipeline</CardTitle></CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dashboard.data.pipelineStages}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value, name) => (name === "value" ? formatMoney(Number(value)) : value)} />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Leads by Source</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {dashboard.data.leadsBySource.map((item) => (
              <div key={item.source} className="flex items-center justify-between text-sm">
                <span>{item.source}</span>
                <span className="font-medium">{item.count}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Revenue</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dashboard.data.revenueByMonth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => formatMoney(Number(value))} />
                <Line dataKey="revenue" stroke="hsl(var(--success))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>My Tasks</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {(tasks.data?.items ?? []).map((task) => (
              <div key={task.id} className="flex items-center justify-between gap-3 rounded-md border border-border p-3">
                <div>
                  <div className="text-sm font-medium">{task.title}</div>
                  <div className="text-xs text-muted-foreground">{task.customerName} · {formatDate(task.dueDate)}</div>
                </div>
                <StatusBadge value={task.status} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
