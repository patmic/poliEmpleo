import type { HarvardCv } from "@/lib/cv";

/** Hoja de CV en formato Harvard (vista previa, impresión y vista para empresas). */
export function HarvardSheet({ cv, id }: { cv: HarvardCv; id?: string }) {
  const p = cv.personal;
  const contact = [p.city, p.phone, p.email, p.linkedin, p.portfolio].filter(Boolean).join("  •  ");
  const edu = cv.education.filter((e) => e.institution || e.degree);
  const exp = cv.experience.filter((e) => e.company || e.role);
  const proj = cv.projects.filter((e) => e.title);
  const skills = ([
    ["Técnicas", cv.skills.technical], ["Idiomas", cv.skills.languages],
    ["Certificaciones", cv.skills.certifications], ["Intereses", cv.skills.interests],
  ] as const).filter(([, v]) => v);
  return (
    <div id={id} className="harvard rounded-lg border bg-white px-8 py-8 shadow-xs">
      <h1>{p.full_name || "Tu nombre"}</h1>
      {contact ? <div className="contact">{contact}</div> : null}
      {p.summary ? <><h2>Perfil</h2><p>{p.summary}</p></> : null}
      {edu.length ? <h2>Educación</h2> : null}
      {edu.map((e, i) => (
        <div key={i} className="mb-2">
          <div className="row"><b>{e.institution}</b><span>{e.city}</span></div>
          <div className="row"><i>{e.degree}{e.gpa ? ` — Promedio: ${e.gpa}` : ""}</i><span>{e.dates}</span></div>
          {e.details ? <div>{e.details}</div> : null}
        </div>
      ))}
      {exp.length ? <h2>Experiencia</h2> : null}
      {exp.map((e, i) => (
        <div key={i} className="mb-2">
          <div className="row"><b>{e.company}</b><span>{e.city}</span></div>
          <div className="row"><i>{e.role}</i><span>{e.dates}</span></div>
          {e.bullets.filter(Boolean).length ? <ul>{e.bullets.filter(Boolean).map((b, k) => <li key={k}>{b}</li>)}</ul> : null}
        </div>
      ))}
      {proj.length ? <h2>Proyectos y liderazgo</h2> : null}
      {proj.map((e, i) => (
        <div key={i} className="mb-2">
          <div className="row"><b>{e.title}</b><span>{e.dates}</span></div>
          {e.role ? <i>{e.role}</i> : null}
          {e.description ? <div>{e.description}</div> : null}
        </div>
      ))}
      {skills.length ? <h2>Habilidades e información adicional</h2> : null}
      {skills.map(([k, v]) => <div key={k}><b>{k}:</b> {v}</div>)}
    </div>
  );
}
