import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

/** Hash de contraseña con scrypt + sal aleatoria. Formato: "scrypt$<sal>$<hash>". */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [scheme, salt, hash] = stored.split("$");
  if (scheme !== "scrypt" || !salt || !hash) return false;
  const test = scryptSync(password, salt, 64);
  const ref = Buffer.from(hash, "hex");
  return ref.length === test.length && timingSafeEqual(ref, test);
}
