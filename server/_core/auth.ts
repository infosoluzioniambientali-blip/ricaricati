import crypto from "crypto";

/**
 * Hash una password usando SHA-256
 */
export async function hashPassword(password: string): Promise<string> {
  return crypto.createHash("sha256").update(password).digest("hex");
}

/**
 * Verifica una password contro un hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
}

/**
 * Genera un ID di sessione casuale
 */
export function generateSessionId(): string {
  return crypto.randomBytes(32).toString("hex");
}
