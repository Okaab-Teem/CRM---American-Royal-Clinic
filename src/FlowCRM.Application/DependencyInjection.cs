using FlowCRM.Application.Services;
using FlowCRM.Application.Services.Implementations;
using Microsoft.Extensions.DependencyInjection;

namespace FlowCRM.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<ILeadService, LeadService>();
        services.AddScoped<ICustomerService, CustomerService>();
        services.AddScoped<IOpportunityService, OpportunityService>();
        services.AddScoped<ITaskService, TaskService>();
        services.AddScoped<IActivityService, ActivityService>();
        services.AddScoped<IDashboardService, DashboardService>();
        services.AddScoped<IUserService, UserService>();
        services.AddScoped<IProductService, ProductService>();

        return services;
    }
}
