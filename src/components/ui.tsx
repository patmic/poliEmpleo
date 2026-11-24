// Componentes base con el estilo del sistema de diseño Talento.
import Link from "next/link";
import type { ReactNode, ButtonHTMLAttributes, InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes } from "react";

export function cn(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

const BTN_BASE =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md border border-transparent text-[14px] font-semibold leading-none transition-[background-color,border-color,color,transform] active:scale-[0.985] disabled:pointer-events-none disabled:opacity-50 select-none";
const BTN_VARIANT = {
  default: "bg-theme text-white hover:bg-theme-hover",
  secondary: "bg-neutral-700 text-white hover:bg-neutral-600",
  cancel: "border-slate-300 bg-white font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900",
  ghost: "text-foreground hover:bg-muted",
  destructive: "bg-red-600 text-white hover:bg-red-500",
  link: "text-primary underline-offset-4 hover:underline px-0",
};
const BTN_SIZE = { default: "h-[34px] px-4", sm: "h-8 px-3 text-[13px]", xs: "h-6 px-2 text-xs rounded-md", lg: "h-10 px-5", icon: "size-[34px]" };
export type BtnVariant = keyof typeof BTN_VARIANT;
export type BtnSize = keyof typeof BTN_SIZE;

export function buttonClass(variant: BtnVariant = "default", size: BtnSize = "default", extra?: string) {
  return cn(BTN_BASE, BTN_VARIANT[variant], BTN_SIZE[size], extra);
}

export function Button({ variant = "default", size = "default", className, ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; size?: BtnSize }) {
  return <button className={buttonClass(variant, size, className)} {...p} />;
}

export function LinkButton({ href, variant = "default", size = "default", className, children }: { href: string; variant?: BtnVariant; size?: BtnSize; className?: string; children: ReactNode }) {
  return <Link href={href} className={buttonClass(variant, size, className)}>{children}</Link>;
}

const BADGE = {
  default: "border-transparent bg-primary text-primary-foreground",
  secondary: "border-transparent bg-secondary text-secondary-foreground",
  outline: "border-slate-300 text-foreground",
  destructive: "border-transparent bg-red-50 text-red-700",
  success: "border-transparent bg-emerald-50 text-emerald-800",
  warning: "border-transparent bg-amber-50 text-amber-800",
  theme: "border-transparent bg-theme/10 text-theme",
};
export function Badge({ variant = "default", className, children }: { variant?: keyof typeof BADGE; className?: string; children: ReactNode }) {
  return (
    <span className={cn("inline-flex h-5 w-fit shrink-0 items-center gap-1 whitespace-nowrap rounded-full border px-2 text-xs font-medium", BADGE[variant], className)}>
      {children}
    </span>
  );
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("rounded-xl border border-slate-300 bg-card text-sm text-card-foreground", className)}>{children}</div>;
}
export function CardHeader({ title, description, action }: { title: ReactNode; description?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 px-6 pt-6">
      <div>
        <div className="text-base font-medium leading-normal">{title}</div>
        {description ? <div className="mt-1 text-sm text-muted-foreground">{description}</div> : null}
      </div>
      {action}
    </div>
  );
}
export function CardBody({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("px-6 py-6", className)}>{children}</div>;
}

const FIELD = "w-full min-w-0 rounded-md border border-input bg-transparent px-2.5 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-theme focus-visible:outline-none disabled:opacity-50 aria-invalid:border-destructive";
export function Input({ className, ...p }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(FIELD, "h-9 py-1", className)} {...p} />;
}
export function Textarea({ className, ...p }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(FIELD, "min-h-20 py-2", className)} {...p} />;
}
export function Select({ className, children, ...p }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(FIELD, "h-9 bg-white py-1 pr-8", className)} {...p}>{children}</select>;
}
export function Field({ label, hint, children, className }: { label: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <label className={cn("flex flex-col gap-1.5", className)}>
      <span className="text-sm font-medium">{label}</span>
      {children}
      {hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
    </label>
  );
}

/** Puntaje de afinidad 0-100. 70+ verde, 40-69 ámbar, <40 rojo (ScoreBadge de Talento). */
export function ScoreBadge({ score, label, size = "compact" }: { score: number | null | undefined; label?: string; size?: "compact" | "full" }) {
  const tone =
    score === null || score === undefined ? "bg-slate-100 text-slate-500"
      : score >= 70 ? "bg-emerald-50 text-emerald-800"
      : score >= 40 ? "bg-amber-50 text-amber-800"
      : "bg-red-50 text-red-800";
  return (
    <span className="inline-flex items-center gap-1.5" title={label ?? "Afinidad con la vacante"}>
      <span className={cn("inline-flex h-6 items-center justify-center rounded-md font-semibold tabular-nums", size === "full" ? "min-w-12 px-2 text-sm" : "min-w-9 px-1.5 text-xs", tone)}>
        {score === null || score === undefined ? "—" : `${score}%`}
      </span>
      {label ? <span className="text-xs text-muted-foreground">{label}</span> : null}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const v = status === "Seleccionado" ? "success" : status === "Rechazado" ? "destructive" : status === "Entrevista" ? "theme" : "secondary";
  return <Badge variant={v}>{status}</Badge>;
}

export function Avatar({ name, size = "default" }: { name: string; size?: "sm" | "default" | "lg" }) {
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("");
  const sz = size === "sm" ? "size-6 text-[10px]" : size === "lg" ? "size-12 text-base" : "size-9 text-xs";
  return <span className={cn("inline-flex shrink-0 items-center justify-center rounded-full bg-theme/10 font-semibold text-theme", sz)}>{initials}</span>;
}

export function TagList({ tags, highlight = [], max }: { tags: string[]; highlight?: string[]; max?: number }) {
  const h = new Set(highlight.map((t) => t.toLowerCase()));
  const shown = max ? tags.slice(0, max) : tags;
  return (
    <div className="flex flex-wrap gap-1.5">
      {shown.map((t) => (
        <Badge key={t} variant={h.has(t.toLowerCase()) ? "success" : "outline"}>{t}</Badge>
      ))}
      {max && tags.length > max ? <Badge variant="secondary" className="text-muted-foreground">+{tags.length - max}</Badge> : null}
    </div>
  );
}

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <Card className="px-5 py-4">
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
      {hint ? <div className="mt-0.5 text-xs text-muted-foreground">{hint}</div> : null}
    </Card>
  );
}

