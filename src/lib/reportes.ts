// Consultas de los reportes del rol Administrador (Observatorio, Consultorio, Aliados, Banco de retos).
import { getDb } from "./db";
import { ATENCION_ESTADOS, LINEAS, TIPOS_ACTOR } from "./observatorio";

type Row = Record<string, unknown>;
const num = (v: unknown) => Number(v ?? 0);
const txt = (v: unknown) => (v == null ? "" : String(v));

function count(sql: string, ...params: unknown[]) {
  return num((getDb().prepare(sql).get(...params) as Row | undefined)?.c);
}

/** KPIs del Anexo 4 del Observatorio, con las metas de 48 h y 30 días del documento. */
export function kpisObservatorio() {
  const senales = count("SELECT COUNT(*) c FROM senales");
  const senalesConEnlace = count("SELECT COUNT(*) c FROM senales WHERE enlace <> ''");
  const enProceso = "('Priorizado','En diseño','Piloto','Ejecución')";
  return [
    { dimension: "Vigilancia", kpi: "Señales tecnológicas codificadas", valor: senales, meta: "20 a 30 (48 h) · 40 (30 días)" },
    { dimension: "Inteligencia", kpi: "Categorías de necesidad priorizadas", valor: count("SELECT COUNT(DISTINCT linea_tecnica) c FROM senales WHERE linea_tecnica <> ''"), meta: "6 (48 h) · 8 (30 días)" },
    { dimension: "Vinculación", kpi: "Retos formulados", valor: count("SELECT COUNT(*) c FROM retos"), meta: "8 (48 h) · 15 (30 días)" },
    { dimension: "Vinculación", kpi: "Retos priorizados o en ejecución", valor: count(`SELECT COUNT(*) c FROM retos WHERE estado IN ${enProceso}`), meta: "5 piloto" },
    { dimension: "Gobernanza", kpi: "Docentes focales designados", valor: count("SELECT COUNT(DISTINCT docente_focal) c FROM retos WHERE docente_focal <> ''"), meta: "5 (48 h) · 6 (30 días)" },
    { dimension: "Participación", kpi: "Estudiantes activados (postulación o vinculación en línea técnica)", valor: count("SELECT COUNT(DISTINCT student_id) c FROM applications WHERE linea_tecnica <> ''"), meta: "10 (48 h) · 20 (30 días)" },
    { dimension: "Ejecución", kpi: "Casos piloto atendidos", valor: count("SELECT COUNT(*) c FROM atenciones WHERE estado IN ('Entregada','Cerrada')"), meta: "0-1 (48 h) · 3-5 (30 días)" },
    { dimension: "Trazabilidad", kpi: "Productos intermedios documentados", valor: count("SELECT COUNT(*) c FROM atenciones WHERE evidencia_url <> ''"), meta: "8 (48 h) · 25 (30 días)" },
    { dimension: "Impacto", kpi: "Casos escalables", valor: count("SELECT COUNT(*) c FROM atenciones WHERE escalable = 1"), meta: "2 (48 h) · 5 (30 días)" },
    { dimension: "Pertinencia", kpi: "Señales con evidencia pública verificable (%)", valor: senales ? Math.round((senalesConEnlace / senales) * 100) : 0, meta: "80% (48 h) · 90% (30 días)" },
    { dimension: "Aliados", kpi: "Aliados con convenio o en proceso", valor: count("SELECT COUNT(*) c FROM aliados WHERE estado IN ('Contactado','En negociación','Convenio firmado')") + count("SELECT COUNT(*) c FROM company_profiles WHERE convenio_estado IN ('Contactado','En negociación','Convenio firmado')"), meta: "Base para carta de intención" },
  ];
}

