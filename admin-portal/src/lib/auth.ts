export type AuthUser = {
  token: string;
  name: string;
  userId: number;
  userType: string;
};

const KEY = 'admin_auth';

export function getAuth(): AuthUser | null {
  const raw = localStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function setAuth(auth: AuthUser): void {
  localStorage.setItem(KEY, JSON.stringify(auth));
}

export function clearAuth(): void {
  localStorage.removeItem(KEY);
}

