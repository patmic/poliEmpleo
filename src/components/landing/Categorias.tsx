"use client";

/* Acordeón de categorías de la portada con revelado al hacer scroll.
   Adaptado de la animación de la portada de referencia. Se abre también
   cuando el dial emite el evento "abrir-categoria". */

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";

type Categoria = {
  id: string;
  num: string;
  titulo: string;
  descripcion: ReactNode;
  enlaces: { label: string; href: string }[];
};

const CATEGORIAS: Categoria[] = [
  {
    id: "cat-estudiantes",
    num: "01",
    titulo: "Para estudiantes & Alumni",
    descripcion:
      (
        <>
          <span className="block">
            <b>Estudiantes / Alumni:</b>  Encuentra oportunidades de prácticas preprofesionales, pasantías y vinculación social. Postula a las vacantes que más te interesen y gestiona tu perfil y cada postulación. 
            Las empresas publican ofertas, filtran candidatos por etiquetas y gestionan su proceso en un solo lugar.
            Crea tu perfil con etiquetas de habilidades y tu condición EPN o externa, y recibe vacantes ordenadas por afinidad con tu perfil.
          </span>
          <span className="mt-3 block">
          <b className="font-semibold text-slate-900">Estudiantes:</b> Realiza tus prácticas preprofesionales, pasantías y vinculación social,
          <br />
          <b className="font-semibold text-slate-900">Alumni:</b> Estudiante graduados en busqueda de su primer empleo
          <br />
          </span>
        </>
      ),
    enlaces: [
      { label: "Crear cuenta", href: "/registro" },
      { label: "Ver vacantes", href: "/empleos" },
    ],
  },
  {
    id: "cat-empresas",
    num: "02",
    titulo: "Para empresas",
    descripcion:
      (
        <>
          <span className="block">
            Publica vacantes con etiquetas y carreras afines, revisa postulantes ordenados por afinidad y mueve cada candidato por el proceso.          
          </span>
          <span className="mt- block">
          <b className="font-semibold text-slate-900">Empresas:</b> Gestiona tus procesos de selección y contrata a los mejores talentos.
          </span>
        </>
      ),
    enlaces: [{ label: "Registrar empresa", href: "/registro" }],
  },
  {
    id: "cat-cv",
    num: "03",
    titulo: "Currículum formato Harvard",
    descripcion:
      "Arma tu hoja de vida con vista previa en vivo, descárgala en Word o PDF y mantén tus datos al día desde tu perfil.",
    enlaces: [{ label: "Mi hoja de vida", href: "/estudiante/cv" }],
  },
  {
    id: "cat-afinidad",
    num: "04",
    titulo: "Afinidad con cada vacante",
    descripcion:
      "El porcentaje compara las etiquetas de tu perfil con las de la vacante, con colores que muestran de un vistazo cuántos requisitos cumples.",
    enlaces: [{ label: "Explorar vacantes", href: "/empleos" }],
  },
  {
    id: "cat-seguimiento",
    num: "05",
    titulo: "Seguimiento de postulaciones",
    descripcion:
      "Cada postulación muestra su estado —en revisión, entrevista, seleccionado o rechazado— con el historial de cambios.",
    enlaces: [{ label: "Mis postulaciones", href: "/estudiante" }],
  },
  {
    id: "cat-etiquetas",
    num: "06",
    titulo: "Etiquetas y competencias",
    descripcion:
      "Tecnologías, idiomas, áreas y competencias alimentan el cruce entre estudiantes y vacantes.",
    enlaces: [],
  },
  {
    id: "cat-coordinacion",
    num: "07",
    titulo: "Para administración",
    descripcion:
      "Verifica empresas, modera vacantes y mide la demanda de habilidades con indicadores y gráficos.",
    enlaces: [{ label: "Iniciar sesión", href: "/login" }],
  },
];

export function Categorias() {
  const [abiertas, setAbiertas] = useState<Set<string>>(new Set());
  const [visibles, setVisibles] = useState<Set<string>>(new Set());
  const [armado, setArmado] = useState(false);
  const refs = useRef<Record<string, HTMLLIElement | null>>({});

  // Revelado al entrar en pantalla (o inmediato si no hay animación).
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !("IntersectionObserver" in window)) {
      setVisibles(new Set(CATEGORIAS.map((c) => c.id)));
      return;
    }
    setArmado(true);
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setVisibles((prev) => new Set(prev).add(e.target.id));
            observer.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 },
    );
    Object.values(refs.current).forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // Abrir y desplazar hasta una categoría desde el dial.
  useEffect(() => {
    function onAbrir(ev: Event) {
      const id = (ev as CustomEvent<string>).detail;
      setAbiertas((prev) => new Set(prev).add(id));
      const el = document.getElementById(id);
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      el?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    }
    window.addEventListener("abrir-categoria", onAbrir);
    return () => window.removeEventListener("abrir-categoria", onAbrir);
  }, []);

  function alternar(id: string) {
    setAbiertas((prev) => {
      const siguiente = new Set(prev);
      if (siguiente.has(id)) siguiente.delete(id);
      else siguiente.add(id);
      return siguiente;
    });
  }

  return (
    <ol className="divide-y divide-slate-200 border-y border-slate-200">
      {CATEGORIAS.map((c) => {
        const abierta = abiertas.has(c.id);
        const oculta = armado && !visibles.has(c.id);
        return (
          <li
            key={c.id}
            id={c.id}
            ref={(el) => {
              refs.current[c.id] = el;
            }}
            className={`scroll-mt-24 transition-all duration-700 ${oculta ? "translate-y-6 opacity-0" : "opacity-100"}`}
          >
            <button
              type="button"
              aria-expanded={abierta}
              aria-controls={`${c.id}-panel`}
              onClick={() => alternar(c.id)}
              className="group grid w-full cursor-pointer grid-cols-[40px_1fr_24px] items-center gap-4 py-6 text-left md:grid-cols-[56px_1fr_24px]"
            >
              <span className="text-sm tabular-nums text-slate-400">{c.num}</span>
              <span className="text-xl font-semibold text-slate-900 transition-colors group-hover:text-theme md:text-2xl">
                {c.titulo}
              </span>
              <span aria-hidden="true" className="relative h-[22px] w-[22px] justify-self-end">
                <span className="absolute left-0 right-0 top-1/2 h-[1.5px] bg-current" />
                <span
                  className={`absolute left-0 right-0 top-1/2 h-[1.5px] bg-current transition-transform duration-500 ${abierta ? "rotate-0" : "rotate-90"}`}
                />
              </span>
            </button>

            <div
              id={`${c.id}-panel`}
              className={`grid transition-[grid-template-rows] duration-500 ${abierta ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
            >
              <div className="overflow-hidden">
                <div className="pb-6 pl-[64px] md:pl-[80px]">
                  <p className="max-w-prose text-slate-600">{c.descripcion}</p>
                  {c.enlaces.length > 0 && (
                    <ul className="mt-4 flex flex-wrap gap-2">
                      {c.enlaces.map((e) => (
                        <li key={e.href + e.label}>
                          <Link
                            href={e.href}
                            className="inline-flex rounded-full border border-slate-300 px-4 py-1.5 text-sm transition-colors hover:border-theme hover:text-theme"
                          >
                            {e.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
