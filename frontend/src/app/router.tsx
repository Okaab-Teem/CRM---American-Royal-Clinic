import { Navigate, createBrowserRouter } from "react-router-dom";
import { AppLayout } from "@/layouts/AppLayout";
import { LoginPage } from "@/features/auth/pages/LoginPage";
import { ProtectedRoute } from "@/features/auth/ProtectedRoute";
import { PermissionRoute } from "@/features/auth/PermissionRoute";
import { DashboardPage } from "@/features/dashboard/pages/DashboardPage";
import { LeadsPage } from "@/features/leads/pages/LeadsPage";
import { LeadDetailsPage } from "@/features/leads/pages/LeadDetailsPage";
import { LeadFormPage } from "@/features/leads/pages/LeadFormPage";
import { CustomersPage } from "@/features/customers/pages/CustomersPage";
import { CustomerDetailsPage } from "@/features/customers/pages/CustomerDetailsPage";
import { CustomerFormPage } from "@/features/customers/pages/CustomerFormPage";
import { ProductsPage } from "@/features/products/pages/ProductsPage";
import { OpportunitiesPage } from "@/features/opportunities/pages/OpportunitiesPage";
import { OpportunityDetailsPage } from "@/features/opportunities/pages/OpportunityDetailsPage";
import { OpportunityFormPage } from "@/features/opportunities/pages/OpportunityFormPage";
import { PipelinePage } from "@/features/pipeline/pages/PipelinePage";
import { TasksPage } from "@/features/tasks/pages/TasksPage";
import { ActivitiesPage } from "@/features/activities/pages/ActivitiesPage";
import { ReportsPage } from "@/features/reports/pages/ReportsPage";
import { UsersPage } from "@/features/users/pages/UsersPage";
import { UserFormPage } from "@/features/users/pages/UserFormPage";
import { SettingsPage } from "@/features/settings/pages/SettingsPage";
import { ForbiddenPage } from "@/features/system/ForbiddenPage";
import { NotFoundPage } from "@/features/system/NotFoundPage";

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <Navigate to="/dashboard" replace /> },
          { path: "/dashboard", element: <DashboardPage /> },
          { path: "/leads", element: <LeadsPage /> },
          { path: "/leads/new", element: <LeadFormPage mode="create" /> },
          { path: "/leads/:id", element: <LeadDetailsPage /> },
          { path: "/leads/:id/edit", element: <LeadFormPage mode="edit" /> },
          { path: "/customers", element: <CustomersPage /> },
          { path: "/customers/new", element: <CustomerFormPage mode="create" /> },
          { path: "/customers/:id", element: <CustomerDetailsPage /> },
          { path: "/customers/:id/edit", element: <CustomerFormPage mode="edit" /> },
          { path: "/products", element: <ProductsPage /> },
          { path: "/opportunities", element: <OpportunitiesPage /> },
          { path: "/opportunities/new", element: <OpportunityFormPage mode="create" /> },
          { path: "/opportunities/:id", element: <OpportunityDetailsPage /> },
          { path: "/opportunities/:id/edit", element: <OpportunityFormPage mode="edit" /> },
          { path: "/pipeline", element: <PipelinePage /> },
          { path: "/tasks", element: <TasksPage /> },
          { path: "/activities", element: <ActivitiesPage /> },
          {
            element: <PermissionRoute permission="report.view" />,
            children: [{ path: "/reports", element: <ReportsPage /> }],
          },
          {
            element: <PermissionRoute permission="user.view" />,
            children: [
              { path: "/users", element: <UsersPage /> },
              { path: "/users/new", element: <UserFormPage mode="create" /> },
              { path: "/users/:id/edit", element: <UserFormPage mode="edit" /> },
              { path: "/settings", element: <SettingsPage /> },
            ],
          },
          { path: "/403", element: <ForbiddenPage /> },
          { path: "/404", element: <NotFoundPage /> },
        ],
      },
    ],
  },
  { path: "*", element: <Navigate to="/404" replace /> },
]);
