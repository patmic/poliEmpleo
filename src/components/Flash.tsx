"use client";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";

/** Muestra mensajes ?ok= / ?error= que dejan las acciones del servidor. */
export function Flash() {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const ok = sp.get("ok");
  const error = sp.get("error");
  const [visible, setVisible] = useState(true);
  useEffect(() => setVisible(true), [ok, error]);
  if ((!ok && !error) || !visible) return null;
  const close = () => {
    setVisible(false);
    const next = new URLSearchParams(sp.toString());
    next.delete("ok"); next.delete("error");
    router.replace(pathname + (next.toString() ? `?${next}` : ""), { scroll: false });
  };
  return (
    <div role="status" className={`mx-auto mb-4 flex max-w-6xl items-center justify-between gap-4 rounded-lg border px-4 py-3 text-sm ${error ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}>
      <span>{error ?? ok}</span>
      <button onClick={close} aria-label="Cerrar" className="text-lg leading-none opacity-70 hover:opacity-100">×</button>
    </div>
  );
}
