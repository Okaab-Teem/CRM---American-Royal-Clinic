using System.Security.Claims;
using System.Text;
using System.Threading.RateLimiting;
using FlowCRM.Api.Endpoints;
using FlowCRM.Api.Extensions;
using FlowCRM.Api.Middleware;
using FlowCRM.Application;
using FlowCRM.Infrastructure;
using FlowCRM.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

builder.Host.UseSerilog((context, services, configuration) =>
{
    configuration
        .ReadFrom.Configuration(context.Configuration)
        .ReadFrom.Services(services)
        .Enrich.FromLogContext();
});

builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);

var jwtKey = builder.Configuration["Jwt:Key"] ?? "FlowCRM_SuperSecretKey_ForDevelopment_RequiresAtLeast32BytesLength!";
if (builder.Environment.IsProduction() && (string.IsNullOrWhiteSpace(jwtKey) || jwtKey.Contains("SuperSecretKey") || jwtKey.Length < 32))
{
    throw new InvalidOperationException("FATAL: In Production, 'Jwt:Key' must be provided via environment variable and be at least 32 characters long.");
}

var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "FlowCRM";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "FlowCRMClient";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtIssuer,
        ValidAudience = jwtAudience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
        RoleClaimType = ClaimTypes.Role,
        NameClaimType = ClaimTypes.NameIdentifier
    };
});

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("RequireAdmin", policy => policy.RequireRole("Admin"));
    options.AddPolicy("RequireManagerOrAdmin", policy => policy.RequireRole("Admin", "Manager"));
});
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddOpenApi();

var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];
builder.Services.AddCors(options =>
{
    options.AddPolicy("FlowCrmFrontend", policy =>
    {
        policy
            .SetIsOriginAllowed(origin =>
            {
                if (builder.Environment.IsDevelopment())
                {
                    if (Uri.TryCreate(origin, UriKind.Absolute, out var uri))
                    {
                        return uri.Host == "localhost" || uri.Host == "127.0.0.1";
                    }
                    return false;
                }
                return allowedOrigins.Contains(origin, StringComparer.OrdinalIgnoreCase);
            })
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

builder.Services.AddResponseCompression(options =>
{
    options.EnableForHttps = true;
});
builder.Services.AddOutputCache();

builder.Services.AddHealthChecks()
    .AddDbContextCheck<FlowCrmDbContext>("sql-server", tags: ["ready"]);

builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    // Global protective rate limiter (500 permits per 10s per client IP)
    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(httpContext =>
    {
        var clientIp = httpContext.Connection.RemoteIpAddress?.ToString() ?? "anonymous";
        return RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: clientIp,
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 500,
                Window = TimeSpan.FromSeconds(10),
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit = 100
            });
    });

    // Anti-spam rapid-clicking limiter for mutating button actions (Max 3 rapid requests per 2s)
    options.AddPolicy("anti-spam-click", httpContext =>
    {
        var clientIp = httpContext.Connection.RemoteIpAddress?.ToString() ?? "anonymous";
        var endpoint = httpContext.Request.Path.ToString().ToLowerInvariant();
        return RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: $"{clientIp}_{endpoint}",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 3,
                Window = TimeSpan.FromSeconds(2),
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit = 0
            });
    });

    // Auth limiter: permits up to 15 login attempts per 10s per client IP
    options.AddPolicy("auth-rate-limit", httpContext =>
    {
        var clientIp = httpContext.Connection.RemoteIpAddress?.ToString() ?? "anonymous";
        return RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: clientIp,
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 15,
                Window = TimeSpan.FromSeconds(10),
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit = 0
            });
    });

    options.OnRejected = async (context, token) =>
    {
        context.HttpContext.Response.StatusCode = StatusCodes.Status429TooManyRequests;
        context.HttpContext.Response.ContentType = "application/json";
        context.HttpContext.Response.Headers.Append("Retry-After", "2");

        var response = new
        {
            error = "Too Many Requests",
            message = "You are clicking too rapidly. Please slow down and wait a moment before trying again.",
            statusCode = 429,
            retryAfterSeconds = 2,
            timestamp = DateTime.UtcNow
        };
        await context.HttpContext.Response.WriteAsJsonAsync(response, cancellationToken: token);
    };
});

