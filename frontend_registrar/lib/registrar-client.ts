const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5240";

export type Department = {
  id: number;
  name: string;
};

export type RegistrarDocument = {
  id: number;
  referenceCode: string;
  studentName: string;
  title: string;
  departmentId: number;
  createdAt: string;
};

export type StudentDirectoryEntry = {
  studentNo: string;
  fullName: string;
  collegeCode: string;
  programCode: string;
  email: string;
  dateCreated: string;
  hasPassword: boolean;
};

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
  createdAt: string;
  updatedAt: string;
};

export type UncertainQuestion = {
  id: number;
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
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string | null;
};

export type ActivityEntry = {
  id: number;
  action: string;
  actor: string;
  createdAt: string;
};

export type Program = {
  id: number;
  name: string;
  code: string;
  group: string;
  collegeId: number;
};

export type College = {
  id: number;
  name: string;
  programs: Program[];
};

export type RegistrarCatalog = {
  colleges: College[];
  departments: Department[];
};

export type RegistrarState = {
  departments: Department[];
  documents: RegistrarDocument[];
  activity: ActivityEntry[];
  catalog: RegistrarCatalog;
};

export type EtlRow = {
  stagingId: number;
  category: string;
  fileName: string;
  sourceRow: number;
  status: string;
  conflictNote: string;
  data: Record<string, string>;
};

export type EtlStagingDashboard = {
  departments: EtlRow[];
  admissions: EtlRow[];
  discipline: EtlRow[];
  service: EtlRow[];
  technology: EtlRow[];
  students: EtlRow[];
  grades: EtlRow[];
  curriculums: EtlRow[];
  syllabi: EtlRow[];
  thesis: EtlRow[];
};

export type EtlUploadHistoryEntry = {
  batchId: string;
  fileName: string;
  category: string;
  collegeCode: string;
  programCode: string;
  parsedRows: number;
  status: string;
  isActive: boolean;
  isIncomplete: boolean;
  error: string;
  parsedAt: string;
};

export type CollegeTab = {
  code: string;
  label: string;
  href: string;
};

export type EtlBulkUploadResponse = {
  batchId: string;
  staging: EtlStagingDashboard;
  files: Array<{ fileName: string; category: string; parsedRows: number; status: string; error: string }>;
  conflicts: Array<{ stagingId: number; fileName: string; studentNo: string; note: string }>;
  errors: Array<{ fileName: string; row: number; message: string }>;
};

export type FaqImportResult = {
  imported: number;
  updated: number;
  skipped: number;
};

export type IctoAccountImportResult = {
  imported: number;
  updated: number;
  skipped: number;
  notFound: number;
  errors: string[];
};

let registrarCollegeTabsCache: CollegeTab[] | null = null;
let registrarCollegeTabsPromise: Promise<CollegeTab[]> | null = null;

export function getCachedRegistrarCollegeTabs(): CollegeTab[] | null {
  return registrarCollegeTabsCache;
}

async function parseJsonOrThrow(response: Response) {
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const errorMessage = payload?.error ?? "Registrar API request failed.";
    throw new Error(errorMessage);
  }

  return response.json();
}

export async function loadRegistrarState(): Promise<RegistrarState> {
  const response = await fetch(`${API_BASE}/api/registrar/state`);
  return (await parseJsonOrThrow(response)) as RegistrarState;
}

export async function loadRegistrarCatalog(): Promise<RegistrarCatalog> {
  const response = await fetch(`${API_BASE}/api/registrar/catalog`);
  return (await parseJsonOrThrow(response)) as RegistrarCatalog;
}

export async function createDepartment(name: string): Promise<Department> {
  const response = await fetch(`${API_BASE}/api/registrar/departments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });

  return (await parseJsonOrThrow(response)) as Department;
}

export async function createCollege(name: string): Promise<College> {
  const response = await fetch(`${API_BASE}/api/registrar/colleges`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });

  return (await parseJsonOrThrow(response)) as College;
}

export async function updateCollege(collegeId: number, name: string): Promise<College> {
  const response = await fetch(`${API_BASE}/api/registrar/colleges/${collegeId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });

  return (await parseJsonOrThrow(response)) as College;
}

export async function deleteCollege(collegeId: number): Promise<void> {
  const response = await fetch(`${API_BASE}/api/registrar/colleges/${collegeId}`, {
    method: "DELETE",
  });

  await parseJsonOrThrow(response);
}

