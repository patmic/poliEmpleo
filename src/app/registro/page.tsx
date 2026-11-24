import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession, homeFor } from "@/lib/auth";
import { CAREERS } from "@/lib/catalog";
import { Card } from "@/components/ui";
import { RegisterForm } from "./RegisterForm";

export const metadata = { title: "Crear cuenta" };

export default function RegisterPage() {
  const u = getSession();
  if (u) redirect(homeFor(u.role));
  return (
    <Card className="mx-auto max-w-lg p-6">
      <h1 className="text-2xl font-semibold">Crear cuenta</h1>
      <p className="mb-6 mt-1 text-sm text-muted-foreground">Las empresas nuevas quedan pendientes de verificación por la coordinación.</p>
      <RegisterForm careers={CAREERS} />
      <p className="mt-4 text-sm text-muted-foreground">¿Ya tienes cuenta? <Link href="/login" className="font-medium text-theme hover:underline">Ingresa</Link></p>
    </Card>
  );
}
