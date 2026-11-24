// Lectura de CV en PDF: lector local (heurístico) y, opcionalmente, IA compatible con OpenAI.
import { ALL_TAGS } from "./catalog";
import { emptyEducation, emptyExperience, type HarvardCv } from "./cv";

export interface ParseResult { cv: Partial<HarvardCv>; tags: string[]; method: "ia" | "local"; fields: number; warning?: string }

export async function pdfToText(buf: Buffer): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require("pdf-parse/lib/pdf-parse.js") as (b: Buffer) => Promise<{ text: string }>;
  const data = await pdfParse(buf);
  return (data.text || "").replace(/\r/g, "");
}

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Etiquetas del catálogo que aparecen en el texto. */
export function detectTags(text: string): string[] {
  const low = ` ${text.toLowerCase()} `;
  const found = ALL_TAGS.filter((t) => {
    const k = t.toLowerCase().replace(" / ", "/");
    if (k.length <= 2) return false;
    return new RegExp(`(^|[^\\p{L}\\p{N}])${esc(k)}([^\\p{L}\\p{N}]|$)`, "u").test(low);
  });
  const en = /ingl[eé]s|english/i.test(text);
  if (en) {
    if (/\bC[12]\b|avanzado|advanced|fluent/i.test(text)) found.push("Inglés C1");
    else if (/\bB2\b|intermedio.?alto|upper/i.test(text)) found.push("Inglés B2");
    else if (/\bB1\b|intermedio|intermediate/i.test(text)) found.push("Inglés B1");
  }
  if (/scrum|agile|ágil/i.test(text)) found.push("Scrum / Agile");
  return [...new Set(found)];
}

const HEADINGS: [keyof Sections, RegExp][] = [
  ["summary", /^(perfil( profesional)?|resumen|sobre m[ií]|objetivo|summary|profile|about me)\s*:?$/i],
  ["education", /^(educaci[oó]n|formaci[oó]n( acad[eé]mica)?|estudios|education)\s*:?$/i],
  ["experience", /^(experiencia( laboral| profesional)?|experience|work experience|historial laboral)\s*:?$/i],
  ["projects", /^(proyectos|projects|liderazgo|actividades)\s*:?$/i],
  ["skills", /^(habilidades|conocimientos|competencias|skills|aptitudes|herramientas)( t[eé]cnicas)?\s*:?$/i],
  ["languages", /^(idiomas|languages)\s*:?$/i],
  ["certifications", /^(certificaciones|certificados|cursos|certifications|courses)\s*:?$/i],
];
interface Sections { head: string[]; summary: string[]; education: string[]; experience: string[]; projects: string[]; skills: string[]; languages: string[]; certifications: string[] }

const DATE_RANGE = /((ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic|jan|apr|aug|dec)[a-z]*\.?\s+)?(19|20)\d{2}\s*[-–—a]+\s*((ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic|jan|apr|aug|dec)[a-z]*\.?\s+)?((19|20)\d{2}|presente|actualidad|actual|present|current)/i;

