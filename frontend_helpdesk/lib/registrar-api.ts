import { authFetch } from "./auth-client";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5240";

export type StudentDocumentRequest = {
  id: number;
  requestCode: string;
  studentNo: string;
  studentName: string;
  documentType: string;
  departmentId: number;
  status: string;
  requestedAt: string;
  preparedAt?: string | null;
  claimedAt?: string | null;
  disposedAt?: string | null;
  disposedReason: string;
  handledBy: string;
  notes: string;
  updatedAt: string;
};

export type FaqContextEntry = {
  id: number;
  scopeType: string;
  collegeCode: string;
  programCode: string;
  category: string;
  title: string;
  answer: string;
  isGuestVisible: boolean;
  createdAt: string;
  updatedAt: string;
};

export type UncertainQuestion = {
  id: number;
  sourceAssistantMessageId?: number | null;
  conversationId: string;
  studentNo: string;
  collegeCode: string;
  programCode: string;
  questionText: string;
  routing: string;
  confidence: number;
  status: string;
  resolutionCategory: string;
  resolutionEntryId?: number | null;
  resolutionAnswer?: string | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string | null;
};

function normalizeScope(scopeType: string) {
  const normalized = scopeType.trim().toLowerCase();
  if (normalized === "global") return "general";
  if (normalized === "non_guest" || normalized === "nonguest" || normalized === "non-guest") return "student";
  if (normalized === "faq-general" || normalized === "context-general") return "general";
  if (normalized === "faq-student" || normalized === "context-student") return "student";
  return normalized;
}

async function parseJsonOrThrow(response: Response) {
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.error || "Request failed.");
  }

  return response.json();
}

export async function loadMyRequests(studentNo: string): Promise<StudentDocumentRequest[]> {
  const url = new URL(`${API_BASE}/api/registrar/requests`);
  url.searchParams.set("studentNo", studentNo);
  url.searchParams.set("limit", "50");

  const response = await authFetch(url.toString());
  return (await parseJsonOrThrow(response)) as StudentDocumentRequest[];
}

export async function loadFaqEntries(_studentCollegeCode?: string, _studentProgramCode?: string, guestMode = false): Promise<FaqContextEntry[]> {
  const url = new URL(`${API_BASE}/api/registrar/faq`);
  url.searchParams.set("includeUnpublished", guestMode ? "false" : "true");
  url.searchParams.set("limit", "200");

  if (guestMode) {
    url.searchParams.set("scopeType", "general");
  }

  const response = await fetch(url.toString(), { credentials: "include" });
  const entries = (await parseJsonOrThrow(response)) as FaqContextEntry[];
  return entries.filter((entry) => {
    const normalizedCategory = entry.category.trim().toLowerCase();
    if (normalizedCategory !== "faq" && !normalizedCategory.startsWith("faq-")) {
      return false;
    }

    if (guestMode) {
      const normalizedScope = normalizeScope(entry.scopeType);
      return normalizedScope === "general" && entry.isGuestVisible;
    }

    return true;
  });
}

export async function createRegistrarQuestion(payload: {
  conversationId: string;
  questionText: string;
  sourceAssistantMessageId?: number;
  studentNo?: string;
  collegeCode?: string;
  programCode?: string;
  routing?: string;
  confidence?: number;
}): Promise<UncertainQuestion> {
  const response = await authFetch(`${API_BASE}/api/registrar/questions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      conversationId: payload.conversationId,
      questionText: payload.questionText,
      sourceAssistantMessageId: payload.sourceAssistantMessageId ?? null,
      studentNo: payload.studentNo ?? "",
      collegeCode: payload.collegeCode ?? "",
      programCode: payload.programCode ?? "",
      routing: payload.routing ?? "manual-review",
      confidence: payload.confidence ?? 0,
    }),
  });

  return (await parseJsonOrThrow(response)) as UncertainQuestion;
}

export async function loadRegistrarQuestions(limit = 200): Promise<UncertainQuestion[]> {
  const url = new URL(`${API_BASE}/api/registrar/questions`);
  url.searchParams.set("limit", String(limit));

  const response = await authFetch(url.toString());
  return (await parseJsonOrThrow(response)) as UncertainQuestion[];
}
