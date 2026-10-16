// Persistent posture state shared across Posture Air AI.
import { useEffect, useState } from "react";

export type SessionTimelinePoint = {
  t: number; // seconds from session start
  score: number;
  state: "good" | "warn" | "bad";
  tilt: number;
  roll?: number;
};

export type SessionSummary = {
  id: string;
  date: string; // ISO string
  durationSec: number;
  score: number;
  goodPosturePct: number;
  corrections: number;
  topIssue: string;
  timeline?: SessionTimelinePoint[];
  source?: "camera" | "sensor" | "simulated";
};

export type CalibrationBaseline = {
  baselineRoll: number;
  baselinePitch: number;
  baselineShoulderSlope: number;
  baselineEarShoulderDist: number;
  calibratedAt: string;
  sampleCount: number;
  stabilityScore: number;
};

export type UserAccount = {
  id: string;
  name: string;
  email: string;
  goal: "study" | "work" | "reading" | "phone";
  height: number;
  createdAt: string;
};

type StoredUserRecord = UserAccount & {
  passwordHash: string;
};

const KEY_CURRENT_USER = "pa_current_user_v2";
const KEY_USERS_DB = "pa_registered_users_v2";

export type Profile = {
  name: string;
  height: number;
  goal: "study" | "work" | "reading" | "phone";
  sensitivity: "low" | "medium" | "high";
  voice: "female" | "male" | "tone" | "vibration";
  alertAfterSec: number;
  trackingMode: "camera" | "sensor";
};

export const defaultProfile: Profile = {
  name: "Você",
  height: 175,
  goal: "work",
  sensitivity: "medium",
  voice: "female",
  alertAfterSec: 30,
  trackingMode: "camera",
};

export const defaultBaseline: CalibrationBaseline = {
  baselineRoll: 0,
  baselinePitch: 0,
  baselineShoulderSlope: 0,
  baselineEarShoulderDist: 0.18,
  calibratedAt: new Date().toISOString(),
  sampleCount: 100,
  stabilityScore: 98,
};

// --- DYNAMIC STORAGE KEYS (PER USER) ---

function getActiveUserId(): string {
  const user = getCurrentUser();
  return user ? user.id : "guest";
}

function getSessionsKey(): string {
  return `pa_sessions_${getActiveUserId()}`;
}

function getCalibratedKey(): string {
  return `pa_calibrated_${getActiveUserId()}`;
}

function getBaselineKey(): string {
  return `pa_baseline_${getActiveUserId()}`;
}

function getProfileKey(): string {
  return `pa_profile_${getActiveUserId()}`;
}

// --- AUTHENTICATION & USER MANAGEMENT ---

export function getCurrentUser(): UserAccount | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY_CURRENT_USER);
    if (raw) return JSON.parse(raw) as UserAccount;
  } catch {}
  return null;
}

export function setCurrentUser(user: UserAccount | null) {
  if (typeof window === "undefined") return;
  try {
    if (user) {
      localStorage.setItem(KEY_CURRENT_USER, JSON.stringify(user));
      // Sincronizar nome no perfil do usuário
      const prof = loadProfile();
      prof.name = user.name;
      prof.goal = user.goal;
      prof.height = user.height;
      saveProfile(prof);
    } else {
      localStorage.removeItem(KEY_CURRENT_USER);
    }
  } catch {}
}

export function getRegisteredUsers(): StoredUserRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY_USERS_DB);
    if (raw) return JSON.parse(raw) as StoredUserRecord[];
  } catch {}
  return [];
}

export function registerUser(
  name: string,
  email: string,
  password: string,
  goal: Profile["goal"] = "work",
  height: number = 175
): { success: boolean; error?: string; user?: UserAccount } {
  if (!name.trim() || !email.trim() || !password.trim()) {
    return { success: false, error: "Preencha todos os campos obrigatórios." };
  }
  if (!email.includes("@")) {
    return { success: false, error: "Digite um e-mail válido." };
  }
  if (password.length < 4) {
    return { success: false, error: "A senha deve ter pelo menos 4 caracteres." };
  }

  const users = getRegisteredUsers();
  const normalizedEmail = email.toLowerCase().trim();

  if (users.some((u) => u.email.toLowerCase() === normalizedEmail)) {
    return { success: false, error: "Este e-mail já está cadastrado. Faça login." };
  }

  const newUser: StoredUserRecord = {
    id: `usr_${Date.now()}`,
    name: name.trim(),
    email: normalizedEmail,
    goal,
    height: height || 175,
    createdAt: new Date().toISOString(),
    passwordHash: password,
  };

  users.push(newUser);
  try {
    localStorage.setItem(KEY_USERS_DB, JSON.stringify(users));
  } catch {}

  const { passwordHash: _, ...publicUser } = newUser;
  setCurrentUser(publicUser);

  // Inicializar o novo usuário 100% ZERADO:
  try {
    localStorage.setItem(`pa_sessions_${publicUser.id}`, JSON.stringify([]));
    localStorage.setItem(`pa_calibrated_${publicUser.id}`, "0");
    const freshProfile: Profile = {
      ...defaultProfile,
      name: publicUser.name,
      goal: publicUser.goal,
      height: publicUser.height,
    };
    localStorage.setItem(`pa_profile_${publicUser.id}`, JSON.stringify(freshProfile));
  } catch {}

  return { success: true, user: publicUser };
}

