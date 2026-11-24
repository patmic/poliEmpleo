"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import { saveCv, updateStudentProfile } from "@/app/actions";
import { HarvardEditable, type ProfilePatch } from "@/components/HarvardEditable";
import type { HarvardCv } from "@/lib/cv";
import { FotoEditor } from "./FotoEditor";

type Parsed = { cv: Partial<HarvardCv>; tags: string[]; method: "ia" | "local"; fields: number; file?: string; warning?: string };

/** Espera tras el último cambio antes de guardar solo. */
const AUTOSAVE_MS = 1500;

/** Mi CV: la hoja Harvard es el único punto de edición. El CV se guarda en `cv_json`
 *  y los datos del perfil (nombre, contacto, titular, formación) en el Perfil del estudiante. */
export function CvEditor({ initial, headline: headlineInicial, origin, careers, foto, userTags, lastSaved, studentId }: {
  initial: HarvardCv; headline: string; origin: string; careers: readonly string[]; foto: string;
  userTags: string[]; lastSaved: string | null; studentId: number;
}) {
  const [cv, setCv] = useState<HarvardCv>(initial);
  const [headline, setHeadline] = useState(headlineInicial);
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState<string | null>(lastSaved);
  const [pending, start] = useTransition();
  const [parsed, setParsed] = useState<Parsed | null>(null);
  const [pickTags, setPickTags] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  // Versión más reciente del CV, para no marcar como guardado un cambio que llegó durante el guardado.
  const cvRef = useRef(cv);
  cvRef.current = cv;

  const up = (fn: (c: HarvardCv) => HarvardCv) => { setCv((c) => fn(structuredClone(c))); setDirty(true); };

  const save = (extraTags: string[] = [], next?: HarvardCv) => {
    const snapshot = next ?? cvRef.current;
    start(async () => {
      setError(null);
      try {
        const r = await saveCv(snapshot, extraTags);
        setSaved(r.savedAt);
        if (cvRef.current === snapshot) setDirty(false);
      } catch {
        setError("No se pudo guardar. Revisa tu sesión e inténtalo de nuevo.");
      }
    });
  };

  // Datos del perfil: se reflejan en la hoja y se guardan de inmediato en el Perfil.
  const setProfile = (p: ProfilePatch) => {
    setCv((c) => {
      const n = structuredClone(c);
      if (p.name !== undefined) n.personal.full_name = p.name;
      if (p.phone !== undefined) n.personal.phone = p.phone;
      if (p.city !== undefined) n.personal.city = p.city;
      if (p.linkedin !== undefined) n.personal.linkedin = p.linkedin;
      if (p.portfolio !== undefined) n.personal.portfolio = p.portfolio;
      if (p.career !== undefined) n.education[0].degree = p.career;
      if (p.gpa !== undefined) n.education[0].gpa = p.gpa;
      if (p.institution !== undefined) n.education[0].institution = p.institution;
      return n;
    });
    if (p.headline !== undefined) setHeadline(p.headline);
    start(async () => {
      setError(null);
      try {
        await updateStudentProfile(p);
      } catch {
        setError("No se pudo guardar el dato del perfil. Revisa tu sesión e inténtalo de nuevo.");
      }
    });
  };

  // Guardado automático: al dejar de editar un momento, se guarda en la base de datos.
  useEffect(() => {
    if (!dirty) return;
    const t = setTimeout(() => save(), AUTOSAVE_MS);
    return () => clearTimeout(t);
    // save se recrea en cada render; solo nos interesa reaccionar a cambios del CV.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cv, dirty]);

  async function onUpload(f: File) {
    setUploading(true); setError(null); setParsed(null);
    const fd = new FormData();
    fd.append("file", f);
    try {
      const res = await fetch("/api/cv/parse", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error");
      setParsed(data);
      setPickTags((data.tags as string[]).filter((t) => !userTags.includes(t)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo leer el archivo.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function applyParsed() {
    if (!parsed) return;
    const p = parsed.cv;
    // Datos de contacto que estaban vacíos y el PDF trae: van al Perfil además de la hoja.
    const profilePatch: ProfilePatch = {};
    const pp = p.personal;
    if (pp) {
      const cur = cv.personal;
      if (pp.full_name && !cur.full_name) profilePatch.name = pp.full_name;
      if (pp.phone && !cur.phone) profilePatch.phone = pp.phone;
      if (pp.city && !cur.city) profilePatch.city = pp.city;
      if (pp.linkedin && !cur.linkedin) profilePatch.linkedin = pp.linkedin;
      if (pp.portfolio && !cur.portfolio) profilePatch.portfolio = pp.portfolio;
    }
    const merge = (c: HarvardCv) => {
      if (p.personal) for (const [k, v] of Object.entries(p.personal)) if (v && !c.personal[k as keyof HarvardCv["personal"]]) c.personal[k as keyof HarvardCv["personal"]] = v as string;
      const hasContent = <T extends object>(list: T[]) => list.some((x) => Object.values(x).some((v) => (Array.isArray(v) ? v.some(Boolean) : !!v)));
      const sinDetalle = !c.education.some((x, i) => i > 0 || x.city || x.dates || x.details);
      if (p.education?.length && sinDetalle) {
        const [primera, ...resto] = p.education as HarvardCv["education"];
        const base = c.education[0];
        c.education = [{ ...primera, institution: base.institution, degree: base.degree, gpa: base.gpa }, ...resto];
      }
      if (p.experience?.length && !hasContent(c.experience)) c.experience = p.experience as HarvardCv["experience"];
      if (p.projects?.length && !hasContent(c.projects)) c.projects = p.projects as HarvardCv["projects"];
      if (p.skills) for (const [k, v] of Object.entries(p.skills)) if (v && !c.skills[k as keyof HarvardCv["skills"]]) c.skills[k as keyof HarvardCv["skills"]] = v as string;
      return c;
    };
    const next = merge(structuredClone(cv));
    setCv(next);
    setParsed(null);
    if (Object.keys(profilePatch).length) updateStudentProfile(profilePatch).catch(() => setError("No se pudieron guardar los datos de contacto en tu perfil."));
    // Guarda de inmediato el CV completado y las etiquetas aceptadas.
    save(pickTags, next);
  }

  const btn = "inline-flex h-[34px] items-center rounded-md border border-slate-300 px-3 text-sm font-medium hover:bg-slate-50 disabled:opacity-50";

  return (
    <div className="flex flex-col gap-4">
      {/* Barra de acciones */}
      <div className="sticky top-[60px] z-30 flex flex-wrap items-center gap-2 rounded-xl border bg-white/95 p-3 backdrop-blur">
        <button type="button" onClick={() => save()} disabled={pending || !dirty}
          className="inline-flex h-[34px] items-center rounded-md bg-theme px-4 text-sm font-semibold text-white hover:bg-theme-hover disabled:opacity-50">
          {pending ? "Guardando…" : dirty ? "Guardar cambios" : "Guardado"}
        </button>
        <input ref={fileRef} type="file" accept="application/pdf,.pdf" hidden onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])} />
        <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className={btn}>
          {uploading ? "Leyendo PDF…" : "Subir CV en PDF"}
        </button>
        <a href={`/api/cv/docx?student=${studentId}`} className={btn}>Word</a>
        <button type="button" onClick={() => window.print()} className={btn}>PDF</button>
        <span className="ml-auto text-xs text-muted-foreground">{saved ? `Último guardado: ${new Date(saved.includes("T") ? saved : saved.replace(" ", "T") + "Z").toLocaleString("es-EC")}` : "Sin guardar"}</span>
      </div>

      {error ? <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

      {parsed ? (
        <div className="rounded-xl border border-theme/40 bg-theme/5 p-4 text-sm">
          <div className="font-medium">Tu CV fue procesado {parsed.method === "ia" ? "con IA" : "con el lector local"}</div>
          <p className="mt-1 text-muted-foreground">
            Detectamos {parsed.fields} dato{parsed.fields === 1 ? "" : "s"}. Al aplicar, solo se completan los campos vacíos de tu CV; nada de lo que ya escribiste se reemplaza.
            {parsed.warning ? ` ${parsed.warning}` : ""}
          </p>
          {parsed.tags.length ? (
            <div className="mt-3">
              <div className="mb-1.5 text-xs font-medium text-muted-foreground">Etiquetas sugeridas para tu perfil</div>
              <div className="flex flex-wrap gap-1.5">
                {parsed.tags.map((t) => {
                  const has = userTags.includes(t);
                  const on = has || pickTags.includes(t);
                  return (
                    <button key={t} type="button" disabled={has} onClick={() => setPickTags((s) => (s.includes(t) ? s.filter((x) => x !== t) : [...s, t]))}
                      className={`h-6 rounded-full border px-2.5 text-xs font-medium ${on ? "border-theme bg-theme text-white" : "border-border bg-white"} ${has ? "opacity-60" : ""}`}>
                      {t}{has ? " ✓" : ""}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
          <div className="mt-4 flex gap-2">
            <button type="button" onClick={applyParsed} className="h-8 rounded-md bg-theme px-3 text-sm font-semibold text-white hover:bg-theme-hover">Aplicar al CV y guardar</button>
            <button type="button" onClick={() => setParsed(null)} className="h-8 rounded-md px-3 text-sm font-medium hover:bg-muted">Descartar</button>
          </div>
        </div>
      ) : null}

      <div className="mx-auto w-full max-w-[820px]">
        <HarvardEditable
          cv={cv}
          up={up}
          onProfile={setProfile}
          headline={headline}
          origin={origin}
          careers={careers}
          fotoSrc={foto}
          photo={<FotoEditor foto={foto} />}
          tags={userTags}
        />
      </div>
    </div>
  );
}
