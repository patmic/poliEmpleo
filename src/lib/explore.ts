// Lógica de filtros y orden de la pantalla "Buscar empleo" (se ejecuta en el navegador).
import type { Job } from "./data";
import { ALL_TAGS, CAREERS, JOB_TYPES, MODALITIES } from "./catalog";

export type OptionKind = "Tipo" | "Modalidad" | "Carrera" | "Habilidad";

export const QUICK_OPTIONS: { label: string; kind: OptionKind }[] = [
  ...JOB_TYPES.map((label) => ({ label, kind: "Tipo" as const })),
  ...MODALITIES.map((label) => ({ label, kind: "Modalidad" as const })),
];

export const ALL_OPTIONS: string[] = [...JOB_TYPES, ...MODALITIES, ...CAREERS, ...ALL_TAGS];

export function kindOf(label: string): OptionKind {
  if ((JOB_TYPES as readonly string[]).includes(label)) return "Tipo";
  if ((MODALITIES as readonly string[]).includes(label)) return "Modalidad";
  if ((CAREERS as readonly string[]).includes(label)) return "Carrera";
  return "Habilidad";
}

const norm = (s: string) => s.trim().toLowerCase();

/** Opciones seleccionadas que cumple una vacante (tipo, modalidad, etiquetas o carreras). */
export function jobOptionsHit(job: Job, selected: string[]): string[] {
  const set = new Set([job.job_type, job.modality, ...job.tags, ...job.careers].map(norm));
  const openToAllCareers = job.careers.length === 0; // sin carreras definidas = abierta a todas
  return selected.filter(
    (o) => set.has(norm(o)) || (openToAllCareers && (CAREERS as readonly string[]).includes(o)),
  );
}

export interface RankedJob { job: Job; hits: string[]; coverage: number }

/**
 * Sin filtros: todas las vacantes, ordenadas por afinidad con el estudiante (o recientes).
 * Con filtros: las que cumplen al menos una opción, ordenadas por porcentaje de opciones cumplidas
 * y, en empate, por afinidad con el estudiante.
 */
export function rankJobs(jobs: Job[], selected: string[]): RankedJob[] {
  if (!selected.length) {
    return jobs
      .map((job) => ({ job, hits: [], coverage: 0 }))
      .sort((a, b) => (b.job.match?.score ?? 0) - (a.job.match?.score ?? 0));
  }
  return jobs
    .map((job) => {
      const hits = jobOptionsHit(job, selected);
      return { job, hits, coverage: hits.length / selected.length };
    })
    .filter((r) => r.hits.length > 0)
    .sort((a, b) => b.coverage - a.coverage || (b.job.match?.score ?? 0) - (a.job.match?.score ?? 0));
}