var app = builder.Build();

// Auto-seed database & configure SQLite WAL mode
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<FlowCrmDbContext>();
    try
    {
        await context.Database.EnsureCreatedAsync();
        if (context.Database.IsSqlite())
        {
            await context.Database.ExecuteSqlRawAsync(@"
                PRAGMA journal_mode = WAL; 
                PRAGMA busy_timeout = 5000; 
                PRAGMA synchronous = NORMAL;

                CREATE TABLE IF NOT EXISTS ""Products"" (
                    ""Id"" TEXT NOT NULL CONSTRAINT ""PK_Products"" PRIMARY KEY,
                    ""Name"" TEXT NOT NULL,
                    ""Category"" TEXT NOT NULL,
                    ""Sku"" TEXT NOT NULL,
                    ""FlavorOrSize"" TEXT NULL,
                    ""UnitPrice"" TEXT NOT NULL,
                    ""CostPrice"" TEXT NOT NULL,
                    ""StockQuantity"" INTEGER NOT NULL,
                    ""LowStockThreshold"" INTEGER NOT NULL,
                    ""Description"" TEXT NULL,
                    ""IsActive"" INTEGER NOT NULL,
                    ""CreatedAt"" TEXT NOT NULL,
                    ""UpdatedAt"" TEXT NOT NULL
                );
                CREATE INDEX IF NOT EXISTS ""IX_Products_Name"" ON ""Products"" (""Name"");
                CREATE INDEX IF NOT EXISTS ""IX_Products_Category"" ON ""Products"" (""Category"");
                CREATE UNIQUE INDEX IF NOT EXISTS ""IX_Products_Sku"" ON ""Products"" (""Sku"");
                CREATE INDEX IF NOT EXISTS ""IX_Products_IsActive"" ON ""Products"" (""IsActive"");
            ");
        }
        var seeder = scope.ServiceProvider.GetRequiredService<DatabaseSeeder>();
        await seeder.SeedAsync();
    }
    catch (Exception ex)
    {
        Log.Warning(ex, "Could not initialize database on startup. Ensure SQL Server is accessible or configure SQLite provider.");
    }
}

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseResponseCompression();
app.UseMiddleware<ExceptionHandlingMiddleware>();
app.UseSerilogRequestLogging();

// Security Headers & Correlation ID
app.Use(async (context, next) =>
{
    context.Response.Headers.Append("X-Frame-Options", "DENY");
    context.Response.Headers.Append("X-Content-Type-Options", "nosniff");
    context.Response.Headers.Append("Referrer-Policy", "strict-origin-when-cross-origin");
    context.Response.Headers.Append("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

    var correlationId = context.Request.Headers["X-Correlation-Id"].FirstOrDefault() ?? Guid.NewGuid().ToString("N");
    context.Response.Headers.Append("X-Correlation-Id", correlationId);

    await next();
});

app.UseCors("FlowCrmFrontend");
app.UseRateLimiter();
app.UseOutputCache();

app.UseAuthentication();
app.UseAuthorization();

if (!app.Environment.IsDevelopment())
{
    app.UseHsts();
    app.UseHttpsRedirection();
}

app.MapGet("/", () => Results.Ok(new
{
    name = "FlowCRM API",
    status = "ok",
    timestamp = DateTime.UtcNow
}))
.WithName("GetApiRoot");

app.MapGet("/api/system/info", () => Results.Ok(new
{
    application = "FlowCRM",
    environment = app.Environment.EnvironmentName,
    timestamp = DateTime.UtcNow
}))
.WithName("GetSystemInfo");

app.MapAuthEndpoints();
app.MapLeadEndpoints();
app.MapCustomerEndpoints();
app.MapOpportunityEndpoints();
app.MapPipelineEndpoints();
app.MapTaskEndpoints();
app.MapActivityEndpoints();
app.MapReportEndpoints();
app.MapUserEndpoints();
app.MapProductEndpoints();
app.MapSystemAndLookupEndpoints();

app.MapFlowCrmHealthChecks();

app.Run();

public partial class Program;
