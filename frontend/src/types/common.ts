export type UserRole = "Admin" | "Manager" | "SalesRepresentative" | "Viewer";

export interface UserSummary {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
}

export interface CurrentUser extends UserSummary {
  isActive: boolean;
  permissions: string[];
}

export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

export interface QueryParams {
  search?: string;
  page?: number;
  pageSize?: number;
  [key: string]: string | number | boolean | undefined;
}
