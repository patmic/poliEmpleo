// Consultas de lectura usadas por las páginas (componentes de servidor).
import { getDb, getJobTags, getUserTags } from "./db";
import { computeMatch } from "./match";
import { parseCvJson, cvToText, type HarvardCv } from "./cv";

export interface Job {
  id: number; company_id: number; company_name: string; company_verified: boolean; title: string; description: string;
  requirements: string; responsibilities: string; city: string; modality: string; job_type: string; vacancies: number;
  salary: string; careers: string[]; deadline: string | null; status: string; created_at: string; tags: string[];
  applicant_count: number; match?: { score: number; matched: string[]; missing: string[] }; my_status?: string | null;
  acepta_discapacidad: boolean; company_rating: number; company_logo: string; plazo: Plazo;
}

/** Plazo restante: H = horas (rojo), S = semanas (amarillo), M = meses (azul), A = abierta sin fecha límite, C = cerrada. */
export interface Plazo { unidad: "H" | "S" | "M" | "A" | "C"; etiqueta: string }

/** Calcula el plazo restante hasta el fin del día límite (hora de Guayaquil, UTC-05:00). */
export function plazoDe(deadline: string | null, now = Date.now()): Plazo {
  if (!deadline) return { unidad: "A", etiqueta: "Abierta" };
  const horas = (Date.parse(`${deadline}T23:59:59-05:00`) - now) / 3600000;
  if (horas <= 0) return { unidad: "C", etiqueta: "Cerrada" };
  if (horas < 72) return { unidad: "H", etiqueta: `${Math.ceil(horas)} H` };
  const dias = horas / 24;
  if (dias < 60) return { unidad: "S", etiqueta: `${Math.ceil(dias / 7)} S` };
  return { unidad: "M", etiqueta: `${Math.ceil(dias / 30)} M` };
}

export interface Student {
  id: number; name: string; email: string; active: boolean; created_at: string; origin: "EPN" | "EXTERNO"; condicion: string; institution: string;
  career: string; semester: string; student_code: string; gpa: string; phone: string; city: string; linkedin: string;
  portfolio: string; headline: string; bio: string; modality_pref: string; cv: HarvardCv; cv_file: string; foto: string;
  cv_updated_at: string | null; tags: string[];
}

export interface Company {
  id: number; name: string; email: string; active: boolean; created_at: string; ruc: string; sector: string; size: string;
  city: string; website: string; phone: string; description: string; verified: boolean; tags: string[];
}

const s = (v: unknown) => (v === null || v === undefined ? "" : String(v));
const parseList = (v: unknown): string[] => {
  try { const a = JSON.parse(s(v) || "[]"); return Array.isArray(a) ? a.map(String) : []; } catch { return []; }
};

const JOB_SELECT = `
  SELECT j.*, u.name AS company_name, COALESCE(cp.verified,0) AS company_verified, COALESCE(cp.calificacion,0) AS company_rating, COALESCE(cp.logo,'') AS company_logo,
         (SELECT COUNT(*) FROM applications a WHERE a.job_id = j.id) AS applicant_count
  FROM jobs j JOIN users u ON u.id = j.company_id LEFT JOIN company_profiles cp ON cp.user_id = j.company_id`;

function toJob(r: Record<string, unknown>): Job {
  const db = getDb();
  return {
    id: Number(r.id), company_id: Number(r.company_id), company_name: s(r.company_name), company_verified: !!Number(r.company_verified),
    title: s(r.title), description: s(r.description), requirements: s(r.requirements), responsibilities: s(r.responsibilities),
    city: s(r.city), modality: s(r.modality), job_type: s(r.job_type), vacancies: Number(r.vacancies), salary: s(r.salary),
    careers: parseList(r.careers), deadline: r.deadline ? s(r.deadline) : null, status: s(r.status), created_at: s(r.created_at),
    tags: getJobTags(db, Number(r.id)), applicant_count: Number(r.applicant_count),
    acepta_discapacidad: !!Number(r.acepta_discapacidad), company_rating: Number(r.company_rating ?? 0), company_logo: s(r.company_logo),
    plazo: plazoDe(r.deadline ? s(r.deadline) : null),
  };
}

