"use client";

/* Dial tipo sintonizador de canales para la portada.
   - El anillo y las etiquetas están fijos; cuatro opciones en sus posiciones.
   - El triángulo naranja gira con el mouse (o barre solo) y selecciona la opción.
   - La imagen central y la palabra activa cambian según la opción seleccionada.
   - Pulsar el dial abre la opción seleccionada. */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type CSSProperties, type MouseEvent } from "react";

type Opcion = {
  text: string;
  imagen: string;
  angulo: number; // posición en el anillo (0° = arriba, sentido horario)
  target?: string;
  href?: string;
  negrita?: boolean;
};

const OPCIONES: Opcion[] = [
  { text: "poliEmpleo", imagen: "/poliempleo.jpg", angulo: 0, href: "#conecta", negrita: true },
  { text: "Postulante", imagen: "/estudiante.jpg", angulo: 120, href: "/postulante" },
  { text: "Empresas", imagen: "/empresa.png", angulo: 180, href: "/empresa-acceso" },
  { text: "Administración", imagen: "/administracion.png", angulo: 240, href: "/admin-acceso" },
];

const TICKS = Array.from({ length: 180 }, (_, i) => {
  const mayor = i % 15 === 0;
  return { deg: (360 / 180) * i, mayor };
});

function normalizar(angulo: number) {
  return ((angulo % 360) + 360) % 360;
}

function distanciaAngular(a: number, b: number) {
  const d = Math.abs(normalizar(a - b));
  return Math.min(d, 360 - d);
}

/* Índice de la opción más cercana al ángulo del triángulo. */
function indiceMasCercano(angulo: number) {
  let mejor = 0;
  let distMejor = Infinity;
  OPCIONES.forEach((o, i) => {
    const d = distanciaAngular(angulo, o.angulo);
    if (d < distMejor) {
      distMejor = d;
      mejor = i;
    }
  });
  return mejor;
}

const CLASE_ETIQUETA =
  "absolute whitespace-nowrap border-0 font-sans text-[clamp(18px,2.2vmin,24px)] uppercase tracking-[0.15em] transition-colors";

