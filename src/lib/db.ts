import fs from "node:fs";
import path from "node:path";
import { seedDatabase, seedObservatorio } from "./seed";
import { lineaDe } from "./observatorio";
import { hashPassword } from "./passwords";

// SQLite nativo de Node 22 (node:sqlite). Se carga en tiempo de ejecución para
// que el empaquetador de Next.js no intente resolverlo.
type Row = Record<string, unknown>;
export interface Stmt {
  run(...params: unknown[]): { changes: number | bigint; lastInsertRowid: number | bigint };
  get(...params: unknown[]): Row | undefined;
  all(...params: unknown[]): Row[];
}
export interface Db {
  exec(sql: string): void;
  prepare(sql: string): Stmt;
}

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");
export const UPLOAD_DIR = path.join(DATA_DIR, "uploads");
const DB_FILE = path.join(DATA_DIR, "poliEmpleo.db");

const SCHEMA = `
PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('student','company','admin')),
  name TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_login TEXT
);

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS student_profiles (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  origin TEXT NOT NULL DEFAULT 'EPN' CHECK (origin IN ('EPN','EXTERNO')),
  condicion TEXT NOT NULL DEFAULT '',
  institution TEXT NOT NULL DEFAULT 'Escuela Politécnica Nacional',
  career TEXT DEFAULT '',
  semester TEXT DEFAULT '',
  student_code TEXT DEFAULT '',
  gpa TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  city TEXT DEFAULT 'Quito',
  linkedin TEXT DEFAULT '',
  portfolio TEXT DEFAULT '',
  headline TEXT DEFAULT '',
  bio TEXT DEFAULT '',
  modality_pref TEXT DEFAULT 'Híbrido',
  cv_json TEXT DEFAULT '{}',
  cv_file TEXT DEFAULT '',
  cv_updated_at TEXT
);

CREATE TABLE IF NOT EXISTS company_profiles (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  ruc TEXT DEFAULT '',
  sector TEXT DEFAULT '',
  size TEXT DEFAULT 'Mediana (51-250)',
  city TEXT DEFAULT 'Quito',
  website TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  description TEXT DEFAULT '',
  verified INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL COLLATE NOCASE,
  category TEXT NOT NULL DEFAULT 'Personalizada'
);

CREATE TABLE IF NOT EXISTS user_tags (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, tag_id)
);

CREATE TABLE IF NOT EXISTS jobs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  requirements TEXT DEFAULT '',
  responsibilities TEXT DEFAULT '',
  city TEXT DEFAULT 'Quito',
  modality TEXT NOT NULL DEFAULT 'Híbrido',
  job_type TEXT NOT NULL DEFAULT 'Tiempo completo',
  vacancies INTEGER NOT NULL DEFAULT 1,
  salary TEXT DEFAULT 'A convenir',
  careers TEXT NOT NULL DEFAULT '[]',
  deadline TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','closed')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS job_tags (
  job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (job_id, tag_id)
);

CREATE TABLE IF NOT EXISTS applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'En revisión' CHECK (status IN ('En revisión','Entrevista','Seleccionado','Rechazado')),
  match_score INTEGER NOT NULL DEFAULT 50,
  rating INTEGER,
  note TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (job_id, student_id)
);

CREATE TABLE IF NOT EXISTS application_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  note TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT DEFAULT '',
  is_read INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_jobs_company ON jobs(company_id, status);
CREATE INDEX IF NOT EXISTS idx_app_job ON applications(job_id);
CREATE INDEX IF NOT EXISTS idx_app_student ON applications(student_id);
CREATE TABLE IF NOT EXISTS senales (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fuente TEXT NOT NULL DEFAULT '',
  cargo TEXT NOT NULL,
  empresa TEXT NOT NULL DEFAULT '',
  ciudad TEXT NOT NULL DEFAULT '',
  linea_tecnica TEXT NOT NULL DEFAULT '',
  necesidad_inferida TEXT NOT NULL DEFAULT '',
  solucion_asociada TEXT NOT NULL DEFAULT '',
  prioridad TEXT NOT NULL DEFAULT 'Media',
  enlace TEXT NOT NULL DEFAULT '',
  fecha_corte TEXT NOT NULL DEFAULT (date('now')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS tic_proyectos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  periodo TEXT NOT NULL DEFAULT '2026-A',
  docente TEXT NOT NULL DEFAULT '',
  titulo TEXT NOT NULL,
  linea_tecnica TEXT NOT NULL DEFAULT '',
  estado TEXT NOT NULL DEFAULT 'PENDIENTE',
  fecha_aprobacion TEXT NOT NULL DEFAULT '',
  observaciones TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS tic_componentes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  proyecto_id INTEGER NOT NULL REFERENCES tic_proyectos(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  estudiante TEXT NOT NULL DEFAULT '',
  carrera TEXT NOT NULL DEFAULT '',
  linea_tecnica TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS retos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  titulo TEXT NOT NULL,
  origen TEXT NOT NULL DEFAULT '',
  linea_tecnica TEXT NOT NULL DEFAULT '',
  actividad TEXT NOT NULL DEFAULT '',
  entregable TEXT NOT NULL DEFAULT '',
  complejidad TEXT NOT NULL DEFAULT 'Media',
  impacto TEXT NOT NULL DEFAULT 'Medio',
  prioridad TEXT NOT NULL DEFAULT 'Media',
  tiempo_estimado TEXT NOT NULL DEFAULT '',
  docente_focal TEXT NOT NULL DEFAULT '',
  estado TEXT NOT NULL DEFAULT 'Idea',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS aliados (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  tipo_actor TEXT NOT NULL DEFAULT 'Otro',
  linea_tecnica TEXT NOT NULL DEFAULT '',
  oportunidad TEXT NOT NULL DEFAULT '',
  prioridad TEXT NOT NULL DEFAULT 'Media',
  estado TEXT NOT NULL DEFAULT 'Prospecto',
  proximo_paso TEXT NOT NULL DEFAULT '',
  fuente_url TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS atenciones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reto_id INTEGER REFERENCES retos(id) ON DELETE SET NULL,
  solicitante TEXT NOT NULL,
  linea_tecnica TEXT NOT NULL DEFAULT '',
  tipo TEXT NOT NULL DEFAULT 'Diagnóstico',
  estado TEXT NOT NULL DEFAULT 'Recibida',
  estudiantes INTEGER NOT NULL DEFAULT 0,
  horas INTEGER NOT NULL DEFAULT 0,
  evidencia_url TEXT NOT NULL DEFAULT '',
  escalable INTEGER NOT NULL DEFAULT 0,
  resultado TEXT NOT NULL DEFAULT '',
  fecha_recepcion TEXT NOT NULL DEFAULT (date('now')),
  fecha_cierre TEXT NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications(user_id, is_read);
`;


