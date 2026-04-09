using HariKnowsBackend.Models;

namespace HariKnowsBackend.Services;

public interface IAuthService
{
    Task<TokenResponseDto?> LoginAsync(LoginRequestDto request, CancellationToken cancellationToken);

    Task<TokenResponseDto?> RefreshAsync(string refreshToken, CancellationToken cancellationToken);

    Task<StudentProfileDto?> GetProfileAsync(string studentNo, CancellationToken cancellationToken);

    string HashPassword(string password);
}
