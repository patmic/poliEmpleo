import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getDb, UPLOAD_DIR } from "@/lib/db";

export const runtime = "nodejs";

const TIPOS: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const MAX_BYTES = 2 * 1024 * 1024;

/** Sube el logo de la empresa conectada (multipart, campo «logo»). */
export async function POST(req: Request) {
  const u = getSession();
  if (!u || u.role !== "company") return NextResponse.json({ error: "Solo las empresas pueden cambiar su logo." }, { status: 403 });
  let file: File | null = null;
  try {
    const form = await req.formData();
    const campo = form.get("logo");
    file = campo instanceof File ? campo : null;
  } catch {
    return NextResponse.json({ error: "No se pudo leer el archivo." }, { status: 400 });
  }
  if (!file || file.size === 0) return NextResponse.json({ error: "Selecciona una imagen." }, { status: 400 });
  const ext = TIPOS[file.type];
  if (!ext) return NextResponse.json({ error: "El logo debe ser JPG, PNG o WEBP." }, { status: 415 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "El logo no puede superar 2 MB." }, { status: 413 });

  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  const nombre = `logo-${u.id}-${Date.now()}.${ext}`;
  fs.writeFileSync(path.join(UPLOAD_DIR, nombre), Buffer.from(await file.arrayBuffer()));

  const db = getDb();
  const previa = String((db.prepare("SELECT logo FROM company_profiles WHERE user_id = ?").get(u.id) as { logo?: string } | undefined)?.logo ?? "");
  const ruta = `/api/logo/${nombre}`;
  db.prepare("UPDATE company_profiles SET logo = ? WHERE user_id = ?").run(ruta, u.id);
  // Borra solo el logo anterior que se subió desde la app; los de demostración viven en /public.
  if (previa.startsWith("/api/logo/")) { try { fs.unlinkSync(path.join(UPLOAD_DIR, path.basename(previa))); } catch { /* ya no existe */ } }
  return NextResponse.json({ ok: true, logo: ruta });
}
