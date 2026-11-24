"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

const STORAGE_KEY = "poliempleo_notificaciones";

/** Muestra una notificación del navegador si el permiso fue concedido. */
export function notifyBrowser(title: string, body: string, href = "/") {
  if (typeof window === "undefined" || !("Notification" in window) || Notification.permission !== "granted") return;
  const n = new Notification(title, { body, tag: href });
  n.onclick = () => {
    window.focus();
    window.location.href = href;
  };
}

/** Pregunta, como el navegador, si poliEmpleo puede mostrar notificaciones. */
export function NotificationPrompt() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!("Notification" in window) || Notification.permission !== "default") return;
    if (localStorage.getItem(STORAGE_KEY) === "bloqueado" || sessionStorage.getItem(STORAGE_KEY) === "cerrado") return;
    const t = window.setTimeout(() => setVisible(true), 2500);
    return () => window.clearTimeout(t);
  }, []);

  function cerrar(clave: "bloqueado" | "cerrado") {
    if (clave === "bloqueado") localStorage.setItem(STORAGE_KEY, clave);
    else sessionStorage.setItem(STORAGE_KEY, clave);
    setVisible(false);
  }

  async function permitir() {
    const resultado = await Notification.requestPermission();
    setVisible(false);
    if (resultado === "granted") {
      notifyBrowser("Notificaciones activadas", "Te avisaremos de nuevas respuestas y entrevistas.");
    } else if (resultado === "denied") {
      localStorage.setItem(STORAGE_KEY, "bloqueado");
    }
  }

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          role="dialog"
          aria-label="Permiso de notificaciones"
          initial={{ opacity: 0, y: -12, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -12, scale: 0.97 }}
          transition={{ duration: 0.2 }}
          className="fixed left-4 top-20 z-50 w-80 max-w-[calc(100vw-2rem)] rounded-2xl border bg-white p-4 shadow-xl"
        >
          <div className="mb-3 flex items-start justify-between gap-3">
            <p className="text-[15px] font-semibold leading-snug text-slate-900">
              <span className="font-bold">poliEmpleo</span> quiere
            </p>
            <button type="button" aria-label="Cerrar" onClick={() => cerrar("cerrado")} className="-mr-1 -mt-1 rounded-full p-1 text-slate-500 hover:bg-slate-100">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
            </button>
          </div>
          <div className="mb-4 flex items-center gap-3 text-sm text-slate-700">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" className="shrink-0 text-slate-600">
              <path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
            </svg>
            Mostrar notificaciones
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => cerrar("bloqueado")} className="rounded-full bg-sky-100 px-4 py-2 text-sm font-medium text-sky-900 hover:bg-sky-200">
              Bloquear
            </button>
            <button type="button" onClick={permitir} className="rounded-full bg-sky-100 px-4 py-2 text-sm font-medium text-sky-900 hover:bg-sky-200">
              Permitir
            </button>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
