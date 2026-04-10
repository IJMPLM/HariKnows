namespace HariKnowsBackend.Models;

public sealed class JwtOptions
{
    public string Issuer { get; set; } = "HariKnows";
    public string Audience { get; set; } = "HariKnowsClients";
    public string SigningKey { get; set; } = string.Empty;
    public int AccessTokenMinutes { get; set; } = 30;
    public int RefreshTokenDays { get; set; } = 7;
}

public sealed record LoginRequestDto(string Email, string Password);

public sealed record StudentProfileDto(string StudentNo, string FullName, string CollegeCode, string ProgramCode, string Email);

public sealed record StudentStatusDto(
    string StudentNo,
    string FullName,
    string CollegeCode,
    string ProgramCode,
    int? CurrentYear,
    string EnrollmentStatus,
    string GoodMoralStatus,
    string NstpStatus,
    string BirthCertStatus,
    string Form137Status,
    string Email
);

public sealed record TokenResponseDto(
    string AccessToken,
    DateTime ExpiresAtUtc,
    string RefreshToken,
    DateTime RefreshTokenExpiresAtUtc,
    StudentProfileDto User
);
