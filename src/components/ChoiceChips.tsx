"use client";
import { useState } from "react";

/** Selección única con chips (mismo estilo que las etiquetas). Envía la opción elegida
 *  en un input oculto con el nombre `name`, así sigue funcionando dentro de un <form>. */
export function ChoiceChips({ name, options, initial }: { name: string; options: readonly string[]; initial?: string }) {
  const [value, setValue] = useState(initial && options.includes(initial) ? initial : options[0]);
  return (
    <div role="radiogroup" className="flex flex-wrap gap-2">
      <input type="hidden" name={name} value={value} />
      {options.map((o) => {
        const on = o === value;
        return (
          <button
            type="button"
            key={o}
            role="radio"
            aria-checked={on}
            onClick={() => setValue(o)}
            className={`h-8 rounded-full border px-3.5 text-sm font-medium transition-colors ${on ? "border-theme bg-theme text-white" : "border-border text-foreground hover:bg-muted"}`}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}
