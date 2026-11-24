import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Flash } from "@/components/Flash";
import { NotificationPrompt } from "@/components/NotificationPrompt";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: { default: "poliEmpleo · Bolsa de empleo y pasantías", template: "%s · poliEmpleo" },
  description: "Plataforma que conecta a estudiantes y graduados con empresas: vacantes, pasantías, CV Harvard y seguimiento de postulaciones.",
};

export const dynamic = "force-dynamic";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;600;700&family=Geist+Mono:wght@400;500&family=EB+Garamond:ital,wght@0,400;0,500;0,700;1,400;1,500&display=swap" />
      </head>
      <body className="min-h-screen bg-slate-50/60">
        <Navbar />
        <NotificationPrompt />
        <main className="px-4 py-8">
          <Suspense fallback={null}><Flash /></Suspense>
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
        <Footer />
      </body>
    </html>
  );
}
