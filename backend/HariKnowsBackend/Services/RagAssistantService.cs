using System.Text;
using GeminiChatbot.Models;
using GeminiChatbot.Services;
using HariKnowsBackend.Models;
using HariKnowsBackend.Repositories;
using Microsoft.Extensions.Options;

namespace HariKnowsBackend.Services;

public sealed class RagAssistantOptions
{
    public int MaxHistoryTurns { get; set; } = 8;
    public int MaxHistoryCharsPerTurn { get; set; } = 220;
    public int MaxFaqCharsPerEntry { get; set; } = 360;
}

public sealed class RagAssistantService(
    IRegistrarRepository registrarRepository,
    IGeminiService geminiService,
    IAuthService authService,
    IOptions<RagAssistantOptions> optionsAccessor
) : GeminiChatbot.Services.IRagAssistantService
{
    private readonly RagAssistantOptions _options = optionsAccessor.Value;

    public async Task<RagResponseDto> AnswerAsync(string? studentNo, string conversationId, string message, IReadOnlyList<ChatResponseDto> conversationHistory, CancellationToken cancellationToken)
    {
        var isGuest = string.IsNullOrWhiteSpace(studentNo);
        var student = isGuest ? null : await authService.GetProfileAsync(studentNo!, cancellationToken);
        var recentRequests = isGuest
            ? Array.Empty<StudentDocumentRequestDto>()
            : registrarRepository.GetStudentRequests(studentNo, null, 10);
        var faqScopeType = isGuest ? "general" : null;
        var faqMatches = registrarRepository.SearchFaqEntries(message, faqScopeType, student?.CollegeCode, student?.ProgramCode, 6);

        var routing = DetermineRouting(message, faqMatches, recentRequests);
        var citations = faqMatches
            .Select(entry => new RagCitationDto(
                entry.Id,
                entry.Title,
                $"/faq/{entry.Id}",
                entry.ScopeType,
                entry.Category
            ))
            .ToList();

        if (IsAuthStatusQuestion(message))
        {
            var authReply = isGuest
                ? "You are currently using Hari in guest mode and are not signed in. Sign in to access account-specific request status and personalized records."
                : $"Yes, you are signed in as {student?.FullName ?? "your account"} ({studentNo}).";

            return new RagResponseDto(
                authReply,
                "gemini",
                "helpdesk",
                0.9,
                citations,
                null,
                null
            );
        }

        if (string.Equals(routing, "redirect", StringComparison.OrdinalIgnoreCase) && faqMatches.Count == 0)
        {
            return new RagResponseDto(
                isGuest
                    ? "I can help with general registrar FAQs and published policies. For account-specific concerns, please sign in or contact the registrar office."
                    : "I can help with registrar document requests, student records, and published FAQ/context topics. For this question, please contact the appropriate office directly.",
                "gemini",
                routing,
                0.58,
                citations,
                "registrar",
                isGuest ? "Guest mode provides general guidance only." : "Question appears out of scope for the helpdesk knowledge base."
            );
        }

        var context = BuildContext(student, recentRequests, faqMatches, conversationHistory, message, isGuest);
        var geminiReply = await geminiService.GetChatResponseAsync(context, conversationHistory);
        var resolvedRouting = routing == "faq" ? "faq+gemini" : routing;
        var confidence = EstimateConfidence(resolvedRouting, faqMatches.Count, recentRequests.Count);

        return new RagResponseDto(geminiReply, "gemini", resolvedRouting, confidence, citations, null, null);
    }

    private static string DetermineRouting(string message, IReadOnlyList<FaqContextEntryDto> faqMatches, IReadOnlyList<StudentDocumentRequestDto> recentRequests)
    {
        var lowered = message.ToLowerInvariant();
        var isGreeting = lowered is "hi" or "hello" or "hey" or "good morning" or "good afternoon" or "good evening";

        if (isGreeting || IsAuthStatusQuestion(lowered))
        {
            return "helpdesk";
        }

        if (IsClearlyOutOfScope(lowered))
        {
            return "redirect";
        }

        if (lowered.Contains("course") || lowered.Contains("enrollment") || lowered.Contains("document") || lowered.Contains("tor") || lowered.Contains("grades") || faqMatches.Count > 0 || recentRequests.Count > 0)
        {
            return faqMatches.Count > 0 ? "faq" : "helpdesk";
        }

        return "helpdesk";
    }

    private static bool IsAuthStatusQuestion(string message)
    {
        var lowered = message.ToLowerInvariant();
        return lowered.Contains("am i logged in")
            || lowered.Contains("am i signed in")
            || lowered.Contains("logged in")
            || lowered.Contains("signed in")
            || lowered.Contains("my account");
    }

    private static bool IsClearlyOutOfScope(string lowered)
    {
        return lowered.Contains("weather")
            || lowered.Contains("stock market")
            || lowered.Contains("bitcoin")
            || lowered.Contains("recipe")
            || lowered.Contains("movie")
            || lowered.Contains("nba")
            || lowered.Contains("football")
            || lowered.Contains("celebrity");
    }

    private string BuildContext(StudentProfileDto? student, IReadOnlyList<StudentDocumentRequestDto> recentRequests, IReadOnlyList<FaqContextEntryDto> faqMatches, IReadOnlyList<ChatResponseDto> recentConversation, string message, bool isGuest)
    {
        var builder = new StringBuilder();
        builder.AppendLine("You are Hari, a registrar helpdesk assistant.");
        builder.AppendLine("You must protect student privacy. Never reveal another student's records, requests, or identifiers.");
        builder.AppendLine("Use only known registrar policies and supplied context. If uncertain, say what is missing and suggest the correct office.");
        builder.AppendLine("If the question is out of scope, briefly redirect the student to the correct office.");
        if (isGuest)
        {
            builder.AppendLine("Guest mode is active: only provide general registrar guidance and published policies. Do not infer student-specific statuses.");
        }
        builder.AppendLine();

        if (student is not null)
        {
            builder.AppendLine($"Student: {student.FullName} ({student.StudentNo}), College={student.CollegeCode}, Program={student.ProgramCode}, Email={student.Email}");
        }

        if (recentRequests.Count > 0)
        {
            builder.AppendLine("Recent requests:");
            foreach (var request in recentRequests.Take(5))
            {
                builder.AppendLine($"- {request.RequestCode} | {request.DocumentType} | {request.Status} | Dept {request.DepartmentId} | Updated {request.UpdatedAt:yyyy-MM-dd HH:mm}");
            }
        }

        if (faqMatches.Count > 0)
        {
            builder.AppendLine("Relevant FAQ/context:");
            foreach (var faq in faqMatches)
            {
                builder.AppendLine($"- [{faq.Id}] {CompressText(faq.Title, 140)}: {CompressText(faq.Answer, Math.Max(120, _options.MaxFaqCharsPerEntry))}");
            }
        }

        if (recentConversation.Count > 0)
        {
            builder.AppendLine("Conversation digest (complete, compressed, oldest to newest):");
            var turnIndex = 1;
            foreach (var turn in recentConversation)
            {
                builder.AppendLine($"{turnIndex}. {NormalizeRole(turn.Role)}: {CompressText(turn.Content, Math.Max(80, _options.MaxHistoryCharsPerTurn))}");
                turnIndex++;
            }

            builder.AppendLine("Latest conversation turns (verbatim):");
            foreach (var turn in recentConversation.TakeLast(Math.Max(1, _options.MaxHistoryTurns)))
            {
                builder.AppendLine($"- {NormalizeRole(turn.Role)}: {turn.Content}");
            }
        }

        builder.AppendLine();
        builder.AppendLine("User message:");
        builder.AppendLine(message);
        return builder.ToString();
    }

    private static string NormalizeRole(string? role)
    {
        return string.Equals(role, "user", StringComparison.OrdinalIgnoreCase)
            ? "user"
            : "assistant";
    }

    private static string CompressText(string? text, int maxChars)
    {
        if (string.IsNullOrWhiteSpace(text))
        {
            return string.Empty;
        }

        var compact = string.Join(' ', text.Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries));
        if (compact.Length <= maxChars)
        {
            return compact;
        }

        return compact[..Math.Max(1, maxChars)].TrimEnd() + "...";
    }

    private static double EstimateConfidence(string routing, int faqMatches, int recentRequests)
    {
        var baseScore = routing switch
        {
            "faq+gemini" => 0.84,
            "helpdesk" => 0.7,
            "redirect" => 0.58,
            _ => 0.66
        };

        if (faqMatches > 0)
        {
            baseScore += 0.04;
        }

        if (recentRequests > 0)
        {
            baseScore += 0.03;
        }

        return Math.Clamp(baseScore, 0.35, 0.95);
    }

}
