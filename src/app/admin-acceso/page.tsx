import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export const metadata = { title: "Administración" };

// Enlace "Administración" del dial: con sesión va al sitio de administración; sin sesión, solo el login.
export default function AdminAccesoPage() {
  redirect(getSession() ? "/admin" : "/login?acceso=admin");
}
