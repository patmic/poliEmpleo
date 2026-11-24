import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { UPLOAD_DIR } from "@/lib/db";

export const runtime = "nodejs";

const MIME: Record<string, string> = { jpg: "image/jpeg", png: "image/png", webp: "image/webp" };

/** Sirve el logo de una empresa. Es público: se muestra en las vacantes. */
export async function GET(_req: Request, { params }: { params: { name: string } }) {
  const name = path.basename(params.name);
  if (!/^logo-\d+-\d+\.(jpg|png|webp)$/.test(name)) return NextResponse.json({ error: "Archivo no válido" }, { status: 400 });
  const file = path.join(UPLOAD_DIR, name);
  if (!fs.existsSync(file)) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  const ext = name.split(".").pop() ?? "jpg";
  return new NextResponse(new Uint8Array(fs.readFileSync(file)), { headers: { "Content-Type": MIME[ext], "Cache-Control": "public, max-age=3600" } });
}
