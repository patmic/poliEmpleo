import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { REPORTES, toCsv } from "@/lib/reportes";

export const dynamic = "force-dynamic";

/** Descarga un reporte en CSV. Solo el rol administrador. */
export function GET(req: Request) {
  const u = getSession();
  if (!u || u.role !== "admin") return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  const tipo = new URL(req.url).searchParams.get("tipo") ?? "";
  if (!Object.prototype.hasOwnProperty.call(REPORTES, tipo)) return NextResponse.json({ error: "Reporte no válido" }, { status: 404 });
  const rep = REPORTES[tipo];
  const fecha = new Date().toISOString().slice(0, 10);
  return new NextResponse(toCsv(rep.headers, rep.rows()), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${tipo}-${fecha}.csv"`,
    },
  });
}
