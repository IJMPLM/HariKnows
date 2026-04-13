using System.Text;
using HariKnowsBackend.Data;
using HariKnowsBackend.Data.Entities;
using GeminiChatbot.Models;
using GeminiChatbot.Services;
using HariKnowsBackend.Models;
using HariKnowsBackend.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace HariKnowsBackend.Services;

public sealed class RagAssistantOptions
{
    public int MaxHistoryTurns { get; set; } = 8;
    public int MaxHistoryCharsPerTurn { get; set; } = 220;
    public int MaxFaqCharsPerEntry { get; set; } = 360;
    public double UncertainConfidenceThreshold { get; set; } = 0.66;
    public int UncertainDedupMinutes { get; set; } = 20;
}

public sealed class RagAssistantService(
    IRegistrarRepository registrarRepository,
    IGeminiService geminiService,
    IAuthService authService,
    HariKnowsDbContext dbContext,
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
        var gradeSnapshot = isGuest ? new StudentGradeSnapshotDto(0, 0, null) : registrarRepository.GetStudentGradeSnapshot(studentNo!);
        var curriculumCount = isGuest || student is null ? 0 : registrarRepository.GetCurriculumCourseCount(student.CollegeCode, student.ProgramCode);
        var curriculumPreview = isGuest || student is null
            ? Array.Empty<CurriculumCourseSnapshotDto>()
            : registrarRepository.GetCurriculumCourses(student.CollegeCode, student.ProgramCode, 18);
        var syllabusCount = isGuest || student is null ? 0 : registrarRepository.GetSyllabusEntryCount(student.CollegeCode, student.ProgramCode);
        var syllabusPreview = isGuest || student is null
            ? Array.Empty<SyllabusEntrySnapshotDto>()
            : registrarRepository.GetSyllabusEntries(student.CollegeCode, student.ProgramCode, 18);
        var recentRequests = isGuest
            ? Array.Empty<StudentDocumentRequestDto>()
            : registrarRepository.GetStudentRequests(studentNo, null, 10);
        var faqScopeType = isGuest ? "general" : null;
        var includeUnpublished = !isGuest;
        var contextEntries = registrarRepository.GetFaqEntries(faqScopeType, student?.CollegeCode, student?.ProgramCode, includeUnpublished, 120);
        var faqMatches = registrarRepository.SearchFaqEntries(message, faqScopeType, student?.CollegeCode, student?.ProgramCode, includeUnpublished, 6);

        var routing = DetermineRouting(message, faqMatches, recentRequests);
        var citations = faqMatches
            .Select(entry => new RagCitationDto(
                entry.Id,
                entry.Title,
                $"/FAQs?faqId={entry.Id}",
                entry.ScopeType,
                entry.Category
            ))
            .ToList();

        var hasKnowledgeMatch = faqMatches.Count > 0;

        async Task<RagResponseDto> FinalizeResponseAsync(RagResponseDto response)
        {
            var linkedReply = AddInlineFaqLink(response.Reply, citations);
            var finalResponse = response with { Reply = linkedReply };

            if (ShouldCaptureUncertainQuestion(message, finalResponse.Confidence, hasKnowledgeMatch))
            {
                await CaptureUncertainQuestionAsync(studentNo, student, conversationId, message, finalResponse.Routing, finalResponse.Confidence, cancellationToken);
                finalResponse = finalResponse with { UncertainQuestion = message.Trim() };
            }

            return finalResponse;
        }

        if (faqMatches.Count > 0 && IsStrongFaqMatch(message, faqMatches[0].Title))
        {
            var topMatch = faqMatches[0];
            return await FinalizeResponseAsync(new RagResponseDto(
                topMatch.Answer,
                "faq",
                "faq",
                0.95,
                citations,
                null,
                null
            ));
        }

        if (IsAuthStatusQuestion(message))
        {
            var authReplyTemplate = isGuest
                ? ResolveTemplate(contextEntries, AuthStatusGuestReplyTitle, "You are currently using Hari in guest mode and are not signed in. Sign in to access account-specific request status and personalized records.")
                : ResolveTemplate(contextEntries, AuthStatusSignedInReplyTitle, "Yes, you are signed in as {fullName} ({studentNo}).");

            var authReply = RenderTemplate(authReplyTemplate, student?.FullName ?? "your account", studentNo ?? string.Empty);

            return await FinalizeResponseAsync(new RagResponseDto(
                authReply,
                "gemini",
                "helpdesk",
                0.9,
                citations,
                null,
                null
            ));
        }

        if (IsGradeDataAvailabilityQuestion(message))
        {
            if (isGuest)
            {
                return await FinalizeResponseAsync(new RagResponseDto(
                    "In guest mode, I cannot access student-specific grade records. Sign in with your student account so I can verify whether your grade records are on file.",
                    "gemini",
                    "helpdesk",
                    0.92,
                    citations,
                    null,
                    null
                ));
            }

            if (gradeSnapshot.TotalGradeRecords > 0)
            {
                var updatedText = gradeSnapshot.LastUpdatedUtc is DateTime lastUpdated
                    ? $" Last grade-record update: {lastUpdated:yyyy-MM-dd HH:mm} UTC."
                    : string.Empty;

                return await FinalizeResponseAsync(new RagResponseDto(
                    $"Yes. I can see your grade records in HariKnows ({gradeSnapshot.TotalGradeRecords} records across {gradeSnapshot.DistinctCourses} courses). I can use these records for eligibility and registrar guidance.{updatedText} I will not reveal private per-subject grade details unless policy explicitly allows it.",
                    "gemini",
                    "helpdesk",
                    0.96,
                    citations,
                    null,
                    null
                ));
            }

            return await FinalizeResponseAsync(new RagResponseDto(
                "I checked your signed-in record, but I currently do not see grade records linked to your student number in HariKnows. This usually means grades have not been imported yet or were not matched during ETL.",
                "gemini",
                "helpdesk",
                0.9,
                citations,
                null,
                null
            ));
        }

        if (IsGradeDisclosureQuestion(message))
        {
            if (isGuest)
            {
                return await FinalizeResponseAsync(new RagResponseDto(
                    "In guest mode, I cannot access student-specific grade records. Sign in with your student account so I can verify your grade-record availability.",
                    "gemini",
                    "helpdesk",
                    0.92,
                    citations,
                    null,
                    null
                ));
            }

            if (gradeSnapshot.TotalGradeRecords <= 0)
            {
                return await FinalizeResponseAsync(new RagResponseDto(
                    "I checked your signed-in account and do not currently see grade records linked to your student number in HariKnows. This usually means grades were not imported yet or were not matched during ETL.",
                    "gemini",
                    "helpdesk",
                    0.9,
                    citations,
                    null,
                    null
                ));
            }

            var updatedText = gradeSnapshot.LastUpdatedUtc is DateTime lastUpdated
                ? $" Most recent grade-record update: {lastUpdated:yyyy-MM-dd HH:mm} UTC."
                : string.Empty;

            return await FinalizeResponseAsync(new RagResponseDto(
                $"I can confirm that your signed-in account has grade records on file ({gradeSnapshot.TotalGradeRecords} records across {gradeSnapshot.DistinctCourses} courses).{updatedText} For privacy and policy compliance, I do not display exact grade values in chat. These records are used internally to validate eligibility for registrar document requests and related services.",
                "gemini",
                "helpdesk",
                0.96,
                citations,
                null,
                null
            ));
        }

        if (IsCurriculumQuestion(message))
        {
            if (isGuest)
            {
                return await FinalizeResponseAsync(new RagResponseDto(
                    "In guest mode, I cannot verify your program-specific curriculum. Sign in so I can check the curriculum records linked to your account.",
                    "gemini",
                    "helpdesk",
                    0.92,
                    citations,
                    null,
                    null
                ));
            }

            if (curriculumCount == 0)
            {
                return await FinalizeResponseAsync(new RagResponseDto(
                    $"I checked your signed-in program ({student?.ProgramCode}), but I do not see curriculum entries loaded yet for {student?.CollegeCode}/{student?.ProgramCode} in HariKnows.",
                    "gemini",
                    "helpdesk",
                    0.9,
                    citations,
                    null,
                    null
                ));
            }

            var lines = curriculumPreview
                .Take(12)
                .Select(c => $"- Year {c.Level}, Term {c.Term}: {c.Code} ({c.Units:0.##}u) - {c.Title}")
                .ToList();

            var reply = new StringBuilder();
            reply.AppendLine($"Yes, I can access your program curriculum in HariKnows for {student?.ProgramCode} ({student?.CollegeCode}).");
            reply.AppendLine($"Total curriculum entries on file: {curriculumCount}.");
            reply.AppendLine("Curriculum preview:");
            foreach (var line in lines)
            {
                reply.AppendLine(line);
            }

            if (curriculumCount > lines.Count)
            {
                reply.AppendLine($"- ...and {curriculumCount - lines.Count} more entries.");
            }

            return await FinalizeResponseAsync(new RagResponseDto(reply.ToString().Trim(), "gemini", "helpdesk", 0.95, citations, null, null));
        }

        if (IsSyllabusQuestion(message))
        {
            if (isGuest)
            {
                return await FinalizeResponseAsync(new RagResponseDto(
                    "In guest mode, I cannot verify your program-specific syllabus entries. Sign in so I can check syllabus records linked to your account.",
                    "gemini",
                    "helpdesk",
                    0.92,
                    citations,
                    null,
                    null
                ));
            }

            if (syllabusCount == 0)
            {
                return await FinalizeResponseAsync(new RagResponseDto(
                    $"I checked your signed-in program ({student?.ProgramCode}), but I do not see syllabus entries loaded yet for {student?.CollegeCode}/{student?.ProgramCode} in HariKnows.",
                    "gemini",
                    "helpdesk",
                    0.9,
                    citations,
                    null,
                    null
                ));
            }

            var lines = syllabusPreview
                .Take(12)
                .Select(s => $"- {s.Code}: {s.Title}")
                .ToList();

            var reply = new StringBuilder();
            reply.AppendLine($"Yes, I can access syllabus entries in HariKnows for {student?.ProgramCode} ({student?.CollegeCode}).");
            reply.AppendLine($"Total syllabus entries on file: {syllabusCount}.");
            reply.AppendLine("Syllabus preview:");
            foreach (var line in lines)
            {
                reply.AppendLine(line);
            }

            if (syllabusCount > lines.Count)
            {
                reply.AppendLine($"- ...and {syllabusCount - lines.Count} more entries.");
            }

            return await FinalizeResponseAsync(new RagResponseDto(reply.ToString().Trim(), "gemini", "helpdesk", 0.95, citations, null, null));
        }

        if (string.Equals(routing, "redirect", StringComparison.OrdinalIgnoreCase) && faqMatches.Count == 0)
        {
            var redirectReplyTemplate = isGuest
                ? ResolveTemplate(contextEntries, RedirectReplyGuestTitle, "I can help with general registrar FAQs and published policies. For account-specific concerns, please sign in or contact the registrar office.")
                : ResolveTemplate(contextEntries, RedirectReplySignedInTitle, "I can help with registrar document requests, student records, and published FAQ/context topics. For this question, please contact the appropriate office directly.");
            var redirectNote = isGuest
                ? ResolveTemplate(contextEntries, RedirectNoteGuestTitle, "Guest mode provides general guidance only.")
                : ResolveTemplate(contextEntries, RedirectNoteSignedInTitle, "Question appears out of scope for the helpdesk knowledge base.");

            return await FinalizeResponseAsync(new RagResponseDto(
                RenderTemplate(redirectReplyTemplate, student?.FullName ?? "your account", studentNo ?? string.Empty),
                "gemini",
                routing,
                0.58,
                citations,
                "registrar",
                RenderTemplate(redirectNote, student?.FullName ?? "your account", studentNo ?? string.Empty)
            ));
        }

        var context = BuildContext(student, studentStatus, gradeSnapshot, curriculumCount, syllabusCount, recentRequests, faqMatches, contextEntries, conversationHistory, message, isGuest);
        var geminiReply = await geminiService.GetChatResponseAsync(context, conversationHistory);
        var resolvedRouting = routing == "faq" ? "faq+gemini" : routing;
        var confidence = EstimateConfidence(resolvedRouting, faqMatches.Count, recentRequests.Count);

        return await FinalizeResponseAsync(new RagResponseDto(geminiReply, "gemini", resolvedRouting, confidence, citations, null, null));
    }

    private bool ShouldCaptureUncertainQuestion(string message, double confidence, bool hasKnowledgeMatch)
    {
        if (!IsKnowledgeExpansionCandidate(message))
        {
            return false;
        }

        return confidence < _options.UncertainConfidenceThreshold || !hasKnowledgeMatch;
    }

    private static bool IsKnowledgeExpansionCandidate(string message)
    {
        var lowered = message.Trim().ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(lowered) || lowered.Length < 6)
        {
            return false;
        }

        if (lowered is "hi" or "hello" or "hey" or "thanks" or "thank you")
        {
            return false;
        }

        if (IsAuthStatusQuestion(lowered))
        {
            return false;
        }

        return lowered.Contains('?')
            || lowered.Contains("how")
            || lowered.Contains("what")
            || lowered.Contains("when")
            || lowered.Contains("where")
            || lowered.Contains("can i")
            || lowered.Contains("should i");
    }

    private async Task CaptureUncertainQuestionAsync(string? studentNo, StudentProfileDto? student, string conversationId, string message, string routing, double confidence, CancellationToken cancellationToken)
    {
        var normalized = NormalizeQuestion(message);
        var now = DateTime.UtcNow;
        var dedupWindowStart = now.AddMinutes(-Math.Max(1, _options.UncertainDedupMinutes));

        var exists = await dbContext.UncertainQuestions
            .AnyAsync(entry =>
                entry.Status.ToLower() == "open"
                && entry.NormalizedQuestion == normalized
                && entry.ConversationId == conversationId
                && entry.CreatedAt >= dedupWindowStart,
                cancellationToken);

        if (exists)
        {
            return;
        }

        dbContext.UncertainQuestions.Add(new UncertainQuestion
        {
            ConversationId = conversationId,
            StudentNo = studentNo ?? string.Empty,
            CollegeCode = student?.CollegeCode ?? string.Empty,
            ProgramCode = student?.ProgramCode ?? string.Empty,
            QuestionText = message.Trim(),
            NormalizedQuestion = normalized,
            Routing = routing,
            Confidence = confidence,
            Status = "open",
            CreatedAt = now,
            UpdatedAt = now
        });

        await dbContext.SaveChangesAsync(cancellationToken);
    }

    private static string NormalizeQuestion(string message)
    {
        var compact = string.Join(' ', message
            .Trim()
            .ToLowerInvariant()
            .Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries));
        return compact;
    }

    private static string AddInlineFaqLink(string reply, IReadOnlyList<RagCitationDto> citations)
    {
        if (citations.Count == 0)
        {
            return reply;
        }

        var topCitation = citations[0];
        if (string.IsNullOrWhiteSpace(topCitation.Url) || reply.Contains(topCitation.Url, StringComparison.OrdinalIgnoreCase))
        {
            return reply;
        }

        return $"{reply.Trim()}\n\nSee related FAQ: [{topCitation.Title}]({topCitation.Url}).";
    }

    private static bool IsStrongFaqMatch(string message, string faqTitle)
    {
        var messageTokens = Tokenize(message);
        var titleTokens = Tokenize(faqTitle);
        if (messageTokens.Count == 0 || titleTokens.Count == 0)
        {
            return false;
        }

        var overlap = titleTokens.Count(token => messageTokens.Contains(token));
        var ratio = (double)overlap / titleTokens.Count;
        return ratio >= 0.55;
    }

    private static HashSet<string> Tokenize(string text)
    {
        return text
            .ToLowerInvariant()
            .Split([' ', '\t', '\r', '\n', ',', '.', '?', '!', ':', ';', '(', ')', '[', ']', '{', '}', '-', '_', '/'], StringSplitOptions.RemoveEmptyEntries)
            .Where(token => token.Length > 2)
            .ToHashSet();
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

    private static bool IsGradeDataAvailabilityQuestion(string message)
    {
        var lowered = message.ToLowerInvariant();
        return (lowered.Contains("record") || lowered.Contains("records") || lowered.Contains("have") || lowered.Contains("access"))
               && lowered.Contains("grade");
    }

    private static bool IsCurriculumQuestion(string message)
    {
        var lowered = message.ToLowerInvariant();
        return lowered.Contains("curriculum")
               || lowered.Contains("prospectus")
               || lowered.Contains("program checklist")
               || lowered.Contains("curriculum checklist");
    }

    private static bool IsSyllabusQuestion(string message)
    {
        var lowered = message.ToLowerInvariant();
        return lowered.Contains("syllabus") || lowered.Contains("course description");
    }

    private static bool IsGradeDisclosureQuestion(string message)
    {
        var lowered = message.ToLowerInvariant();
        var asksForGradeDetails = lowered.Contains("what are my grades")
            || lowered.Contains("show my grades")
            || lowered.Contains("my grades")
            || lowered.Contains("exact grade")
            || lowered.Contains("grade breakdown")
            || lowered.Contains("most recent term");

        return asksForGradeDetails && lowered.Contains("grade");
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

    private string BuildContext(StudentProfileDto? student, StudentStatusDto? studentStatus, StudentGradeSnapshotDto gradeSnapshot, int curriculumCount, int syllabusCount, IReadOnlyList<StudentDocumentRequestDto> recentRequests, IReadOnlyList<FaqContextEntryDto> faqMatches, IReadOnlyList<FaqContextEntryDto> contextEntries, IReadOnlyList<ChatResponseDto> recentConversation, string message, bool isGuest)
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

        if (!isGuest)
        {
            var gradeUpdatedText = gradeSnapshot.LastUpdatedUtc is DateTime updatedAt
                ? updatedAt.ToString("yyyy-MM-dd HH:mm") + " UTC"
                : "N/A";
            builder.AppendLine("Grade Records Snapshot:");
            builder.AppendLine($"- Total grade records: {gradeSnapshot.TotalGradeRecords}");
            builder.AppendLine($"- Distinct courses with recorded grades: {gradeSnapshot.DistinctCourses}");
            builder.AppendLine($"- Last grade update: {gradeUpdatedText}");
            builder.AppendLine("- If grade record count is above zero, do not claim that grade records are unavailable.");
            builder.AppendLine("- Never reveal exact numeric grades in chat; use grade records only for eligibility/requirement validation guidance.");

            builder.AppendLine("Academic Catalog Snapshot:");
            builder.AppendLine($"- Curriculum entries for signed-in program: {curriculumCount}");
            builder.AppendLine($"- Syllabus entries for signed-in program: {syllabusCount}");
            builder.AppendLine("- If curriculum/syllabus counts are above zero, do not claim there is no access to curriculum or syllabus data.");
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

        builder.AppendLine("Response behavior:");
        builder.AppendLine("- If a specific FAQ is relevant, prefer a concise answer and include one clear FAQ reference link.");
        builder.AppendLine("- Do not mention internal uncertainty logging, triage queues, or hidden metadata in user-visible responses.");

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
            "critical" => -1,
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