/** Agrega match y estado de postulación cuando quien mira es estudiante. */
function decorateForStudent(jobs: Job[], studentId?: number): Job[] {
  if (!studentId) return jobs;
  const st = getStudent(studentId);
  if (!st) return jobs;
  const text = cvToText(st.cv);
  const db = getDb();
  const mine = new Map(
    db.prepare("SELECT job_id, status FROM applications WHERE student_id = ?").all(studentId).map((r) => [Number(r.job_id), s(r.status)]),
  );
  return jobs.map((j) => ({ ...j, match: computeMatch(st.tags, st.career, j.tags, j.careers, text), my_status: mine.get(j.id) ?? null }));
}

export interface JobFilters { q?: string; modality?: string; type?: string; career?: string; tags?: string[]; mode?: "or" | "and"; companyId?: number; status?: string }

export function listJobs(f: JobFilters = {}, studentId?: number): Job[] {
  const db = getDb();
  const where: string[] = ["u.active = 1"];
  const params: unknown[] = [];
  if (f.status !== "all") { where.push("j.status = ?"); params.push(f.status ?? "active"); }
  if (f.companyId) { where.push("j.company_id = ?"); params.push(f.companyId); }
  if (f.modality) { where.push("j.modality = ?"); params.push(f.modality); }
  if (f.type) { where.push("j.job_type = ?"); params.push(f.type); }
  if (f.career) { where.push("(j.careers LIKE ? OR j.careers = '[]')"); params.push(`%"${f.career}"%`); }
  if (f.q) {
    where.push(`(j.title LIKE ? OR j.description LIKE ? OR j.requirements LIKE ? OR u.name LIKE ?
      OR EXISTS (SELECT 1 FROM job_tags jt JOIN tags t ON t.id = jt.tag_id WHERE jt.job_id = j.id AND t.name LIKE ?))`);
    const like = `%${f.q}%`;
    params.push(like, like, like, like, like);
  }
  let jobs = db.prepare(`${JOB_SELECT} WHERE ${where.join(" AND ")} ORDER BY j.created_at DESC`).all(...params).map(toJob);
  if (f.tags?.length) jobs = jobs.filter((j) => tagFilter(j.tags, f.tags!, f.mode));
  return decorateForStudent(jobs, studentId);
}

export function tagFilter(have: string[], wanted: string[], mode: "or" | "and" = "or") {
  const h = new Set(have.map((t) => t.toLowerCase()));
  return mode === "and" ? wanted.every((t) => h.has(t.toLowerCase())) : wanted.some((t) => h.has(t.toLowerCase()));
}

export function getJob(id: number, studentId?: number): Job | null {
  const r = getDb().prepare(`${JOB_SELECT} WHERE j.id = ?`).get(id);
  if (!r) return null;
  return decorateForStudent([toJob(r)], studentId)[0];
}

export function getStudent(id: number): Student | null {
  const db = getDb();
  const r = db.prepare(`SELECT u.id, u.name, u.email, u.active, u.created_at, p.* FROM users u
    JOIN student_profiles p ON p.user_id = u.id WHERE u.id = ? AND u.role = 'student'`).get(id);
  if (!r) return null;
  return {
    id: Number(r.id), name: s(r.name), email: s(r.email), active: !!Number(r.active), created_at: s(r.created_at),
    origin: s(r.origin) as Student["origin"], condicion: s(r.condicion), institution: s(r.institution), career: s(r.career), semester: s(r.semester),
    student_code: s(r.student_code), gpa: s(r.gpa), phone: s(r.phone), city: s(r.city), linkedin: s(r.linkedin),
    portfolio: s(r.portfolio), headline: s(r.headline), bio: s(r.bio), modality_pref: s(r.modality_pref),
    cv: parseCvJson(s(r.cv_json), { full_name: s(r.name), email: s(r.email), phone: s(r.phone) }),
    cv_file: s(r.cv_file), foto: s(r.foto), cv_updated_at: r.cv_updated_at ? s(r.cv_updated_at) : null, tags: getUserTags(db, id),
  };
}

export function getCompany(id: number): Company | null {
  const db = getDb();
  const r = db.prepare(`SELECT u.id, u.name, u.email, u.active, u.created_at, p.* FROM users u
    JOIN company_profiles p ON p.user_id = u.id WHERE u.id = ? AND u.role = 'company'`).get(id);
  if (!r) return null;
  return {
    id: Number(r.id), name: s(r.name), email: s(r.email), active: !!Number(r.active), created_at: s(r.created_at), ruc: s(r.ruc),
    sector: s(r.sector), size: s(r.size), city: s(r.city), website: s(r.website), phone: s(r.phone), description: s(r.description),
    verified: !!Number(r.verified), tags: getUserTags(db, id),
  };
}

