using FlowCRM.Domain.Entities;

namespace FlowCRM.Application.Common.Interfaces;

public interface IJwtTokenService
{
    string GenerateToken(User user, IReadOnlyList<string> permissions);
}
