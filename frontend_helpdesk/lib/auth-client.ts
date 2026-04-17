const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5240";
const ACCESS_TOKEN_KEY = "hk.accessToken";
const USER_KEY = "hk.user";
const EXPIRES_AT_KEY = "hk.expiresAtUtc";

export type StudentProfile = {
  studentNo: string;
  fullName: string;
  collegeCode: string;
  programCode: string;
};

type ChangePasswordResponse = {
  success: boolean;
};

type AuthResponse = {
  accessToken: string;
  expiresAtUtc: string;
  user: StudentProfile;
};

let sessionUserCache: StudentProfile | null | undefined = undefined;
let signedInSnapshot: boolean | null = null;
let sessionExpiryTimer: number | null = null;

function notifyAuthChanged() {
  if (!canUseStorage()) {
    return;
  }

  window.dispatchEvent(new Event("hk-auth-changed"));
}

function canUseStorage() {
  return typeof window !== "undefined";
}

function parseAuthResponse(data: unknown): AuthResponse {
  const parsed = data as AuthResponse;
  return parsed;
}

function clearSessionExpiryTimer() {
  if (sessionExpiryTimer !== null) {
    window.clearTimeout(sessionExpiryTimer);
    sessionExpiryTimer = null;
  }
}

function scheduleSessionExpiry(expiresAtUtc: string) {
  clearSessionExpiryTimer();

  const expiresAt = Date.parse(expiresAtUtc);
  if (Number.isNaN(expiresAt)) {
    return;
  }

  const delay = expiresAt - Date.now();
  if (delay <= 0) {
    clearSession();
    return;
  }

  sessionExpiryTimer = window.setTimeout(() => {
    clearSession();
  }, delay);
}

function storeSession(data: AuthResponse) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken);
  window.localStorage.setItem(USER_KEY, JSON.stringify(data.user));
  window.localStorage.setItem(EXPIRES_AT_KEY, data.expiresAtUtc);
  sessionUserCache = data.user;
  signedInSnapshot = true;
  scheduleSessionExpiry(data.expiresAtUtc);
  notifyAuthChanged();
}

export function clearSession() {
  if (!canUseStorage()) {
    return;
  }

  clearSessionExpiryTimer();
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
  window.localStorage.removeItem(EXPIRES_AT_KEY);
  sessionUserCache = null;
  signedInSnapshot = false;
  notifyAuthChanged();
}

export function getSignedInSnapshot(): boolean | null {
  return signedInSnapshot;
}

export function setSignedInSnapshot(isSignedIn: boolean) {
  signedInSnapshot = isSignedIn;
}

export function getAccessToken(): string | null {
  if (!canUseStorage()) {
    return null;
  }

  const token = window.localStorage.getItem(ACCESS_TOKEN_KEY);
  if (!token) {
    return null;
  }

  const expiresAtUtcRaw = window.localStorage.getItem(EXPIRES_AT_KEY);
  if (!expiresAtUtcRaw) {
    return token;
  }

  const expiresAtUtc = Date.parse(expiresAtUtcRaw);
  if (Number.isNaN(expiresAtUtc)) {
    return token;
  }

  if (Date.now() >= expiresAtUtc) {
    clearSession();
    return null;
  }

  return token;
}

export function getStoredUser(): StudentProfile | null {
  const token = getAccessToken();
  if (!token) {
    return null;
  }

  if (sessionUserCache !== undefined) {
    return sessionUserCache;
  }

  if (!canUseStorage()) {
    return null;
  }

  const raw = window.localStorage.getItem(USER_KEY);
  if (!raw) {
    return null;
  }

  try {
    sessionUserCache = JSON.parse(raw) as StudentProfile;
    return sessionUserCache;
  } catch {
    clearSession();
    return null;
  }
}

export function hasLocalSession(): boolean {
  return Boolean(getAccessToken() && getStoredUser());
}

export async function signIn(studentNo: string, password: string): Promise<StudentProfile> {
  const response = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ studentNo, password }),
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to sign in");
  }

  const payload = parseAuthResponse(await response.json());
  storeSession(payload);
  return payload.user;
}

export async function refreshSession(): Promise<boolean> {
  const response = await fetch(`${API_BASE}/api/auth/refresh`, {
    method: "POST",
    credentials: "include",
  });

  if (!response.ok) {
    clearSession();
    return false;
  }

  const payload = parseAuthResponse(await response.json());
  storeSession(payload);
  return true;
}

export async function signOut(): Promise<void> {
  try {
    await fetch(`${API_BASE}/api/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
  } finally {
    clearSession();
  }
}

export async function getCurrentUser(): Promise<StudentProfile | null> {
  let currentToken = getAccessToken();
  if (!currentToken) {
    const refreshed = await refreshSession();
    if (!refreshed) {
      clearSession();
      return null;
    }

    currentToken = getAccessToken();
    if (!currentToken) {
      clearSession();
      return null;
    }
  }

  if (sessionUserCache !== undefined) {
    return sessionUserCache;
  }

  const response = await fetch(`${API_BASE}/api/auth/me`, {
    headers: {
      Authorization: `Bearer ${currentToken}`,
    },
    credentials: "include",
  });

  if (response.status === 401) {
    const refreshed = await refreshSession();
    if (!refreshed) {
      return null;
    }

    return getCurrentUser();
  }

  if (!response.ok) {
    clearSession();
    return null;
  }

  const profile = (await response.json()) as StudentProfile;
  if (canUseStorage()) {
    window.localStorage.setItem(USER_KEY, JSON.stringify(profile));
  }
  sessionUserCache = profile;
  return profile;
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  const response = await authFetch(`${API_BASE}/api/auth/change-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ currentPassword, newPassword }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.error || "Failed to change password");
  }

  const payload = (await response.json()) as ChangePasswordResponse;
  if (!payload.success) {
    throw new Error("Failed to change password");
  }
}

export async function initializeSession(): Promise<StudentProfile | null> {
  return getCurrentUser();
}

export async function authFetch(input: string, init?: RequestInit): Promise<Response> {
  const token = getAccessToken();
  const headers = new Headers(init?.headers ?? {});
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response = await fetch(input, {
    ...init,
    headers,
    credentials: "include",
  });

  if (response.status !== 401) {
    return response;
  }

  const refreshed = await refreshSession();
  if (!refreshed) {
    return response;
  }

  const nextToken = getAccessToken();
  const retryHeaders = new Headers(init?.headers ?? {});
  if (nextToken) {
    retryHeaders.set("Authorization", `Bearer ${nextToken}`);
  }

  response = await fetch(input, {
    ...init,
    headers: retryHeaders,
    credentials: "include",
  });

  return response;
}
