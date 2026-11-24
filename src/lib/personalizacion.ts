// Porcentaje de personalización del CV: cuántas secciones clave del CV y del perfil están completas.
import type { Student } from "./data";

export interface CvCheck { label: string; done: boolean }

export function cvPersonalization(st: Student | null): { percent: number; checks: CvCheck[]; missing: string[] } {
  if (!st) return { percent: 0, checks: [], missing: [] };
  const cv = st.cv;
  const skillCount = [cv.skills.technical, cv.skills.languages, cv.skills.certifications]
    .join(",")
    .split(/[,;\n]/)
    .filter((x) => x.trim()).length;
  const checks: CvCheck[] = [
    { label: "Datos de contacto", done: !!(cv.personal.email && cv.personal.phone) },
    { label: "Resumen profesional", done: cv.personal.summary.trim().length >= 60 },
    { label: "Educación", done: cv.education.some((e) => e.institution.trim() && e.degree.trim()) },
    { label: "Experiencia", done: cv.experience.some((e) => e.company.trim() && e.role.trim()) },
    { label: "Proyectos o liderazgo", done: cv.projects.some((p) => p.title.trim()) },
    { label: "Habilidades (3 o más)", done: skillCount >= 3 },
    { label: "Etiquetas de tu perfil (3 o más)", done: st.tags.length >= 3 },
    { label: "CV actualizado", done: !!st.cv_updated_at },
  ];
  const done = checks.filter((c) => c.done).length;
  return {
    percent: Math.round((done / checks.length) * 100),
    checks,
    missing: checks.filter((c) => !c.done).map((c) => c.label),
  };
}
