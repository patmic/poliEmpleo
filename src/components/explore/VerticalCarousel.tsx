"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Lista vertical en bucle: avanza sola y el usuario también la mueve con la rueda, arrastrando o al tocar.
 * Mientras el cursor está encima se detiene para permitir leer y desplazar a mano.
 */
export function VerticalCarousel({ children, speed = 24 }: { children: ReactNode; speed?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const hovering = useRef(false);
  const idleUntil = useRef(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const half = () => (el.firstElementChild as HTMLElement | null)?.offsetHeight ?? 0;
    const activity = () => { idleUntil.current = performance.now() + 2500; };
    el.addEventListener("wheel", activity, { passive: true });
    el.addEventListener("touchstart", activity, { passive: true });
    el.addEventListener("pointerdown", activity, { passive: true });

    let pos = el.scrollTop;
    let last = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const dt = Math.min(64, now - last) / 1000;
      last = now;
      const h = half();
      const loops = h > el.clientHeight;
      // Si el usuario movió la lista, tomamos su posición como nueva referencia.
      if (Math.abs(el.scrollTop - pos) > 1) pos = el.scrollTop;
      const paused = hovering.current || now < idleUntil.current || reduce || !loops;
      if (!paused) pos += speed * dt;
      if (loops) {
        if (pos >= h) pos -= h;
        if (pos < 0) pos += h;
        el.scrollTop = pos;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener("wheel", activity);
      el.removeEventListener("touchstart", activity);
      el.removeEventListener("pointerdown", activity);
    };
  }, [speed]);

  return (
    <div
      ref={ref}
      data-carousel
      onMouseEnter={() => { hovering.current = true; }}
      onMouseLeave={() => { hovering.current = false; }}
      className="h-[640px] overflow-y-auto overscroll-contain [scrollbar-width:thin] [scrollbar-color:#cbd5e1_transparent]"
    >
      <div>{children}</div>
      <div aria-hidden>{children}</div>
    </div>
  );
}
