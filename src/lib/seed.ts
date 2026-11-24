// Datos de demostración. Se cargan solo cuando la base está vacía (primer arranque).
// Todas las cuentas usan la contraseña 123456. Empresas y personas son ficticias.
import type { Db } from "./db";
import { ensureTag, setJobTags, setUserTags, getUserTags, getJobTags, notify } from "./db";
import { hashPassword } from "./passwords";
import { TAG_CATALOG, condicionDe, tagCategory } from "./catalog";
import { computeMatch } from "./match";
import type { HarvardCv } from "./cv";
import { cvToText } from "./cv";

const ago = (days: number) => {
  const d = new Date(Date.now() - days * 86400000);
  return d.toISOString().slice(0, 19).replace("T", " ");
};

function user(db: Db, email: string, role: string, name: string, daysAgo = 30) {
  const r = db
    .prepare("INSERT INTO users (email, password_hash, role, name, created_at) VALUES (?, ?, ?, ?, ?)")
    .run(email, hashPassword("123456"), role, name, ago(daysAgo));
  return Number(r.lastInsertRowid);
}

interface StudentSeed {
  email: string; name: string; origin: "EPN" | "EXTERNO"; institution: string; career: string; semester: string;
  code: string; gpa: string; phone: string; headline: string; bio: string; modality: string; tags: string[];
  cv?: HarvardCv; cvDaysAgo?: number;
}

