import { useState } from "react";
import { Bell, LogOut, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/features/auth/auth-context";
import { useNotifications } from "@/features/notifications/hooks";

export function Topbar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const { data: notifications = [] } = useNotifications();
  const unread = notifications.filter((item) => !item.isRead).length;

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-card px-4 lg:px-6">
      <div className="relative max-w-xl flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search FlowCRM..." />
      </div>
      <div className="relative">
        <button className="relative grid h-9 w-9 place-items-center rounded-md hover:bg-muted" onClick={() => setOpen((value) => !value)} aria-label="Open notifications">
          <Bell className="h-4 w-4" />
          {unread ? <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-danger" /> : null}
        </button>
        {open ? (
          <div className="absolute right-0 mt-2 w-80 rounded-lg border border-border bg-card p-3 shadow-soft">
            <div className="mb-2 text-sm font-semibold">Notifications</div>
            <div className="space-y-2">
              {notifications.slice(0, 4).map((item) => (
                <div key={item.id} className="rounded-md bg-muted/70 p-2">
                  <div className="text-sm font-medium">{item.title}</div>
                  <div className="text-xs text-muted-foreground">{item.description}</div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
      <Link to="/settings" className="min-w-0 text-right block">
        <div className="truncate text-sm font-medium">
          {user?.firstName} {user?.lastName}
        </div>
        <div className="truncate text-xs text-muted-foreground">{user?.role}</div>
      </Link>
      <button className="grid h-9 w-9 place-items-center rounded-md hover:bg-muted" onClick={logout} aria-label="Sign Out" title="Sign Out">
        <LogOut className="h-4 w-4" />
      </button>
    </header>
  );
}
