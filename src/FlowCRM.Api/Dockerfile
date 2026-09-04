# Multi-stage production Dockerfile for FlowCRM API (.NET 10)
# Stage 1: Base Build Environment
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy solution and project files for layer caching
COPY FlowCRM.slnx ./
COPY src/FlowCRM.Domain/FlowCRM.Domain.csproj src/FlowCRM.Domain/
COPY src/FlowCRM.Application/FlowCRM.Application.csproj src/FlowCRM.Application/
COPY src/FlowCRM.Infrastructure/FlowCRM.Infrastructure.csproj src/FlowCRM.Infrastructure/
COPY src/FlowCRM.Api/FlowCRM.Api.csproj src/FlowCRM.Api/
COPY tests/FlowCRM.Tests/FlowCRM.Tests.csproj tests/FlowCRM.Tests/

RUN dotnet restore FlowCRM.slnx

# Copy source code and build in Release mode
COPY src/ src/
COPY tests/ tests/
RUN dotnet build FlowCRM.slnx -c Release --no-restore

# Stage 2: Publish Optimized Binaries
FROM build AS publish
RUN dotnet publish src/FlowCRM.Api/FlowCRM.Api.csproj -c Release -o /app/publish --no-build /p:UseAppHost=false

# Stage 3: Hardened Non-Root Chiseled Runtime
FROM mcr.microsoft.com/dotnet/aspnet:10.0-noble-chiseled AS final
WORKDIR /app

# Non-root user provided by chiseled image (UID 1654:app)
USER $APP_UID

EXPOSE 5000
ENV ASPNETCORE_URLS=http://+:5000 \
    ASPNETCORE_ENVIRONMENT=Production \
    DOTNET_RUNNING_IN_CONTAINER=true

COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "FlowCRM.Api.dll"]
