import { useState, type ReactNode } from "react";
import { FRANJAS, addDias, etiquetaDia, fmtFecha, lunesDe, semana } from "@/lib/agenda";

export function useSemana() {
  const [lunes, setLunes] = useState(() => lunesDe(fmtFecha(new Date())));
  return { lunes, prev: () => setLunes(addDias(lunes, -7)), next: () => setLunes(addDias(lunes, 7)), hoy: () => setLunes(lunesDe(fmtFecha(new Date()))) };
}

export function SemanaNav({ lunes, prev, next, hoy }: ReturnType<typeof useSemana>) {
  const dias = semana(lunes);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="font-display text-lg font-semibold">
        {etiquetaDia(dias[0], { day: "numeric", month: "long" })} – {etiquetaDia(dias[4], { day: "numeric", month: "long" })}
      </p>
      <div className="flex gap-2">
        <button onClick={prev} className="rounded-lg border border-border bg-card px-3 py-2 text-sm hover:bg-secondary">← Anterior</button>
        <button onClick={hoy} className="rounded-lg border border-border bg-card px-3 py-2 text-sm hover:bg-secondary">Hoy</button>
        <button onClick={next} className="rounded-lg border border-border bg-card px-3 py-2 text-sm hover:bg-secondary">Siguiente →</button>
      </div>
    </div>
  );
}

export function WeekGrid({ lunes, cell }: { lunes: string; cell: (fecha: string, hora: string) => ReactNode }) {
  const dias = semana(lunes);
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-soft">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead>
          <tr className="bg-secondary">
            <th className="w-16 p-2 text-left font-medium text-muted-foreground">Hora</th>
            {dias.map((d) => (
              <th key={d} className="p-2 text-left font-display font-semibold capitalize">{etiquetaDia(d)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {FRANJAS.map((h) => (
            <tr key={h} className={h === "16:00" ? "border-t-4 border-secondary" : "border-t border-border"}>
              <td className="p-2 font-medium tabular-nums text-muted-foreground">{h}</td>
              {dias.map((d) => <td key={d} className="p-1 align-top">{cell(d, h)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
