import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { getSession, homeFor } from "@/lib/auth";
import { unreadCount, allTagNames, getStudent } from "@/lib/data";
import { CAREERS, MODALITIES } from "@/lib/catalog";
import { logoutAction } from "@/app/actions";
import { FotoPerfil } from "@/components/explore/FotoPerfil";
import { UserMenu } from "./UserMenu";
import { SearchBar } from "./SearchBar";
import { Avatar, LinkButton } from "./ui";

const LINKS: Record<string, { href: string; label: string }[]> = {
  guest: [{ href: "/empleos", label: "Buscar empleo" }],
  student: [
    { href: "/empleos", label: "Buscar empleo" },
  ],
  company: [
    { href: "/empresa", label: "Panel" },
    { href: "/empresa/vacantes/nueva", label: "Publicar vacante" },
    { href: "/empleos", label: "Buscar empleo" },
    { href: "/empresa/perfil", label: "Perfil" },
  ],
  admin: [
    { href: "/admin", label: "Analítica" },
    { href: "/admin/usuarios", label: "Usuarios" },
    { href: "/admin/vacantes", label: "Vacantes" },
    { href: "/admin/postulaciones", label: "Postulaciones" },
    { href: "/admin/reportes", label: "Reportes" },
    { href: "/admin/retos", label: "Retos" },
    { href: "/admin/aliados", label: "Aliados" },
    { href: "/admin/atenciones", label: "Consultorio" },
    { href: "/admin/datos", label: "Datos" },
    { href: "/empleos", label: "Buscar empleo" },
  ],
};

type IconName = "home" | "doc" | "check" | "megaphone" | "gear" | "logout" | "mail" | "bell";

function Icon({ name, className = "size-5" }: { name: IconName; className?: string }) {
  const base = { viewBox: "0 0 24 24", className, fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  switch (name) {
    case "home":
      return <svg {...base}><path d="M3 11l9-8 9 8" /><path d="M5 10v10h14V10" /></svg>;
    case "doc":
      return <svg {...base}><path d="M7 3h7l5 5v13H7z" /><path d="M14 3v5h5M9.5 13h5M9.5 17h5" /></svg>;
    case "check":
      return <svg {...base}><circle cx="12" cy="12" r="9" /><path d="M8.5 12.5l2.5 2.5 4.5-5" /></svg>;
    case "megaphone":
      return <svg {...base}><path d="M3 10v4h4l9 4V6L7 10z" /><path d="M19 9a3 3 0 0 1 0 6" /></svg>;
    case "gear":
      return <svg {...base}><circle cx="12" cy="12" r="3" /><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4" /></svg>;
    case "logout":
      return <svg {...base}><path d="M15 4h4v16h-4" /><path d="M10 8l-4 4 4 4M6 12h10" /></svg>;
    case "mail":
      return <svg {...base}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></svg>;
    case "bell":
      return <svg {...base}><path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>;
  }
}

function MenuItem({ href, label, icon }: { href: string; label: string; icon: IconName }) {
  return (
    <Link href={href} role="menuitem" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900">
      <Icon name={icon} className="size-5 text-slate-500" />
      {label}
    </Link>
  );
}

/** Opciones del menú de usuario según el rol (antes estaban en la cabecera). */
function menuFor(role: string): { href: string; label: string; icon: IconName }[] {
  const inicio = { href: homeFor(role as "student" | "company" | "admin"), label: "Inicio", icon: "home" as const };
  const buscar = { href: "/empleos", label: "Buscar empleo", icon: "check" as const };
  const ajustes = { href: "/notificaciones", label: "Ajustes de notificaciones y alertas", icon: "megaphone" as const };
  if (role === "student") return [inicio, { href: "/estudiante/cv", label: "Mi HV", icon: "doc" }, buscar, ajustes, { href: "/estudiante/perfil", label: "Mi cuenta", icon: "gear" }];
  if (role === "company") return [inicio, { href: "/empresa/vacantes/nueva", label: "Publicar vacante", icon: "doc" }, buscar, ajustes, { href: "/empresa/perfil", label: "Mi cuenta", icon: "gear" }];
  const adminPages = LINKS.admin.filter((l) => !["/admin", "/empleos"].includes(l.href)).map((l) => ({ href: l.href, label: l.label, icon: "doc" as const }));
  return [inicio, ...adminPages, buscar, ajustes];
}

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5 font-semibold tracking-tight text-white">
      <span className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-teal-400 to-teal-700 shadow-[0_0_18px_rgba(45,212,191,0.45)]" aria-hidden>
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
          <circle cx="6" cy="6" r="2.5" /><circle cx="18" cy="6" r="2.5" /><circle cx="12" cy="18" r="2.5" />
          <path d="M8 7.5l3 8.5M16 7.5l-3 8.5M8.5 6h7" />
        </svg>
      </span>
      <span className="text-[18px]">poli<span className="text-teal-300">Empleo</span></span>
    </Link>
  );
}

