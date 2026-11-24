import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { UPLOAD_DIR } from "@/lib/db";
import { companyCanSeeStudent } from "@/lib/data";

export const runtime = "nodejs";

const TIPOS: Record<string, string> = { jpg: "image/jpeg", png: "image/png", webp: "image/webp" };

/** Sirve la foto de perfil del postulante. Nombre: foto-<idEstudiante>-<marca>.<ext> */
export async function GET(_req: Request, { params }: { params: { name: string } }) {
  const u = getSession();
  if (!u) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  const name = path.basename(params.name);
  const m = /^foto-(\d+)-\d+\.(jpg|png|webp)$/.exec(name);
  if (!m) return NextResponse.json({ error: "Archivo no válido" }, { status: 400 });
  const owner = Number(m[1]);
  const ok = u.role === "admin" || u.id === owner || (u.role === "company" && companyCanSeeStudent(u.id, owner));
  if (!ok) return NextResponse.json({ error: "Sin permiso" }, { status: 403 });
  const file = path.join(UPLOAD_DIR, name);
  if (!fs.existsSync(file)) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return new NextResponse(new Uint8Array(fs.readFileSync(file)), {
    headers: { "Content-Type": TIPOS[m[2]], "Cache-Control": "private, max-age=300" },
  });
}