const STUDENTS: StudentSeed[] = [
  {
    email: "estudiante@demo.com", name: "Camila Andrade Rivas", origin: "EPN", institution: "Escuela Politécnica Nacional",
    career: "Ingeniería de Software", semester: "8.º semestre", code: "201920345", gpa: "8.9", phone: "+593 99 123 4567",
    headline: "Desarrolladora full stack en formación", modality: "Híbrido",
    bio: "Estudiante de Software en la EPN con experiencia en APIs con Node.js y aplicaciones React. Me interesan los equipos ágiles y el producto.",
    tags: ["TypeScript", "Node.js", "React", "SQL", "Git", "Backend", "Full Stack", "Scrum / Agile", "Inglés B2"],
    cvDaysAgo: 12,
    cv: {
      personal: {
        full_name: "Camila Andrade Rivas", email: "estudiante@demo.com", phone: "+593 99 123 4567", city: "Quito, Ecuador",
        linkedin: "linkedin.com/in/camila-andrade", portfolio: "github.com/camiandrade",
        summary: "Estudiante de último año de Ingeniería de Software con experiencia construyendo APIs REST y aplicaciones web. Orientada a la calidad del código y al trabajo en equipo.",
      },
      education: [{ institution: "Escuela Politécnica Nacional", city: "Quito, Ecuador", degree: "Ingeniería de Software", dates: "Abr 2021 - Presente", gpa: "8.9 / 10", details: "Cursos: Arquitectura de Software, Bases de Datos, Calidad de Software, Desarrollo Web." }],
      experience: [{
        company: "Club de Software EPN", city: "Quito, Ecuador", role: "Desarrolladora backend (voluntariado)", dates: "Mar 2024 - Presente",
        bullets: ["Construí una API en Node.js y PostgreSQL para la gestión de eventos del club (600 usuarios).", "Configuré integración continua con GitHub Actions y pruebas automatizadas."],
      }],
      projects: [{ title: "App de reservas de laboratorios", role: "Líder técnica", dates: "Sep 2024 - Feb 2025", description: "Aplicación React + Node.js para reservar laboratorios de la facultad, con roles y reportes." }],
      skills: { technical: "TypeScript, Node.js, React, PostgreSQL, Docker, Git", languages: "Español (nativo), Inglés (B2)", certifications: "Scrum Fundamentals", interests: "Desarrollo web, open source" },
    },
  },
  {
    email: "mateo.vasquez@demo.com", name: "Mateo Vásquez León", origin: "EPN", institution: "Escuela Politécnica Nacional",
    career: "Ciencia de Datos e Inteligencia Artificial", semester: "7.º semestre", code: "202010877", gpa: "9.2", phone: "+593 98 765 4321",
    headline: "Analista de datos y machine learning", modality: "Remoto",
    bio: "Me apasiona convertir datos en decisiones. Trabajo con Python, SQL y Power BI; he participado en proyectos de investigación con modelos predictivos.",
    tags: ["Python", "SQL", "Machine Learning", "Ciencia de Datos", "Power BI", "Análisis de datos", "Investigación", "Inglés C1"],
    cvDaysAgo: 45,
    cv: {
      personal: { full_name: "Mateo Vásquez León", email: "mateo.vasquez@demo.com", phone: "+593 98 765 4321", city: "Quito, Ecuador", linkedin: "linkedin.com/in/mateo-vasquez", portfolio: "kaggle.com/mateovl", summary: "Estudiante de Ciencia de Datos con experiencia en modelos predictivos y tableros de indicadores." },
      education: [{ institution: "Escuela Politécnica Nacional", city: "Quito, Ecuador", degree: "Ciencia de Datos e Inteligencia Artificial", dates: "Oct 2021 - Presente", gpa: "9.2 / 10", details: "Ayudante de cátedra de Estadística." }],
      experience: [{ company: "Laboratorio de Investigación en Datos (proyecto académico)", city: "Quito, Ecuador", role: "Asistente de investigación", dates: "May 2024 - Presente", bullets: ["Entrené modelos de pronóstico de demanda eléctrica con scikit-learn (error medio 6 %).", "Publiqué tableros en Power BI para el equipo de investigación."] }],
      projects: [],
      skills: { technical: "Python, pandas, scikit-learn, SQL, Power BI", languages: "Español (nativo), Inglés (C1)", certifications: "", interests: "IA aplicada, energía" },
    },
  },
  {
    email: "daniela.paredes@demo.com", name: "Daniela Paredes Mora", origin: "EPN", institution: "Escuela Politécnica Nacional",
    career: "Electrónica y Automatización", semester: "9.º semestre", code: "201820112", gpa: "8.6", phone: "+593 99 222 3344",
    headline: "Automatización y control industrial", modality: "Presencial",
    bio: "Estudiante de Electrónica y Automatización con prácticas en PLC y sistemas SCADA.",
    tags: ["PLC", "Automatización industrial", "MATLAB", "Arduino", "Energía", "Trabajo en equipo"],
  },
  {
    email: "sebastian.morales@demo.com", name: "Sebastián Morales Chávez", origin: "EPN", institution: "Escuela Politécnica Nacional",
    career: "Computación", semester: "6.º semestre", code: "202110045", gpa: "8.1", phone: "+593 96 555 1212",
    headline: "Soporte, redes y Linux", modality: "Presencial",
    bio: "Me gusta la infraestructura: redes, servidores Linux y ciberseguridad.",
    tags: ["Linux", "Redes", "Soporte TI", "Ciberseguridad", "Infraestructura", "Docker"],
  },
  {
    email: "andrea.salazar@demo.com", name: "Andrea Salazar Ortiz", origin: "EXTERNO", institution: "Universidad Central del Ecuador",
    career: "Sistemas de Información", semester: "Graduada", code: "", gpa: "8.7", phone: "+593 99 888 7766",
    headline: "Analista BI y procesos", modality: "Híbrido",
    bio: "Ingeniera en Sistemas de Información con dos años de experiencia en reportes y análisis de procesos logísticos.",
    tags: ["Power BI", "SQL", "Excel avanzado", "Análisis de datos", "Logística", "Comunicación"],
    cvDaysAgo: 5,
    cv: {
      personal: { full_name: "Andrea Salazar Ortiz", email: "andrea.salazar@demo.com", phone: "+593 99 888 7766", city: "Quito, Ecuador", linkedin: "linkedin.com/in/andrea-salazar", portfolio: "", summary: "Ingeniera en Sistemas de Información con experiencia en inteligencia de negocios para logística." },
      education: [{ institution: "Universidad Central del Ecuador", city: "Quito, Ecuador", degree: "Ingeniería en Sistemas de Información", dates: "2018 - 2023", gpa: "8.7 / 10", details: "" }],
      experience: [{ company: "Distribuidora Andina (ficticia)", city: "Quito, Ecuador", role: "Analista de reportes", dates: "Ene 2024 - Presente", bullets: ["Automaticé reportes semanales de inventario con Power BI y SQL Server.", "Reduje en 30 % el tiempo de cierre mensual de indicadores."] }],
      projects: [],
      skills: { technical: "Power BI, SQL, Excel avanzado, Python básico", languages: "Español (nativo), Inglés (B1)", certifications: "PL-300 (en curso)", interests: "Analítica, procesos" },
    },
  },
  {
    email: "kevin.toapanta@demo.com", name: "Kevin Toapanta Guamán", origin: "EXTERNO", institution: "Universidad de las Fuerzas Armadas ESPE",
    career: "Mecatrónica", semester: "10.º semestre", code: "", gpa: "8.3", phone: "+593 98 111 2233",
    headline: "Mecatrónica y robótica", modality: "Presencial",
    bio: "Estudiante de Mecatrónica interesado en automatización de plantas.",
    tags: ["Arduino", "PLC", "AutoCAD", "Automatización industrial"],
  },
];

