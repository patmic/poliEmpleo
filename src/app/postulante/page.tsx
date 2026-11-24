import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export const metadata = { title: "Postulante" };

// Enlace "Postulante" del dial: con sesión va a las vacantes, sin sesión al login con la marquesina de empresas.
export default function PostulantePage() {
  redirect(getSession() ? "/empleos" : "/login?marquesina=empresas");
}
