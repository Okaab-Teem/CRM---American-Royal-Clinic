using FlowCRM.Application.Common.Interfaces;
using FlowCRM.Infrastructure.Persistence;
using FlowCRM.Infrastructure.Security;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace FlowCRM.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("FlowCrm")
            ?? "Server=localhost,1433;Database=FlowCRM;User Id=sa;Password=Your_strong_password123;TrustServerCertificate=True;Encrypt=True";

        var provider = configuration["DatabaseProvider"] ?? "SqlServer";

        services.AddDbContext<FlowCrmDbContext>(options =>
        {
            if (provider.Equals("Sqlite", StringComparison.OrdinalIgnoreCase) || connectionString.Contains(".db", StringComparison.OrdinalIgnoreCase))
            {
                if (!connectionString.Contains("Cache=", StringComparison.OrdinalIgnoreCase))
                {
                    connectionString = connectionString.TrimEnd(';') + ";Cache=Shared;Mode=ReadWriteCreate;";
                }
                options.UseSqlite(connectionString);
            }
            else
            {
                options.UseSqlServer(connectionString, sqlOptions =>
                {
                    sqlOptions.EnableRetryOnFailure(maxRetryCount: 3, maxRetryDelay: TimeSpan.FromSeconds(5), errorNumbersToAdd: null);
                });
            }
        });

        services.AddMemoryCache();
        services.AddScoped<IApplicationDbContext>(sp => sp.GetRequiredService<FlowCrmDbContext>());
        services.AddSingleton<IPasswordHasher, PasswordHasher>();
        services.AddSingleton<IJwtTokenService, JwtTokenService>();
        services.AddScoped<DatabaseSeeder>();

        return services;
    }
}
