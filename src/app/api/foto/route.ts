import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getDb, UPLOAD_DIR } from "@/lib/db";

export const runtime = "nodejs";

const TIPOS: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const MAX_BYTES = 3 * 1024 * 1024;

/** Sube la foto de perfil del postulante conectado (multipart, campo «foto»). */
export async function POST(req: Request) {
  const u = getSession();
  if (!u || u.role !== "student") return NextResponse.json({ error: "Solo los postulantes pueden cambiar su foto." }, { status: 403 });
  let file: File | null = null;
  try {
    const form = await req.formData();
    const campo = form.get("foto");
    file = campo instanceof File ? campo : null;
  } catch {
    return NextResponse.json({ error: "No se pudo leer el archivo." }, { status: 400 });
  }
  if (!file || file.size === 0) return NextResponse.json({ error: "Selecciona una imagen." }, { status: 400 });
  const ext = TIPOS[file.type];
  if (!ext) return NextResponse.json({ error: "La foto debe ser JPG, PNG o WEBP." }, { status: 415 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "La foto no puede superar 3 MB." }, { status: 413 });

  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  const nombre = `foto-${u.id}-${Date.now()}.${ext}`;
  fs.writeFileSync(path.join(UPLOAD_DIR, nombre), Buffer.from(await file.arrayBuffer()));

  const db = getDb();
  const previa = String((db.prepare("SELECT foto FROM student_profiles WHERE user_id = ?").get(u.id) as { foto?: string } | undefined)?.foto ?? "");
  db.prepare("UPDATE student_profiles SET foto = ? WHERE user_id = ?").run(nombre, u.id);
  if (previa) { try { fs.unlinkSync(path.join(UPLOAD_DIR, path.basename(previa))); } catch { /* ya no existe */ } }
  return NextResponse.json({ ok: true, foto: nombre });
}
