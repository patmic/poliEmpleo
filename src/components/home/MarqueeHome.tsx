"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { CompanyLogo, PostulanteCard } from "@/lib/data";
import { MarqueeEmpresas } from "@/components/login/MarqueeEmpresas";
import { MarqueePostulantes } from "@/components/home/MarqueePostulantes";

// Muestra una sola marquesina al pie de la portada, según la opción elegida en el dial.
type Vista = "empresas" | "postulantes" | "administracion";

export function MarqueeHome({ empresas, postulantes }: { empresas: CompanyLogo[]; postulantes: PostulanteCard[] }) {
  const [vista, setVista] = useState<Vista>("empresas");

  useEffect(() => {
    const cambiar = (e: Event) => {
      setVista((e as CustomEvent<Vista>).detail);
      // Lleva la vista a la marquesina para que el cambio se vea desde el dial.
      document.getElementById("marquesina-inicio")?.scrollIntoView({ behavior: "smooth", block: "center" });
    };
    window.addEventListener("cambiar-marquesina", cambiar);
    return () => window.removeEventListener("cambiar-marquesina", cambiar);
  }, []);

  return (
    <div id="marquesina-inicio" className="scroll-mt-24">
      {vista === "empresas" && <MarqueeEmpresas empresas={empresas} />}
      {vista === "postulantes" && <MarqueePostulantes postulantes={postulantes} />}
      {vista === "administracion" && (
        <section className="mx-auto w-full max-w-2xl">
          <Image src="/administrador.jpg" alt="Administración de poliEmpleo" width={465} height={300} className="mx-auto h-auto w-full rounded-2xl" />
        </section>
      )}
    </div>
  );
}