const COMPANIES = [
  {
    email: "empresa@demo.com", name: "Andes Software Lab", ruc: "1792456789001", sector: "Desarrollo de software",
    size: "Mediana (51-250)", web: "https://andessoftware.example", phone: "+593 2 290 1000", verified: 1,
    description: "Estudio de software que construye productos digitales para banca y retail en la región andina. Tenemos un programa de talento joven con mentoría.",
    tags: ["Full Stack", "TypeScript", "React", "Node.js", "Scrum / Agile"],
  },
  {
    email: "talento@enerandina.example", name: "EnerAndina S.A.", ruc: "1790011223001", sector: "Energía y automatización",
    size: "Grande (251-1000)", web: "https://enerandina.example", phone: "+593 2 245 7000", verified: 1,
    description: "Generación y distribución de energía con foco en automatización de subestaciones y analítica de consumo.",
    tags: ["Energía", "Automatización industrial", "PLC", "Análisis de datos"],
  },
  {
    email: "rrhh@logipichincha.example", name: "Logística Pichincha Cía. Ltda.", ruc: "1791234567001", sector: "Logística y distribución",
    size: "Mediana (51-250)", web: "https://logipichincha.example", phone: "+593 2 380 4400", verified: 0,
    description: "Operador logístico con centros de distribución en Quito y Guayaquil. Buscamos perfiles de TI y analítica.",
    tags: ["Logística", "Power BI", "Soporte TI"],
  },
];

interface JobSeed {
  c: number; title: string; description: string; requirements: string; responsibilities: string; modality: string;
  type: string; vacancies: number; salary: string; careers: string[]; tags: string[]; status?: string; daysAgo: number; deadlineDays: number;
}

