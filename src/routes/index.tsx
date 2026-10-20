import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { FRANJAS, TERAPIAS, addDias, esDiaLaborable, etiquetaDia, fmtFecha, ocupadas, puedeReservar, limpiarTelefono, telefonoValido } from "@/lib/agenda";
import { crearReserva, useReservas } from "@/lib/store";
import { resumenWhatsApp } from "@/lib/notificaciones";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Reserva tu turno de fisioterapia — Motio Rehab" },
      { name: "description", content: "Elige terapia, día y hora libre y confirma tu turno en menos de un minuto." },
      { property: "og:title", content: "Reserva tu turno de fisioterapia — Motio Rehab" },
      { property: "og:description", content: "Elige terapia, día y hora libre y confirma tu turno en menos de un minuto." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Reservar,
});

function proximosDias(n: number) {
  const out: string[] = [];
  let d = fmtFecha(new Date());
  while (out.length < n) { if (esDiaLaborable(d)) out.push(d); d = addDias(d, 1); }
  return out;
}

function Reservar() {
  const reservas = useReservas();
  const [hidratado, setHidratado] = useState(false);
  useEffect(() => setHidratado(true), []);
  const dias = useMemo(() => (hidratado ? proximosDias(10) : []), [hidratado]);
  const [terapiaId, setTerapiaId] = useState(TERAPIAS[0]?.id ?? "");
  const [fecha, setFecha] = useState<string>("");
  const [hora, setHora] = useState<string | null>(null);
  const [form, setForm] = useState({ nombre: "", telefono: "", motivo: "" });
  const [error, setError] = useState("");
  const [confirmado, setConfirmado] = useState<string | null>(null);
  const [whatsapp, setWhatsapp] = useState("");
  const terapia = TERAPIAS.find((t) => t.id === terapiaId);
  const fechaSel = fecha || dias[0] || "";
  const occ = fechaSel ? ocupadas(reservas, fechaSel) : new Set<string>();
  const ahora = new Date();
  const esHoy = fechaSel === fmtFecha(ahora);
  const yaPaso = (h: string) => esHoy && Number(h.slice(0, 2)) * 60 + Number(h.slice(3)) <= ahora.getHours() * 60 + ahora.getMinutes();

  if (!terapia) return null;

  const enviar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre.trim() || !form.telefono.trim()) return setError("Completa tu nombre y teléfono.");
    if (!telefonoValido(form.telefono)) return setError("El teléfono debe contener números, sin letras.");
    if (!hora) return;
    const r = crearReserva({ terapiaId, fecha: fechaSel, horaInicio: hora, ...form });
    if (!r.ok) return setError(r.error);
    setWhatsapp(resumenWhatsApp(r.reserva));
    setConfirmado(`${terapia.nombre} · ${etiquetaDia(fechaSel, { weekday: "long", day: "numeric", month: "long" })} a las ${hora}`);
    setHora(null); setForm({ nombre: "", telefono: "", motivo: "" }); setError("");
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
      <section className="min-w-0 space-y-8">
        <div className="rounded-2xl bg-hero p-6 text-primary-foreground sm:p-8">
          <h1 className="text-2xl font-bold sm:text-3xl">Reserva tu turno</h1>
          <p className="mt-2 max-w-lg opacity-90">Ves nuestra agenda real: elige la terapia, el día y una hora libre. Te esperamos.</p>
        </div>

        <div>
          <h2 className="mb-3 text-lg font-semibold">1. Tipo de terapia</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {TERAPIAS.map((t) => (
              <Button key={t.id} onClick={() => { setTerapiaId(t.id); setHora(null); }}
                className={`rounded-xl border-2 p-4 text-left transition ${t.id === terapiaId ? "border-primary bg-secondary" : "border-border bg-card hover:border-ring"}`}>
                <span className="block font-semibold">{t.nombre}</span>
                <span className="text-sm text-muted-foreground">{t.duracionMinutos} min</span>
              </Button>
            ))}
          </div>
        </div>

        <div>
          <h2 className="mb-3 text-lg font-semibold">2. Día</h2>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {dias.map((d) => (
              <Button key={d} onClick={() => { setFecha(d); setHora(null); }}
                className={`shrink-0 rounded-xl border px-4 py-3 text-center capitalize ${d === fechaSel ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-secondary"}`}>
                <span className="block text-xs">{etiquetaDia(d, { weekday: "short" })}</span>
                <span className="block font-display text-lg font-bold">{etiquetaDia(d, { day: "numeric" })}</span>
                <span className="block text-xs">{etiquetaDia(d, { month: "short" })}</span>
              </Button>
            ))}
          </div>
        </div>

        <div>
          <h2 className="mb-3 text-lg font-semibold">3. Hora</h2>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 md:grid-cols-6">
            {fechaSel && FRANJAS.map((h) => {
              const libre = !yaPaso(h) && puedeReservar(reservas, fechaSel, h, terapia.duracionMinutos);
              return (
                <Button key={h} disabled={!libre} onClick={() => { setHora(h); setConfirmado(null); setWhatsapp(""); setError(""); }}
                  aria-label={`${h} ${libre ? "libre" : "ocupado"}`}
                  className={`rounded-lg border py-2.5 text-sm font-medium tabular-nums transition ${
                    hora === h ? "border-accent bg-accent text-accent-foreground"
                    : libre ? "border-border bg-card hover:border-accent hover:bg-accent-soft"
                    : "cursor-not-allowed border-transparent bg-busy text-busy-foreground line-through"}`}>
                  {h}
                </Button>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{occ.size} franjas ocupadas este día. Las tachadas no están disponibles.</p>
        </div>
      </section>

      <aside className="min-w-0 lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          {confirmado ? (
            <div role="status" className="space-y-3">
              <div className="rounded-xl bg-accent-soft p-4">
                <p className="font-display font-bold text-accent-foreground">¡Turno confirmado!</p>
                <p className="mt-1 text-sm capitalize-first">{confirmado}</p>
              </div>
              <Button asChild className="h-auto w-full whitespace-normal py-3">
                <a href={whatsapp} target="_blank" rel="noopener noreferrer"><MessageCircle />Enviar resumen por WhatsApp</a>
              </Button>
              <p className="text-sm text-muted-foreground">Si no puedes venir, llámanos para liberar el hueco.</p>
              <Button onClick={() => { setConfirmado(null); setWhatsapp(""); }} className="text-sm font-medium text-primary underline">Reservar otro turno</Button>
            </div>
          ) : hora ? (
            <form onSubmit={enviar} noValidate className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold">Tus datos</h2>
                <p className="text-sm capitalize text-muted-foreground">{terapia.nombre} · {etiquetaDia(fechaSel)} · {hora}</p>
              </div>
              <label className="block text-sm font-medium">Nombre y apellido *
                <input className="input-field mt-1" value={form.nombre} required onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
              </label>
              <label className="block text-sm font-medium">Teléfono *
                <input className="input-field mt-1" type="tel" inputMode="tel" value={form.telefono} required onChange={(e) => setForm({ ...form, telefono: limpiarTelefono(e.target.value) })} />
              </label>
              <label className="block text-sm font-medium">Motivo de consulta <span className="text-muted-foreground">(opcional)</span>
                <textarea className="input-field mt-1" rows={3} value={form.motivo} onChange={(e) => setForm({ ...form, motivo: e.target.value })} />
              </label>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" disabled={!form.nombre.trim() || !telefonoValido(form.telefono)}
                className="w-full rounded-xl bg-primary py-3 font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50">
                Confirmar turno
              </Button>
              <Button type="button" onClick={() => setHora(null)} className="w-full text-sm text-muted-foreground">Cambiar hora</Button>
            </form>
          ) : (
            <div>
              <h2 className="text-lg font-semibold">Elige una hora libre</h2>
              <p className="mt-1 text-sm text-muted-foreground">Al seleccionarla te pediremos tu nombre y teléfono.</p>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
