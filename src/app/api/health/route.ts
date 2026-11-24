import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Usado por el healthcheck de Docker. */
export function GET() {
  getDb().prepare("SELECT 1").get();
  return NextResponse.json({ ok: true });
}
