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
    private const string AssistantIdentityTitle = "Assistant Identity";
    private const string ContextGuidanceHeaderTitle = "Context Guidance Header";
    private const string ContextUnavailableTitle = "Context Unavailable Fallback";
    private const string GuestModeTagTitle = "Guest Mode Tag";
    private const string AuthStatusGuestReplyTitle = "Auth Status Reply (Guest)";
    private const string AuthStatusSignedInReplyTitle = "Auth Status Reply (Signed In)";
    private const string RedirectReplyGuestTitle = "Redirect Reply (Guest)";
    private const string RedirectReplySignedInTitle = "Redirect Reply (Signed In)";
    private const string RedirectNoteGuestTitle = "Redirect Note (Guest)";
    private const string RedirectNoteSignedInTitle = "Redirect Note (Signed In)";

    private readonly RagAssistantOptions _options = optionsAccessor.Value;

    public async Task<RagResponseDto> AnswerAsync(string? studentNo, string conversationId, string message, IReadOnlyList<ChatResponseDto> conversationHistory, CancellationToken cancellationToken)
    {
        var isGuest = string.IsNullOrWhiteSpace(studentNo);
        var student = isGuest ? null : await authService.GetProfileAsync(studentNo!, cancellationToken);
        var studentStatus = isGuest ? null : registrarRepository.GetStudentStatus(studentNo!);
        var recentRequests = isGuest
            ? Array.Empty<StudentDocumentRequestDto>()
            : registrarRepository.GetStudentRequests(studentNo, null, 10);
        var faqScopeType = isGuest ? "general" : null;
        var contextEntries = registrarRepository.GetFaqEntries(faqScopeType, student?.CollegeCode, student?.ProgramCode, false, 120);
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
            var authReplyTemplate = isGuest
                ? ResolveTemplate(contextEntries, AuthStatusGuestReplyTitle, "You are currently using Hari in guest mode and are not signed in. Sign in to access account-specific request status and personalized records.")
                : ResolveTemplate(contextEntries, AuthStatusSignedInReplyTitle, "Yes, you are signed in as {fullName} ({studentNo}).");

            var authReply = RenderTemplate(authReplyTemplate, student?.FullName ?? "your account", studentNo ?? string.Empty);

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
            var redirectReplyTemplate = isGuest
                ? ResolveTemplate(contextEntries, RedirectReplyGuestTitle, "I can help with general registrar FAQs and published policies. For account-specific concerns, please sign in or contact the registrar office.")
                : ResolveTemplate(contextEntries, RedirectReplySignedInTitle, "I can help with registrar document requests, student records, and published FAQ/context topics. For this question, please contact the appropriate office directly.");
            var redirectNote = isGuest
                ? ResolveTemplate(contextEntries, RedirectNoteGuestTitle, "Guest mode provides general guidance only.")
                : ResolveTemplate(contextEntries, RedirectNoteSignedInTitle, "Question appears out of scope for the helpdesk knowledge base.");

            return new RagResponseDto(
                RenderTemplate(redirectReplyTemplate, student?.FullName ?? "your account", studentNo ?? string.Empty),
                "gemini",
                routing,
                0.58,
                citations,
                "registrar",
                RenderTemplate(redirectNote, student?.FullName ?? "your account", studentNo ?? string.Empty)
            );
        }

        var context = BuildContext(student, studentStatus, recentRequests, faqMatches, contextEntries, conversationHistory, message, isGuest);
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

    private string BuildContext(StudentProfileDto? student, StudentStatusDto? studentStatus, IReadOnlyList<StudentDocumentRequestDto> recentRequests, IReadOnlyList<FaqContextEntryDto> faqMatches, IReadOnlyList<FaqContextEntryDto> contextEntries, IReadOnlyList<ChatResponseDto> recentConversation, string message, bool isGuest)
    {
        var builder = new StringBuilder();
        var guidanceHeader = ResolveTemplate(contextEntries, ContextGuidanceHeaderTitle, "Registrar knowledge base guidance:");
        var noGuidanceFallback = ResolveTemplate(contextEntries, ContextUnavailableTitle, "Registrar knowledge base guidance is unavailable. Use only verified student/request data and clearly state uncertainties.");
        var guestModeTag = ResolveTemplate(contextEntries, GuestModeTagTitle, "Mode: guest");
        var assistantIdentity = ResolveTemplate(contextEntries, AssistantIdentityTitle, string.Empty);

        var guidanceEntries = contextEntries
            .Where(entry => !string.Equals(entry.Category, "faq", StringComparison.OrdinalIgnoreCase))
            .OrderBy(entry => GetGuidancePriority(entry.Category))
            .ThenBy(entry => entry.Title)
            .Take(20)
            .ToList();

        if (guidanceEntries.Count > 0)
        {
            if (!string.IsNullOrWhiteSpace(assistantIdentity))
            {
                builder.AppendLine(RenderTemplate(assistantIdentity, student?.FullName ?? "your account", student?.StudentNo ?? string.Empty));
            }

            builder.AppendLine(guidanceHeader);
            foreach (var entry in guidanceEntries)
            {
                builder.AppendLine($"- [{entry.ScopeType}/{entry.Category}] {CompressText(entry.Title, 120)}: {CompressText(entry.Answer, Math.Max(180, _options.MaxFaqCharsPerEntry))}");
            }
        }
        else
        {
            if (!string.IsNullOrWhiteSpace(assistantIdentity))
            {
                builder.AppendLine(RenderTemplate(assistantIdentity, student?.FullName ?? "your account", student?.StudentNo ?? string.Empty));
            }

            builder.AppendLine(noGuidanceFallback);
        }

        if (isGuest)
        {
            builder.AppendLine(guestModeTag);
        }

        builder.AppendLine();

        if (student is not null)
        {
            builder.AppendLine($"Student: {student.FullName} ({student.StudentNo}), College={student.CollegeCode}, Program={student.ProgramCode}, Email={student.Email}");
        }

        if (studentStatus is not null)
        {
            builder.AppendLine("Student Status Record:");
            builder.AppendLine($"- Current Year: {studentStatus.CurrentYear}");
            builder.AppendLine($"- Enrollment Status: {studentStatus.EnrollmentStatus}");
            builder.AppendLine($"- Good Moral Status: {studentStatus.GoodMoralStatus}");
            builder.AppendLine($"- NSTP Status: {studentStatus.NstpStatus}");
            builder.AppendLine($"- Birth Certificate Status: {studentStatus.BirthCertStatus}");
            builder.AppendLine($"- Form 137 Status: {studentStatus.Form137Status}");
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

    private static int GetGuidancePriority(string category)
    {
        return category.ToLowerInvariant() switch
        {
            "assistant" => 0,
            "overview" => 0,
            "scope" => 1,
            "policy" => 2,
            "services" => 3,
            "requirements" => 4,
            "document" => 5,
            "privacy" => 6,
            _ => 10
        };
    }

    private static string ResolveTemplate(IReadOnlyList<FaqContextEntryDto> contextEntries, string title, string fallback)
    {
        var template = contextEntries
            .FirstOrDefault(entry =>
                string.Equals(entry.Title, title, StringComparison.OrdinalIgnoreCase)
                && string.Equals(entry.Category, "assistant", StringComparison.OrdinalIgnoreCase))
            ?.Answer;

        return string.IsNullOrWhiteSpace(template) ? fallback : template;
    }

    private static string RenderTemplate(string template, string fullName, string studentNo)
    {
        return template
            .Replace("{fullName}", string.IsNullOrWhiteSpace(fullName) ? "your account" : fullName, StringComparison.OrdinalIgnoreCase)
            .Replace("{studentNo}", string.IsNullOrWhiteSpace(studentNo) ? "N/A" : studentNo, StringComparison.OrdinalIgnoreCase);
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