function iniciales(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("");
}

export function Navbar() {
  const user = getSession();
  const links = LINKS[user?.role ?? "guest"];
  const unread = user ? unreadCount(user.id) : 0;
  const foto = user?.role === "student" ? getStudent(user.id)?.foto ?? "" : "";
  const trigger: ReactNode = user?.role === "student"
    ? <FotoPerfil foto={foto} alt={user.name} className="size-9 rounded-full object-cover" />
    : <Avatar name={user?.name ?? ""} />;

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0a1a26]/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
        <Logo />
        <nav className="flex flex-wrap items-center gap-1 text-sm">
          {!user && links.map((l) => (
            <Link key={l.href + l.label} href={l.href} className="rounded-md px-2.5 py-1.5 font-medium text-slate-300 hover:bg-white/10 hover:text-white">{l.label}</Link>
          ))}
        </nav>
        <div className="ml-auto flex flex-1 items-center justify-end gap-3">
          <Suspense fallback={null}>
            <SearchBar tags={allTagNames()} careers={CAREERS} modalities={MODALITIES} canSeeStudents={user?.role === "company" || user?.role === "admin"} />
          </Suspense>
          {user ? (
            <div className="flex items-center gap-1">
              {/* Mensajes: aún no existe la función; el icono queda visible como lugar reservado. */}
              <span title="Mensajes (próximamente)" aria-label="Mensajes (próximamente)" className="inline-flex size-9 items-center justify-center rounded-md text-slate-300">
                <Icon name="mail" />
              </span>
              <Link href="/notificaciones" className="relative inline-flex size-9 items-center justify-center rounded-md text-slate-300 hover:bg-white/10" aria-label={`Notificaciones (${unread} sin leer)`}>
                <Icon name="bell" />
                {unread ? <span className="absolute -right-0.5 -top-0.5 min-w-4 rounded-full bg-red-600 px-1 text-center text-[10px] font-semibold leading-4 text-white">{unread}</span> : null}
              </Link>
              <div className="ml-2">
                <UserMenu trigger={trigger}>
                  <div className="flex items-center gap-4 pr-6">
                    {user.role === "student" ? (
                      <FotoPerfil foto={foto} alt={user.name} className="size-14 shrink-0 rounded-full object-cover" />
                    ) : (
                      <span className="grid size-14 shrink-0 place-items-center rounded-full bg-theme/10 text-lg font-semibold text-theme">{iniciales(user.name)}</span>
                    )}
                    <div className="min-w-0">
                      <div className="truncate font-semibold text-slate-900">{user.name}</div>
                      <div className="truncate text-sm text-slate-500" title={user.email}>{user.email}</div>
                    </div>
                  </div>
                  <nav className="mt-5 flex flex-col gap-0.5" role="none">
                    {menuFor(user.role).map((m) => <MenuItem key={m.label} {...m} />)}
                  </nav>
                  <form action={logoutAction} className="mt-2 border-t pt-2">
                    <button role="menuitem" className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900">
                      <Icon name="logout" className="size-5 text-slate-500" />
                      Cerrar Sesión
                    </button>
                  </form>
                </UserMenu>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <LinkButton href="/login" variant="cancel" size="sm">Ingresar</LinkButton>
              <LinkButton href="/registro" size="sm">Crear cuenta</LinkButton>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
