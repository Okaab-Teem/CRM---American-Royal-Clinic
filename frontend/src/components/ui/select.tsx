import type { SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn("h-9 w-full rounded-md border border-border bg-card px-3 text-sm text-foreground shadow-sm", className)}
      {...props}
    >
      {children}
    </select>
  );
}
