namespace HariKnowsBackend.Services;

public static class PromptRoleTagCategoryMapper
{
    public static string DeriveCategory(string promptRoleTag, string? currentCategory = null)
    {
        var normalizedTag = PromptRoleTags.Normalize(promptRoleTag);
        var normalizedCategory = currentCategory?.Trim().ToLowerInvariant() ?? string.Empty;

        return normalizedTag switch
        {
            PromptRoleTags.AssistantIdentity
            or PromptRoleTags.GuidanceHeader
            or PromptRoleTags.ContextUnavailable
            or PromptRoleTags.GuestModeTag
            or PromptRoleTags.AuthStatusGuest
            or PromptRoleTags.AuthStatusSignedIn
            or PromptRoleTags.RedirectReplyGuest
            or PromptRoleTags.RedirectReplySignedIn
            or PromptRoleTags.RedirectNoteGuest
            or PromptRoleTags.RedirectNoteSignedIn => "assistant",

            PromptRoleTags.ResponseGuardrail => "guardrail",

            PromptRoleTags.ContextGeneral
            or PromptRoleTags.ContextStudent => "context",

            PromptRoleTags.FaqGeneral
            or PromptRoleTags.FaqStudent => "faq",

            PromptRoleTags.Other => string.IsNullOrWhiteSpace(normalizedCategory) ? "context" : normalizedCategory,
            _ => string.IsNullOrWhiteSpace(normalizedCategory) ? "context" : normalizedCategory
        };
    }
}