export async function createProgram(collegeId: number, payload: { name: string; code: string; group: string }): Promise<Program> {
  const response = await fetch(`${API_BASE}/api/registrar/colleges/${collegeId}/programs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return (await parseJsonOrThrow(response)) as Program;
}

export async function updateProgram(programId: number, payload: { name: string; code: string; group: string; collegeId: number }): Promise<Program> {
  const response = await fetch(`${API_BASE}/api/registrar/programs/${programId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return (await parseJsonOrThrow(response)) as Program;
}

export async function deleteProgram(programId: number): Promise<void> {
  const response = await fetch(`${API_BASE}/api/registrar/programs/${programId}`, {
    method: "DELETE",
  });

  await parseJsonOrThrow(response);
}

export async function createDocument(studentName: string, title: string, departmentId: number): Promise<RegistrarDocument> {
  const response = await fetch(`${API_BASE}/api/registrar/documents`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ studentName, title, departmentId }),
  });

  return (await parseJsonOrThrow(response)) as RegistrarDocument;
}

export async function searchStudents(query: string, limit = 20): Promise<StudentDirectoryEntry[]> {
  const url = new URL(`${API_BASE}/api/registrar/students/search`);
  url.searchParams.set("query", query);
  url.searchParams.set("limit", String(limit));

  const response = await fetch(url.toString());
  return (await parseJsonOrThrow(response)) as StudentDirectoryEntry[];
}

export async function updateStudentCredentials(studentNo: string, payload: { email: string; password: string }): Promise<StudentDirectoryEntry> {
  const response = await fetch(`${API_BASE}/api/registrar/students/${encodeURIComponent(studentNo)}/credentials`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ studentNo, ...payload }),
  });

  return (await parseJsonOrThrow(response)) as StudentDirectoryEntry;
}

export async function getRegistrarRequests(studentNo?: string, status?: string, limit = 50): Promise<StudentDocumentRequest[]> {
  const url = new URL(`${API_BASE}/api/registrar/requests`);
  if (studentNo) url.searchParams.set("studentNo", studentNo);
  if (status) url.searchParams.set("status", status);
  url.searchParams.set("limit", String(limit));

  const response = await fetch(url.toString());
  return (await parseJsonOrThrow(response)) as StudentDocumentRequest[];
}

export async function createRegistrarRequest(payload: { studentNo: string; documentType: string; departmentId: number; notes: string }): Promise<StudentDocumentRequest> {
  const response = await fetch(`${API_BASE}/api/registrar/requests`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return (await parseJsonOrThrow(response)) as StudentDocumentRequest;
}

export async function updateRegistrarRequestStatus(requestId: number, payload: { status: string; handledBy?: string; disposedReason?: string; notes?: string }): Promise<StudentDocumentRequest> {
  const response = await fetch(`${API_BASE}/api/registrar/requests/${requestId}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return (await parseJsonOrThrow(response)) as StudentDocumentRequest;
}

export async function getFaqEntries(filters: { scopeType?: string; collegeCode?: string; programCode?: string; includeUnpublished?: boolean; limit?: number }): Promise<FaqContextEntry[]> {
  const url = new URL(`${API_BASE}/api/registrar/faq`);
  if (filters.scopeType) url.searchParams.set("scopeType", filters.scopeType);
  if (filters.collegeCode) url.searchParams.set("collegeCode", filters.collegeCode);
  if (filters.programCode) url.searchParams.set("programCode", filters.programCode);
  if (filters.includeUnpublished) url.searchParams.set("includeUnpublished", "true");
  url.searchParams.set("limit", String(filters.limit ?? 100));

  const response = await fetch(url.toString());
  return (await parseJsonOrThrow(response)) as FaqContextEntry[];
}

export async function createFaqEntry(payload: Omit<FaqContextEntry, "id" | "createdAt" | "updatedAt">): Promise<FaqContextEntry> {
  const response = await fetch(`${API_BASE}/api/registrar/faq`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return (await parseJsonOrThrow(response)) as FaqContextEntry;
}

export async function updateFaqEntry(faqId: number, payload: Omit<FaqContextEntry, "id" | "createdAt" | "updatedAt">): Promise<FaqContextEntry> {
  const response = await fetch(`${API_BASE}/api/registrar/faq/${faqId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return (await parseJsonOrThrow(response)) as FaqContextEntry;
}

export async function deleteFaqEntry(faqId: number): Promise<void> {
  const response = await fetch(`${API_BASE}/api/registrar/faq/${faqId}`, {
    method: "DELETE",
  });

  await parseJsonOrThrow(response);
}

export async function getUncertainQuestions(filters: { status?: string; limit?: number } = {}): Promise<UncertainQuestion[]> {
  const url = new URL(`${API_BASE}/api/registrar/questions`);
  if (filters.status) url.searchParams.set("status", filters.status);
  url.searchParams.set("limit", String(filters.limit ?? 150));

  const response = await fetch(url.toString());
  return (await parseJsonOrThrow(response)) as UncertainQuestion[];
}

export async function resolveUncertainQuestion(
  questionId: number,
  payload: {
    category: string;
    scopeType: string;
    collegeCode: string;
    programCode: string;
    title: string;
    answer: string;
  }
): Promise<{ question: UncertainQuestion; createdEntry: FaqContextEntry }> {
  const response = await fetch(`${API_BASE}/api/registrar/questions/${questionId}/resolve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return (await parseJsonOrThrow(response)) as { question: UncertainQuestion; createdEntry: FaqContextEntry };
}

export async function closeUncertainQuestion(
  questionId: number,
  payload?: {
    notes?: string;
  }
): Promise<{ question: UncertainQuestion }> {
  const response = await fetch(`${API_BASE}/api/registrar/questions/${questionId}/close`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ notes: payload?.notes ?? "" }),
  });

  if (response.status === 404) {
    throw new Error("Close endpoint not found. Restart the backend so the latest API routes are loaded.");
  }

  return (await parseJsonOrThrow(response)) as { question: UncertainQuestion };
}

export async function moveDocument(documentId: number, toDepartmentId: number): Promise<{ moved: boolean }> {
  const response = await fetch(`${API_BASE}/api/registrar/documents/${documentId}/move`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ toDepartmentId }),
  });

  return (await parseJsonOrThrow(response)) as { moved: boolean };
}

export async function bulkUploadRegistrarCsv(files: File[], incompleteFiles: string[] = []): Promise<EtlBulkUploadResponse> {
  const form = new FormData();
  files.forEach((file) => form.append("files", file));
  incompleteFiles.forEach((name) => form.append("incompleteFiles", name));

  const response = await fetch(`${API_BASE}/api/registrar/etl/bulk-upload`, {
    method: "POST",
    body: form,
  });

  return (await parseJsonOrThrow(response)) as EtlBulkUploadResponse;
}

export async function syncFaqCsv() {
  const response = await fetch(`${API_BASE}/api/registrar/etl/sync-faq-csv`, {
    method: "POST",
  });

  return await parseJsonOrThrow(response);
}

export async function commitRegistrarEtl(batchId: string, decisions: Array<{ stagingId: number; action: string }>) {
  const response = await fetch(`${API_BASE}/api/registrar/etl/commit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ batchId, decisions }),
  });

  return parseJsonOrThrow(response);
}

