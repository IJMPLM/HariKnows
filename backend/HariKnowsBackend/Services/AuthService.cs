using System.IdentityModel.Tokens.Jwt;
using System.Net.Mail;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using HariKnowsBackend.Data;
using HariKnowsBackend.Data.Entities;
using HariKnowsBackend.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace HariKnowsBackend.Services;

public sealed class AuthService(HariKnowsDbContext db, IOptions<JwtOptions> jwtOptionsAccessor) : IAuthService
{
    private readonly JwtOptions _jwtOptions = jwtOptionsAccessor.Value;

    public async Task<TokenResponseDto?> LoginAsync(LoginRequestDto request, CancellationToken cancellationToken)
    {
        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(normalizedEmail) || string.IsNullOrWhiteSpace(request.Password))
        {
            return null;
        }

        if (!IsValidEmail(normalizedEmail))
        {
            return null;
        }

        var student = await db.StudentMasters
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.Email.ToLower() == normalizedEmail, cancellationToken);

        if (student is null || string.IsNullOrWhiteSpace(student.PasswordHash))
        {
            return null;
        }

        if (!VerifyPassword(request.Password, student.PasswordHash))
        {
            return null;
        }

        return BuildTokenResponse(student);
    }

    public async Task<TokenResponseDto?> RefreshAsync(string refreshToken, CancellationToken cancellationToken)
    {
        var principal = ValidateToken(refreshToken, expectedTokenType: "refresh");
        if (principal is null)
        {
            return null;
        }

        var studentNo = principal.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(studentNo))
        {
            return null;
        }

        var student = await db.StudentMasters
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.StudentNo == studentNo, cancellationToken);

        if (student is null)
        {
            return null;
        }

        return BuildTokenResponse(student);
    }

    public async Task<StudentProfileDto?> GetProfileAsync(string studentNo, CancellationToken cancellationToken)
    {
        var student = await db.StudentMasters
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.StudentNo == studentNo, cancellationToken);

        return student is null ? null : ToProfile(student);
    }

    public string HashPassword(string password)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(password);

        var salt = RandomNumberGenerator.GetBytes(16);
        var derived = Rfc2898DeriveBytes.Pbkdf2(password, salt, 100_000, HashAlgorithmName.SHA256, 32);
        return $"{Convert.ToBase64String(salt)}.{Convert.ToBase64String(derived)}";
    }

    private bool VerifyPassword(string password, string storedHash)
    {
        var parts = storedHash.Split('.', 2);
        if (parts.Length != 2)
        {
            return false;
        }

        try
        {
            var salt = Convert.FromBase64String(parts[0]);
            var expectedHash = Convert.FromBase64String(parts[1]);
            var actualHash = Rfc2898DeriveBytes.Pbkdf2(password, salt, 100_000, HashAlgorithmName.SHA256, expectedHash.Length);
            return CryptographicOperations.FixedTimeEquals(expectedHash, actualHash);
        }
        catch (FormatException)
        {
            return false;
        }
    }

    private TokenResponseDto BuildTokenResponse(StudentMaster student)
    {
        var now = DateTime.UtcNow;
        var accessExpires = now.AddMinutes(Math.Max(1, _jwtOptions.AccessTokenMinutes));
        var refreshExpires = now.AddDays(Math.Max(1, _jwtOptions.RefreshTokenDays));
        var profile = ToProfile(student);

        var accessToken = CreateToken(student.StudentNo, tokenType: "access", accessExpires);
        var refreshToken = CreateToken(student.StudentNo, tokenType: "refresh", refreshExpires);

        return new TokenResponseDto(accessToken, accessExpires, refreshToken, refreshExpires, profile);
    }

    private string CreateToken(string studentNo, string tokenType, DateTime expiresAtUtc)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtOptions.SigningKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, studentNo),
            new(JwtRegisteredClaimNames.Sub, studentNo),
            new("token_type", tokenType)
        };

        var token = new JwtSecurityToken(
            issuer: _jwtOptions.Issuer,
            audience: _jwtOptions.Audience,
            claims: claims,
            notBefore: DateTime.UtcNow,
            expires: expiresAtUtc,
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private ClaimsPrincipal? ValidateToken(string token, string expectedTokenType)
    {
        var tokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtOptions.SigningKey)),
            ValidateIssuer = true,
            ValidIssuer = _jwtOptions.Issuer,
            ValidateAudience = true,
            ValidAudience = _jwtOptions.Audience,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromSeconds(30)
        };

        try
        {
            var handler = new JwtSecurityTokenHandler();
            var principal = handler.ValidateToken(token, tokenValidationParameters, out _);
            var tokenType = principal.FindFirstValue("token_type");
            return tokenType == expectedTokenType ? principal : null;
        }
        catch
        {
            return null;
        }
    }

    private static StudentProfileDto ToProfile(StudentMaster student)
    {
        return new StudentProfileDto(
            student.StudentNo,
            student.FullName,
            student.CollegeCode,
            student.ProgramCode,
            student.Email
        );
    }

    private static bool IsValidEmail(string email)
    {
        try
        {
            _ = new MailAddress(email);
            return true;
        }
        catch (FormatException)
        {
            return false;
        }
    }
}
