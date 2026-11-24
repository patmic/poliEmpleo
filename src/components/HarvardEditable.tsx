"use client";
import { useEffect, useRef, type ClipboardEvent, type KeyboardEvent, type ReactNode } from "react";
import { emptyEducation, emptyExperience, emptyProject, type HarvardCv } from "@/lib/cv";
import { FotoPerfil } from "@/components/explore/FotoPerfil";
import { tagCategory } from "@/lib/catalog";

type Up = (fn: (c: HarvardCv) => HarvardCv) => void;

/** Campos que viven en el Perfil del estudiante (no en el JSON del CV). */
export type ProfilePatch = {
  name?: string; phone?: string; city?: string; linkedin?: string; portfolio?: string;
  headline?: string; gpa?: string; career?: string; institution?: string;
};

/** Oculta el elemento solo al imprimir (en pantalla siempre se ve para poder editarlo). */
const hide = (empty: boolean) => (empty ? "no-print" : "");

function caretAtEnd(el: HTMLElement) {
  el.focus();
  const sel = window.getSelection();
  if (!sel) return;
  const range = document.createRange();
  range.selectNodeContents(el);
  range.collapse(false);
  sel.removeAllRanges();
  sel.addRange(range);
}

/** Texto editable en línea dentro de la hoja. Guarda al salir del campo.
 *  Enter confirma (o ejecuta `onEnter`). El pegado se convierte a texto plano. */
function Ed({
  value, onCommit, ph, id, block = false, onEnter, onKey, className = "",
}: {
  value: string;
  onCommit: (v: string) => void;
  ph: string;
  id?: string;
  block?: boolean;
  onEnter?: () => void;
  onKey?: (e: KeyboardEvent<HTMLSpanElement>) => void;
  className?: string;
}) {
  return (
    <span
      contentEditable
      suppressContentEditableWarning
      spellCheck={false}
      data-ph={ph}
      data-focus={id}
      className={`ed ${block ? "block" : ""} ${className}`}
      onBlur={(e) => {
        const t = (e.currentTarget.textContent ?? "").trim();
        if (t !== value) onCommit(t);
      }}
      onKeyDown={(e) => {
        onKey?.(e);
        if (e.defaultPrevented) return;
        if (e.key === "Enter") {
          e.preventDefault();
          if (onEnter) onEnter();
          else e.currentTarget.blur();
        }
      }}
      onPaste={(e: ClipboardEvent<HTMLSpanElement>) => {
        e.preventDefault();
        document.execCommand("insertText", false, e.clipboardData.getData("text/plain").replace(/\s+/g, " "));
      }}
    >
      {value}
    </span>
  );
}

function AddBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className="no-print rounded-md border border-theme bg-theme/10 px-2.5 py-0.5 font-sans text-[11px] font-semibold normal-case text-theme shadow-xs transition-colors hover:bg-theme hover:text-white">
      + {label}
    </button>
  );
}

function DelBtn({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} title="Eliminar" aria-label="Eliminar"
      className="no-print absolute -right-6 top-0 flex h-5 w-5 items-center justify-center rounded text-sm text-red-600 opacity-40 hover:bg-red-50 hover:opacity-100 group-hover:opacity-100">
      ×
    </button>
  );
}

