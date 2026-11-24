"use server";
// Acciones del servidor (formularios). Cada acción valida la sesión y el rol antes de escribir.
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import fs from "node:fs";
import path from "node:path";
import { getDb, tx, setUserTags, setJobTags, getUserTags, notify, uniq, UPLOAD_DIR } from "@/lib/db";
import { createSession, destroySession, requireUser, homeFor, type Role } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/passwords";
import { APP_STATUSES, CAREERS, JOB_TYPES, MODALITIES, origenDe, parseCondicion, tagCategory } from "@/lib/catalog";
import { computeMatch } from "@/lib/match";
import { lineaDe } from "@/lib/observatorio";
import { getStudent, getJob } from "@/lib/data";
import { cvToText, normalizeCv, type HarvardCv } from "@/lib/cv";

const str = (fd: FormData, k: string, max = 2000) => String(fd.get(k) ?? "").trim().slice(0, max);
const tagsFrom = (fd: FormData) => uniq(String(fd.get("tags") ?? "").split("|")).slice(0, 30);
const back = (path: string, msg: string, kind: "ok" | "error" = "ok") =>
  redirect(`${path}${path.includes("?") ? "&" : "?"}${kind}=${encodeURIComponent(msg)}`);

// ---------------- Autenticación ----------------

export async function loginAction(fd: FormData) {
  const email = str(fd, "email", 200).toLowerCase();
  const password = String(fd.get("password") ?? "");
  const row = getDb().prepare("SELECT id, password_hash, role, active FROM users WHERE email = ?").get(email);
  if (!row || !verifyPassword(password, String(row.password_hash))) back("/login", "Correo o contraseña incorrectos.", "error");
  if (!Number(row!.active)) back("/login", "Tu cuenta está desactivada. Contacta a la coordinación.", "error");
  createSession(Number(row!.id));
  const next = str(fd, "next", 200);
  redirect(next.startsWith("/") && !next.startsWith("//") ? next : homeFor(row!.role as Role));
}

export async function demoLoginAction(fd: FormData) {
  const email = str(fd, "email", 200);
  const row = getDb().prepare("SELECT id, role FROM users WHERE email = ? AND active = 1").get(email);
  if (!row) back("/login", "La cuenta de demostración no existe.", "error");
  createSession(Number(row!.id));
  redirect(homeFor(row!.role as Role));
}

export async function registerAction(fd: FormData) {
  const role = str(fd, "role") === "company" ? "company" : "student";
  const name = str(fd, "name", 120);
  const email = str(fd, "email", 200).toLowerCase();
  const password = String(fd.get("password") ?? "");
  if (!name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) back("/registro", "Completa nombre y un correo válido.", "error");
  if (password.length < 6) back("/registro", "La contraseña debe tener al menos 6 caracteres.", "error");
  const db = getDb();
  if (db.prepare("SELECT 1 FROM users WHERE email = ?").get(email)) back("/registro", "Ya existe una cuenta con ese correo.", "error");

  const id = tx((d) => {
    const r = d.prepare("INSERT INTO users (email, password_hash, role, name) VALUES (?, ?, ?, ?)").run(email, hashPassword(password), role, name);
    const uid = Number(r.lastInsertRowid);
    if (role === "student") {
      const condicion = parseCondicion(str(fd, "condicion"));
      const origin = origenDe(condicion);
      const institution = origin === "EPN" ? "Escuela Politécnica Nacional" : str(fd, "institution", 160) || "Otra institución";
      const career = CAREERS.includes(str(fd, "career") as (typeof CAREERS)[number]) ? str(fd, "career") : "";
      d.prepare("INSERT INTO student_profiles (user_id, origin, condicion, institution, career) VALUES (?, ?, ?, ?, ?)").run(uid, origin, condicion, institution, career);
      notify(d, uid, "¡Bienvenido/a!", "Completa tu perfil y tu CV para recibir ofertas con mayor afinidad.", "/estudiante/cv");
    } else {
      d.prepare("INSERT INTO company_profiles (user_id, ruc, sector) VALUES (?, ?, ?)").run(uid, str(fd, "ruc", 13), str(fd, "sector", 120));
      const admins = d.prepare("SELECT id FROM users WHERE role = 'admin'").all();
      for (const a of admins) notify(d, Number(a.id), "Nueva empresa registrada", `${name} espera verificación.`, "/admin/usuarios?rol=company");
    }
    return uid;
  });
  createSession(id);
  redirect(role === "student" ? "/estudiante/cv?ok=Cuenta+creada" : "/empresa/perfil?ok=Cuenta+creada");
}

