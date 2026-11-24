import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export const metadata = { title: "Empresas" };

// Enlace "Empresas" del dial: con sesión va al sitio de empresa, sin sesión al login con la marquesina de postulantes.
export default function EmpresaAccesoPage() {
  redirect(getSession() ? "/empresa" : "/login?marquesina=postulantes");
}