export function DialHero() {
  const router = useRouter();
  const dialRef = useRef<HTMLDivElement>(null); // caja fija del anillo
  const brazoRef = useRef<HTMLDivElement>(null); // brazo que gira con el triángulo
  const anguloRef = useRef(0);
  const interactuandoRef = useRef(false);
  const girandoRef = useRef(true);
  const [girando, setGirando] = useState(true);
  const [activo, setActivo] = useState(0);
  const opcion = OPCIONES[activo];

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      girandoRef.current = false;
      setGirando(false);
    }
    let raf = 0;
    const pintar = () => {
      if (brazoRef.current) brazoRef.current.style.transform = `rotate(${anguloRef.current}deg)`;
      setActivo(indiceMasCercano(anguloRef.current));
    };
    const tick = () => {
      if (girandoRef.current && !interactuandoRef.current) {
        anguloRef.current = normalizar(anguloRef.current + 0.06);
        pintar();
      }
      raf = requestAnimationFrame(tick);
    };
    pintar();
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  function apuntarA(angulo: number) {
    anguloRef.current = normalizar(angulo);
    if (brazoRef.current) brazoRef.current.style.transform = `rotate(${anguloRef.current}deg)`;
    setActivo(indiceMasCercano(anguloRef.current));
  }

  function abrir(o: Opcion) {
    if (o.href?.startsWith("#")) {
      document.getElementById(o.href.slice(1))?.scrollIntoView({ behavior: "smooth", block: "start" });
    } else if (o.href) {
      router.push(o.href);
    } else if (o.target) {
      window.dispatchEvent(new CustomEvent("abrir-categoria", { detail: o.target }));
    }
  }

  // Ángulo del mouse y distancia relativa al centro (1 = borde de la caja del anillo).
  function medirPuntero(e: MouseEvent<HTMLDivElement>) {
    const caja = dialRef.current?.getBoundingClientRect();
    if (!caja) return null;
    const cx = caja.left + caja.width / 2;
    const cy = caja.top + caja.height / 2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    const relativo = Math.hypot(dx, dy) / (caja.width / 2);
    const angulo = (Math.atan2(dx, -dy) * 180) / Math.PI;
    return { angulo, relativo };
  }

  function alternarMovimiento() {
    const siguiente = !girandoRef.current;
    girandoRef.current = siguiente;
    setGirando(siguiente);
  }

  const estiloContenedor = {
    width: "calc(var(--dial) + 2 * var(--pad))",
    height: "calc(var(--dial) + 2 * var(--pad))",
    "--dial": "min(56vmin, 520px)",
    "--pad": "min(140px, 22vmin)",
    "--rd": "calc(var(--dial) * 0.5 + 8px)",
    "--dial-accent": "#ff5a36",
  } as CSSProperties;

  return (
    <div className="flex flex-col items-center gap-5">
      <div
        className="relative mx-auto cursor-pointer"
        style={estiloContenedor}
        onMouseEnter={() => {
          interactuandoRef.current = true;
        }}
        onMouseLeave={() => {
          interactuandoRef.current = false;
        }}
        onMouseMove={(e) => {
          const m = medirPuntero(e);
          // Solo el anillo selecciona; el centro (la imagen) no mueve el triángulo.
          if (m && m.relativo >= 0.8) apuntarA(m.angulo);
        }}
        onClick={() => abrir(opcion)}
      >
        {/* Anillo fijo: no gira. */}
        <div
          ref={dialRef}
          className="absolute"
          style={{ top: "var(--pad)", left: "var(--pad)", width: "var(--dial)", height: "var(--dial)" }}
        >
          <svg viewBox="0 0 100 100" aria-hidden="true" className="absolute inset-0 h-full w-full overflow-visible">
            {TICKS.map((t) => (
              <line
                key={t.deg}
                x1={50}
                y1={t.mayor ? 2.5 : 3.2}
                x2={50}
                y2={t.mayor ? 6.5 : 5.6}
                transform={`rotate(${t.deg} 50 50)`}
                stroke={t.mayor ? "#64748b" : "#cbd5e1"}
                strokeWidth={t.mayor ? 0.5 : 0.35}
              />
            ))}
          </svg>

          {OPCIONES.map((o) => (
            <span
              key={`punto-${o.text}`}
              aria-hidden="true"
              className="absolute left-1/2 top-1/2 h-2.5 w-2.5 rounded-full bg-slate-800"
              style={{ transform: `translate(-50%,-50%) rotate(${o.angulo}deg) translateY(calc(var(--rd) * -1))` }}
            />
          ))}

          {OPCIONES.map((o, i) => {
            // Mismo punto que el círculo; la etiqueta se separa 18 px de él.
            const rad = (o.angulo * Math.PI) / 180;
            const sx = Math.sin(rad);
            const cy = Math.cos(rad);
            const f = Math.sign(sx) * Math.min(1, Math.abs(sx) / 0.5); // -1 izquierda, 0 arriba/abajo, 1 derecha
            const vf = 1 - Math.abs(f); // 1 arriba/abajo, 0 a los lados
            const estilo = {
              left: `calc(50% + var(--rd) * ${sx.toFixed(4)})`,
              top: `calc(50% - var(--rd) * ${cy.toFixed(4)})`,
              transform: `translate(calc(${(-50 + 50 * f).toFixed(2)}% + ${(18 * f).toFixed(2)}px), calc(${(-50 - 50 * cy * vf).toFixed(2)}% - ${(18 * cy * vf).toFixed(2)}px))`,
            } as CSSProperties;
            const clase = `${CLASE_ETIQUETA} ${i === activo ? "rounded-full bg-white/90 px-4 py-1.5 text-[var(--dial-accent)] shadow-sm" : "p-0 text-slate-400 hover:text-slate-900"} ${o.negrita ? "font-semibold" : ""}`;
            if (o.href && !o.href.startsWith("#")) {
              return (
                <Link key={o.text} href={o.href} className={clase} style={estilo} onClick={(e) => e.stopPropagation()}>
                  {o.text}
                </Link>
              );
            }
            return (
              <button
                key={o.text}
                type="button"
                className={clase}
                style={estilo}
                onClick={(e) => {
                  e.stopPropagation();
                  apuntarA(o.angulo);
                  abrir(o);
                }}
              >
                {o.text}
              </button>
            );
          })}
        </div>

        {/* Brazo selector: gira con el mouse o barre solo; el triángulo marca la opción. */}
        <div
          ref={brazoRef}
          aria-hidden="true"
          className="pointer-events-none absolute"
          style={{ top: "var(--pad)", left: "var(--pad)", width: "var(--dial)", height: "var(--dial)" }}
        >
          {/* Selector: borde superior recto y lados cóncavos que terminan en punta hacia el centro. */}
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden="true"
            className="absolute h-[19.2px] w-[28.8px] -translate-x-1/2 -translate-y-1/2 overflow-visible"
            style={{ left: "50%", top: "calc(var(--dial) * 0.06)" }}
          >
            <path d="M0,0 C4,0 30,40 49,100 L51,100 C70,40 96,0 100,0 Z" style={{ fill: "var(--dial-accent)" }} />
          </svg>
        </div>

        {/* Imagen central: cambia según la opción seleccionada. */}
        <div
          className="pointer-events-none absolute z-10 overflow-hidden rounded-full"
          style={{
            left: "50%",
            top: "50%",
            width: "calc(var(--dial) * 0.8)",
            height: "calc(var(--dial) * 0.8)",
            transform: "translate(-50%,-50%)",
            maskImage: "radial-gradient(circle, #000 40%, transparent 70%)",
            WebkitMaskImage: "radial-gradient(circle, #000 40%, transparent 70%)",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img key={opcion.imagen} src={opcion.imagen} alt={opcion.text} className="h-full w-full object-cover" />
        </div>

      </div>

      <button
        type="button"
        aria-pressed={girando}
        onClick={alternarMovimiento}
        className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-1.5 text-sm text-slate-600 transition-colors hover:border-slate-900 hover:text-slate-900"
      >
        {girando ? "Movimiento activado" : "Movimiento desactivado"}
      </button>
    </div>
  );
}
