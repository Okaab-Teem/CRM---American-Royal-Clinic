# FlowCRM

FlowCRM is a production-quality CRM MVP for a small sales team. The implementation follows the provided blueprint and is built sprint-by-sprint.

## Current Scope

Sprint 0 creates the backend foundation:

- ASP.NET Core Web API
- Clean project structure: API, Application, Domain, Infrastructure
- SQL Server configuration through EF Core
- Swagger/OpenAPI
- Global exception middleware with a stable error contract
- Serilog structured logging
- Health checks
- Docker Compose for SQL Server
- CI build/test workflow

Feature APIs start in later sprints after this foundation is healthy.

## Prerequisites

- .NET 10 SDK
- Docker Desktop

## Build And Test

```powershell
dotnet restore FlowCRM.slnx
dotnet build FlowCRM.slnx
dotnet test FlowCRM.slnx
```

## Run Locally

```powershell
docker compose up -d sqlserver
dotnet run --project src/FlowCRM.Api/FlowCRM.Api.csproj
```

Swagger is available at `/swagger` in Development.
