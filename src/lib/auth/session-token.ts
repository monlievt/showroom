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

const encoder = new TextEncoder();

export function toBase64(str: string): string {
  const bytes = encoder.encode(str);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function fromBase64(b64: string): string {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

/**
 * Buat signature HMAC-SHA256 untuk payload menggunakan Web Crypto API (Edge & Node compatible)
 */
export async function signData(payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(AUTH_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Verifikasi signature HMAC-SHA256 secara constant-time menggunakan Web Crypto API
 */
export async function verifySignature(payload: string, hexSignature: string): Promise<boolean> {
  try {
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(AUTH_SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );
    const matches = hexSignature.match(/.{1,2}/g);
    if (!matches) return false;
    const sigBytes = new Uint8Array(matches.map((byte) => parseInt(byte, 16)));
    return await crypto.subtle.verify("HMAC", key, sigBytes, encoder.encode(payload));
  } catch {
    return false;
  }
}

/**
 * Buat token session dari data session
 */
export async function createSessionToken(data: SessionData): Promise<string> {
  const payload = JSON.stringify(data);
  const signature = await signData(payload);
  return toBase64(JSON.stringify({ payload, signature }));
}

/**
 * Verifikasi token session dengan constant-time Web Crypto API
 */
export async function verifySessionToken(token: string): Promise<SessionData | null> {
  try {
    if (!token || typeof token !== "string") return null;

    const decoded = JSON.parse(fromBase64(token));
    const { payload, signature } = decoded;

    if (!payload || !signature || typeof payload !== "string" || typeof signature !== "string") {
      return null;
    }

    const isValid = await verifySignature(payload, signature);
    if (!isValid) {
      console.warn("⚠️ DETEKSI KEAMANAN: Signature cookie session tidak valid!");
      return null;
    }

    return JSON.parse(payload) as SessionData;
  } catch {
    return null;
  }
}
