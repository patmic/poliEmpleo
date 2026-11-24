"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getDb, tx } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { csvObjects } from "@/lib/csv";
import {
  ALIADO_ESTADOS, ATENCION_ESTADOS, CONVENIO_ESTADOS, IMPACTOS, LINEAS, NIVELES, PRIORIDADES, RETO_ESTADOS, ROLES_VINCULACION,
  TIPOS_ACTOR, TIPOS_ATENCION, TIPOS_VINCULACION, lineaDe, opcion,
} from "@/lib/observatorio";

const str = (fd: FormData, k: string, max = 300) => String(fd.get(k) ?? "").trim().slice(0, max);
const int = (fd: FormData | Record<string, string>, k: string, max = 9999) => {
  const v = fd instanceof FormData ? fd.get(k) : fd[k];
  return Math.max(0, Math.min(max, Math.floor(Number(v) || 0)));
};
const lin = (v: string) => ((LINEAS as readonly string[]).includes(v) ? v : "");
const cerrado = (estado: string) => (estado === "Entregada" || estado === "Cerrada" || estado === "Cerrado" ? new Date().toISOString().slice(0, 10) : "");

/** Vuelve a la página del panel con un mensaje de confirmación. */
function back(path: string, msg: string): never {
  revalidatePath("/admin", "layout");
  redirect(`${path}${path.includes("?") ? "&" : "?"}ok=${encodeURIComponent(msg)}`);
}

export async function createSenalAction(fd: FormData) {
  requireUser("admin");
  const cargo = str(fd, "cargo", 200);
  if (!cargo) back("/admin/datos", "Indica el cargo o señal.");
  const db = getDb();
  const linea = lin(str(fd, "linea_tecnica")) || lineaDe(`${cargo} ${str(fd, "necesidad_inferida")}`);
  db.prepare("INSERT INTO senales (fuente, cargo, empresa, ciudad, linea_tecnica, necesidad_inferida, solucion_asociada, prioridad, enlace) VALUES (?,?,?,?,?,?,?,?,?)")
    .run(str(fd, "fuente", 60), cargo, str(fd, "empresa", 120), str(fd, "ciudad", 60), linea, str(fd, "necesidad_inferida", 300),
      str(fd, "solucion_asociada", 200), opcion(PRIORIDADES, str(fd, "prioridad"), "Media"), str(fd, "enlace", 400));
  back("/admin/datos", "Señal registrada.");
}

export async function importSenalesAction(fd: FormData) {
  requireUser("admin");
  const rows = csvObjects(String(fd.get("csv") ?? "").slice(0, 500_000));
  const db = getDb();
  let n = 0;
  for (const r of rows) {
    const cargo = (r.cargo ?? "").trim();
    if (!cargo) continue;
    const linea = lin(r.linea_tecnica ?? "") || lineaDe(`${cargo} ${r.necesidad_inferida ?? ""}`);
    db.prepare("INSERT INTO senales (fuente, cargo, empresa, ciudad, linea_tecnica, necesidad_inferida, solucion_asociada, prioridad, enlace) VALUES (?,?,?,?,?,?,?,?,?)")
      .run(r.fuente ?? "", cargo, r.empresa ?? "", r.ciudad ?? "", linea, r.necesidad_inferida ?? "", r.solucion_asociada ?? "",
        opcion(PRIORIDADES, r.prioridad ?? "", "Media"), r.enlace ?? "");
    n++;
  }
  back("/admin/datos", `Importadas ${n} señales de ${rows.length} filas.`);
}

