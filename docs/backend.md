# FlowCRM Backend

FlowCRM starts as a modular monolith with these backend projects:

- `FlowCRM.Api`: ASP.NET Core Web API, HTTP contracts, middleware, OpenAPI, health checks.
- `FlowCRM.Application`: use cases, DTOs, validation, business exceptions.
- `FlowCRM.Domain`: domain entities and business rules.
- `FlowCRM.Infrastructure`: EF Core, SQL Server persistence, external infrastructure adapters.

Sprint 0 intentionally creates the foundation only. Authentication, users, leads, customers, opportunities, tasks, notifications, and reporting belong to later sprints.

## Local Database

Start SQL Server:

```powershell
docker compose up -d sqlserver
```

Docker Desktop must be installed and available on `PATH`.

The development connection string is configured in `src/FlowCRM.Api/appsettings.Development.json`.

## API

Run the API:

```powershell
dotnet run --project src/FlowCRM.Api/FlowCRM.Api.csproj
```

Endpoints available in Sprint 0:

- `/`
- `/api/system/info`
- `/health`
- `/health/live`
- `/health/ready`
- `/swagger`
- `/openapi/v1.json`
