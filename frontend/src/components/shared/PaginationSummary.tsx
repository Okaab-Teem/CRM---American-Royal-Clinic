import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PagedResult } from "@/types/common";

export interface PaginationProps<T> {
  result: PagedResult<T>;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
}

export function PaginationSummary<T>({
  result,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 20, 50],
}: PaginationProps<T>) {
  const total = result.total;
  const page = result.page;
  const pageSize = result.pageSize;
  const totalPages = Math.max(1, Math.ceil(total / (pageSize || 10)));

  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | "...")[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (page <= 3) {
        pages.push(1, 2, 3, "...", totalPages);
      } else if (page >= totalPages - 2) {
        pages.push(1, "...", totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, "...", page - 1, page, page + 1, "...", totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-b-lg border-t border-border bg-card px-4 py-3 text-sm text-muted-foreground">
      <div className="flex flex-wrap items-center gap-4">
        <span>
          Showing <strong className="font-semibold text-foreground">{start}</strong>-
          <strong className="font-semibold text-foreground">{end}</strong> of{" "}
          <strong className="font-semibold text-foreground">{total}</strong> items
        </span>

        {onPageSizeChange && (
          <div className="flex items-center gap-1.5 text-xs">
            <span>Show</span>
            <select
              aria-label="Items per page"
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="rounded-md border border-input bg-background px-2 py-1 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            <span>per page</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="secondary"
          className="h-8 w-8 p-0"
          disabled={page <= 1}
          onClick={() => onPageChange?.(1)}
          title="First Page"
          aria-label="First Page"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>

        <Button
          variant="secondary"
          className="h-8 w-8 p-0"
          disabled={page <= 1}
          onClick={() => onPageChange?.(page - 1)}
          title="Previous Page"
          aria-label="Previous Page"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-1 mx-1">
          {getPageNumbers().map((p, idx) =>
            p === "..." ? (
              <span key={`ellipsis-${idx}`} className="px-1 text-muted-foreground">
                ...
              </span>
            ) : (
              <Button
                key={p}
                variant={p === page ? "primary" : "secondary"}
                className="h-8 min-w-[32px] px-2 text-xs font-semibold"
                onClick={() => onPageChange?.(Number(p))}
              >
                {p}
              </Button>
            )
          )}
        </div>

        <Button
          variant="secondary"
          className="h-8 w-8 p-0"
          disabled={page >= totalPages}
          onClick={() => onPageChange?.(page + 1)}
          title="Next Page"
          aria-label="Next Page"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        <Button
          variant="secondary"
          className="h-8 w-8 p-0"
          disabled={page >= totalPages}
          onClick={() => onPageChange?.(totalPages)}
          title="Last Page"
          aria-label="Last Page"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
