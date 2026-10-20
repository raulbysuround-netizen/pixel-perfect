import { createFileRoute, Link } from "@tanstack/react-router";
import { Clock, MapPin, Globe, ArrowRight, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TERAPIAS } from "@/lib/agenda";

export const Route = createFileRoute("/centro")({
  head: () => ({ meta: [
    { title: "El centro y sus servicios — Motio Rehab" },
    { name: "description", content: "Conoce las sesiones de Motio Rehab en México y los horarios de su agenda de demostración." },
    { property: "og:title", content: "El centro y sus servicios — Motio Rehab" },
    { property: "og:description", content: "Evaluación inicial, rehabilitación y control. Información del centro y agenda de demostración." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Centro,
});

function Centro() {
  const descripciones: Record<string, string> = {
    evaluacion: "Primera sesión para revisar el motivo de consulta.",
    rehabilitacion: "Sesión de fisioterapia y seguimiento del proceso de rehabilitación.",
    control: "Consulta de seguimiento para revisar la evolución.",
  };
  return <div className="space-y-8">
    <header className="space-y-3 border-b border-border pb-8">
      <p className="text-sm font-medium text-primary">Fisioterapia · México</p>
      <h1 className="text-3xl font-bold">Motio Rehab</h1>
      <Button asChild><Link to="/">Reservar turno<ArrowRight /></Link></Button>
    </header>
    <section><h2 className="mb-4 text-xl font-semibold">Sesiones disponibles</h2><div className="grid gap-4 sm:grid-cols-3">{TERAPIAS.map((t) => <article key={t.id} className="rounded-lg border border-border bg-card p-5"><Activity className="mb-3 size-5 text-primary" /><h3 className="font-semibold">{t.nombre}</h3><p className="mt-2 text-sm text-muted-foreground">{descripciones[t.id]}</p><p className="mt-3 text-sm font-medium">{t.duracionMinutos} minutos</p></article>)}</div></section>
    <section className="grid gap-6 border-t border-border pt-6 sm:grid-cols-3">
      <div><Clock className="mb-2 size-5 text-primary" /><h2 className="font-semibold">Horarios de la agenda demo</h2><p className="mt-2 text-sm">Lunes a viernes<br />8:00–14:00 y 16:00–19:00</p><p className="mt-2 text-sm text-muted-foreground">Horarios del centro pendientes de confirmación.</p></div>
      <div><MapPin className="mb-2 size-5 text-primary" /><h2 className="font-semibold">Ubicación</h2><p className="mt-2 text-sm text-muted-foreground">Dirección y enlace de Google Maps pendientes de Kodarvia.</p></div>
      <div><Globe className="mb-2 size-5 text-primary" /><h2 className="font-semibold">Redes sociales</h2><p className="mt-2 text-sm text-muted-foreground">Perfiles oficiales pendientes de Kodarvia.</p></div>
    </section>
  </div>;
}