using System.Security.Claims;
using HariKnowsBackend.Models;
using HariKnowsBackend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HariKnowsBackend.Controllers;

[ApiController]
[Route("api/auth")]
public sealed class AuthController(IAuthService authService, IConfiguration configuration) : ControllerBase
{
    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login([FromBody] LoginRequestDto request, CancellationToken cancellationToken)
    {
        var token = await authService.LoginAsync(request, cancellationToken);
        if (token is null)
        {
            return Unauthorized(new { error = "Invalid student number or password." });
        }

        SetRefreshCookie(token.RefreshToken, token.RefreshTokenExpiresAtUtc);
        return Ok(new
        {
            accessToken = token.AccessToken,
            expiresAtUtc = token.ExpiresAtUtc,
            user = token.User
        });
    }

    [HttpPost("refresh")]
    [AllowAnonymous]
    public async Task<IActionResult> Refresh(CancellationToken cancellationToken)
    {
        var refreshToken = Request.Cookies["hk_refresh"];
        if (string.IsNullOrWhiteSpace(refreshToken))
        {
            return Unauthorized(new { error = "Refresh token not found." });
        }

        var token = await authService.RefreshAsync(refreshToken, cancellationToken);
        if (token is null)
        {
            return Unauthorized(new { error = "Refresh token is invalid or expired." });
        }

        SetRefreshCookie(token.RefreshToken, token.RefreshTokenExpiresAtUtc);
        return Ok(new
        {
            accessToken = token.AccessToken,
            expiresAtUtc = token.ExpiresAtUtc,
            user = token.User
        });
    }

    [HttpPost("logout")]
    [AllowAnonymous]
    public IActionResult Logout()
    {
        var requireSecureCookies = string.Equals(configuration["Jwt:RequireSecureCookies"], "true", StringComparison.OrdinalIgnoreCase);

        // Delete with both secure variants to avoid stale cookies when environment flags change.
        Response.Cookies.Delete("hk_refresh", new CookieOptions
        {
            HttpOnly = true,
            Secure = Request.IsHttps || requireSecureCookies,
            SameSite = SameSiteMode.Lax,
            Path = "/"
        });

        Response.Cookies.Delete("hk_refresh", new CookieOptions
        {
            HttpOnly = true,
            Secure = false,
            SameSite = SameSiteMode.Lax,
            Path = "/"
        });

        return Ok(new { success = true });
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> Me(CancellationToken cancellationToken)
    {
        var studentNo = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(studentNo))
        {
            return Unauthorized(new { error = "Missing student identity." });
        }

        var profile = await authService.GetProfileAsync(studentNo, cancellationToken);
        if (profile is null)
        {
            return NotFound(new { error = "Student account not found." });
        }

        return Ok(profile);
    }

    [HttpPost("change-password")]
    [Authorize]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequestDto request, CancellationToken cancellationToken)
    {
        var studentNo = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(studentNo))
        {
            return Unauthorized(new { error = "Missing student identity." });
        }

        var result = await authService.ChangePasswordAsync(studentNo, request.CurrentPassword, request.NewPassword, cancellationToken);

        if (result.NotFound)
        {
            return NotFound(new { error = result.Error ?? "Student account not found." });
        }

        if (result.InvalidCurrentPassword)
        {
            return Unauthorized(new { error = result.Error ?? "Current password is incorrect." });
        }

        if (result.InvalidNewPassword)
        {
            return BadRequest(new { error = result.Error ?? "New password is invalid." });
        }

        if (!result.Success)
        {
            return BadRequest(new { error = result.Error ?? "Password update failed." });
        }

        return Ok(new { success = true });
    }

    private void SetRefreshCookie(string refreshToken, DateTime expiresAtUtc)
    {
        var secureCookie = Request.IsHttps || string.Equals(configuration["Jwt:RequireSecureCookies"], "true", StringComparison.OrdinalIgnoreCase);

        Response.Cookies.Append("hk_refresh", refreshToken, new CookieOptions
        {
            HttpOnly = true,
            Secure = secureCookie,
            SameSite = SameSiteMode.Lax,
            Expires = expiresAtUtc,
            Path = "/"
        });
    }
}
