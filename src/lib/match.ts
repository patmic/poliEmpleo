// Cálculo del porcentaje de afinidad ("match") entre un estudiante y una vacante.
//
//   base 35 + hasta 55 por etiquetas + 10 si la carrera del estudiante está entre las carreras afines.
//   Etiquetas: proporción de etiquetas de la vacante que el estudiante tiene (perfil + CV).
//   Si la vacante no tiene etiquetas, la parte de etiquetas vale la mitad (27).
//   Resultado entre 35 y 99. Colores del ScoreBadge: 70+ verde, 40-69 ámbar, <40 rojo.

export interface MatchResult { score: number; matched: string[]; missing: string[] }

const norm = (s: string) => s.trim().toLowerCase();

export function computeMatch(
  studentTags: string[],
  studentCareer: string | null | undefined,
  jobTags: string[],
  jobCareers: string[],
  extraText = "",
): MatchResult {
  const have = new Set(studentTags.map(norm));
  const text = norm(extraText);
  const matched: string[] = [];
  const missing: string[] = [];
  for (const t of jobTags) {
    if (have.has(norm(t)) || (text && text.includes(norm(t)))) matched.push(t);
    else missing.push(t);
  }
  const tagPart = jobTags.length ? (matched.length / jobTags.length) * 55 : 27;
  const careerOk = !jobCareers.length || (!!studentCareer && jobCareers.includes(studentCareer));
  const score = Math.min(99, Math.round(35 + tagPart + (careerOk ? 10 : 0)));
  return { score, matched, missing };
}
