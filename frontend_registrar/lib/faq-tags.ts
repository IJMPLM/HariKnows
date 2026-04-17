export type FaqSection = "faq" | "context";

export const FAQ_TAG_OPTIONS = ["faq-general", "faq-student"];

export const CONTEXT_TAG_OPTIONS = [
  "context-general",
  "context-student",
  "assistant-identity",
  "response-guardrail",
  "other",
];

export function normalizePromptRoleTag(tag: string) {
  return tag.trim().toLowerCase();
}

export function isFaqTag(tag: string) {
  const normalized = normalizePromptRoleTag(tag);
  return normalized === "faq-general" || normalized === "faq-student";
}

export function isGuestVisibleScopeTag(tag: string) {
  const normalized = normalizePromptRoleTag(tag);
  return normalized !== "faq-student" && normalized !== "context-student";
}

export function getTagOptions(section: FaqSection) {
  return section === "faq" ? FAQ_TAG_OPTIONS : CONTEXT_TAG_OPTIONS;
}

export function deriveCategoryFromTag(tag: string, currentCategory = "context") {
  const normalized = normalizePromptRoleTag(tag);
  const normalizedCategory = currentCategory.trim().toLowerCase();

  switch (normalized) {
    case "assistant-identity":
    case "guidance-header":
    case "context-unavailable":
    case "guest-mode-tag":
    case "auth-status-guest":
    case "auth-status-signed-in":
    case "redirect-reply-guest":
    case "redirect-reply-signed-in":
    case "redirect-note-guest":
    case "redirect-note-signed-in":
      return "assistant";
    case "response-guardrail":
      return "guardrail";
    case "context-general":
    case "context-student":
      return "context";
    case "faq-general":
    case "faq-student":
      return "faq";
    case "other":
      return normalizedCategory || "context";
    default:
      return normalizedCategory || "context";
  }
}
