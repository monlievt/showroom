import { cookies } from "next/headers";
import crypto from "crypto";

export interface SessionData {
  userId: string;
  authUserId: string;
  role: "OWNER" | "ADMIN" | "STAFF_ADMIN" | "SALES" | "INVESTOR";
  fullName: string;
  phone?: string | null;
  investorId?: string | null;
}

export const SESSION_COOKIE_NAME = "nur_mobil_session";
const AUTH_SECRET = process.env.AUTH_SECRET || "dev-secret-key-nur-mobil-32-chars-long-secure";

if (process.env.NODE_ENV === "production" && (!process.env.AUTH_SECRET || process.env.AUTH_SECRET.length < 32)) {
  console.warn("⚠️ PERINGATAN KEAMANAN: AUTH_SECRET di production harus didefinisikan dengan panjang minimal 32 karakter acak!");
}

/**
 * Buat signature HMAC-SHA256 untuk mencegah manipulasi cookie di client
 */
export function signData(payload: string): string {
  const hmac = crypto.createHmac("sha256", AUTH_SECRET);
  hmac.update(payload);
  return hmac.digest("hex");
}

/**
 * Verifikasi token session dengan constant-time comparison untuk mencegah timing attack
 */
export function verifySessionToken(token: string): SessionData | null {
  try {
    if (!token || typeof token !== "string") return null;

    const decoded = JSON.parse(Buffer.from(token, "base64").toString("utf-8"));
    const { payload, signature } = decoded;

    if (!payload || !signature || typeof payload !== "string" || typeof signature !== "string") {
      return null;
    }

    const expectedSignature = signData(payload);

    const sigBuf = Buffer.from(signature, "hex");
    const expBuf = Buffer.from(expectedSignature, "hex");

    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      console.warn("⚠️ DETEKSI KEAMANAN: Signature cookie session tidak valid (percobaan manipulasi/spoofing terdeteksi)!");
      return null;
    }

    return JSON.parse(payload) as SessionData;
  } catch {
    return null;
  }
}

export async function createSession(data: SessionData) {
  const cookieStore = await cookies();
  const payload = JSON.stringify(data);
  const signature = signData(payload);
  const token = Buffer.from(JSON.stringify({ payload, signature })).toString("base64");

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
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
    return verifySessionToken(cookie.value);
  } catch (error) {
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