/** Capacidad TIC 2026-A: una fila por componente. Las filas con el mismo título se agrupan en un proyecto. */
export async function importTicAction(fd: FormData) {
  requireUser("admin");
  const rows = csvObjects(String(fd.get("csv") ?? "").slice(0, 500_000));
  let proyectos = 0;
  let componentes = 0;
  tx((db) => {
    for (const r of rows) {
      const titulo = (r.titulo ?? "").trim();
      if (!titulo) continue;
      const periodo = (r.periodo ?? "").trim() || "2026-A";
      let p = db.prepare("SELECT id FROM tic_proyectos WHERE titulo = ? AND periodo = ?").get(titulo, periodo) as { id: number } | undefined;
      if (!p) {
        const linea = lin(r.linea_proyecto ?? "") || lineaDe(titulo);
        const id = Number(db.prepare("INSERT INTO tic_proyectos (periodo, docente, titulo, linea_tecnica, estado, fecha_aprobacion, observaciones) VALUES (?,?,?,?,?,?,?)")
          .run(periodo, r.docente ?? "", titulo, linea, (r.estado || "PENDIENTE").toUpperCase(), r.fecha_aprobacion ?? "", r.observaciones ?? "").lastInsertRowid);
        p = { id };
        proyectos++;
      }
      const nombre = (r.componente ?? "").trim();
      if (!nombre) continue;
      const est = (r.estudiante ?? "").trim();
      const dup = db.prepare("SELECT 1 FROM tic_componentes WHERE proyecto_id = ? AND nombre = ? AND estudiante = ?").get(p.id, nombre, est);
      if (dup) continue;
      const proyLinea = (db.prepare("SELECT linea_tecnica FROM tic_proyectos WHERE id = ?").get(p.id) as { linea_tecnica: string }).linea_tecnica;
      const linea = lin(r.linea_componente ?? "") || lineaDe(nombre) || proyLinea;
      db.prepare("INSERT INTO tic_componentes (proyecto_id, nombre, estudiante, carrera, linea_tecnica) VALUES (?,?,?,?,?)")
        .run(p.id, nombre, est === "POR ASIGNAR" ? "" : est, (r.carrera ?? "").toUpperCase(), linea);
      componentes++;
    }
  });
  back("/admin/datos", `Importados ${proyectos} proyectos y ${componentes} componentes TIC.`);
}

export async function createRetoAction(fd: FormData) {
  requireUser("admin");
  const titulo = str(fd, "titulo", 200);
  if (!titulo) back("/admin/retos", "El reto necesita un título.");
  const linea = lin(str(fd, "linea_tecnica")) || lineaDe(titulo);
  getDb().prepare(`INSERT INTO retos (titulo, origen, linea_tecnica, actividad, entregable, complejidad, impacto, prioridad, tiempo_estimado, docente_focal, estado)
      VALUES (?,?,?,?,?,?,?,?,?,?,?)`).run(
    titulo, str(fd, "origen", 300), linea, str(fd, "actividad", 500), str(fd, "entregable", 300),
    opcion(NIVELES, str(fd, "complejidad"), "Media"), opcion(IMPACTOS, str(fd, "impacto"), "Medio"), opcion(PRIORIDADES, str(fd, "prioridad"), "Media"),
    str(fd, "tiempo_estimado", 60), str(fd, "docente_focal", 120), opcion(RETO_ESTADOS, str(fd, "estado"), "Idea"),
  );
  back("/admin/retos", "Reto registrado.");
}

export async function updateRetoAction(fd: FormData) {
  requireUser("admin");
  getDb().prepare("UPDATE retos SET estado = ?, prioridad = ?, docente_focal = ? WHERE id = ?").run(
    opcion(RETO_ESTADOS, str(fd, "estado"), "Idea"), opcion(PRIORIDADES, str(fd, "prioridad"), "Media"), str(fd, "docente_focal", 120), int(fd, "id"),
  );
  back("/admin/retos", "Reto actualizado.");
}

export async function createAliadoAction(fd: FormData) {
  requireUser("admin");
  const nombre = str(fd, "nombre", 160);
  if (!nombre) back("/admin/aliados", "Indica el nombre del aliado.");
  getDb().prepare("INSERT INTO aliados (nombre, tipo_actor, linea_tecnica, oportunidad, prioridad, estado, proximo_paso, fuente_url) VALUES (?,?,?,?,?,?,?,?)").run(
    nombre, opcion(TIPOS_ACTOR, str(fd, "tipo_actor"), "Otro"), lin(str(fd, "linea_tecnica")), str(fd, "oportunidad", 300),
    opcion(PRIORIDADES, str(fd, "prioridad"), "Media"), opcion(ALIADO_ESTADOS, str(fd, "estado"), "Prospecto"), str(fd, "proximo_paso", 200), str(fd, "fuente_url", 400),
  );
  back("/admin/aliados", "Aliado registrado.");
}

