// Catálogos fijos de la plataforma (carreras, modalidades, estados, etiquetas).

export const CAREERS = [
  "Ingeniería de Software",
  "Computación",
  "Sistemas de Información",
  "Ciencia de Datos e Inteligencia Artificial",
  "Electrónica y Automatización",
  "Telecomunicaciones",
  "Electricidad",
  "Mecánica",
  "Mecatrónica",
  "Civil",
  "Química",
  "Agroindustria",
  "Ambiental",
  "Petróleos",
  "Geología",
  "Matemática",
  "Física",
  "Economía",
  "Administración de Empresas",
] as const;

export const MODALITIES = ["Presencial", "Híbrido", "Remoto"] as const;

export const JOB_TYPES = [
  "Tiempo completo",
  "Medio tiempo",
  "Pasantía",
  "Prácticas preprofesionales",
  "Proyecto de titulación",
] as const;

export const COMPANY_SIZES = [
  "Startup (1-10)",
  "Pequeña (11-50)",
  "Mediana (51-250)",
  "Grande (251-1000)",
  "Corporativo (+1000)",
] as const;

// Flujo de una postulación. "Rechazado" puede ocurrir en cualquier etapa.
export const APP_STATUSES = ["En revisión", "Entrevista", "Seleccionado", "Rechazado"] as const;
export type AppStatus = (typeof APP_STATUSES)[number];

export const JOB_STATUS_LABEL: Record<string, string> = {
  active: "Activa",
  paused: "Pausada",
  closed: "Cerrada",
};

export const TAG_CATALOG: Record<string, string[]> = {
  "Tecnologías": [
    "Python", "JavaScript", "TypeScript", "React", "Next.js", "Node.js", "Java", "C#", ".NET",
    "SQL", "PostgreSQL", "MongoDB", "Docker", "AWS", "Azure", "Git", "Linux", "Power BI",
    "Excel avanzado", "Machine Learning", "Ciencia de Datos", "Ciberseguridad", "Redes",
    "Flutter", "Kotlin", "SAP", "AutoCAD", "MATLAB", "PLC", "Arduino",
  ],
  "Áreas": [
    "Backend", "Frontend", "Full Stack", "Móvil", "DevOps", "QA / Testing", "Análisis de datos",
    "Soporte TI", "Infraestructura", "Automatización industrial", "Energía", "Construcción",
    "Finanzas", "Logística", "Investigación",
  ],
  "Competencias": [
    "Trabajo en equipo", "Liderazgo", "Comunicación", "Scrum / Agile", "Gestión de proyectos",
    "Resolución de problemas",
  ],
  "Idiomas": ["Inglés B1", "Inglés B2", "Inglés C1", "Portugués", "Francés"],
};

export const ALL_TAGS = Object.values(TAG_CATALOG).flat();

export function tagCategory(tag: string): string {
  for (const [cat, list] of Object.entries(TAG_CATALOG)) if (list.includes(tag)) return cat;
  return "Personalizada";
}

// Rol único "Postulante": su condición académica describe si es estudiante o graduado, EPN o externo.
export const CONDICIONES = ["Estudiante EPN", "Graduado EPN", "Estudiante externo", "Graduado externo"] as const;
export type Condicion = (typeof CONDICIONES)[number];

export function parseCondicion(v: string): Condicion {
  return (CONDICIONES as readonly string[]).includes(v) ? (v as Condicion) : "Estudiante EPN";
}

/** Origen EPN o externo que usan las estadísticas y filtros, derivado de la condición. */
export function origenDe(condicion: string): "EPN" | "EXTERNO" {
  return condicion.includes("EPN") ? "EPN" : "EXTERNO";
}

/** Condición inicial a partir del origen y la situación académica (estudiante o graduado). */
export function condicionDe(origin: string, situacion: string): Condicion {
  const graduado = situacion.toLowerCase().includes("gradu");
  if (origin === "EPN") return graduado ? "Graduado EPN" : "Estudiante EPN";
  return graduado ? "Graduado externo" : "Estudiante externo";
}