export async function getRegistrarEtlStaging(batchId: string): Promise<EtlStagingDashboard> {
  const response = await fetch(`${API_BASE}/api/registrar/etl/staging/${batchId}`);
  return (await parseJsonOrThrow(response)) as EtlStagingDashboard;
}

export async function getRegistrarUploadHistory(limit = 100): Promise<EtlUploadHistoryEntry[]> {
  const response = await fetch(`${API_BASE}/api/registrar/etl/upload-history?limit=${limit}`);
  return (await parseJsonOrThrow(response)) as EtlUploadHistoryEntry[];
}

export async function getRegistrarCollegeTabs(): Promise<CollegeTab[]> {
  if (registrarCollegeTabsCache) {
    return registrarCollegeTabsCache;
  }

  if (!registrarCollegeTabsPromise) {
    registrarCollegeTabsPromise = fetch(`${API_BASE}/api/registrar/etl/college-tabs`)
      .then((response) => parseJsonOrThrow(response) as Promise<CollegeTab[]>)
      .then((tabs) => {
        const sortedTabs = [...tabs].sort((left, right) => left.label.localeCompare(right.label));
        registrarCollegeTabsCache = sortedTabs;
        return sortedTabs;
      })
      .finally(() => {
        registrarCollegeTabsPromise = null;
      });
  }

  return registrarCollegeTabsPromise!;
}

export async function importFaqCsvFile(file: File): Promise<FaqImportResult> {
  const form = new FormData();
  form.append("file", file);

  const response = await fetch(`${API_BASE}/api/registrar/etl/import-faqs`, {
    method: "POST",
    body: form,
  });

  return (await parseJsonOrThrow(response)) as FaqImportResult;
}

export async function importIctoAccounts(file: File): Promise<IctoAccountImportResult> {
  const form = new FormData();
  form.append("file", file);

  const response = await fetch(`${API_BASE}/api/registrar/students/import-icto`, {
    method: "POST",
    body: form,
  });

  return (await parseJsonOrThrow(response)) as IctoAccountImportResult;
}

export async function clearRegistrarEtlStaging(batchId: string): Promise<void> {
  const response = await fetch(`${API_BASE}/api/registrar/etl/staging/${batchId}`, {
    method: "DELETE",
  });

  await parseJsonOrThrow(response);
}

export async function flushRegistrarDatabase(confirmation: string): Promise<{
  flushed: boolean;
  deletedStudents: number;
  deletedCurriculumCourses: number;
  deletedStagingRows: number;
  deletedStagingFiles: number;
  deletedStagingBatches: number;
  deletedDocuments: number;
  deletedActivityLogs: number;
  deletedPrograms: number;
  deletedColleges: number;
  deletedDepartments: number;
}> {
  const response = await fetch(`${API_BASE}/api/registrar/etl/flush-database`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ confirmation }),
  });

  return parseJsonOrThrow(response);
}
