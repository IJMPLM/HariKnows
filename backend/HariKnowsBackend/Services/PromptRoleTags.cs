using System;
using System.Linq;

namespace HariKnowsBackend.Services;

public static class PromptRoleTags
{
    public const string AssistantIdentity = "assistant-identity";
    public const string GuidanceHeader = "guidance-header";
    public const string ContextUnavailable = "context-unavailable";
    public const string GuestModeTag = "guest-mode-tag";
    public const string AuthStatusGuest = "auth-status-guest";
    public const string AuthStatusSignedIn = "auth-status-signed-in";
    public const string RedirectReplyGuest = "redirect-reply-guest";
    public const string RedirectReplySignedIn = "redirect-reply-signed-in";
    public const string RedirectNoteGuest = "redirect-note-guest";
    public const string RedirectNoteSignedIn = "redirect-note-signed-in";
    public const string ResponseGuardrail = "response-guardrail";
    public const string ContextGeneral = "context-general";
    public const string ContextStudent = "context-student";
    public const string FaqGeneral = "faq-general";
    public const string FaqStudent = "faq-student";
    public const string Other = "other";

    public static readonly string[] All =
    [
        AssistantIdentity,
        GuidanceHeader,
        ContextUnavailable,
        GuestModeTag,
        AuthStatusGuest,
        AuthStatusSignedIn,
        RedirectReplyGuest,
        RedirectReplySignedIn,
        RedirectNoteGuest,
        RedirectNoteSignedIn,
        ResponseGuardrail,
        ContextGeneral,
        ContextStudent,
        FaqGeneral,
        FaqStudent,
        Other
    ];

    public static string Normalize(string raw)
    {
        var normalized = raw.Trim().ToLowerInvariant();
        return normalized;
    }

    public static bool IsValid(string raw)
    {
        var normalized = Normalize(raw);
        return All.Contains(normalized, StringComparer.Ordinal);
    }

    public static bool IsFaq(string tag)
    {
        var normalized = Normalize(tag);
        return normalized is FaqGeneral or FaqStudent;
    }

    public static bool IsGuidance(string tag)
    {
        var normalized = Normalize(tag);
        return normalized is ContextGeneral or ContextStudent or Other;
    }

    public static bool IsGuestVisible(string tag)
    {
        var normalized = Normalize(tag);
        return normalized is not FaqStudent and not ContextStudent;
    }
}