export function Alert({ title, children, variant = "default", action }: { title: ReactNode; children?: ReactNode; variant?: "default" | "destructive" | "theme"; action?: ReactNode }) {
  return (
    <div className={cn("flex items-start justify-between gap-4 rounded-lg border px-4 py-3 text-sm",
      variant === "destructive" ? "border-red-200 bg-red-50/50 text-red-700" : variant === "theme" ? "border-theme/30 bg-theme/5" : "bg-card")}>
      <div>
        <div className="font-medium">{title}</div>
        {children ? <div className={cn("mt-0.5", variant === "destructive" ? "text-red-700/90" : "text-muted-foreground")}>{children}</div> : null}
      </div>
      {action}
    </div>
  );
}

export function Empty({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 px-6 py-12 text-center">
      <div className="text-base font-medium">{title}</div>
      {children ? <div className="max-w-md text-sm text-muted-foreground">{children}</div> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

export function PageHeader({ title, description, action }: { title: string; description?: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
        {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

/** Pasos del proceso de una postulación. */
export function Stepper({ status }: { status: string }) {
  const steps = ["En revisión", "Entrevista", "Seleccionado"];
  const rejected = status === "Rechazado";
  const idx = rejected ? -1 : steps.indexOf(status);
  return (
    <ol className="flex items-center gap-2 text-xs">
      {steps.map((st, i) => {
        const done = !rejected && i <= idx;
        return (
          <li key={st} className="flex items-center gap-2">
            <span className={cn("inline-flex size-5 items-center justify-center rounded-full text-[10px] font-semibold", done ? "bg-theme text-white" : "bg-muted text-muted-foreground")}>{i + 1}</span>
            <span className={done ? "font-medium" : "text-muted-foreground"}>{st}</span>
            {i < steps.length - 1 ? <span className={cn("h-px w-6", done && i < idx ? "bg-theme" : "bg-border")} /> : null}
          </li>
        );
      })}
      {rejected ? <li><Badge variant="destructive">Rechazado</Badge></li> : null}
    </ol>
  );
}

export function Stars({ value }: { value: number | null }) {
  return (
    <span className="inline-flex text-sm" aria-label={value ? `${value} de 5` : "Sin valorar"}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={value && n <= value ? "text-amber-500" : "text-slate-300"}>★</span>
      ))}
    </span>
  );
}

/** Barras horizontales simples en SVG/CSS (sin librerías de gráficos). */
export function BarList({ data, color = "bg-theme" }: { data: { label: string; value: number; extra?: string }[]; color?: string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <ul className="flex flex-col gap-2.5">
      {data.map((d) => (
        <li key={d.label} className="grid grid-cols-[minmax(0,10rem)_1fr_auto] items-center gap-3 text-sm">
          <span className="truncate text-muted-foreground" title={d.label}>{d.label}</span>
          <span className="h-2 rounded-full bg-muted">
            <span className={cn("block h-2 rounded-full", color)} style={{ width: `${(d.value / max) * 100}%` }} />
          </span>
          <span className="w-10 text-right font-medium tabular-nums">{d.extra ?? d.value}</span>
        </li>
      ))}
    </ul>
  );
}

export function fmtDate(d: string | null | undefined) {
  if (!d) return "—";
  const date = new Date(d.includes("T") ? d : d.replace(" ", "T") + "Z");
  if (Number.isNaN(date.getTime())) return d;
  return date.toLocaleDateString("es-EC", { day: "numeric", month: "short", year: "numeric" });
}

export function daysSince(d: string | null | undefined) {
  if (!d) return Infinity;
  const date = new Date(d.includes("T") ? d : d.replace(" ", "T") + "Z");
  return Math.floor((Date.now() - date.getTime()) / 86400000);
}
