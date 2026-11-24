// Estructura del CV en formato Harvard (guardada como JSON en student_profiles.cv_json).

export interface CvEducation { institution: string; city: string; degree: string; dates: string; gpa: string; details: string }
export interface CvExperience { company: string; city: string; role: string; dates: string; bullets: string[] }
export interface CvProject { title: string; role: string; dates: string; description: string }
export interface HarvardCv {
  personal: { full_name: string; email: string; phone: string; city: string; linkedin: string; portfolio: string; summary: string };
  education: CvEducation[];
  experience: CvExperience[];
  projects: CvProject[];
  skills: { technical: string; languages: string; certifications: string; interests: string };
}

export const emptyEducation = (): CvEducation => ({ institution: "", city: "", degree: "", dates: "", gpa: "", details: "" });
export const emptyExperience = (): CvExperience => ({ company: "", city: "", role: "", dates: "", bullets: [""] });
export const emptyProject = (): CvProject => ({ title: "", role: "", dates: "", description: "" });

export function emptyCv(seed?: Partial<HarvardCv["personal"]>): HarvardCv {
  return {
    personal: { full_name: "", email: "", phone: "", city: "Quito, Ecuador", linkedin: "", portfolio: "", summary: "", ...seed },
    education: [emptyEducation()],
    experience: [],
    projects: [],
    skills: { technical: "", languages: "", certifications: "", interests: "" },
  };
}

/** Lee un JSON guardado y completa campos que falten. */
export function normalizeCv(raw: unknown, seed?: Partial<HarvardCv["personal"]>): HarvardCv {
  const base = emptyCv(seed);
  if (!raw || typeof raw !== "object") return base;
  const r = raw as Partial<HarvardCv>;
  return {
    personal: { ...base.personal, ...(r.personal ?? {}) },
    education: Array.isArray(r.education) ? r.education.map((e) => ({ ...emptyEducation(), ...e })) : base.education,
    experience: Array.isArray(r.experience)
      ? r.experience.map((e) => ({ ...emptyExperience(), ...e, bullets: Array.isArray(e.bullets) ? e.bullets.map(String) : [] }))
      : [],
    projects: Array.isArray(r.projects) ? r.projects.map((p) => ({ ...emptyProject(), ...p })) : [],
    skills: { ...base.skills, ...(r.skills ?? {}) },
  };
}

export function parseCvJson(text: string | null | undefined, seed?: Partial<HarvardCv["personal"]>): HarvardCv {
  try {
    return normalizeCv(JSON.parse(text || "{}"), seed);
  } catch {
    return emptyCv(seed);
  }
}

/** Texto plano del CV, usado por el buscador. */
export function cvToText(cv: HarvardCv): string {
  return [
    Object.values(cv.personal).join(" "),
    cv.education.map((e) => Object.values(e).join(" ")).join(" "),
    cv.experience.map((e) => [e.company, e.role, e.city, ...e.bullets].join(" ")).join(" "),
    cv.projects.map((p) => Object.values(p).join(" ")).join(" "),
    Object.values(cv.skills).join(" "),
  ].join(" ");
}