function addColumnIfMissing(db: Db, table: string, column: string, definition: string) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all().map((c) => String(c.name));
  if (!cols.includes(column)) db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
}

/** Asigna línea técnica a vacantes existentes a partir de su título, descripción y etiquetas. */
function backfillJobLineas(db: Db) {
  const pendientes = db.prepare("SELECT j.id, j.title, j.description, (SELECT GROUP_CONCAT(t.name, ' ') FROM job_tags jt JOIN tags t ON t.id = jt.tag_id WHERE jt.job_id = j.id) AS tags FROM jobs j WHERE j.linea_tecnica = ''").all();
  const upd = db.prepare("UPDATE jobs SET linea_tecnica = ? WHERE id = ?");
  for (const j of pendientes) {
    const linea = lineaDe(`${String(j.title ?? "")} ${String(j.description ?? "")} ${String(j.tags ?? "")}`);
    if (linea) upd.run(linea, Number(j.id));
  }
}

const g = globalThis as unknown as { __talentoDb?: Db };

export function getDb(): Db {
  if (g.__talentoDb) return g.__talentoDb;
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  const { DatabaseSync } = (process as unknown as { getBuiltinModule(n: string): { DatabaseSync: new (f: string) => Db } })
    .getBuiltinModule("node:sqlite");
  const db = new DatabaseSync(DB_FILE);
  db.exec(SCHEMA);
  // Migración: bases creadas antes de la columna condición.
  const cols = db.prepare("PRAGMA table_info(student_profiles)").all().map((c) => String(c.name));
  if (!cols.includes("condicion")) db.exec("ALTER TABLE student_profiles ADD COLUMN condicion TEXT NOT NULL DEFAULT ''");
  // Migración: columnas del Observatorio / Consultorio (postulaciones, empresas y vacantes).
  addColumnIfMissing(db, "jobs", "linea_tecnica", "TEXT NOT NULL DEFAULT ''");
  addColumnIfMissing(db, "jobs", "prioridad", "TEXT NOT NULL DEFAULT 'Media'");
  addColumnIfMissing(db, "applications", "linea_tecnica", "TEXT NOT NULL DEFAULT ''");
  addColumnIfMissing(db, "applications", "tipo_vinculacion", "TEXT NOT NULL DEFAULT 'Práctica preprofesional'");
  addColumnIfMissing(db, "applications", "rol_asignado", "TEXT NOT NULL DEFAULT ''");
  addColumnIfMissing(db, "applications", "horas", "INTEGER NOT NULL DEFAULT 0");
  addColumnIfMissing(db, "company_profiles", "tipo_actor", "TEXT NOT NULL DEFAULT ''");
  addColumnIfMissing(db, "company_profiles", "lineas", "TEXT NOT NULL DEFAULT ''");
  addColumnIfMissing(db, "company_profiles", "convenio_estado", "TEXT NOT NULL DEFAULT 'Sin contacto'");
  addColumnIfMissing(db, "company_profiles", "calificacion", "REAL NOT NULL DEFAULT 0");
  addColumnIfMissing(db, "company_profiles", "logo", "TEXT NOT NULL DEFAULT ''");
  addColumnIfMissing(db, "jobs", "acepta_discapacidad", "INTEGER NOT NULL DEFAULT 0");
  addColumnIfMissing(db, "student_profiles", "foto", "TEXT NOT NULL DEFAULT ''");
  db.exec("UPDATE student_profiles SET condicion = CASE WHEN origin = 'EPN' THEN (CASE WHEN lower(semester) LIKE '%gradu%' THEN 'Graduado EPN' ELSE 'Estudiante EPN' END) ELSE (CASE WHEN lower(semester) LIKE '%gradu%' THEN 'Graduado externo' ELSE 'Estudiante externo' END) END WHERE condicion = ''");
  const senales = db.prepare("SELECT COUNT(*) AS c FROM senales").get() as { c: number };
  if (Number(senales.c) === 0 && process.env.SEED_DEMO !== "false") seedObservatorio(db);
  const count = db.prepare("SELECT COUNT(*) AS c FROM users").get() as { c: number };
  if (Number(count.c) === 0 && process.env.SEED_DEMO !== "false") seedDatabase(db);
  // Administrador inicial para instalaciones sin datos de demostración.
  const adminEmail = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  const adminPass = process.env.ADMIN_PASSWORD || "";
  if (adminEmail && adminPass.length >= 6 && !db.prepare("SELECT 1 FROM users WHERE role = 'admin'").get()) {
    db.prepare("INSERT OR IGNORE INTO users (email, password_hash, role, name) VALUES (?, ?, 'admin', ?)")
      .run(adminEmail, hashPassword(adminPass), "Administración");
  }
  db.exec("UPDATE applications SET linea_tecnica = (SELECT j.linea_tecnica FROM jobs j WHERE j.id = applications.job_id) WHERE linea_tecnica = '' AND EXISTS (SELECT 1 FROM jobs j WHERE j.id = applications.job_id AND j.linea_tecnica <> '')");
  backfillJobLineas(db);
  g.__talentoDb = db;
  return db;
}

