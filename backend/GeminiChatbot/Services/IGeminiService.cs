using GeminiChatbot.Models;
using GeminiChatbot.Repositories;
using Google.GenAI;
using Google.GenAI.Types;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Text.RegularExpressions;

namespace GeminiChatbot.Services;

public interface IGeminiService
{
    Task<string> GetChatResponseAsync(string userMessage, IReadOnlyList<ChatResponseDto> conversationHistory);
}

public sealed class GeminiRateLimitException(string message, int? retryAfterSeconds, Exception innerException)
    : Exception(message, innerException)
{
    public int? RetryAfterSeconds { get; } = retryAfterSeconds;
}

public sealed class GeminiService(IConfiguration config, ILogger<GeminiService> logger) : IGeminiService
{
    private static readonly SemaphoreSlim RequestGate = new(1, 1);
    private static DateTime _lastRequestUtc = DateTime.MinValue;

    private readonly ILogger<GeminiService> _logger = logger;
    private readonly Client _client = new Client(apiKey: config["GeminiApi:ApiKey"] ?? throw new InvalidOperationException("GeminiApi:ApiKey not configured"));
    private readonly string[] _modelCandidates = BuildModelCandidates(config);
    private readonly TimeSpan _minRequestInterval = TimeSpan.FromMilliseconds(
        Math.Max(0, config.GetValue<int?>("GeminiApi:MinRequestIntervalMs") ?? 1200)
    );
    private readonly int _maxHistoryItems = Math.Max(1, config.GetValue<int?>("GeminiApi:MaxHistoryItems") ?? 12);
    private readonly bool _enableGoogleSearchTool = config.GetValue<bool?>("GeminiApi:EnableGoogleSearchTool") ?? false;
    private readonly int _thinkingBudget = Math.Max(0, config.GetValue<int?>("GeminiApi:ThinkingBudget") ?? 0);
    private readonly int _maxRateLimitRetries = Math.Max(0, config.GetValue<int?>("GeminiApi:MaxRateLimitRetries") ?? 2);
    private readonly int _retryBaseDelayMs = Math.Max(200, config.GetValue<int?>("GeminiApi:RetryBaseDelayMs") ?? 1000);
    private readonly int _retryJitterMs = Math.Max(0, config.GetValue<int?>("GeminiApi:RetryJitterMs") ?? 500);

    public async Task<string> GetChatResponseAsync(string userMessage, IReadOnlyList<ChatResponseDto> conversationHistory)
    {
        await RequestGate.WaitAsync();

        // Serialize outbound model calls and enforce a small interval to avoid accidental bursts.
        var elapsed = DateTime.UtcNow - _lastRequestUtc;
        if (elapsed < _minRequestInterval)
        {
            await Task.Delay(_minRequestInterval - elapsed);
        }

        _lastRequestUtc = DateTime.UtcNow;

        var recentHistory = conversationHistory
            .TakeLast(_maxHistoryItems)
            .ToList();

        var contents = new List<Content>();

        foreach (var message in recentHistory)
        {
            contents.Add(new Content
            {
                Role = NormalizeRoleForGemini(message.Role),
                Parts = new List<Part> 
                {
                    new Part { Text = message.Content }
                }
            });
        }

        contents.Add(new Content
        {
            Role = "user",
            Parts = new List<Part>
            {
                new Part { Text = userMessage }
            }
        });

        var generationConfig = new GenerateContentConfig();

        if (_thinkingBudget > 0)
        {
            generationConfig.ThinkingConfig = new ThinkingConfig
            {
                ThinkingBudget = _thinkingBudget,
            };
        }

        if (_enableGoogleSearchTool)
        {
            generationConfig.Tools = new List<Tool>
            {
                new Tool { GoogleSearch = new GoogleSearch() }
            };
        }

        try
        {
            return await GenerateWithRetryAsync(contents, generationConfig);
        }
        finally
        {
            RequestGate.Release();
        }
    }

    private static bool IsRateLimitOrQuota(Exception ex, out int? retryAfterSeconds)
    {
        retryAfterSeconds = null;
        var message = ex.ToString();

        var isQuotaError = message.Contains("429", StringComparison.OrdinalIgnoreCase)
            || message.Contains("TooManyRequests", StringComparison.OrdinalIgnoreCase)
            || message.Contains("Quota exceeded", StringComparison.OrdinalIgnoreCase)
            || message.Contains("rate limit", StringComparison.OrdinalIgnoreCase);

        if (!isQuotaError)
        {
            return false;
        }

        var retryInMatch = Regex.Match(message, @"retry in\s+(?<seconds>\d+(\.\d+)?)s", RegexOptions.IgnoreCase);
        if (retryInMatch.Success && double.TryParse(retryInMatch.Groups["seconds"].Value, out var retrySeconds))
        {
            retryAfterSeconds = (int)Math.Ceiling(retrySeconds);
            return true;
        }

        var retryDelayMatch = Regex.Match(message, "\\\"retryDelay\\\":\\\"(?<seconds>\\d+)s\\\"", RegexOptions.IgnoreCase);
        if (retryDelayMatch.Success && int.TryParse(retryDelayMatch.Groups["seconds"].Value, out var retryDelaySeconds))
        {
            retryAfterSeconds = retryDelaySeconds;
        }

        return true;
    }

