"use client";

import { useState } from "react";

/** Silueta predeterminada dibujada en SVG: no depende de archivos estáticos. */
export function SiluetaPredeterminada({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 160" className={className} role="img" aria-label="Foto predeterminada">
      <rect width="160" height="160" fill="#e6f0f1" />
      <circle cx="80" cy="62" r="28" fill="#145962" opacity="0.85" />
      <path d="M28 150c4-33 24-52 52-52s48 19 52 52z" fill="#145962" opacity="0.85" />
    </svg>
  );
}

/** Foto del postulante; si no hay foto o no carga, muestra la predeterminada. Usar con key={foto}. */
export function FotoPerfil({ foto, alt, className }: { foto: string; alt: string; className?: string }) {
  const [fallo, setFallo] = useState(false);
  if (!foto || fallo) return <SiluetaPredeterminada className={className} />;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={`/api/foto/${foto}`} alt={alt} className={className} onError={() => setFallo(true)} />;
}