export async function logoutAction() {
  destroySession();
  redirect("/");
}

// ---------------- Estudiante ----------------

/** Datos del perfil editados desde la hoja del CV. Cada campo guarda solo lo que llega. */
export async function updateStudentProfile(patch: { name?: string; phone?: string; city?: string; linkedin?: string; portfolio?: string; headline?: string; gpa?: string; career?: string; institution?: string }) {
  const u = requireUser("student");
  tx((db) => {
    if (typeof patch.name === "string") db.prepare("UPDATE users SET name = ? WHERE id = ?").run(patch.name.trim().slice(0, 120) || u.name, u.id);
    const sets: string[] = [];
    const vals: string[] = [];
    const put = (col: string, v: string | undefined, max: number) => {
      if (typeof v === "string") { sets.push(`${col} = ?`); vals.push(v.trim().slice(0, max)); }
    };
    put("phone", patch.phone, 30);
    put("city", patch.city, 80);
    put("linkedin", patch.linkedin, 200);
    put("portfolio", patch.portfolio, 200);
    put("headline", patch.headline, 140);
    put("gpa", patch.gpa, 10);
    if (typeof patch.career === "string") {
      sets.push("career = ?");
      vals.push(CAREERS.includes(patch.career as (typeof CAREERS)[number]) ? patch.career : "");
    }
    if (typeof patch.institution === "string") {
      // La institución solo la escribe el estudiante externo; para EPN queda fija.
      const row = db.prepare("SELECT origin FROM student_profiles WHERE user_id = ?").get(u.id);
      if (row && row.origin === "EXTERNO") { sets.push("institution = ?"); vals.push(patch.institution.trim().slice(0, 160)); }
    }
    if (sets.length) db.prepare(`UPDATE student_profiles SET ${sets.join(", ")} WHERE user_id = ?`).run(...vals, u.id);
  });
  revalidatePath("/", "layout");
}

/** Condición, semestre, código, modalidad y etiquetas: datos del perfil que no aparecen en el CV. */
export async function saveProfileMeta(fd: FormData) {
  const u = requireUser("student");
  const condicion = parseCondicion(str(fd, "condicion"));
  const origin = origenDe(condicion);
  tx((db) => {
    db.prepare(`UPDATE student_profiles SET origin=?, condicion=?, semester=?, student_code=?, modality_pref=?,
      institution = CASE WHEN ? = 'EPN' THEN 'Escuela Politécnica Nacional' WHEN institution = 'Escuela Politécnica Nacional' THEN '' ELSE institution END
      WHERE user_id=?`).run(origin, condicion, str(fd, "semester", 40), str(fd, "student_code", 20), str(fd, "modality_pref", 20), origin, u.id);
    setUserTags(db, u.id, tagsFrom(fd), tagCategory);
  });
  revalidatePath("/", "layout");
  back("/estudiante/cv", "Datos del perfil guardados.");
}

/** Guarda el CV Harvard (llamada desde el editor del cliente). */
export async function saveCv(cv: HarvardCv, addTags: string[] = []) {
  const u = requireUser("student");
  const clean = normalizeCv(cv);
  tx((db) => {
    db.prepare("UPDATE student_profiles SET cv_json = ?, cv_updated_at = datetime('now') WHERE user_id = ?").run(JSON.stringify(clean), u.id);
    if (addTags.length) setUserTags(db, u.id, [...getUserTags(db, u.id), ...addTags], tagCategory);
  });
  revalidatePath("/estudiante", "layout");
  return { ok: true, savedAt: new Date().toISOString() };
}