/** Cruce línea técnica: demanda externa, vacantes, postulaciones, capacidad TIC y consultorio. */
export function pertinenciaPorLinea() {
  return LINEAS.map((linea) => {
    const senales = count("SELECT COUNT(*) c FROM senales WHERE linea_tecnica = ?", linea);
    const retos = count("SELECT COUNT(*) c FROM retos WHERE linea_tecnica = ?", linea);
    return {
      linea,
      senales,
      senales_alta: count("SELECT COUNT(*) c FROM senales WHERE linea_tecnica = ? AND prioridad = 'Alta'", linea),
      vacantes_activas: count("SELECT COUNT(*) c FROM jobs WHERE linea_tecnica = ? AND status = 'active'", linea),
      postulaciones: count("SELECT COUNT(*) c FROM applications WHERE linea_tecnica = ?", linea),
      retos,
      tic_proyectos: count("SELECT COUNT(*) c FROM tic_proyectos WHERE linea_tecnica = ?", linea),
      tic_componentes: count("SELECT COUNT(*) c FROM tic_componentes WHERE linea_tecnica = ?", linea),
      tic_estudiantes: count("SELECT COUNT(*) c FROM tic_componentes WHERE linea_tecnica = ? AND estudiante <> '' AND estudiante <> 'POR ASIGNAR'", linea),
      atenciones: count("SELECT COUNT(*) c FROM atenciones WHERE linea_tecnica = ?", linea),
      brecha: senales - retos,
    };
  });
}

export function consultorioFlujo() {
  const db = getDb();
  const porEstado = ATENCION_ESTADOS.map((estado) => {
    const r = db.prepare("SELECT COUNT(*) c, COALESCE(SUM(estudiantes),0) e, COALESCE(SUM(horas),0) h FROM atenciones WHERE estado = ?").get(estado) as Row;
    return { estado, casos: num(r.c), estudiantes: num(r.e), horas: num(r.h) };
  });
  const porLinea = db.prepare(`SELECT linea_tecnica AS linea, COUNT(*) AS casos, COALESCE(SUM(estudiantes),0) AS estudiantes,
      COALESCE(SUM(horas),0) AS horas, SUM(CASE WHEN escalable = 1 THEN 1 ELSE 0 END) AS escalables
    FROM atenciones GROUP BY linea_tecnica ORDER BY casos DESC`).all()
    .map((r) => ({ linea: txt(r.linea) || "Sin línea", casos: num(r.casos), estudiantes: num(r.estudiantes), horas: num(r.horas), escalables: num(r.escalables) }));
  const casos = db.prepare(`SELECT a.*, r.titulo AS reto FROM atenciones a LEFT JOIN retos r ON r.id = a.reto_id ORDER BY a.fecha_recepcion DESC, a.id DESC`).all()
    .map((r) => ({
      id: num(r.id), solicitante: txt(r.solicitante), reto: txt(r.reto), linea: txt(r.linea_tecnica), tipo: txt(r.tipo), estado: txt(r.estado),
      estudiantes: num(r.estudiantes), horas: num(r.horas), evidencia_url: txt(r.evidencia_url), escalable: num(r.escalable) === 1,
      resultado: txt(r.resultado), fecha_recepcion: txt(r.fecha_recepcion), fecha_cierre: txt(r.fecha_cierre),
    }));
  return { porEstado, porLinea, casos };
}

/** Matriz de aliados: empresas registradas y aliados prospectados, por tipo de actor y estado de convenio. */
export function aliadosMatriz() {
  const db = getDb();
  return TIPOS_ACTOR.map((tipo) => {
    const emp = db.prepare("SELECT COUNT(*) c, SUM(CASE WHEN convenio_estado = 'Convenio firmado' THEN 1 ELSE 0 END) f, SUM(CASE WHEN convenio_estado IN ('Prospecto','Contactado','En negociación') THEN 1 ELSE 0 END) p FROM company_profiles WHERE tipo_actor = ?").get(tipo) as Row;
    const ali = db.prepare("SELECT COUNT(*) c, SUM(CASE WHEN estado = 'Convenio firmado' THEN 1 ELSE 0 END) f, SUM(CASE WHEN estado IN ('Prospecto','Contactado','En negociación') THEN 1 ELSE 0 END) p FROM aliados WHERE tipo_actor = ?").get(tipo) as Row;
    return {
      tipo,
      empresas: num(emp.c),
      aliados: num(ali.c),
      en_proceso: num(emp.p) + num(ali.p),
      convenios: num(emp.f) + num(ali.f),
    };
  }).filter((r) => r.empresas + r.aliados > 0);
}

