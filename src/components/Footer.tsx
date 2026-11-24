/** Pie de página del sitio: logos institucionales y derechos de autoría. */
function Logo({ src, alt, className }: { src: string; alt: string; className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className={`h-10 w-auto shrink-0 object-contain ${className ?? ""}`} />;
}

const Divisor = () => <span aria-hidden className="hidden h-10 w-px bg-slate-200 md:block" />;

export function Footer() {
  return (
    <footer className="mt-12 border-t border-slate-200 bg-white text-slate-900">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-8 md:flex-row md:items-center md:gap-8">
        <div className="flex items-center gap-3">
          <Logo src="/epn.png" alt="Escuela Politécnica Nacional" />
          <p className="text-sm font-semibold leading-snug">Escuela Politécnica<br />Nacional</p>
        </div>
        <Divisor />
        <div className="flex items-center gap-3">
          <Logo src="/fis.png" alt="Facultad de Ingeniería de Sistemas" />
          <p className="text-sm font-semibold leading-snug">Facultad de Ingeniería<br />de Sistemas</p>
        </div>
        <Divisor />
        <div className="text-xs leading-relaxed text-slate-500 md:ml-auto">
          <p>Copyright © JISIC</p>
          <p>pat_mic is cooking now...!</p>
        </div>
      </div>
    </footer>
  );
}