export function loginUser(
  email: string,
  password: string
): { success: boolean; error?: string; user?: UserAccount } {
  if (!email.trim() || !password.trim()) {
    return { success: false, error: "Informe o e-mail e a senha." };
  }

  const users = getRegisteredUsers();
  const normalizedEmail = email.toLowerCase().trim();
  const matched = users.find(
    (u) => u.email.toLowerCase() === normalizedEmail && u.passwordHash === password
  );

  if (!matched) {
    return { success: false, error: "E-mail ou senha incorretos." };
  }

  const { passwordHash: _, ...publicUser } = matched;
  setCurrentUser(publicUser);
  return { success: true, user: publicUser };
}

export function logoutUser() {
  setCurrentUser(null);
}

// --- SESSIONS & METRICS (100% REAL, ZERO FAKE DATA) ---

export function loadSessions(): SessionSummary[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(getSessionsKey());
    if (raw) return JSON.parse(raw) as SessionSummary[];
  } catch {}
  return []; // Começa estritamente vazio para novos usuários
}

export function saveSession(s: SessionSummary) {
  if (typeof window === "undefined") return;
  const list = loadSessions();
  list.unshift(s);
  try {
    localStorage.setItem(getSessionsKey(), JSON.stringify(list.slice(0, 100)));
  } catch {}
}

export function isCalibrated(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(getCalibratedKey()) === "1";
}

export function setCalibrated(v: boolean) {
  if (typeof window === "undefined") return;
  localStorage.setItem(getCalibratedKey(), v ? "1" : "0");
}

export function loadBaseline(): CalibrationBaseline {
  if (typeof window === "undefined") return defaultBaseline;
  try {
    const raw = localStorage.getItem(getBaselineKey());
    if (raw) return { ...defaultBaseline, ...JSON.parse(raw) };
  } catch {}
  return defaultBaseline;
}

export function saveBaseline(b: CalibrationBaseline) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(getBaselineKey(), JSON.stringify(b));
    setCalibrated(true);
  } catch {}
}

export function loadProfile(): Profile {
  if (typeof window === "undefined") return defaultProfile;
  try {
    const raw = localStorage.getItem(getProfileKey());
    if (raw) return { ...defaultProfile, ...JSON.parse(raw) };
  } catch {}
  return defaultProfile;
}

export function saveProfile(p: Profile) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(getProfileKey(), JSON.stringify(p));
  } catch {}
}

/**
 * Calcula a sequência (streak) de dias consecutivos reais.
 * Retorna 0 se o usuário não tiver completado nenhuma sessão ainda.
 */
export function calculateStreak(sessions: SessionSummary[]): number {
  if (!sessions || sessions.length === 0) return 0;

  const dayMap = new Map<string, number>();
  for (const s of sessions) {
    const key = new Date(s.date).toDateString();
    const current = dayMap.get(key) ?? 0;
    if (s.score > current) {
      dayMap.set(key, s.score);
    }
  }

  let streak = 0;
  const checkDate = new Date();

  const todayKey = checkDate.toDateString();
  const todayScore = dayMap.get(todayKey);

  // Se hoje teve sessão >= 65, conta hoje
  if (todayScore !== undefined && todayScore >= 65) {
    streak += 1;
    checkDate.setDate(checkDate.getDate() - 1);
  } else {
    // Se hoje ainda não teve, checa a partir de ontem para manter sequência viva
    checkDate.setDate(checkDate.getDate() - 1);
  }

  while (true) {
    const key = checkDate.toDateString();
    const score = dayMap.get(key);
    if (score !== undefined && score >= 65) {
      streak += 1;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

export function formatDuration(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}h ${m.toString().padStart(2, "0")}m`;
  if (m > 0) return `${m}m ${s.toString().padStart(2, "0")}s`;
  return `${s}s`;
}

export function useLocal<T>(key: string, initial: T): [T, (v: T) => void] {
  const [v, setV] = useState<T>(initial);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) setV(JSON.parse(raw));
    } catch {}
  }, [key]);

  const set = (next: T) => {
    setV(next);
    try {
      localStorage.setItem(key, JSON.stringify(next));
    } catch {}
  };
  return [v, set];
}