export interface Application {
  id: number; job_id: number; student_id: number; status: string; match_score: number; rating: number | null; note: string;
  message: string; created_at: string; updated_at: string; job_title: string; company_id: number; company_name: string;
  student_name: string; student_origin: string; student_career: string; student_headline: string; student_tags: string[];
  events: { status: string; note: string; created_at: string }[];
}

const APP_SELECT = `
  SELECT a.*, j.title AS job_title, j.company_id, cu.name AS company_name, su.name AS student_name,
         sp.origin AS student_origin, sp.career AS student_career, sp.headline AS student_headline
  FROM applications a JOIN jobs j ON j.id = a.job_id JOIN users cu ON cu.id = j.company_id
  JOIN users su ON su.id = a.student_id JOIN student_profiles sp ON sp.user_id = a.student_id`;

function toApp(r: Record<string, unknown>, withEvents = true): Application {
  const db = getDb();
  return {
    id: Number(r.id), job_id: Number(r.job_id), student_id: Number(r.student_id), status: s(r.status), match_score: Number(r.match_score),
    rating: r.rating === null || r.rating === undefined ? null : Number(r.rating), note: s(r.note), message: s(r.message),
    created_at: s(r.created_at), updated_at: s(r.updated_at), job_title: s(r.job_title), company_id: Number(r.company_id),
    company_name: s(r.company_name), student_name: s(r.student_name), student_origin: s(r.student_origin),
    student_career: s(r.student_career), student_headline: s(r.student_headline),
    student_tags: getUserTags(db, Number(r.student_id)),
    events: withEvents
      ? db.prepare("SELECT status, note, created_at FROM application_events WHERE application_id = ? ORDER BY id").all(Number(r.id))
          .map((e) => ({ status: s(e.status), note: s(e.note), created_at: s(e.created_at) }))
      : [],
  };
}

export function studentApplications(studentId: number): Application[] {
  return getDb().prepare(`${APP_SELECT} WHERE a.student_id = ? ORDER BY a.updated_at DESC`).all(studentId).map((r) => toApp(r));
}

export function jobApplicants(jobId: number): Application[] {
  return getDb().prepare(`${APP_SELECT} WHERE a.job_id = ? ORDER BY a.match_score DESC`).all(jobId).map((r) => toApp(r, false));
}

export function getApplication(id: number): Application | null {
  const r = getDb().prepare(`${APP_SELECT} WHERE a.id = ?`).get(id);
  return r ? toApp(r) : null;
}

/** ¿La empresa tiene una postulación de este estudiante? (para permitir ver su CV) */
export function companyCanSeeStudent(companyId: number, studentId: number) {
  return !!getDb().prepare(`SELECT 1 FROM applications a JOIN jobs j ON j.id = a.job_id WHERE j.company_id = ? AND a.student_id = ?`)
    .get(companyId, studentId);
}

export function unreadCount(userId: number): number {
  return Number((getDb().prepare("SELECT COUNT(*) AS c FROM notifications WHERE user_id = ? AND is_read = 0").get(userId) as { c: number }).c);
}

export function listNotifications(userId: number) {
  return getDb().prepare("SELECT * FROM notifications WHERE user_id = ? ORDER BY id DESC LIMIT 100").all(userId).map((r) => ({
    id: Number(r.id), title: s(r.title), message: s(r.message), link: s(r.link), is_read: !!Number(r.is_read), created_at: s(r.created_at),
  }));
}

export function allTagNames(): string[] {
  return getDb().prepare("SELECT name FROM tags ORDER BY name").all().map((r) => s(r.name));
}

// ---------------- Buscador global ----------------

export interface SearchParams { q: string; cat: string; modality: string; career: string; tags: string[]; mode: "or" | "and" }

