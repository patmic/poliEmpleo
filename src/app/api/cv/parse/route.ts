import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getDb, UPLOAD_DIR } from "@/lib/db";
import { aiParse, localParse, pdfToText } from "@/lib/cvparse";

export const runtime = "nodejs";

const MAX = 5 * 1024 * 1024;

/** Recibe un PDF, lo guarda y devuelve los datos detectados (no modifica el CV hasta que el estudiante confirma). */
export async function POST(req: Request) {
  const u = getSession();
  if (!u || u.role !== "student") return NextResponse.json({ error: "Solo estudiantes pueden subir su CV." }, { status: 401 });
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Adjunta un archivo PDF." }, { status: 400 });
  if (file.size > MAX) return NextResponse.json({ error: "El PDF supera 5 MB." }, { status: 400 });
  const buf = Buffer.from(await file.arrayBuffer());
  if (buf.subarray(0, 5).toString() !== "%PDF-") return NextResponse.json({ error: "El archivo no es un PDF válido." }, { status: 400 });

  const name = `${u.id}-${Date.now()}.pdf`;
  fs.writeFileSync(path.join(UPLOAD_DIR, name), buf);
  getDb().prepare("UPDATE student_profiles SET cv_file = ? WHERE user_id = ?").run(name, u.id);

  let text = "";
  try { text = await pdfToText(buf); } catch { /* PDF escaneado o protegido */ }
  if (text.trim().length < 30) {
    return NextResponse.json({ cv: {}, tags: [], method: "local", fields: 0, file: name,
      warning: "No pudimos leer texto del PDF (¿es una imagen escaneada?). El archivo quedó adjunto a tu perfil; completa el CV a mano." });
  }
  const ai = await aiParse(text);
  const result = ai ?? localParse(text);
  const warning = !ai && process.env.AI_API_KEY ? "La IA no respondió; se usó el lector local." : undefined;
  return NextResponse.json({ ...result, file: name, warning });
}