export async function applyAction(fd: FormData) {
  const u = requireUser("student");
  const jobId = Number(fd.get("job_id"));
  const job = getJob(jobId, u.id);
  if (!job || job.status !== "active") back(`/empleos/${jobId}`, "La vacante ya no recibe postulaciones.", "error");
  if (job!.my_status) back(`/empleos/${jobId}`, "Ya te postulaste a esta vacante.", "error");
  const st = getStudent(u.id)!;
  const m = computeMatch(st.tags, st.career, job!.tags, job!.careers, cvToText(st.cv));
  tx((db) => {
    const r = db.prepare("INSERT INTO applications (job_id, student_id, message, match_score) VALUES (?, ?, ?, ?)")
      .run(jobId, u.id, str(fd, "message", 1000), m.score);
    db.prepare("UPDATE applications SET linea_tecnica = (SELECT linea_tecnica FROM jobs WHERE id = ?) WHERE id = ?").run(jobId, Number(r.lastInsertRowid));
    db.prepare("INSERT INTO application_events (application_id, status, note) VALUES (?, 'En revisión', 'Postulación recibida')")
      .run(Number(r.lastInsertRowid));
    notify(db, job!.company_id, "Nueva postulación", `${u.name} se postuló a ${job!.title} (afinidad ${m.score}%).`, `/empresa/vacantes/${jobId}`);
  });
  revalidatePath("/", "layout");
  back(`/empleos/${jobId}`, "¡Postulación enviada! Puedes seguir su estado en «Mis postulaciones».");
}

export async function withdrawAction(fd: FormData) {
  const u = requireUser("student");
  const id = Number(fd.get("application_id"));
  const app = getDb().prepare("SELECT a.status, j.company_id, j.title FROM applications a JOIN jobs j ON j.id = a.job_id WHERE a.id = ? AND a.student_id = ?").get(id, u.id);
  if (app && app.status === "En revisión") {
    tx((db) => {
      db.prepare("DELETE FROM applications WHERE id = ?").run(id);
      notify(db, Number(app.company_id), "Postulación retirada", `${u.name} retiró su postulación a ${app.title}.`);
    });
  }
  revalidatePath("/", "layout");
  back("/estudiante/postulaciones", app?.status === "En revisión" ? "Postulación retirada." : "Solo puedes retirar postulaciones en revisión.", app?.status === "En revisión" ? "ok" : "error");
}

// ---------------- Empresa ----------------

export async function saveCompanyProfile(fd: FormData) {
  const u = requireUser("company");
  tx((db) => {
    db.prepare("UPDATE users SET name = ? WHERE id = ?").run(str(fd, "name", 160) || u.name, u.id);
    db.prepare("UPDATE company_profiles SET ruc=?, sector=?, size=?, city=?, website=?, phone=?, description=? WHERE user_id=?").run(
      str(fd, "ruc", 13), str(fd, "sector", 120), str(fd, "size", 40), str(fd, "city", 80), str(fd, "website", 200),
      str(fd, "phone", 30), str(fd, "description", 2000), u.id,
    );
    setUserTags(db, u.id, tagsFrom(fd), tagCategory);
  });
  revalidatePath("/", "layout");
  back("/empresa/perfil", "Perfil de empresa guardado.");
}

