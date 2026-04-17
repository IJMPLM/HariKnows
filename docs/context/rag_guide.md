# RAG Guide: Prompt Role Tag Schema

This guide defines the enforced FAQ/context schema used by HariKnows RAG prompt construction.

## 1) Source Of Truth

Prompt content is assembled from the FAQ/context table and CSV imports only. Prompt section text must not be hardcoded in service logic except emergency fallbacks when required tag entries are missing.

## 2) Enforced CSV Schema

All FAQ/context imports must use this exact header order:

promptRoleTag,category,title,answer

Required fields:
- promptRoleTag
- category
- title
- answer

The parser accepts answer/context/content as answer aliases, but promptRoleTag/category/title are mandatory.

## 3) Prompt Role Tags

Allowed values:
- assistant-identity
- guidance-header
- context-unavailable
- guest-mode-tag
- auth-status-guest
- auth-status-signed-in
- redirect-reply-guest
- redirect-reply-signed-in
- redirect-note-guest
- redirect-note-signed-in
- response-guardrail
- context-general
	- context-student
- faq-general
	- faq-student
- other

Tag semantics:
	- faq-general and faq-student are for retrieval/citation FAQ entries
	- context-general and context-student are standard guidance entries
- assistant and redirect tags are single-section templates used directly in prompt assembly
- response-guardrail rows are appended under Response behavior
- other is for custom categorization labels (category remains editor-defined)

## 4) Prompt Assembly Order

RagAssistantService builds prompt text in this order:
1. assistant-identity
2. guidance-header
	3. context-general plus context-student entries (signed-in only for context-student)
4. guest-mode-tag (guest only)
5. student profile (signed-in only)
6. student status block (signed-in only)
7. grade/curriculum/syllabus snapshot (signed-in only)
8. recent requests
9. relevant FAQ matches
10. conversation digest
11. latest conversation turns
12. response-guardrail entries (or hardcoded minimal fallback lines)
13. user message

## 5) Registrar UI Rules

In registrar FAQ/context management:
- Prompt role tag is a dropdown (no free-text scope entry)
- For context entries, category is editable only when promptRoleTag = other
- For all non-other context tags, category is auto-derived label
- programCode is removed from bot FAQ/context authoring
- Prompt role tag is shown prominently in listing cards

## 6) Gemini API Payload Shape

Gemini requests are assembled as a contents list:
- Recent history turns (bounded by GeminiApi:MaxHistoryItems)
- Final user entry containing the fully assembled RAG prompt string

The debug endpoint POST /api/chat/debug/raw-prompt writes:
- docs/context/complete_raw_prompt.txt with exact raw prompt string
- JSON payload preview with ordered role/text entries and model candidates

## 7) Validation Policy

Create/update/import operations reject entries when:
- promptRoleTag is missing
- promptRoleTag is not in the allowed tag list
- category/title/answer is empty

Legacy scope labels (general/non-guest/global) are no longer accepted for FAQ/context prompt entries.
Legacy import mapping: non-guest, non_guest, nonguest, and student all normalize to context-student or faq-student.
