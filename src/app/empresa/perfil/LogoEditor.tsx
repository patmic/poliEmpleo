"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

/** Muestra el logo de la empresa y permite subir uno nuevo. */
export function LogoEditor({ logo, nombre }: { logo: string; nombre: string }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState("");

  async function subir(archivo: File) {
    setError("");
    setSubiendo(true);
    try {
      const body = new FormData();
      body.append("logo", archivo);
      const r = await fetch("/api/logo", { method: "POST", body });
      const datos = await r.json().catch(() => ({}));
      if (!r.ok) { setError(datos.error ?? "No se pudo subir el logo."); return; }
      router.refresh();
    } catch {
      setError("Sin conexión con el servidor. Intenta de nuevo.");
    } finally {
      setSubiendo(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-5 rounded-xl bg-white p-5 ring-1 ring-slate-200">
      <div className="grid size-24 shrink-0 place-items-center overflow-hidden rounded-xl bg-slate-100">
        {logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logo} alt={`Logo de ${nombre}`} className="size-full object-contain p-1" />
        ) : (
          <span className="text-2xl font-semibold text-slate-400">{nombre.charAt(0).toUpperCase()}</span>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <div className="font-medium text-slate-900">Logo de la empresa</div>
        <p className="text-sm text-muted-foreground">Se muestra en tus vacantes. JPG, PNG o WEBP, máximo 2 MB.</p>
        <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) subir(f); }} />
        <button type="button" disabled={subiendo} onClick={() => input.current?.click()}
          className="w-fit rounded-lg bg-theme px-4 py-2 text-sm font-semibold text-white hover:bg-theme-hover disabled:opacity-50">
          {subiendo ? "Subiendo…" : logo ? "Cambiar logo" : "Subir logo"}
        </button>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </div>
    </div>
  );
}