export function listaAliados() {
  const db = getDb();
  const prospectos = db.prepare("SELECT * FROM aliados ORDER BY prioridad, nombre").all().map((r) => ({
    id: num(r.id), nombre: txt(r.nombre), tipo_actor: txt(r.tipo_actor), linea: txt(r.linea_tecnica), oportunidad: txt(r.oportunidad),
    prioridad: txt(r.prioridad), estado: txt(r.estado), proximo_paso: txt(r.proximo_paso), fuente_url: txt(r.fuente_url), origen: "Prospecto", calificacion: 0,
  }));
  const empresas = db.prepare(`SELECT u.id, u.name, cp.tipo_actor, cp.lineas, cp.convenio_estado, cp.verified, cp.calificacion FROM company_profiles cp
    JOIN users u ON u.id = cp.user_id ORDER BY u.name`).all().map((r) => ({
    id: num(r.id), nombre: txt(r.name), tipo_actor: txt(r.tipo_actor), linea: txt(r.lineas), oportunidad: "", prioridad: "",
    estado: txt(r.convenio_estado), proximo_paso: "", fuente_url: "", origen: num(r.verified) ? "Empresa verificada" : "Empresa registrada", calificacion: num(r.calificacion),
  }));
  return { prospectos, empresas };
}

export function listaRetos() {
  return getDb().prepare(`SELECT * FROM retos ORDER BY CASE prioridad WHEN 'Alta' THEN 1 WHEN 'Media' THEN 2 ELSE 3 END, id`).all().map((r) => ({
    id: num(r.id), titulo: txt(r.titulo), origen: txt(r.origen), linea: txt(r.linea_tecnica), actividad: txt(r.actividad), entregable: txt(r.entregable),
    complejidad: txt(r.complejidad), impacto: txt(r.impacto), prioridad: txt(r.prioridad), tiempo: txt(r.tiempo_estimado),
    docente: txt(r.docente_focal), estado: txt(r.estado),
  }));
}

export function listaSenales() {
  return getDb().prepare("SELECT * FROM senales ORDER BY id").all().map((r) => ({
    id: num(r.id), fuente: txt(r.fuente), cargo: txt(r.cargo), empresa: txt(r.empresa), ciudad: txt(r.ciudad), linea: txt(r.linea_tecnica),
    necesidad: txt(r.necesidad_inferida), solucion: txt(r.solucion_asociada), prioridad: txt(r.prioridad), enlace: txt(r.enlace),
  }));
}

/** Postulaciones con su vinculación académica (tipo, rol, horas), para el registro y el reporte. */
export function listaVinculaciones() {
  return getDb().prepare(`SELECT a.id, a.status, a.linea_tecnica, a.tipo_vinculacion, a.rol_asignado, a.horas, a.created_at,
      j.title AS vacante, u.name AS empresa, s.name AS postulante, sp.condicion, sp.career
    FROM applications a JOIN jobs j ON j.id = a.job_id JOIN users u ON u.id = j.company_id
    JOIN users s ON s.id = a.student_id LEFT JOIN student_profiles sp ON sp.user_id = a.student_id
    ORDER BY a.created_at DESC, a.id DESC LIMIT 300`).all().map((r) => ({
    id: num(r.id), estado: txt(r.status), linea: txt(r.linea_tecnica), tipo: txt(r.tipo_vinculacion), rol: txt(r.rol_asignado),
    horas: num(r.horas), vacante: txt(r.vacante), empresa: txt(r.empresa), postulante: txt(r.postulante), condicion: txt(r.condicion), carrera: txt(r.career),
    fecha: txt(r.created_at),
  }));
}

export function vinculacionResumen() {
  return getDb().prepare(`SELECT tipo_vinculacion AS tipo, linea_tecnica AS linea, COUNT(*) AS postulaciones,
      SUM(CASE WHEN status = 'Seleccionado' THEN 1 ELSE 0 END) AS seleccionados, COALESCE(SUM(horas), 0) AS horas
    FROM applications GROUP BY tipo_vinculacion, linea_tecnica ORDER BY postulaciones DESC`).all().map((r) => ({
    tipo: txt(r.tipo), linea: txt(r.linea) || "Sin línea", postulaciones: num(r.postulaciones), seleccionados: num(r.seleccionados), horas: num(r.horas),
  }));
}


