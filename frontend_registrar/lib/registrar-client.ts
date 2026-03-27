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

export async function moveDocument(documentId: number, toDepartmentId: number): Promise<{ moved: boolean }> {
  const response = await fetch(`${API_BASE}/api/registrar/documents/${documentId}/move`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ toDepartmentId }),
  });

  return (await parseJsonOrThrow(response)) as { moved: boolean };
}
