import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { randomBytes } from "node:crypto";
import { getDb } from "./db";

export type Role = "student" | "company" | "admin";
export interface SessionUser { id: number; email: string; name: string; role: Role }

export const SESSION_COOKIE = "talento_session";
const SESSION_DAYS = 7;

export function createSession(userId: number) {
  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + SESSION_DAYS * 86400000);
  const db = getDb();
  db.prepare("DELETE FROM sessions WHERE expires_at < datetime('now')").run();
  db.prepare("INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)").run(
    token, userId, expires.toISOString().slice(0, 19).replace("T", " "),
  );
  db.prepare("UPDATE users SET last_login = datetime('now') WHERE id = ?").run(userId);
  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true, sameSite: "lax", path: "/", expires,
    secure: process.env.COOKIE_SECURE === "true",
  });
}

export function destroySession() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (token) getDb().prepare("DELETE FROM sessions WHERE token = ?").run(token);
  cookies().delete(SESSION_COOKIE);
}

export function getSession(): SessionUser | null {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const row = getDb()
    .prepare(`SELECT u.id, u.email, u.name, u.role FROM sessions s JOIN users u ON u.id = s.user_id
              WHERE s.token = ? AND s.expires_at > datetime('now') AND u.active = 1`)
    .get(token);
  if (!row) return null;
  return { id: Number(row.id), email: String(row.email), name: String(row.name), role: row.role as Role };
}

/** Exige sesión (y opcionalmente un rol). Si no cumple, redirige. */
export function requireUser(...roles: Role[]): SessionUser {
  const u = getSession();
  if (!u) redirect("/login");
  if (roles.length && !roles.includes(u.role)) redirect(homeFor(u.role));
  return u;
}

export function homeFor(role: Role): string {
  return role === "student" ? "/empleos" : role === "company" ? "/empresa" : "/admin";
}