const JOBS: JobSeed[] = [
  {
    c: 0, title: "Desarrollador/a Backend Node.js Junior", modality: "Híbrido", type: "Tiempo completo", vacancies: 2,
    salary: "$900 - $1.200 / mes", careers: ["Ingeniería de Software", "Computación", "Sistemas de Información"],
    tags: ["Node.js", "TypeScript", "SQL", "Backend", "Git", "Scrum / Agile"], daysAgo: 6, deadlineDays: 24,
    description: "Únete al equipo de plataforma para construir APIs que usan miles de clientes de banca digital.",
    requirements: "Últimos semestres o recién graduado. Node.js o TypeScript, SQL y Git. Inglés técnico.",
    responsibilities: "Diseñar y mantener endpoints REST, escribir pruebas, participar en revisiones de código y ceremonias ágiles.",
  },
  {
    c: 0, title: "Pasante Frontend React", modality: "Remoto", type: "Pasantía", vacancies: 3,
    salary: "$460 / mes (pasantía)", careers: ["Ingeniería de Software", "Computación"],
    tags: ["React", "TypeScript", "Frontend", "Git"], daysAgo: 3, deadlineDays: 30,
    description: "Pasantía de 6 meses construyendo interfaces accesibles para nuestro producto de retail.",
    requirements: "Conocimientos de React y HTML/CSS. Disponibilidad de 6 horas diarias.",
    responsibilities: "Implementar pantallas a partir de diseños, corregir errores y documentar componentes.",
  },
  {
    c: 0, title: "Analista QA (medio tiempo)", modality: "Presencial", type: "Medio tiempo", vacancies: 1,
    salary: "$600 / mes", careers: [], tags: ["QA / Testing", "Python", "Scrum / Agile"], daysAgo: 15, deadlineDays: 10,
    description: "Asegura la calidad de nuestras aplicaciones con pruebas manuales y automatizadas.",
    requirements: "Lógica de programación, atención al detalle. Python deseable.",
    responsibilities: "Diseñar casos de prueba, automatizar pruebas de regresión y reportar incidencias.",
  },
  {
    c: 0, title: "Proyecto de titulación: recomendador con machine learning", modality: "Remoto", type: "Proyecto de titulación", vacancies: 1,
    salary: "Apoyo económico + mentoría", careers: ["Ciencia de Datos e Inteligencia Artificial", "Computación"],
    tags: ["Machine Learning", "Python", "Ciencia de Datos", "Investigación"], status: "paused", daysAgo: 40, deadlineDays: -5,
    description: "Desarrolla tu tesis sobre sistemas de recomendación con datos reales anonimizados.",
    requirements: "Estudiante con plan de titulación aprobado o en trámite.",
    responsibilities: "Investigar, prototipar y evaluar modelos de recomendación.",
  },
  {
    c: 1, title: "Practicante de Automatización Industrial", modality: "Presencial", type: "Prácticas preprofesionales", vacancies: 2,
    salary: "$460 / mes", careers: ["Electrónica y Automatización", "Mecatrónica", "Electricidad"],
    tags: ["PLC", "Automatización industrial", "MATLAB", "Arduino"], daysAgo: 8, deadlineDays: 20,
    description: "Apoya al equipo de automatización de subestaciones en programación de PLC y pruebas en campo.",
    requirements: "Conocimientos de PLC y control. Disponibilidad para visitas técnicas.",
    responsibilities: "Programar y documentar lógicas de control, apoyar pruebas FAT/SAT.",
  },
  {
    c: 1, title: "Analista de Datos de Energía", modality: "Híbrido", type: "Tiempo completo", vacancies: 1,
    salary: "$1.300 - $1.600 / mes", careers: ["Ciencia de Datos e Inteligencia Artificial", "Matemática", "Sistemas de Información"],
    tags: ["Python", "SQL", "Power BI", "Análisis de datos", "Machine Learning"], daysAgo: 2, deadlineDays: 28,
    description: "Construye modelos de pronóstico de demanda y tableros de indicadores de consumo.",
    requirements: "Python y SQL. Experiencia con visualización de datos.",
    responsibilities: "Limpiar y modelar datos, desarrollar pronósticos y presentar hallazgos.",
  },
  {
    c: 2, title: "Practicante de Soporte TI", modality: "Presencial", type: "Prácticas preprofesionales", vacancies: 2,
    salary: "$460 / mes", careers: ["Computación", "Telecomunicaciones", "Sistemas de Información"],
    tags: ["Soporte TI", "Redes", "Linux"], daysAgo: 10, deadlineDays: 15,
    description: "Brinda soporte a usuarios y mantiene la red de nuestros centros de distribución.",
    requirements: "Conocimientos básicos de redes y sistemas operativos.",
    responsibilities: "Atender tickets, configurar equipos y documentar procedimientos.",
  },
  {
    c: 2, title: "Analista BI Logístico", modality: "Híbrido", type: "Tiempo completo", vacancies: 1,
    salary: "$1.000 - $1.300 / mes", careers: ["Sistemas de Información", "Administración de Empresas", "Economía"],
    tags: ["Power BI", "SQL", "Excel avanzado", "Logística", "Análisis de datos"], status: "closed", daysAgo: 60, deadlineDays: -20,
    description: "Diseña tableros de desempeño logístico para la gerencia.",
    requirements: "Power BI y SQL. Experiencia mínima de un año.",
    responsibilities: "Modelar datos, construir reportes y acompañar a las áreas usuarias.",
  },
];

