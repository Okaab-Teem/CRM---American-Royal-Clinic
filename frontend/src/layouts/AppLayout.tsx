import { Outlet } from "react-router-dom";
import { Sidebar } from "@/layouts/Sidebar";
import { Topbar } from "@/layouts/Topbar";
import { MobileNavigation } from "@/layouts/MobileNavigation";

export function AppLayout() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="min-w-0 flex-1 pb-16 lg:pb-0">
        <Topbar />
        <main className="mx-auto w-full max-w-7xl px-4 py-6 lg:px-6">
          <Outlet />
        </main>
      </div>
      <MobileNavigation />
    </div>
  );
}
