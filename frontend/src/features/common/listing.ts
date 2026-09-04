import type { PagedResult, QueryParams } from "@/types/common";

export function filterAndPage<T>(items: T[], params: QueryParams, matcher: (item: T, search: string) => boolean): PagedResult<T> {
  const page = Number(params.page ?? 1);
  const pageSize = Number(params.pageSize ?? 20);
  const search = String(params.search ?? "").trim().toLowerCase();
  const filtered = search ? items.filter((item) => matcher(item, search)) : items;
  const start = (page - 1) * pageSize;
  return {
    items: filtered.slice(start, start + pageSize),
    page,
    pageSize,
    total: filtered.length,
  };
}