/** Ejecuta varias escrituras en una transacción. */
export function tx<T>(fn: (db: Db) => T): T {
  const db = getDb();
  db.exec("BEGIN");
  try {
    const out = fn(db);
    db.exec("COMMIT");
    return out;
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
}

// ---------- utilidades de etiquetas ----------

export function ensureTag(db: Db, name: string, category = "Personalizada"): number {
  const clean = name.trim().slice(0, 40);
  db.prepare("INSERT OR IGNORE INTO tags (name, category) VALUES (?, ?)").run(clean, category);
  return Number((db.prepare("SELECT id FROM tags WHERE name = ?").get(clean) as { id: number }).id);
}

export function setUserTags(db: Db, userId: number, tags: string[], catOf: (t: string) => string) {
  db.prepare("DELETE FROM user_tags WHERE user_id = ?").run(userId);
  const ins = db.prepare("INSERT OR IGNORE INTO user_tags (user_id, tag_id) VALUES (?, ?)");
  for (const t of uniq(tags)) ins.run(userId, ensureTag(db, t, catOf(t)));
}

export function setJobTags(db: Db, jobId: number, tags: string[], catOf: (t: string) => string) {
  db.prepare("DELETE FROM job_tags WHERE job_id = ?").run(jobId);
  const ins = db.prepare("INSERT OR IGNORE INTO job_tags (job_id, tag_id) VALUES (?, ?)");
  for (const t of uniq(tags)) ins.run(jobId, ensureTag(db, t, catOf(t)));
}

export function getUserTags(db: Db, userId: number): string[] {
  return db
    .prepare("SELECT t.name FROM tags t JOIN user_tags ut ON ut.tag_id = t.id WHERE ut.user_id = ? ORDER BY t.name")
    .all(userId)
    .map((r) => String(r.name));
}

export function getJobTags(db: Db, jobId: number): string[] {
  return db
    .prepare("SELECT t.name FROM tags t JOIN job_tags jt ON jt.tag_id = t.id WHERE jt.job_id = ? ORDER BY t.name")
    .all(jobId)
    .map((r) => String(r.name));
}

export function notify(db: Db, userId: number, title: string, message: string, link = "") {
  db.prepare("INSERT INTO notifications (user_id, title, message, link) VALUES (?, ?, ?, ?)").run(userId, title, message, link);
}

export function uniq(list: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of list) {
    const t = raw.trim();
    if (!t || seen.has(t.toLowerCase())) continue;
    seen.add(t.toLowerCase());
    out.push(t);
  }
  return out;
}
