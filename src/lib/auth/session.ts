import { cookies } from "next/headers";
import {
  type SessionData,
  SESSION_COOKIE_NAME,
  createSessionToken,
  verifySessionToken,
  signData,
} from "./session-token";

export type { SessionData };
export { SESSION_COOKIE_NAME, verifySessionToken, signData };

export async function createSession(data: SessionData) {
  const cookieStore = await cookies();
  const token = await createSessionToken(data);

  // Cookie secure hanya diaktifkan jika menggunakan HTTPS (agar bisa login di IP lokal HTTP seperti Proxmox LXC)
  const isHttps = process.env.COOKIE_SECURE === "true" || (process.env.NEXT_PUBLIC_APP_URL?.startsWith("https://") ?? false);

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isHttps,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 hari
  });
}

export async function getSession(): Promise<SessionData | null> {
  try {
    const cookieStore = await cookies();
    const cookie = cookieStore.get(SESSION_COOKIE_NAME);

    if (!cookie?.value) return null;
    return await verifySessionToken(cookie.value);
  } catch {
    return null;
  }
}

/**
 * Guard untuk Server Actions & Route Handlers: Memastikan user telah login
 */
export async function requireSession(): Promise<SessionData> {
  const session = await getSession();
  if (!session) {
    throw new Error("Akses Ditolak: Anda harus login untuk melakukan tindakan ini.");
  }
  return session;
}

/**
 * Guard untuk Server Actions & Route Handlers: Memastikan user memiliki role yang diizinkan
 */
export async function requireRole(allowedRoles: SessionData["role"][]): Promise<SessionData> {
  const session = await requireSession();
  if (!allowedRoles.includes(session.role)) {
    throw new Error(`Akses Ditolak: Peran '${session.role}' tidak memiliki otorisasi untuk operasi ini.`);
  }
  return session;
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
