// Taxonomía del Observatorio de Necesidades Tecnológicas, Consultorio Tecnológico Express
// y Banco de retos (documentos de docs/Admin). Sin dependencias de Node: se usa en servidor y cliente.

export const LINEAS = [
  "Datos / BI",
  "Soporte TI / infraestructura",
  "Ciberseguridad",
  "Gobierno de datos",
  "Software / LMS / UX",
  "IA / automatización",
  "LegalTech / compliance",
  "IoT / FabLab",
  "Computación emergente",
] as const;

export type Linea = (typeof LINEAS)[number];

export const PRIORIDADES = ["Alta", "Media", "Baja"] as const;
export const NIVELES = ["Baja", "Media", "Alta"] as const;
export const IMPACTOS = ["Bajo", "Medio", "Alto"] as const;

export const TIPOS_ACTOR = [
  "Empresa privada",
  "Empresa pública",
  "Institución educativa / ONG",
  "Banca / finanzas",
  "Telecomunicaciones",
  "Salud / seguros",
  "Tecnología / servicios",
  "Gobierno / Estado",
  "Otro",
] as const;

export const CONVENIO_ESTADOS = ["Sin contacto", "Prospecto", "Contactado", "En negociación", "Convenio firmado", "Descartado"] as const;

export const TIPOS_VINCULACION = [
  "Práctica preprofesional",
  "Pasantía",
  "Consultorio",
  "Proyecto de aula",
  "Reto",
  "Trabajo de integración curricular",
  "Voluntariado",
] as const;

export const ROLES_VINCULACION = ["Analista", "Documentador", "Soporte", "Desarrollador", "Data analyst", "Facilitador", "Otro"] as const;
export const RETO_ESTADOS = ["Idea", "Priorizado", "En diseño", "Piloto", "Ejecución", "Cerrado"] as const;
export const ATENCION_ESTADOS = ["Recibida", "En diagnóstico", "Entregada", "Cerrada"] as const;
export const TIPOS_ATENCION = ["Diagnóstico", "Prototipo", "Asesoría", "Capacitación", "Check-up"] as const;
export const ALIADO_ESTADOS = ["Prospecto", "Contactado", "En negociación", "Convenio firmado", "Descartado"] as const;
export const CARRERAS_TIC = ["SW", "CC", "AL", "EM"] as const;

const LINEA_PATRONES: [Linea, RegExp][] = [
  ["Ciberseguridad", /segur|cyber|ciber|phishing|pentest|incidente|control de acceso/i],
  ["Gobierno de datos", /gobierno de datos|calidad de datos|diccionario|activos de datos|data governance/i],
  ["LegalTech / compliance", /legal|compliance|cumplimiento|privacidad|normativ/i],
  ["IA / automatización", /\bia\b|inteligencia artificial|llm|machine learning|automati|chatbot|agente/i],
  ["Datos / BI", /dato|data|\bbi\b|etl|sql|analít|analit|reporting|reporte|inteligencia de negocio|power bi/i],
  ["Software / LMS / UX", /software|desarrollad|lms|edtech|educativ|\bux\b|frontend|backend|web|plataforma|sistema/i],
  ["Soporte TI / infraestructura", /soporte|help ?desk|redes|windows|infraestructura|service desk|\bti\b|tecnolog[ií]a de la informaci|nube|cloud|mantenimiento/i],
  ["IoT / FabLab", /iot|fab ?lab|impresi[oó]n|electr[oó]nica|prototipado f[ií]sico/i],
  ["Computación emergente", /cu[aá]ntic|emergente|investigaci[oó]n aplicada/i],
];

/** Clasifica un texto libre (título, descripción, etiquetas) en una línea técnica. "" si no hay coincidencia. */
export function lineaDe(texto: string): string {
  for (const [linea, re] of LINEA_PATRONES) if (re.test(texto)) return linea;
  return "";
}

/** Convierte un valor libre en una opción válida de la lista, o el valor por defecto. */
export function opcion<T extends string>(lista: readonly T[], valor: string | null | undefined, porDefecto: T): T {
  const v = (valor ?? "").trim();
  return (lista as readonly string[]).includes(v) ? (v as T) : porDefecto;
}
