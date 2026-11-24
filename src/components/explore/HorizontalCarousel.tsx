"use client";

import { Children, useEffect, useRef, type ReactNode } from "react";

/** Carrusel horizontal: se desliza con la rueda del mouse, el trackpad, el arrastre táctil o los botones. */
export function HorizontalCarousel({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      const max = el.scrollWidth - el.clientWidth;
      if (max <= 0) return;
      const atStart = el.scrollLeft <= 0 && e.deltaY < 0;
      const atEnd = el.scrollLeft >= max - 1 && e.deltaY > 0;
      if (atStart || atEnd) return; // al llegar al extremo, la página sigue con su scroll normal
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const step = (dir: number) => ref.current?.scrollBy({ left: dir * 340, behavior: "smooth" });

  return (
    <div>
      <div className="mb-3 flex justify-end gap-2">
        <button onClick={() => step(-1)} aria-label="Anterior" className="grid size-8 place-items-center rounded-full bg-white text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50">‹</button>
        <button onClick={() => step(1)} aria-label="Siguiente" className="grid size-8 place-items-center rounded-full bg-white text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50">›</button>
      </div>
      <div ref={ref} className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 [scrollbar-width:thin]">
        {Children.map(children, (child) => (
          <div className="w-[290px] shrink-0 snap-start md:w-[320px]">{child}</div>
        ))}
      </div>
    </div>
  );
}