export async function updateAliadoAction(fd: FormData) {
  requireUser("admin");
  getDb().prepare("UPDATE aliados SET estado = ?, prioridad = ?, proximo_paso = ? WHERE id = ?").run(
    opcion(ALIADO_ESTADOS, str(fd, "estado"), "Prospecto"), opcion(PRIORIDADES, str(fd, "prioridad"), "Media"), str(fd, "proximo_paso", 200), int(fd, "id"),
  );
  back("/admin/aliados", "Aliado actualizado.");
}

/** Registro de empresa: tipo de actor, líneas de interés y estado del convenio. */
export async function updateEmpresaVinculoAction(fd: FormData) {
  requireUser("admin");
  const lineas = fd.getAll("lineas").map(String).filter((l) => (LINEAS as readonly string[]).includes(l)).join("; ");
  const calificacion = Math.max(0, Math.min(5, Math.round((Number(fd.get("calificacion")) || 0) * 10) / 10));
  getDb().prepare("UPDATE company_profiles SET tipo_actor = ?, convenio_estado = ?, lineas = ?, calificacion = ? WHERE user_id = ?").run(
    opcion(TIPOS_ACTOR, str(fd, "tipo_actor"), "Otro"), opcion(CONVENIO_ESTADOS, str(fd, "convenio_estado"), "Sin contacto"), lineas, calificacion, int(fd, "user_id"),
  );
  back("/admin/aliados", "Empresa actualizada.");
}

export async function createAtencionAction(fd: FormData) {
  requireUser("admin");
  const solicitante = str(fd, "solicitante", 160);
  if (!solicitante) back("/admin/atenciones", "Indica quién solicita la atención.");
  const retoId = int(fd, "reto_id") || null;
  const estado = opcion(ATENCION_ESTADOS, str(fd, "estado"), "Recibida");
  getDb().prepare(`INSERT INTO atenciones (reto_id, solicitante, linea_tecnica, tipo, estado, estudiantes, horas, escalable, resultado, fecha_cierre)
      VALUES (?,?,?,?,?,?,?,?,?,?)`).run(
    retoId, solicitante, lin(str(fd, "linea_tecnica")), opcion(TIPOS_ATENCION, str(fd, "tipo"), "Diagnóstico"), estado,
    int(fd, "estudiantes", 99), int(fd, "horas", 9999), fd.get("escalable") ? 1 : 0, str(fd, "resultado", 500), cerrado(estado),
  );
  back("/admin/atenciones", "Atención registrada.");
}

export async function updateAtencionAction(fd: FormData) {
  requireUser("admin");
  const estado = opcion(ATENCION_ESTADOS, str(fd, "estado"), "Recibida");
  getDb().prepare(`UPDATE atenciones SET estado = ?, estudiantes = ?, horas = ?, evidencia_url = ?, escalable = ?, resultado = ?,
      fecha_cierre = CASE WHEN ? <> '' AND fecha_cierre = '' THEN ? ELSE fecha_cierre END WHERE id = ?`).run(
    estado, int(fd, "estudiantes", 99), int(fd, "horas", 9999), str(fd, "evidencia_url", 400), fd.get("escalable") ? 1 : 0,
    str(fd, "resultado", 500), cerrado(estado), cerrado(estado), int(fd, "id"),
  );
  back("/admin/atenciones", "Atención actualizada.");
}

/** Vinculación académica de una postulación: tipo, rol, horas y línea técnica. */
export async function updateVinculacionAction(fd: FormData) {
  requireUser("admin");
  getDb().prepare("UPDATE applications SET tipo_vinculacion = ?, rol_asignado = ?, horas = ?, linea_tecnica = ? WHERE id = ?").run(
    opcion(TIPOS_VINCULACION, str(fd, "tipo_vinculacion"), "Práctica preprofesional"), opcion(ROLES_VINCULACION, str(fd, "rol_asignado"), "Otro"),
    int(fd, "horas", 9999), lin(str(fd, "linea_tecnica")), int(fd, "id"),
  );
  back("/admin/postulaciones", "Vinculación actualizada.");
}