/** Sección con título en mayúsculas y regla superior. Si está vacía, se oculta solo al imprimir. */
function Section({ title, onAdd, addLabel, empty = false, ruled = true, children }: {
  title: string; onAdd?: () => void; addLabel?: string; empty?: boolean; ruled?: boolean; children: ReactNode;
}) {
  return (
    <section className={`mt-6 ${ruled ? "border-t-2 border-[#111] pt-4" : ""} ${hide(empty)}`}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-[18px] font-normal uppercase tracking-[.03em] text-[#111]">
          {title}
        </h2>
        {onAdd && addLabel ? <AddBtn label={addLabel} onClick={onAdd} /> : null}
      </div>
      {children}
    </section>
  );
}

function Row({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 shrink-0">{icon}</span>
      <div className="min-w-0 flex-1 break-words">{children}</div>
    </div>
  );
}

function Svg({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {children}
    </svg>
  );
}
const PinIcon = () => <Svg><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></Svg>;
const MailIcon = () => <Svg><rect x="3" y="5" width="18" height="14" rx="1.5" /><path d="m3 7 9 6 9-6" /></Svg>;
const PhoneIcon = () => <Svg><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" /></Svg>;
const GlobeIcon = () => <Svg><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></Svg>;

/** Hoja Harvard editable en el lugar, con columna lateral (foto, contacto, formación, idiomas) y columna principal.
 *  Es el único punto de edición y visualización del CV y del perfil: el CV se guarda con `up` y el perfil con `onProfile`. */
export function HarvardEditable({
  cv, up, onProfile, headline, origin, careers, fotoSrc, photo, tags = [], id = "cv-print",
}: {
  cv: HarvardCv;
  up: Up;
  onProfile: (p: ProfilePatch) => void;
  headline: string;
  origin: string;
  careers: readonly string[];
  fotoSrc: string;
  photo?: ReactNode;
  /** Etiquetas del perfil: alimentan las secciones de habilidades, áreas, competencias, idiomas e intereses. */
  tags?: string[];
  id?: string;
}) {
  const p = cv.personal;
  // Id del campo que debe recibir el cursor tras agregar o quitar una fila.
  const pendingFocus = useRef<string | null>(null);

  useEffect(() => {
    const target = pendingFocus.current;
    if (!target) return;
    pendingFocus.current = null;
    const el = document.querySelector<HTMLElement>(`[data-focus="${target}"]`);
    if (el) caretAtEnd(el);
  });

  const addEdu = () => {
    pendingFocus.current = `edu-${cv.education.length}-inst`;
    up((c) => { c.education.push(emptyEducation()); return c; });
  };
  const addExp = () => {
    pendingFocus.current = `exp-${cv.experience.length}-role`;
    up((c) => { c.experience.push(emptyExperience()); return c; });
  };
  const addProj = () => {
    pendingFocus.current = `proj-${cv.projects.length}-title`;
    up((c) => { c.projects.push(emptyProject()); return c; });
  };

  /** Lista separada por comas (idiomas, habilidades, intereses, certificaciones): cada elemento es editable. */
  const listEd = (key: string, value: string, onChange: (v: string) => void, ph: string, bullet = false) => {
    const items = value ? value.split(",").map((s) => s.trim()) : [""];
    return items.map((it, k) => (
      <div key={k} className={`group relative ${hide(!it)}`}>
        <div className={bullet ? "flex gap-2" : ""}>
          {bullet ? <span aria-hidden>•</span> : null}
          <Ed
            block
            value={it}
            ph={ph}
            id={`${key}-${k}`}
            onCommit={(v) => { const next = [...items]; if (v) next[k] = v; else next.splice(k, 1); onChange(next.join(", ")); }}
            onEnter={() => {
              pendingFocus.current = `${key}-${k + 1}`;
              const next = [...items];
              next.splice(k + 1, 0, "");
              onChange(next.join(", "));
            }}
            onKey={(ev) => {
              if (ev.key === "Backspace" && !ev.currentTarget.textContent && items.length > 1) {
                ev.preventDefault();
                pendingFocus.current = `${key}-${Math.max(0, k - 1)}`;
                const next = [...items];
                next.splice(k, 1);
                onChange(next.join(", "));
              }
            }}
          />
        </div>
      </div>
    ));
  };

  // Las secciones salen de las etiquetas del perfil (se editan en "Datos del perfil") y solo aparecen si tienen alguna.
  const porCategoria = (cat: string) => tags.filter((t) => tagCategory(t) === cat);
  const idiomas = porCategoria("Idiomas");
  const tecnologias = porCategoria("Tecnologías");
  const areas = porCategoria("Áreas");
  const competencias = porCategoria("Competencias");
  const intereses = porCategoria("Personalizada");
  const lista = (items: string[]) => (
    <div className="space-y-0.5">{items.map((t) => <div key={t}>{t}</div>)}</div>
  );

  return (
    <div id={id} className="cv2 harvard-edit flex overflow-hidden rounded-lg border bg-white shadow-xs">
      {/* Columna lateral */}
      <aside className="cv2-side w-[280px] shrink-0 bg-[#f1f1f1] px-7 py-9">
        <div className="relative mx-auto size-[220px]">
          <FotoPerfil foto={fotoSrc} alt={`Foto de ${p.full_name}`} className="size-full rounded-full object-cover" />
          {photo ? <div className="no-print absolute -bottom-2 left-1/2 -translate-x-1/2">{photo}</div> : null}
        </div>

        <div className="mt-10 space-y-3">
          <Row icon={<PinIcon />}><Ed value={p.city} ph="Ciudad" onCommit={(v) => onProfile({ city: v })} /></Row>
          <Row icon={<MailIcon />}><span>{p.email}</span></Row>
          <Row icon={<PhoneIcon />}><Ed value={p.phone} ph="Teléfono" onCommit={(v) => onProfile({ phone: v })} /></Row>
          <Row icon={<GlobeIcon />}>
            <div><Ed value={p.linkedin} ph="LinkedIn" onCommit={(v) => onProfile({ linkedin: v })} /></div>
            <div><Ed value={p.portfolio} ph="Portafolio / GitHub" onCommit={(v) => onProfile({ portfolio: v })} /></div>
          </Row>
        </div>


        {idiomas.length > 0 && <Section title="Idiomas">{lista(idiomas)}</Section>}
        {tecnologias.length > 0 && <Section title="Habilidades técnicas">{lista(tecnologias)}</Section>}
        {areas.length > 0 && <Section title="Áreas">{lista(areas)}</Section>}
        {competencias.length > 0 && <Section title="Competencias">{lista(competencias)}</Section>}
        {intereses.length > 0 && <Section title="Intereses">{lista(intereses)}</Section>}
      </aside>

      {/* Columna principal */}
      <main className="min-w-0 flex-1 px-9 py-9">
        <h1 className="text-[32px] font-bold leading-tight tracking-tight">
          <Ed value={p.full_name} ph="Tu nombre completo" onCommit={(v) => { if (v) onProfile({ name: v }); }} />
        </h1>
        <div className="mt-1 text-[17px] italic">
          <Ed block value={headline} ph="Titular profesional, ej. Desarrolladora backend en formación" onCommit={(v) => onProfile({ headline: v })} />
        </div>

        <Section title="Resumen ejecutivo" ruled={false} empty={!p.summary}>
          <Ed block value={p.summary} ph="Escribe tu perfil profesional: quién eres, qué estudias y qué buscas"
            onCommit={(v) => up((c) => { c.personal.summary = v; return c; })} />
        </Section>
        <Section title="Formación" onAdd={addEdu} addLabel="Educación">
          {cv.education.map((e, i) => {
            const primary = i === 0;
            const set = (k: "institution" | "city" | "degree" | "dates" | "gpa" | "details") => (v: string) =>
              up((c) => { c.education[i][k] = v; return c; });
            // La formación principal (institución, carrera y promedio) viene del Perfil.
            const commitGpa = primary ? (v: string) => onProfile({ gpa: v }) : set("gpa");
            const empty = !primary && !e.institution && !e.degree;
            return (
              <div key={i} className={`group relative mb-4 ${hide(empty)}`}>
                <div className="font-bold">
                  {primary ? (
                    <span className={hide(!e.degree)}>
                      <select value={careers.includes(e.degree) ? e.degree : ""} aria-label="Carrera"
                        onChange={(ev) => onProfile({ career: ev.target.value })}
                        className="max-w-full cursor-pointer bg-transparent font-bold outline-none hover:bg-theme/5 focus:bg-theme/10">
                        <option value="">Selecciona tu carrera…</option>
                        {careers.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </span>
                  ) : (
                    <Ed value={e.degree} ph="Título / carrera" onCommit={set("degree")} />
                  )}
                </div>
                <div>
                  {primary && origin !== "EXTERNO" ? e.institution : (
                    <Ed value={e.institution} ph="Institución" id={`edu-${i}-inst`}
                      onCommit={primary ? (v) => onProfile({ institution: v }) : set("institution")} />
                  )}
                  {e.city || !primary ? <>{", "}<Ed value={e.city} ph="Ciudad" onCommit={set("city")} /></> : null}
                </div>
                <div className={hide(!e.gpa)}>
                  {"Promedio: "}
                  <Ed value={e.gpa} ph="0 - 10" onCommit={commitGpa} />
                </div>
                <div><Ed value={e.dates} ph="Abr 2021 - Presente" onCommit={set("dates")} /></div>
                <div className={`text-[12px] ${hide(!e.details)}`}>
                  <Ed block value={e.details} ph="Cursos o detalles" onCommit={set("details")} />
                </div>
                {primary ? null : <DelBtn onClick={() => up((c) => { c.education.splice(i, 1); return c; })} />}
              </div>
            );
          })}
        </Section>

        <Section title="Experiencia laboral" onAdd={addExp} addLabel="Experiencia" empty={cv.experience.length === 0}>
          {cv.experience.length === 0 ? (
            <p className="no-print text-xs italic text-slate-500">Prácticas, pasantías, ayudantías o voluntariados. Usa «+ Experiencia».</p>
          ) : null}
          {cv.experience.map((e, i) => {
            const set = (k: "company" | "city" | "role" | "dates") => (v: string) =>
              up((c) => { c.experience[i][k] = v; return c; });
            const empty = !e.company && !e.role;
            const bullets = e.bullets.length ? e.bullets : [""];
            return (
              <div key={i} className={`group relative mb-5 ${hide(empty)}`}>
                <div className="flex justify-between gap-4 font-bold">
                  <Ed value={e.role} ph="Cargo" id={`exp-${i}-role`} onCommit={set("role")} />
                  <span className="shrink-0 whitespace-nowrap"><Ed value={e.dates} ph="Ene 2020 - Presente" onCommit={set("dates")} /></span>
                </div>
                <div>
                  <Ed value={e.company} ph="Organización" id={`exp-${i}-company`} onCommit={set("company")} />
                  {", "}
                  <Ed value={e.city} ph="Ciudad" onCommit={set("city")} />
                </div>
                <div className="mt-1">
                  {bullets.map((b, k) => (
                    <div key={k} className={hide(!b)}>
                      <Ed
                        block
                        value={b}
                        ph="Escribe un logro (Enter agrega otro)"
                        id={`exp-${i}-b-${k}`}
                        onCommit={(v) => up((c) => { c.experience[i].bullets[k] = v; return c; })}
                        onEnter={() => {
                          pendingFocus.current = `exp-${i}-b-${k + 1}`;
                          up((c) => { c.experience[i].bullets.splice(k + 1, 0, ""); return c; });
                        }}
                        onKey={(ev) => {
                          if (ev.key === "Backspace" && !ev.currentTarget.textContent && bullets.length > 1) {
                            ev.preventDefault();
                            pendingFocus.current = `exp-${i}-b-${Math.max(0, k - 1)}`;
                            up((c) => { c.experience[i].bullets.splice(k, 1); return c; });
                          }
                        }}
                      />
                    </div>
                  ))}
                </div>
                <DelBtn onClick={() => up((c) => { c.experience.splice(i, 1); return c; })} />
              </div>
            );
          })}
        </Section>

        <Section title="Proyectos y liderazgo" onAdd={addProj} addLabel="Proyecto" empty={cv.projects.length === 0}>
          {cv.projects.length === 0 ? (
            <p className="no-print text-xs italic text-slate-500">Proyectos académicos, personales o cargos de liderazgo. Usa «+ Proyecto».</p>
          ) : null}
          {cv.projects.map((e, i) => {
            const set = (k: "title" | "role" | "dates" | "description") => (v: string) =>
              up((c) => { c.projects[i][k] = v; return c; });
            return (
              <div key={i} className={`group relative mb-5 ${hide(!e.title)}`}>
                <div className="flex justify-between gap-4 font-bold">
                  <Ed value={e.title} ph="Nombre del proyecto" id={`proj-${i}-title`} onCommit={set("title")} />
                  <span className="shrink-0 whitespace-nowrap"><Ed value={e.dates} ph="Sep 2024 - Feb 2025" onCommit={set("dates")} /></span>
                </div>
                <div className={hide(!e.role)}><i><Ed value={e.role} ph="Tu rol" onCommit={set("role")} /></i></div>
                <div><Ed block value={e.description} ph="Descripción breve" onCommit={set("description")} /></div>
                <DelBtn onClick={() => up((c) => { c.projects.splice(i, 1); return c; })} />
              </div>
            );
          })}
        </Section>

        <Section title="Certificaciones" empty={!cv.skills.certifications}>
          {listEd("cert", cv.skills.certifications, (v) => up((c) => { c.skills.certifications = v; return c; }), "Ej. PMP - Project Management Institute", true)}
        </Section>
      </main>
    </div>
  );
}
