import type { ReactNode } from "react";

export function DataTableShell({ children }: { children: ReactNode }) {
  return <div className="overflow-x-auto rounded-lg border border-border bg-card scrollbar-thin">{children}</div>;
}