export async function saveJobAction(fd: FormData) {
  const u = requireUser("company");
  const id = Number(fd.get("id") || 0);
  const title = str(fd, "title", 140);
  const description = str(fd, "description", 4000);
  const formPath = id ? `/empresa/vacantes/${id}/editar` : "/empresa/vacantes/nueva";
  if (!title || !description) back(formPath, "El título y la descripción son obligatorios.", "error");
  const modality = MODALITIES.includes(str(fd, "modality") as (typeof MODALITIES)[number]) ? str(fd, "modality") : "Híbrido";
  const type = JOB_TYPES.includes(str(fd, "job_type") as (typeof JOB_TYPES)[number]) ? str(fd, "job_type") : "Tiempo completo";
  const careers = fd.getAll("careers").map(String).filter((c) => (CAREERS as readonly string[]).includes(c));
  const vals = [
    title, description, str(fd, "requirements", 3000), str(fd, "responsibilities", 3000), str(fd, "city", 80) || "Quito",
    modality, type, Math.max(1, Math.min(99, Number(fd.get("vacancies")) || 1)), str(fd, "salary", 80) || "A convenir",
    JSON.stringify(careers), str(fd, "deadline", 10) || null,
  ];
  const discap = fd.get("acepta_discapacidad") ? 1 : 0;
  const lineaTec = lineaDe(`${title} ${description} ${str(fd, "requirements", 3000)} ${str(fd, "responsibilities", 3000)}`);
  const jobId = tx((db) => {
    let jid = id;
    if (id) {
      const own = db.prepare("SELECT 1 FROM jobs WHERE id = ? AND company_id = ?").get(id, u.id);
      if (!own) throw new Error("No autorizado");
      db.prepare(`UPDATE jobs SET title=?, description=?, requirements=?, responsibilities=?, city=?, modality=?, job_type=?, vacancies=?,
        salary=?, careers=?, deadline=?, linea_tecnica=?, acepta_discapacidad=? WHERE id=?`).run(...vals, lineaTec, discap, id);
    } else {
      jid = Number(db.prepare(`INSERT INTO jobs (title, description, requirements, responsibilities, city, modality, job_type, vacancies,
        salary, careers, deadline, linea_tecnica, acepta_discapacidad, company_id) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(...vals, lineaTec, discap, u.id).lastInsertRowid);
    }
    setJobTags(db, jid, tagsFrom(fd), tagCategory);
    return jid;
  });
  revalidatePath("/", "layout");
  back(`/empresa/vacantes/${jobId}`, id ? "Vacante actualizada." : "Vacante publicada.");
}

export async function setJobStatusAction(fd: FormData) {
  const u = requireUser("company", "admin");
  const id = Number(fd.get("id"));
  const status = str(fd, "status");
  if (!["active", "paused", "closed"].includes(status)) return;
  const db = getDb();
  if (u.role === "company") db.prepare("UPDATE jobs SET status = ? WHERE id = ? AND company_id = ?").run(status, id, u.id);
  else {
    db.prepare("UPDATE jobs SET status = ? WHERE id = ?").run(status, id);
    const j = db.prepare("SELECT company_id, title FROM jobs WHERE id = ?").get(id);
    if (j && status !== "active") notify(db, Number(j.company_id), "Vacante moderada", `La coordinación cambió «${j.title}» a ${status === "paused" ? "pausada" : "cerrada"}.`, `/empresa/vacantes/${id}`);
  }
  revalidatePath("/", "layout");
  back(str(fd, "back", 200) || "/empresa", "Estado de la vacante actualizado.");
}

export async function deleteJobAction(fd: FormData) {
  const u = requireUser("company");
  getDb().prepare("DELETE FROM jobs WHERE id = ? AND company_id = ?").run(Number(fd.get("id")), u.id);
  revalidatePath("/", "layout");
  back("/empresa", "Vacante eliminada.");
}

/** Cambia el estado de una postulación, guarda nota/valoración, registra historial y notifica al estudiante. */
export async function updateApplicationAction(fd: FormData) {
  const u = requireUser("company", "admin");
  const id = Number(fd.get("application_id"));
  const db = getDb();
  const app = db.prepare("SELECT a.*, j.company_id, j.title, cu.name AS company FROM applications a JOIN jobs j ON j.id = a.job_id JOIN users cu ON cu.id = j.company_id WHERE a.id = ?").get(id);
  if (!app || (u.role === "company" && Number(app.company_id) !== u.id)) back("/empresa", "Postulación no encontrada.", "error");
  const status = str(fd, "status") || String(app!.status);
  if (!(APP_STATUSES as readonly string[]).includes(status)) return;
  const ratingRaw = fd.get("rating");
  const rating = ratingRaw === null ? app!.rating : ratingRaw === "" ? null : Math.max(1, Math.min(5, Number(ratingRaw)));
  const note = fd.has("note") ? str(fd, "note", 1000) : String(app!.note ?? "");
  tx((d) => {
    d.prepare("UPDATE applications SET status = ?, rating = ?, note = ?, updated_at = datetime('now') WHERE id = ?").run(status, rating, note, id);
    if (status !== app!.status) {
      d.prepare("INSERT INTO application_events (application_id, status, note) VALUES (?, ?, ?)").run(id, status, str(fd, "message", 500));
      const msg = str(fd, "message", 500);
      notify(d, Number(app!.student_id), `Tu postulación cambió a «${status}»`,
        `${app!.title} · ${app!.company}${msg ? ` — ${msg}` : ""}`, "/estudiante/postulaciones");
    }
  });
  revalidatePath("/", "layout");
  back(str(fd, "back", 200) || `/empresa/vacantes/${app!.job_id}`, "Postulación actualizada.");
}

// ---------------- Notificaciones ----------------

export async function markAllReadAction() {
  const u = requireUser();
  getDb().prepare("UPDATE notifications SET is_read = 1 WHERE user_id = ?").run(u.id);
  revalidatePath("/", "layout");
  redirect("/notificaciones");
}

export async function openNotificationAction(fd: FormData) {
  const u = requireUser();
  const id = Number(fd.get("id"));
  const row = getDb().prepare("SELECT link FROM notifications WHERE id = ? AND user_id = ?").get(id, u.id);
  getDb().prepare("UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?").run(id, u.id);
  revalidatePath("/", "layout");
  const link = String(row?.link ?? "");
  redirect(link.startsWith("/") ? link : "/notificaciones");
}

// ---------------- Administración ----------------

export async function toggleVerifyAction(fd: FormData) {
  requireUser("admin");
  const id = Number(fd.get("id"));
  const db = getDb();
  db.prepare("UPDATE company_profiles SET verified = 1 - verified WHERE user_id = ?").run(id);
  const v = db.prepare("SELECT verified FROM company_profiles WHERE user_id = ?").get(id);
  if (v && Number(v.verified)) notify(db, id, "Empresa verificada", "Tu empresa fue verificada por la coordinación. Tus vacantes mostrarán el sello de verificación.", "/empresa");
  revalidatePath("/", "layout");
  back("/admin/usuarios?rol=company", "Verificación actualizada.");
}

export async function toggleActiveAction(fd: FormData) {
  const me = requireUser("admin");
  const id = Number(fd.get("id"));
  if (id === me.id) back("/admin/usuarios", "No puedes desactivar tu propia cuenta.", "error");
  const db = getDb();
  db.prepare("UPDATE users SET active = 1 - active WHERE id = ? AND role != 'admin'").run(id);
  db.prepare("DELETE FROM sessions WHERE user_id = ?").run(id);
  revalidatePath("/", "layout");
  back(`/admin/usuarios${str(fd, "rol") ? `?rol=${str(fd, "rol")}` : ""}`, "Estado de la cuenta actualizado.");
}

// Utilidad para el editor de CV: etiquetas que ya tiene el estudiante.
export async function myTags() {
  const u = requireUser("student");
  return getUserTags(getDb(), u.id);
}


// ---------------- Foto y perfil profesional del postulante ----------------

const FOTO_TIPOS: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

function borrarFoto(nombre: string) {
  if (!nombre) return;
  try { fs.unlinkSync(path.join(UPLOAD_DIR, path.basename(nombre))); } catch { /* ya no existe */ }
}

export async function eliminarFotoAction() {
  const u = requireUser("student");
  const db = getDb();
  const previa = String((db.prepare("SELECT foto FROM student_profiles WHERE user_id = ?").get(u.id) as { foto?: string } | undefined)?.foto ?? "");
  db.prepare("UPDATE student_profiles SET foto = '' WHERE user_id = ?").run(u.id);
  borrarFoto(previa);
  revalidatePath("/", "layout");
  back("/empleos", "Ahora se usa la foto predeterminada.");
}

export async function updatePerfilProfesionalAction(fd: FormData) {
  const u = requireUser("student");
  getDb().prepare("UPDATE student_profiles SET headline = ?, bio = ? WHERE user_id = ?").run(str(fd, "headline", 140), str(fd, "bio", 2000), u.id);
  revalidatePath("/", "layout");
  back("/empleos", "Perfil profesional actualizado.");
}