// [studentIndex, jobIndex, status, daysAgo, rating]
const APPS: [number, number, string, number, number | null][] = [
  [0, 0, "Entrevista", 5, 4],
  [0, 1, "En revisión", 2, null],
  [3, 0, "Rechazado", 4, 2],
  [4, 0, "En revisión", 3, null],
  [0, 2, "Seleccionado", 12, 5],
  [1, 5, "Entrevista", 1, 5],
  [4, 5, "En revisión", 1, null],
  [1, 3, "En revisión", 30, null],
  [2, 4, "Seleccionado", 6, 5],
  [5, 4, "Entrevista", 5, 3],
  [3, 6, "Entrevista", 7, 4],
  [4, 7, "Seleccionado", 45, 5],
  [1, 7, "Rechazado", 50, 3],
];

export function seedDatabase(db: Db) {
  db.exec("BEGIN");
  try {
    for (const [cat, list] of Object.entries(TAG_CATALOG)) for (const t of list) ensureTag(db, t, cat);

    user(db, "admin@demo.com", "admin", "Coordinación de Vinculación", 90);

    const studentIds = STUDENTS.map((s, i) => {
      const id = user(db, s.email, "student", s.name, 40 - i * 3);
      db.prepare(`INSERT INTO student_profiles (user_id, origin, institution, career, semester, student_code, gpa, phone, city,
        linkedin, portfolio, headline, bio, modality_pref, cv_json, cv_updated_at, condicion) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
        id, s.origin, s.institution, s.career, s.semester, s.code, s.gpa, s.phone, "Quito",
        s.cv?.personal.linkedin ?? "", s.cv?.personal.portfolio ?? "", s.headline, s.bio, s.modality,
        s.cv ? JSON.stringify(s.cv) : "{}", s.cv ? ago(s.cvDaysAgo ?? 10) : null, condicionDe(s.origin, s.semester),
      );
      setUserTags(db, id, s.tags, tagCategory);
      return id;
    });

    const companyIds = COMPANIES.map((c, i) => {
      const id = user(db, c.email, "company", c.name, 80 - i * 5);
      db.prepare(`INSERT INTO company_profiles (user_id, ruc, sector, size, city, website, phone, description, verified, calificacion)
        VALUES (?,?,?,?,?,?,?,?,?,?)`).run(id, c.ruc, c.sector, c.size, "Quito", c.web, c.phone, c.description, c.verified, 3.6 + ((i * 37) % 14) / 10);
      setUserTags(db, id, c.tags, tagCategory);
      return id;
    });

    const jobIds = JOBS.map((j) => {
      const deadline = new Date(Date.now() + j.deadlineDays * 86400000).toISOString().slice(0, 10);
      const r = db.prepare(`INSERT INTO jobs (company_id, title, description, requirements, responsibilities, city, modality, job_type,
        vacancies, salary, careers, deadline, status, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
        companyIds[j.c], j.title, j.description, j.requirements, j.responsibilities, "Quito", j.modality, j.type,
        j.vacancies, j.salary, JSON.stringify(j.careers), deadline, j.status ?? "active", ago(j.daysAgo),
      );
      const id = Number(r.lastInsertRowid);
      setJobTags(db, id, j.tags, tagCategory);
      return id;
    });

    const flow = ["En revisión", "Entrevista", "Seleccionado"];
    for (const [si, ji, status, days, rating] of APPS) {
      const sId = studentIds[si];
      const jId = jobIds[ji];
      const s = STUDENTS[si];
      const m = computeMatch(getUserTags(db, sId), s.career, getJobTags(db, jId), JOBS[ji].careers, s.cv ? cvToText(s.cv) : "");
      const r = db.prepare(`INSERT INTO applications (job_id, student_id, message, status, match_score, rating, created_at, updated_at)
        VALUES (?,?,?,?,?,?,?,?)`).run(jId, sId, "Me interesa mucho la vacante y cumplo con los requisitos.", status, m.score, rating, ago(days), ago(Math.max(0, days - 1)));
      const appId = Number(r.lastInsertRowid);
      const steps = status === "Rechazado" ? ["En revisión", "Rechazado"] : flow.slice(0, flow.indexOf(status) + 1);
      steps.forEach((st, k) => {
        db.prepare("INSERT INTO application_events (application_id, status, note, created_at) VALUES (?,?,?,?)")
          .run(appId, st, k === 0 ? "Postulación recibida" : "", ago(Math.max(0, days - k)));
      });
      if (status !== "En revisión") {
        notify(db, sId, `Tu postulación cambió a «${status}»`, `${JOBS[ji].title} · ${COMPANIES[JOBS[ji].c].name}`, "/estudiante/postulaciones");
      }
    }

    notify(db, companyIds[0], "Nueva postulación", "Andrea Salazar Ortiz se postuló a Desarrollador/a Backend Node.js Junior", `/empresa/vacantes/${jobIds[0]}`);
    notify(db, companyIds[1], "Nueva postulación", "Mateo Vásquez León se postuló a Analista de Datos de Energía", `/empresa/vacantes/${jobIds[5]}`);
    notify(db, 1, "Empresa pendiente de verificación", "Logística Pichincha Cía. Ltda. espera verificación de su RUC.", "/admin/usuarios?rol=company");

    db.exec("COMMIT");
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
}

// ---------- Observatorio y Consultorio (datos de referencia de docs/Admin) ----------

const SENALES: [string, string, string, string, string, string, string, string][] = [
  // [fuente, cargo, empresa, ciudad, línea, necesidad inferida, solución asociada, prioridad]
  ["LinkedIn Jobs", "Pasante Tecnología de la Información", "Quifatex", "Quito", "Soporte TI / infraestructura", "Apoyo operativo en tecnología corporativa", "Mesa de Ayuda / Diagnóstico TI", "Alta"],
  ["LinkedIn Jobs", "Pasante de Sistemas / TI", "Grupo Lucky Ecuador", "Quito", "Soporte TI / infraestructura", "Continuidad operativa de sistemas", "Consultorio Tecnológico Express", "Alta"],
  ["LinkedIn Jobs", "Pasante Tecnología de la Información", "La Fabril", "Manta", "Soporte TI / infraestructura", "Soporte en operaciones tecnológicas fuera de Quito", "Red de casos regionales de soporte TI", "Media"],
  ["LinkedIn Jobs", "Pasante de Sistemas Help Desk", "Novacero", "Guayaquil", "Soporte TI / infraestructura", "Mesa de ayuda e incidentes tecnológicos", "Mesa de Ayuda Académica", "Alta"],
  ["LinkedIn Jobs", "Pasante Desarrollo de Software", "Saludsa", "Quito", "Software / LMS / UX", "Prototipado, mantenimiento y soporte de soluciones", "Banco de Retos de Software", "Alta"],
  ["LinkedIn Jobs", "Pasante de Innovación", "Holcim Ecuador", "Guayaquil", "Software / LMS / UX", "Procesos de innovación y digitalización", "Laboratorio de Innovación Aplicada", "Media"],
  ["LinkedIn Jobs", "Pasante TI: soporte, datos y sistemas de información", "Multicines S.A.", "Quito", "Soporte TI / infraestructura", "Continuidad de servicios, integridad de datos y controles", "Consultorio TI + Control de Datos", "Alta"],
  ["LinkedIn Jobs", "Pasante de Analítica de Datos", "Alfanet Ecuador", "Quito", "Datos / BI", "ETL/ELT, integración y monitoreo de datos", "Clínica de Datos y BI", "Alta"],
  ["LinkedIn Jobs", "Pasante Inteligencia de Negocio", "Corporación Maresa", "Quito", "Datos / BI", "Análisis estratégico basado en datos", "Clínica de Datos y BI", "Alta"],
  ["LinkedIn Jobs", "Pasante Gobierno de Datos", "Puntonet S.A.", "Quito", "Gobierno de datos", "Transformar datos en decisiones", "Programa de Gobierno de Datos", "Alta"],
  ["LinkedIn Jobs", "Data Analyst Junior", "BMI Ecuador", "Quito", "Datos / BI", "Perfil junior para análisis de datos", "Ruta de empleabilidad en Data", "Media"],
  ["LinkedIn Jobs", "Analista de Datos e IA", "Lundin Gold Ecuador", "Quito", "Datos / BI", "Cruce de analítica e inteligencia artificial", "Laboratorio Express de IA Aplicada", "Media"],
  ["LinkedIn Jobs", "Intern AI Solutions and Operational Support", "OIM - ONU Migración", "Quito", "IA / automatización", "IA para apoyo operativo institucional", "Laboratorio Express de IA Aplicada", "Media"],
  ["LinkedIn Jobs", "Trainee Analytics & Commercial Support", "Mondelez International", "Quito", "Datos / BI", "Analítica aplicada a soporte comercial", "Clínica de Datos y BI", "Media"],
  ["LinkedIn Jobs", "Pasante de Ciberseguridad", "PentaSec Cybersecurity", "Quito", "Ciberseguridad", "Seguridad de redes y sistemas", "Check-up de Ciberseguridad Básica", "Alta"],
  ["LinkedIn Jobs", "Pasante de Ciberseguridad", "Ecoilpet S.A.", "Quito", "Ciberseguridad", "Seguridad informática para perfiles junior", "Check-up de Ciberseguridad Básica", "Alta"],
  ["Indeed", "Pasante TI", "Digitec", "Quito", "Soporte TI / infraestructura", "Soporte técnico de primer nivel e infraestructura", "Mesa de Ayuda + Redes Básicas", "Alta"],
  ["Indeed", "Pasante Tecnología", "Pintulac", "Quito", "Soporte TI / infraestructura", "Diagnóstico Windows y mantenimiento", "Consultorio de Diagnóstico TI", "Alta"],
  ["Indeed", "Pasante Analítica de Datos", "Alfanet", "Quito", "Datos / BI", "ETL/ELT, validación de calidad y consistencia", "Clínica de Datos y BI", "Alta"],
  ["Indeed", "Pasante Desarrollador de Plataformas Educativas", "Asae", "Quito", "Software / LMS / UX", "LMS, apps educativas y experiencia de usuario", "Banco de Retos EdTech", "Media"],
  ["Indeed", "Pasante Gobierno de Datos", "ChevyPlan", "Quito", "Gobierno de datos", "Formalización de gestión de datos", "Programa de Madurez de Datos", "Alta"],
  ["Indeed", "Pasantías Área de Sistemas", "CAAP", "Quito", "Software / LMS / UX", "Mantener y actualizar sistemas existentes", "Banco de Retos de Software", "Media"],
  ["EncuentraEmpleo", "Jefe de Tecnología de la Información", "Coop. Marcabeli", "El Oro", "Soporte TI / infraestructura", "Demanda formal de perfiles TI", "Observatorio de demanda formal pública", "Media"],
  ["EncuentraEmpleo", "Categorías: Informática hardware/software/telecomunicaciones", "MDT", "Ecuador", "Soporte TI / infraestructura", "Fuente oficial para monitoreo periódico", "Tablero de vigilancia laboral", "Alta"],
  ["Torre.ai", "Data Analyst Intern / Product Engineer Intern", "Torre.ai", "Remoto", "Datos / BI", "Mercado remoto que demanda pasantías tech y data", "Ruta de empleabilidad remota", "Media"],
];

const RETOS: [string, string, string, string, string, string, string, string, string, string][] = [
  // [título, origen, línea, actividad, entregable, complejidad, impacto, prioridad, tiempo, estado]
  ["Dashboard básico para una organización externa", "Vacantes de BI, analítica, SQL y ETL/ELT", "Datos / BI", "Levantar indicadores, limpiar muestra de datos y crear dashboard", "Dashboard + ficha técnica + guía de uso", "Media", "Alto", "Alta", "7 a 15 días", "Priorizado"],
  ["Diagnóstico express de soporte TI para MiPyme", "Vacantes de soporte TI, Windows, hardware y redes", "Soporte TI / infraestructura", "Aplicar checklist de equipos, incidencias y respaldo", "Informe de diagnóstico y plan de mejora", "Baja", "Alto", "Media", "48 h a 7 días", "Idea"],
  ["Checklist de ciberseguridad básica", "Vacantes de pasante de ciberseguridad", "Ciberseguridad", "Evaluar accesos, contraseñas, respaldos, correo y nube", "Matriz de riesgos y recomendaciones", "Media", "Alto", "Alta", "7 días", "Priorizado"],
  ["Diccionario de datos mínimo", "Vacantes de gobierno de datos", "Gobierno de datos", "Identificar activos, responsables y campos críticos", "Diccionario v1 + matriz de responsables", "Media", "Alto", "Media", "7 a 15 días", "Idea"],
  ["Prototipo de sistema o módulo web", "Vacantes de desarrollo de software y mantenimiento", "Software / LMS / UX", "Levantar requerimientos y construir prototipo mínimo", "Demo funcional + backlog", "Media", "Alto", "Alta", "15 a 30 días", "Priorizado"],
  ["Mejora UX/LMS para capacitación externa", "Vacante de plataformas educativas y LMS", "Software / LMS / UX", "Revisar flujo, interfaz y contenidos", "Informe UX + recomendaciones + wireframe", "Baja", "Medio", "Baja", "7 días", "Idea"],
  ["Inventario de activos tecnológicos", "Demanda de soporte e infraestructura", "Soporte TI / infraestructura", "Registrar equipos, usuarios, estado y riesgos básicos", "Inventario + plan de mantenimiento", "Baja", "Alto", "Media", "48 h a 7 días", "Idea"],
  ["Prototipo de chatbot informativo", "Señales de IA aplicada y automatización", "IA / automatización", "Definir FAQs, flujo y prototipo con datos no sensibles", "Chatbot demo + guía de riesgos", "Media", "Medio", "Alta", "15 a 30 días", "Priorizado"],
  ["Automatización de reporte manual", "Demanda en datos, operaciones y soporte comercial", "Datos / BI", "Identificar reporte repetitivo y automatizar flujo simple", "Script/plantilla + instructivo", "Media", "Alto", "Media", "7 a 15 días", "Idea"],
  ["Taller de higiene digital para emprendimientos", "Señales de ciberseguridad y soporte a usuarios", "Ciberseguridad", "Sesión de 60 minutos con checklist aplicable", "Material + lista de asistencia + encuesta", "Baja", "Medio", "Baja", "48 h a 7 días", "Idea"],
];

/** Carga la matriz de señales y el banco de retos de referencia cuando las tablas están vacías. */
export function seedObservatorio(db: Db) {
  const insS = db.prepare("INSERT INTO senales (fuente, cargo, empresa, ciudad, linea_tecnica, necesidad_inferida, solucion_asociada, prioridad) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
  for (const r of SENALES) insS.run(...r);
  const insR = db.prepare("INSERT INTO retos (titulo, origen, linea_tecnica, actividad, entregable, complejidad, impacto, prioridad, tiempo_estimado, estado) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
  for (const r of RETOS) insR.run(...r);
}
