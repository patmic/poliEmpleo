import type { ReactNode } from "react";
import { Alert } from "@/components/ui";

/** Opciones de un <select> a partir de una lista constante. */
export function Opts({ lista, vacio }: { lista: readonly string[]; vacio?: string }) {
  return (
    <>
      {vacio !== undefined ? <option value="">{vacio}</option> : null}
      {lista.map((o) => <option key={o} value={o}>{o}</option>)}
    </>
  );
}

/** Mensaje de confirmación que la acción deja en la URL (?ok=...). */
export function Aviso({ ok }: { ok?: string }) {
  return ok ? <div className="mb-6"><Alert variant="theme" title={ok} /></div> : null;
}

export function Tabla({ children }: { children: ReactNode }) {
  return <div className="overflow-x-auto"><table className="w-full text-sm">{children}</table></div>;
}

export const TH = "border-b px-3 py-2 text-left font-medium text-muted-foreground";
export const TD = "border-b px-3 py-2 align-top last:border-0";
export const CAJA = "h-9 rounded-md border bg-white px-2 text-sm";
