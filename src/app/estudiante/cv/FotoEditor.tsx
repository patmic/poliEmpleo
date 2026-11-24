"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { eliminarFotoAction } from "@/app/actions";

/** Controles de la foto sobre la hoja del CV: un lápiz para cambiarla y, si hay una propia, volver a la predeterminada.
 *  Se muestran solo en pantalla (no se imprimen). */
export function FotoEditor({ foto }: { foto: string }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState("");

  async function subir(archivo: File) {
    setError("");
    setSubiendo(true);
    try {
      const body = new FormData();
      body.append("foto", archivo);
      const r = await fetch("/api/foto", { method: "POST", body });
      const datos = await r.json().catch(() => ({}));
      if (!r.ok) {
        setError(datos.error ?? "No se pudo subir la foto.");
        return;
      }
      router.refresh();
    } catch {
      setError("Sin conexión con el servidor. Intenta de nuevo.");
    } finally {
      setSubiendo(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) subir(f); }}
      />
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={subiendo}
          onClick={() => input.current?.click()}
          title="Cambiar foto"
          aria-label="Cambiar foto"
          className="flex size-11 items-center justify-center rounded-full bg-sky-500 text-white shadow-md transition-colors hover:bg-sky-600 disabled:opacity-50"
        >
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
          </svg>
        </button>
        {foto ? (
          <form action={eliminarFotoAction}>
            <button type="submit" title="Usar foto predeterminada" aria-label="Usar foto predeterminada"
              className="flex size-8 items-center justify-center rounded-full border border-slate-300 bg-white text-sm shadow-md hover:bg-slate-50">
              ↺
            </button>
          </form>
        ) : null}
      </div>
      {error ? <p role="alert" className="rounded bg-white px-2 text-[11px] text-rose-600 shadow">{error}</p> : null}
    </div>
  );
}
