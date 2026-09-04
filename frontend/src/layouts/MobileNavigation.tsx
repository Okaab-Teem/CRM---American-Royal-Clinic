import { NavLink } from "react-router-dom";
import { BriefcaseBusiness, CheckSquare, Gauge, KanbanSquare, Target } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { label: "Home", to: "/dashboard", icon: Gauge },
  { label: "Leads", to: "/leads", icon: Target },
  { label: "Deals", to: "/opportunities", icon: BriefcaseBusiness },
  { label: "Pipeline", to: "/pipeline", icon: KanbanSquare },
  { label: "Tasks", to: "/tasks", icon: CheckSquare },
];

export function MobileNavigation() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-border bg-card lg:hidden">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) => cn("flex h-14 flex-col items-center justify-center gap-1 text-xs text-muted-foreground", isActive && "text-primary")}
        >
          <item.icon className="h-4 w-4" />
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