/** Serializa filas a CSV compatible con Excel en español (separador ;, BOM UTF-8). */
export function toCsv(headers: string[], rows: (string | number | boolean)[][]): string {
  const esc = (v: string | number | boolean) => {
    const s = typeof v === "boolean" ? (v ? "Sí" : "No") : String(v);
    return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [headers, ...rows].map((r) => r.map(esc).join(";"));
  return "﻿" + lines.join("\r\n");
}

/** Reportes exportables a CSV desde /admin/reportes/exportar?tipo=... */
export const REPORTES: Record<string, { titulo: string; headers: string[]; rows: () => (string | number | boolean)[][] }> = {
  kpis: {
    titulo: "KPIs del Observatorio",
    headers: ["Dimensión", "KPI", "Valor actual", "Meta"],
    rows: () => kpisObservatorio().map((k) => [k.dimension, k.kpi, k.valor, k.meta]),
  },
  pertinencia: {
    titulo: "Pertinencia por línea técnica",
    headers: ["Línea técnica", "Señales", "Señales prioridad alta", "Vacantes activas", "Postulaciones", "Retos", "Proyectos TIC", "Componentes TIC", "Estudiantes TIC asignados", "Atenciones consultorio", "Brecha (señales − retos)"],
    rows: () => pertinenciaPorLinea().map((r) => [r.linea, r.senales, r.senales_alta, r.vacantes_activas, r.postulaciones, r.retos, r.tic_proyectos, r.tic_componentes, r.tic_estudiantes, r.atenciones, r.brecha]),
  },
  senales: {
    titulo: "Matriz de señales laborales",
    headers: ["Fuente", "Cargo", "Empresa", "Ciudad", "Línea técnica", "Necesidad inferida", "Solución asociada", "Prioridad", "Enlace"],
    rows: () => listaSenales().map((s) => [s.fuente, s.cargo, s.empresa, s.ciudad, s.linea, s.necesidad, s.solucion, s.prioridad, s.enlace]),
  },
  retos: {
    titulo: "Banco de retos tecnológicos",
    headers: ["ID", "Reto", "Origen", "Línea técnica", "Actividad", "Entregable", "Complejidad", "Impacto", "Prioridad", "Tiempo", "Docente focal", "Estado"],
    rows: () => listaRetos().map((r) => [r.id, r.titulo, r.origen, r.linea, r.actividad, r.entregable, r.complejidad, r.impacto, r.prioridad, r.tiempo, r.docente, r.estado]),
  },
  aliados: {
    titulo: "Matriz de aliados y convenios",
    headers: ["Origen", "Nombre", "Tipo de actor", "Línea técnica", "Estado", "Oportunidad", "Prioridad", "Próximo paso", "Fuente"],
    rows: () => {
      const { prospectos, empresas } = listaAliados();
      return [...prospectos, ...empresas].map((a) => [a.origen, a.nombre, a.tipo_actor, a.linea, a.estado, a.oportunidad, a.prioridad, a.proximo_paso, a.fuente_url]);
    },
  },
  consultorio: {
    titulo: "Casos del Consultorio Tecnológico Express",
    headers: ["ID", "Solicitante", "Reto", "Línea técnica", "Tipo", "Estado", "Estudiantes", "Horas", "Evidencia", "Escalable", "Resultado", "Recepción", "Cierre"],
    rows: () => consultorioFlujo().casos.map((c) => [c.id, c.solicitante, c.reto, c.linea, c.tipo, c.estado, c.estudiantes, c.horas, c.evidencia_url, c.escalable, c.resultado, c.fecha_recepcion, c.fecha_cierre]),
  },
  vinculacion: {
    titulo: "Postulaciones y vinculación",
    headers: ["Postulante", "Condición", "Carrera", "Vacante", "Empresa", "Línea técnica", "Tipo de vinculación", "Rol", "Horas", "Estado", "Fecha"],
    rows: () => listaVinculaciones().map((v) => [v.postulante, v.condicion, v.carrera, v.vacante, v.empresa, v.linea, v.tipo, v.rol, v.horas, v.estado, v.fecha]),
  },
};
