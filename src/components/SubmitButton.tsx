"use client";
import { useFormStatus } from "react-dom";
import { buttonClass, type BtnVariant, type BtnSize } from "./ui";

/** Botón de envío que se deshabilita mientras la acción del servidor trabaja. Opcionalmente pide confirmación. */
export function SubmitButton({ children, variant = "default", size = "default", confirm, className }: { children: React.ReactNode; variant?: BtnVariant; size?: BtnSize; confirm?: string; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={buttonClass(variant, size, className)}
      onClick={(e) => { if (confirm && !window.confirm(confirm)) e.preventDefault(); }}>
      {pending ? "Procesando…" : children}
    </button>
  );
}
