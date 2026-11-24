"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { eliminarFotoAction, updatePerfilProfesionalAction } from "@/app/actions";
import { Button, Field, Input, Textarea, buttonClass } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { FotoPerfil } from "./FotoPerfil";

interface Props {
  open: boolean;
  onClose: () => void;
  foto: string;
  headline: string;
  bio: string;
}

/** Diálogo para cambiar la foto de perfil y editar el perfil profesional del postulante. */
export function PerfilProfesionalDialog({ open, onClose, foto, headline, bio }: Props) {
  const router = useRouter();
  const [archivo, setArchivo] = useState<File | null>(null);
  const [vista, setVista] = useState<string | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [aviso, setAviso] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);

  useEffect(() => {
    if (!open) return;
    const tecla = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [open, onClose]);

  useEffect(() => {
    if (!archivo) { setVista(null); return; }
    const url = URL.createObjectURL(archivo);
    setVista(url);
    return () => URL.revokeObjectURL(url);
  }, [archivo]);

  async function subirFoto(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!archivo) { setAviso({ tipo: "error", texto: "Selecciona una imagen." }); return; }
    setSubiendo(true);
    setAviso(null);
    try {
      const body = new FormData();
      body.append("foto", archivo);
      const r = await fetch("/api/foto", { method: "POST", body });
      const datos = await r.json().catch(() => ({}));
      if (!r.ok) { setAviso({ tipo: "error", texto: datos.error ?? "No se pudo subir la foto." }); return; }
      setAviso({ tipo: "ok", texto: "Foto de perfil actualizada." });
      setArchivo(null);
      router.refresh();
    } catch {
      setAviso({ tipo: "error", texto: "Sin conexión con el servidor. Intenta de nuevo." });
    } finally {
      setSubiendo(false);
    }
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Perfil profesional"
            onClick={(e) => e.stopPropagation()}
            initial={{ scale: 0.96, y: 8 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0 }}
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Perfil profesional</h2>
              <button type="button" aria-label="Cerrar" onClick={onClose} className="rounded-full p-1 text-slate-500 hover:bg-slate-100">✕</button>
            </div>

            <section className="mb-6 flex flex-col gap-4 border-b pb-6">
              <h3 className="text-sm font-semibold text-slate-800">Foto de perfil</h3>
              <div className="flex items-center gap-4">
                {vista ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={vista} alt="Vista previa de la nueva foto" className="size-24 shrink-0 rounded-full object-cover ring-1 ring-slate-200" />
                ) : (
                  <FotoPerfil key={foto} foto={foto} alt="Foto actual" className="size-24 shrink-0 rounded-full object-cover ring-1 ring-slate-200" />
                )}
                <form onSubmit={subirFoto} className="flex flex-1 flex-col gap-2">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => { setArchivo(e.target.files?.[0] ?? null); setAviso(null); }}
                    className="text-sm file:mr-3 file:rounded-full file:border-0 file:bg-theme/10 file:px-3 file:py-1.5 file:text-theme"
                  />
                  <p className="text-xs text-slate-500">JPG, PNG o WEBP de hasta 3 MB. Usa una foto clara del rostro.</p>
                  <div><button type="submit" disabled={subiendo || !archivo} className={buttonClass("default", "sm")}>{subiendo ? "Subiendo…" : "Actualizar foto"}</button></div>
                  {aviso ? (
                    <p role="status" className={`text-xs ${aviso.tipo === "ok" ? "text-theme" : "text-rose-600"}`}>{aviso.texto}</p>
                  ) : null}
                </form>
              </div>
              {foto ? (
                <form action={eliminarFotoAction}>
                  <SubmitButton size="sm" variant="ghost" confirm="¿Quitar tu foto y volver a la predeterminada?">Usar foto predeterminada</SubmitButton>
                </form>
              ) : null}
            </section>

            <section>
              <h3 className="mb-3 text-sm font-semibold text-slate-800">Resumen profesional</h3>
              <form action={updatePerfilProfesionalAction} className="flex flex-col gap-4">
                <Field label="Titular" hint="Una línea que te describa, por ejemplo: Estudiante de Sistemas · Desarrollo web.">
                  <Input name="headline" defaultValue={headline} maxLength={140} placeholder="Ej. Estudiante de Ingeniería en Sistemas" />
                </Field>
                <Field label="Resumen" hint="Cuenta tu experiencia, intereses y lo que buscas. Mínimo 60 caracteres para completar el CV.">
                  <Textarea name="bio" defaultValue={bio} rows={6} maxLength={2000} />
                </Field>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
                  <SubmitButton>Guardar perfil profesional</SubmitButton>
                </div>
              </form>
            </section>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
