import { NextRequest, NextResponse } from "next/server";
import { Document, Packer, Paragraph, TextRun, AlignmentType, BorderStyle, TabStopType } from "docx";
import { getSession } from "@/lib/auth";
import { getStudent, companyCanSeeStudent } from "@/lib/data";

export const runtime = "nodejs";

const FONT = "Garamond";
const t = (text: string, o: { bold?: boolean; italics?: boolean; size?: number } = {}) => new TextRun({ text, font: FONT, size: o.size ?? 22, bold: o.bold, italics: o.italics });
const RIGHT = 9360; // ancho útil en twips (Carta con márgenes de 1")
const row = (left: TextRun, right: string) =>
  new Paragraph({ tabStops: [{ type: TabStopType.RIGHT, position: RIGHT }], children: [left, t(`\t${right}`)] });
const heading = (text: string) =>
  new Paragraph({
    spacing: { before: 200, after: 80 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "000000", space: 1 } },
    children: [t(text.toUpperCase(), { bold: true })],
  });

/** Descarga el CV en Word (.docx) con estructura Harvard. */
export async function GET(req: NextRequest) {
  const u = getSession();
  if (!u) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  const id = Number(req.nextUrl.searchParams.get("student") || u.id);
  const allowed = u.role === "admin" || (u.role === "student" && u.id === id) || (u.role === "company" && companyCanSeeStudent(u.id, id));
  if (!allowed) return NextResponse.json({ error: "Sin permiso" }, { status: 403 });
  const s = getStudent(id);
  if (!s) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  const cv = s.cv;
  const p = cv.personal;
  const children: Paragraph[] = [
    new Paragraph({ alignment: AlignmentType.CENTER, children: [t(p.full_name || s.name, { bold: true, size: 32 })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [t([p.city, p.phone, p.email, p.linkedin, p.portfolio].filter(Boolean).join("  •  "), { size: 20 })] }),
  ];
  if (p.summary) children.push(heading("Perfil"), new Paragraph({ children: [t(p.summary)] }));
  const edu = cv.education.filter((e) => e.institution || e.degree);
  if (edu.length) children.push(heading("Educación"));
  for (const e of edu) {
    children.push(row(t(e.institution, { bold: true }), e.city), row(t(`${e.degree}${e.gpa ? ` — Promedio: ${e.gpa}` : ""}`, { italics: true }), e.dates));
    if (e.details) children.push(new Paragraph({ children: [t(e.details)] }));
  }
  const exp = cv.experience.filter((e) => e.company || e.role);
  if (exp.length) children.push(heading("Experiencia"));
  for (const e of exp) {
    children.push(row(t(e.company, { bold: true }), e.city), row(t(e.role, { italics: true }), e.dates));
    for (const b of e.bullets.filter(Boolean)) children.push(new Paragraph({ bullet: { level: 0 }, children: [t(b)] }));
  }
  const proj = cv.projects.filter((x) => x.title);
  if (proj.length) children.push(heading("Proyectos y liderazgo"));
  for (const x of proj) {
    children.push(row(t(x.title, { bold: true }), x.dates));
    if (x.role) children.push(new Paragraph({ children: [t(x.role, { italics: true })] }));
    if (x.description) children.push(new Paragraph({ children: [t(x.description)] }));
  }
  const skills = [["Técnicas", cv.skills.technical], ["Idiomas", cv.skills.languages], ["Certificaciones", cv.skills.certifications], ["Intereses", cv.skills.interests]].filter(([, v]) => v);
  if (skills.length) children.push(heading("Habilidades e información adicional"));
  for (const [k, v] of skills) children.push(new Paragraph({ children: [t(`${k}: `, { bold: true }), t(v)] }));

  const doc = new Document({
    styles: { default: { document: { run: { font: FONT, size: 22 } } } },
    sections: [{ properties: { page: { margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } } }, children }],
  });
  const buf = await Packer.toBuffer(doc);
  const name = `CV_Harvard_${(p.full_name || s.name).replace(/[^\p{L}\p{N}]+/gu, "_")}.docx`;
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(name)}`,
    },
  });
}
