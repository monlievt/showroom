import { cookies } from "next/headers";
import crypto from "crypto";

export interface SessionData {
  userId: string;
  authUserId: string;
  role: "ADMIN" | "INVESTOR";
  fullName: string;
  phone?: string | null;
  investorId?: string | null;
}

const SESSION_COOKIE_NAME = "nur_mobil_session";
const AUTH_SECRET = process.env.AUTH_SECRET || "dev-secret-key-nur-mobil-32-chars-long-secure";

/**
 * Buat signature HMAC untuk mencegah manipulasi cookie di client
 */
function signData(payload: string): string {
  const hmac = crypto.createHmac("sha256", AUTH_SECRET);
  hmac.update(payload);
  return hmac.digest("hex");
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

    const decoded = JSON.parse(Buffer.from(cookie.value, "base64").toString("utf-8"));
    const { payload, signature } = decoded;

    // Verifikasi integritas signature
    const expectedSignature = signData(payload);
    if (signature !== expectedSignature) {
      console.warn("Invalid session cookie signature detected");
      return null;
    }

    return JSON.parse(payload) as SessionData;
  } catch (error) {
    return null;
  }
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