    private async Task<string> GenerateWithRetryAsync(List<Content> contents, GenerateContentConfig generationConfig)
    {
        Exception? lastRateLimitException = null;
        int? lastRetryAfterSeconds = null;

        for (var attempt = 0; attempt <= _maxRateLimitRetries; attempt++)
        {
            foreach (var model in _modelCandidates)
            {
                var startedAt = DateTime.UtcNow;
                try
                {
                    _logger.LogInformation("Gemini request attempt {Attempt} using model {Model} with {HistoryCount} history items", attempt + 1, model, contents.Count - 1);
                    var response = string.Empty;

                    await foreach (var chunk in _client.Models.GenerateContentStreamAsync(model, contents, generationConfig))
                    {
                        response += chunk.Text;
                    }

                    _logger.LogInformation("Gemini request succeeded with model {Model} in {DurationMs}ms", model, (DateTime.UtcNow - startedAt).TotalMilliseconds);
                    return response;
                }
                catch (Exception ex) when (IsRateLimitOrQuota(ex, out var retryAfterSeconds))
                {
                    lastRateLimitException = ex;
                    lastRetryAfterSeconds = retryAfterSeconds ?? lastRetryAfterSeconds;
                    _logger.LogWarning("Gemini rate-limited for model {Model} on attempt {Attempt}. RetryAfterSeconds={RetryAfterSeconds}.", model, attempt + 1, retryAfterSeconds);
                }
                catch (Exception ex) when (IsModelCandidateError(ex))
                {
                    _logger.LogWarning("Gemini model candidate {Model} failed due to model/permission error. Trying next candidate. Details: {Error}", model, ex.Message);
                }
                catch (Exception ex)
                {
                    throw new InvalidOperationException($"Error calling Gemini API: {ex.Message}", ex);
                }
            }

            if (attempt < _maxRateLimitRetries)
            {
                var backoffMs = CalculateBackoffDelayMs(attempt, lastRetryAfterSeconds);
                _logger.LogWarning("All model candidates rate-limited. Waiting {DelayMs}ms before retry attempt {NextAttempt}.", backoffMs, attempt + 2);
                await Task.Delay(backoffMs);
            }
        }

        throw new GeminiRateLimitException(
            "Gemini API quota exceeded or rate limited after retries. Please retry later or review model/project quota settings.",
            lastRetryAfterSeconds,
            lastRateLimitException ?? new Exception("Gemini API rate limit exceeded")
        );
    }

    private static bool IsModelCandidateError(Exception ex)
    {
        var message = ex.ToString();
        return message.Contains("model", StringComparison.OrdinalIgnoreCase)
            && (message.Contains("not found", StringComparison.OrdinalIgnoreCase)
                || message.Contains("not supported", StringComparison.OrdinalIgnoreCase)
                || message.Contains("permission", StringComparison.OrdinalIgnoreCase)
                || message.Contains("invalid", StringComparison.OrdinalIgnoreCase));
    }

    private int CalculateBackoffDelayMs(int attempt, int? retryAfterSeconds)
    {
        if (retryAfterSeconds is > 0)
        {
            return (retryAfterSeconds.Value * 1000) + Random.Shared.Next(0, _retryJitterMs + 1);
        }

        var exponentialDelay = _retryBaseDelayMs * (int)Math.Pow(2, attempt);
        return exponentialDelay + Random.Shared.Next(0, _retryJitterMs + 1);
    }

    private static string NormalizeRoleForGemini(string? storedRole)
    {
        if (string.Equals(storedRole, "user", StringComparison.OrdinalIgnoreCase))
        {
            return "user";
        }

        // We persist assistant/model replies interchangeably in storage, but Gemini expects "model".
        if (string.Equals(storedRole, "assistant", StringComparison.OrdinalIgnoreCase)
            || string.Equals(storedRole, "model", StringComparison.OrdinalIgnoreCase))
        {
            return "model";
        }

        // Unknown legacy roles are treated as model turns to avoid hard API failures.
        return "model";
    }

    private static string[] BuildModelCandidates(IConfiguration config)
    {
        var primaryModel = config["GeminiApi:Model"] ?? "gemini-1.5-flash";
        var fallbackModels = config.GetSection("GeminiApi:FallbackModels").Get<string[]>() ?? [];

        return [primaryModel, .. fallbackModels.Where(model => !string.IsNullOrWhiteSpace(model) && !string.Equals(model, primaryModel, StringComparison.OrdinalIgnoreCase))];
    }
}
