import { redirect } from "next/navigation";

/** Las postulaciones ahora viven en el Inicio del estudiante; esta ruta redirige para no romper enlaces guardados. */
export default function MyApplications({ searchParams }: { searchParams: { estado?: string } }) {
  redirect(searchParams.estado ? `/estudiante?estado=${encodeURIComponent(searchParams.estado)}` : "/estudiante");
}