export function searchAll(p: SearchParams, viewerRole: string | null, studentId?: number) {
  const db = getDb();
  const q = p.q.trim().toLowerCase();
  const out: { jobs: Job[]; companies: Company[]; students: Student[] } = { jobs: [], companies: [], students: [] };

  if (p.cat === "all" || p.cat === "jobs") {
    out.jobs = listJobs({ q: p.q || undefined, modality: p.modality || undefined, career: p.career || undefined, tags: p.tags, mode: p.mode }, studentId);
  }
  if (p.cat === "all" || p.cat === "companies") {
    const ids = db.prepare("SELECT id FROM users WHERE role = 'company' AND active = 1").all().map((r) => Number(r.id));
    out.companies = ids.map((id) => getCompany(id)!).filter((c) => {
      if (q && ![c.name, c.sector, c.description, c.city, ...c.tags].join(" ").toLowerCase().includes(q)) return false;
      if (p.career && !c.sector.toLowerCase().includes(p.career.toLowerCase()) && !c.tags.includes(p.career)) return false;
      if (p.tags.length && !tagFilter(c.tags, p.tags, p.mode)) return false;
      return true;
    });
  }
  // Los perfiles de estudiantes solo son visibles para empresas y administración.
  if ((p.cat === "all" || p.cat === "students") && (viewerRole === "company" || viewerRole === "admin")) {
    const ids = db.prepare("SELECT id FROM users WHERE role = 'student' AND active = 1").all().map((r) => Number(r.id));
    out.students = ids.map((id) => getStudent(id)!).filter((st) => {
      const hay = [st.name, st.career, st.headline, st.bio, st.institution, ...st.tags, cvToText(st.cv)].join(" ").toLowerCase();
      if (q && !hay.includes(q)) return false;
      if (p.modality && st.modality_pref !== p.modality) return false;
      if (p.career && st.career !== p.career) return false;
      if (p.tags.length && !tagFilter(st.tags, p.tags, p.mode)) return false;
      return true;
    });
  }
  return out;
}

// ---------------- Analítica (administración y empresa) ----------------

export function adminStats() {
  const db = getDb();
  const n = (sql: string, ...a: unknown[]) => Number((db.prepare(sql).get(...a) as { c: number }).c);
  const kpis = {
    activeJobs: n("SELECT COUNT(*) c FROM jobs WHERE status='active'"),
    totalJobs: n("SELECT COUNT(*) c FROM jobs"),
    applications: n("SELECT COUNT(*) c FROM applications"),
    selected: n("SELECT COUNT(*) c FROM applications WHERE status='Seleccionado'"),
    students: n("SELECT COUNT(*) c FROM users WHERE role='student'"),
    epn: n("SELECT COUNT(*) c FROM student_profiles WHERE origin='EPN'"),
    external: n("SELECT COUNT(*) c FROM student_profiles WHERE origin='EXTERNO'"),
    companies: n("SELECT COUNT(*) c FROM users WHERE role='company'"),
    pendingCompanies: n("SELECT COUNT(*) c FROM company_profiles WHERE verified=0"),
  };
  const byStatus = db.prepare("SELECT status AS label, COUNT(*) AS value FROM applications GROUP BY status").all()
    .map((r) => ({ label: s(r.label), value: Number(r.value) }));
  const byCareer = db.prepare(`SELECT sp.career AS label, COUNT(a.id) AS value FROM applications a
      JOIN student_profiles sp ON sp.user_id = a.student_id GROUP BY sp.career ORDER BY value DESC`).all()
    .map((r) => ({ label: s(r.label) || "Sin carrera", value: Number(r.value) }));
  const topTags = db.prepare(`SELECT t.name AS tag,
        (SELECT COUNT(*) FROM job_tags jt JOIN jobs j ON j.id = jt.job_id WHERE jt.tag_id = t.id AND j.status='active') AS offers,
        (SELECT COUNT(*) FROM user_tags ut JOIN users u ON u.id = ut.user_id WHERE ut.tag_id = t.id AND u.role='student') AS students
      FROM tags t ORDER BY (offers + students) DESC, t.name LIMIT 10`).all()
    .map((r) => ({ tag: s(r.tag), offers: Number(r.offers), students: Number(r.students) }));
  const byModality = db.prepare("SELECT modality AS label, COUNT(*) AS value FROM jobs WHERE status='active' GROUP BY modality").all()
    .map((r) => ({ label: s(r.label), value: Number(r.value) }));
  return { kpis, byStatus, byCareer, topTags, byModality };
}