export function localParse(text: string): ParseResult {
  const lines = text.split("\n").map((l) => l.replace(/\s+/g, " ").trim()).filter(Boolean);
  const sec: Sections = { head: [], summary: [], education: [], experience: [], projects: [], skills: [], languages: [], certifications: [] };
  let cur: keyof Sections = "head";
  for (const l of lines) {
    const h = HEADINGS.find(([, re]) => re.test(l));
    if (h) { cur = h[0]; continue; }
    sec[cur].push(l);
  }

  const email = text.match(/[\w.+-]+@[\w-]+\.[\w.-]+/)?.[0] ?? "";
  const phone = text.match(/(\+?593[\s-]?\d{1,2}[\s-]?\d{3}[\s-]?\d{4}|\b09\d{8}\b|\+\d{1,3}[\s-]?\d{2,3}[\s-]?\d{3}[\s-]?\d{3,4})/)?.[0] ?? "";
  const linkedin = text.match(/linkedin\.com\/in\/[\w-]+/i)?.[0] ?? "";
  const portfolio = text.match(/(github\.com|gitlab\.com|behance\.net)\/[\w-]+/i)?.[0] ?? "";
  const name = sec.head.find((l) => /^[\p{L}][\p{L}' .-]{3,60}$/u.test(l) && l.split(" ").length >= 2 && l.split(" ").length <= 5 && !/@|\d/.test(l)) ?? "";
  const city = /quito/i.test(text) ? "Quito, Ecuador" : /guayaquil/i.test(text) ? "Guayaquil, Ecuador" : /cuenca/i.test(text) ? "Cuenca, Ecuador" : "";

  const cv: Partial<HarvardCv> = {
    personal: { full_name: name, email, phone, city, linkedin, portfolio, summary: sec.summary.join(" ").slice(0, 700) },
  };

  // Educación: una entrada por institución detectada.
  const edu = [];
  for (let i = 0; i < sec.education.length; i++) {
    const l = sec.education[i];
    if (/universidad|escuela|instituto|polit[eé]cnic|colegio|university|college/i.test(l)) {
      const e = emptyEducation();
      e.institution = l.replace(DATE_RANGE, "").trim();
      const near = sec.education.slice(i, i + 4);
      e.degree = near.find((x) => /ingenier|licenci|tecnolog|bachiller|maestr|carrera|degree|bachelor|engineer/i.test(x))?.replace(DATE_RANGE, "").trim() ?? "";
      e.dates = near.map((x) => x.match(DATE_RANGE)?.[0]).find(Boolean) ?? "";
      e.gpa = near.join(" ").match(/(promedio|gpa)[:\s]*([\d.,]+(\s*\/\s*\d+)?)/i)?.[2] ?? "";
      edu.push(e);
    }
  }
  if (edu.length) cv.education = edu.slice(0, 4);

  // Experiencia: cada línea con un rango de fechas abre una entrada.
  const exp = [];
  let curExp: ReturnType<typeof emptyExperience> | null = null;
  for (let i = 0; i < sec.experience.length; i++) {
    const l = sec.experience[i];
    const date = l.match(DATE_RANGE)?.[0];
    if (date) {
      curExp = emptyExperience();
      curExp.bullets = [];
      curExp.dates = date;
      const rest = l.replace(DATE_RANGE, "").replace(/[|,–—-]\s*$/, "").trim();
      const prev = sec.experience[i - 1] && !DATE_RANGE.test(sec.experience[i - 1]) && !/^[•\-*·▪]/.test(sec.experience[i - 1]) ? sec.experience[i - 1] : "";
      curExp.role = rest || prev;
      curExp.company = rest && prev ? prev : "";
      exp.push(curExp);
    } else if (curExp && (/^[•\-*·▪]/.test(l) || l.length > 40)) {
      curExp.bullets.push(l.replace(/^[•\-*·▪]\s*/, ""));
    }
  }
  if (exp.length) cv.experience = exp.slice(0, 6).map((e) => ({ ...e, bullets: e.bullets.slice(0, 5) }));

  const tags = detectTags(text);
  const tech = tags.filter((t) => ALL_TAGS.slice(0, 30).includes(t));
  cv.skills = {
    technical: sec.skills.join(", ").slice(0, 400) || tech.join(", "),
    languages: sec.languages.join(", ").slice(0, 200) || (/ingl[eé]s|english/i.test(text) ? tags.filter((t) => t.startsWith("Inglés")).join(", ") : ""),
    certifications: sec.certifications.join(", ").slice(0, 300),
    interests: "",
  };

  return { cv, tags, method: "local", fields: countFields(cv) };
}

export function countFields(cv: Partial<HarvardCv>): number {
  let n = 0;
  for (const v of Object.values(cv.personal ?? {})) if (v) n++;
  n += (cv.education ?? []).length + (cv.experience ?? []).length + (cv.projects ?? []).length;
  for (const v of Object.values(cv.skills ?? {})) if (v) n++;
  return n;
}

/** Lectura con IA (opcional). Requiere AI_API_KEY. Devuelve null si no está configurada o falla. */
export async function aiParse(text: string): Promise<ParseResult | null> {
  const key = process.env.AI_API_KEY;
  if (!key) return null;
  const base = (process.env.AI_BASE_URL || "https://api.deepseek.com").replace(/\/$/, "");
  const model = process.env.AI_MODEL || "deepseek-chat";
  const prompt = `Extrae del siguiente CV un JSON con esta forma exacta:
{"personal":{"full_name":"","email":"","phone":"","city":"","linkedin":"","portfolio":"","summary":""},
"education":[{"institution":"","city":"","degree":"","dates":"","gpa":"","details":""}],
"experience":[{"company":"","city":"","role":"","dates":"","bullets":[""]}],
"projects":[{"title":"","role":"","dates":"","description":""}],
"skills":{"technical":"","languages":"","certifications":"","interests":""},
"tags":[]}
"tags" solo puede contener valores de esta lista: ${ALL_TAGS.join(", ")}.
Escribe en español. No inventes datos: deja vacío lo que no aparezca.
CV:
"""${text.slice(0, 12000)}"""`;
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 30000);
    const res = await fetch(`${base}/chat/completions`, {
      method: "POST",
      signal: ctrl.signal,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({ model, temperature: 0, response_format: { type: "json_object" }, messages: [{ role: "user", content: prompt }] }),
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    const data = await res.json();
    const json = JSON.parse(data.choices?.[0]?.message?.content ?? "{}");
    const { tags = [], ...cv } = json;
    const valid = (Array.isArray(tags) ? tags : []).filter((t: string) => ALL_TAGS.includes(t));
    const merged = [...new Set([...valid, ...detectTags(text)])];
    return { cv, tags: merged, method: "ia", fields: countFields(cv) };
  } catch {
    return null;
  }
}
