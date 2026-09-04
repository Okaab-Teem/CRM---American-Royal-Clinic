import { NavLink } from "react-router-dom";
import { BarChart3, BriefcaseBusiness, CheckSquare, Gauge, KanbanSquare, Package, Settings, Target, UserCog, Users, WalletCards } from "lucide-react";
import { usePermissions } from "@/hooks/use-permissions";
import { cn } from "@/lib/utils";

const sections = [
  {
    title: "",
    items: [{ label: "Dashboard", to: "/dashboard", icon: Gauge, permissions: ["dashboard.view"] }],
  },
  {
    title: "Sales",
    items: [
      { label: "Leads", to: "/leads", icon: Target, permissions: ["lead.view"] },
      { label: "Customers", to: "/customers", icon: Users, permissions: ["customer.view"] },
      { label: "Supplements", to: "/products", icon: Package, permissions: ["customer.view"] },
      { label: "Opportunities", to: "/opportunities", icon: BriefcaseBusiness, permissions: ["opportunity.view"] },
      { label: "Pipeline", to: "/pipeline", icon: KanbanSquare, permissions: ["opportunity.view"] },
    ],
  },
  {
    title: "Work",
    items: [
      { label: "Tasks", to: "/tasks", icon: CheckSquare, permissions: ["task.view"] },
      { label: "Activities", to: "/activities", icon: WalletCards, permissions: ["activity.view"] },
    ],
  },
  {
    title: "Insights",
    items: [{ label: "Reports", to: "/reports", icon: BarChart3, permissions: ["report.view"] }],
  },
  {
    title: "Administration",
    items: [
      { label: "Users", to: "/users", icon: UserCog, permissions: ["user.view"] },
      { label: "Settings", to: "/settings", icon: Settings, permissions: ["user.view"] },
    ],
  },
];

export function Sidebar() {
  const permissions = usePermissions();

  return (
    <aside className="hidden w-64 shrink-0 border-r border-border bg-card lg:block">
      <div className="flex h-16 items-center border-b border-border px-5 text-lg font-semibold text-primary">FlowCRM</div>
      <nav className="space-y-6 px-3 py-4">
        {sections.map((section) => {
          const visibleItems = section.items.filter((item) => permissions.any(item.permissions));
          if (visibleItems.length === 0) return null;
          return (
            <div key={section.title || "root"}>
              {section.title ? <div className="mb-2 px-2 text-xs font-semibold uppercase text-muted-foreground">{section.title}</div> : null}
              <div className="space-y-1">
                {visibleItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      cn(
                        "flex h-9 items-center gap-2 rounded-md px-2 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground",
                        isActive && "bg-muted text-foreground",
                      )
                    }
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
