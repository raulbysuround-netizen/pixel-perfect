import { createFileRoute } from "@tanstack/react-router";
import { ocupadas } from "@/lib/agenda";
import { useReservas } from "@/lib/store";
import { SemanaNav, WeekGrid, useSemana } from "@/components/WeekGrid";

export const Route = createFileRoute("/agenda")({
  head: () => ({
    meta: [
      { title: "Agenda semanal — Motio Rehab" },
      { name: "description", content: "Consulta qué franjas están libres esta semana en Motio Rehab." },
      { property: "og:title", content: "Agenda semanal — Motio Rehab" },
      { property: "og:description", content: "Consulta qué franjas están libres esta semana en Motio Rehab." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Agenda,
});

function Agenda() {
  const reservas = useReservas();
  const s = useSemana();
  const cache = new Map<string, Set<string>>();
  const occ = (f: string) => { const existing = cache.get(f); if (existing) return existing; const next = ocupadas(reservas, f); cache.set(f, next); return next; };
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">Agenda semanal</h1>
        <p className="mt-1 text-muted-foreground">Lunes a viernes, 8:00–14:00 y 16:00–19:00.</p>
      </div>
      <SemanaNav {...s} />
      <WeekGrid lunes={s.lunes} cell={(f, h) => occ(f).has(h)
        ? <span className="block rounded-md bg-busy px-2 py-1.5 text-xs text-busy-foreground">{reservas.some((r) => r.fecha === f && r.horaInicio === h && r.estado === "bloqueada") ? "Bloqueado" : "Ocupado"}</span>
        : <span className="block rounded-md bg-accent-soft px-2 py-1.5 text-xs font-medium text-accent-foreground">Libre</span>} />
    </div>
  );
}
