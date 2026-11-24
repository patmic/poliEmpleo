"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/** Botón con foto/iniciales que despliega el menú de usuario. Se cierra al hacer clic fuera o con Escape. */
export function UserMenu({ trigger, children }: { trigger: ReactNode; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Menú de usuario"
        className="flex items-center rounded-full ring-2 ring-white/20 transition hover:ring-teal-400 focus:outline-none focus-visible:ring-teal-400"
      >
        {trigger}
      </button>
      {open ? (
        <div role="menu" className="absolute right-0 top-full z-50 mt-3 max-h-[80vh] w-[320px] overflow-y-auto rounded-2xl bg-white p-5 text-slate-700 shadow-2xl ring-1 ring-slate-200">
          <button type="button" onClick={() => setOpen(false)} aria-label="Cerrar menú" className="absolute right-4 top-4 rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900">
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
          {children}
        </div>
      ) : null}
    </div>
  );
}
