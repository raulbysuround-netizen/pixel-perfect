import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { FRANJAS, etiquetaDia, franjasDe, puedeReservar, semana, terapiaById, type Reserva } from "@/lib/agenda";
import { ADMIN_PASSWORD } from "@/lib/config";
import { atenderReserva, bloquearHora, cancelarReserva, moverReserva, reiniciarDatos, useReservas } from "@/lib/store";
import { avisoCancelacion, avisosDe } from "@/lib/notificaciones";
import { Button } from "@/components/ui/button";
import { LockKeyhole, UnlockKeyhole, Check } from "lucide-react";
import { SemanaNav, WeekGrid, useSemana } from "@/components/WeekGrid";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Panel de la clínica — Motio Rehab" },
      { name: "description", content: "Gestión interna de turnos de Motio Rehab." },
      { property: "og:title", content: "Panel de la clínica — Motio Rehab" },
      { property: "og:description", content: "Gestión interna de turnos de Motio Rehab." },
      { name: "robots", content: "noindex" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Admin,
});

const SESSION = "fisio.admin.ok";

function Admin() {
  const [ok, setOk] = useState(false);
  useEffect(() => { setOk(sessionStorage.getItem(SESSION) === "1"); }, []);
  if (!ok) return <Login onOk={() => { sessionStorage.setItem(SESSION, "1"); setOk(true); }} />;
  return <Panel onSalir={() => { sessionStorage.removeItem(SESSION); setOk(false); }} />;
}

function Login({ onOk }: { onOk: () => void }) {
  const [clave, setClave] = useState("");
  const [err, setErr] = useState(false);
  return (
    <form onSubmit={(e) => { e.preventDefault(); if (clave === ADMIN_PASSWORD) onOk(); else setErr(true); }}
      className="mx-auto mt-10 max-w-sm space-y-4 rounded-2xl border border-border bg-card p-6 shadow-soft">
      <h1 className="text-xl font-bold">Acceso de la clínica</h1>
      <label className="block text-sm font-medium">Clave
        <input type="password" autoFocus className="input-field mt-1" value={clave} onChange={(e) => { setClave(e.target.value); setErr(false); }} />
      </label>
      {err && <p className="text-sm text-destructive">Clave incorrecta.</p>}
      <Button className="w-full rounded-xl bg-primary py-3 font-semibold text-primary-foreground">Entrar</Button>
    </form>
  );
}

function Panel({ onSalir }: { onSalir: () => void }) {
  const reservas = useReservas();
  const s = useSemana();
  const dias = semana(s.lunes);
  const [bloqueoFecha, setBloqueoFecha] = useState("");
  const [bloqueoHora, setBloqueoHora] = useState("");
  const [bloqueoError, setBloqueoError] = useState("");
  const diaBloqueo = dias.includes(bloqueoFecha) ? bloqueoFecha : dias[0] ?? "";
  const bloqueadas = reservas.filter((r) => r.estado === "bloqueada" && dias.includes(r.fecha));
  const atendidas = reservas.filter((r) => r.estado === "atendida" && dias.includes(r.fecha));
  const activas = reservas.filter((r) => r.estado === "activa" && dias.includes(r.fecha))
    .sort((a, b) => (a.fecha + a.horaInicio).localeCompare(b.fecha + b.horaInicio));
  const cancelados = reservas.filter((r) => r.estado === "cancelada" && dias.includes(r.fecha))
    .sort((a, b) => (a.fecha + a.horaInicio).localeCompare(b.fecha + b.horaInicio));
  const enCelda = (f: string, h: string) => [...activas, ...bloqueadas, ...atendidas].find((r) => r.fecha === f && franjasDe(r.horaInicio, terapiaById(r.terapiaId)?.duracionMinutos ?? 30).includes(h));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold sm:text-3xl">Panel de la clínica</h1>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => { if (confirm("¿Reiniciar los datos de ejemplo? Se borran los turnos actuales.")) reiniciarDatos(); }}
            className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-secondary">Reiniciar datos</Button>
          <Button onClick={onSalir} className="rounded-lg border border-border px-3 py-2 text-sm">Cerrar sesión</Button>
        </div>
      </div>
      <SemanaNav {...s} />
      <WeekGrid lunes={s.lunes} cell={(f, h) => {
        const r = enCelda(f, h);
        if (!r) return null;
        if (r.estado === "bloqueada") return <span className="block rounded-md bg-busy px-2 py-1.5 text-xs text-busy-foreground">Bloqueado</span>;
        if (r.estado === "atendida") return <span className="block rounded-md bg-accent-soft px-2 py-1.5 text-xs text-accent-foreground">Atendido</span>;
        const inicio = r.horaInicio === h;
        return <span className={`block truncate rounded-md px-2 py-1.5 text-xs ${inicio ? "bg-primary font-medium text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>{inicio ? r.nombre : "↳"}</span>;
      }} />
      <section className="space-y-3 border-y border-border py-5">
        <h2 className="text-lg font-semibold">Bloquear horas</h2>
        <form className="flex flex-wrap items-end gap-3" onSubmit={(e) => {
          e.preventDefault(); const res = bloquearHora(diaBloqueo, bloqueoHora);
          if (res.ok) { setBloqueoHora(""); setBloqueoError(""); } else setBloqueoError(res.error);
        }}>
          <label className="text-sm">Día del bloqueo<select className="input-field mt-1" value={diaBloqueo} onChange={(e) => { setBloqueoFecha(e.target.value); setBloqueoHora(""); }}>{dias.map((d) => <option key={d} value={d}>{etiquetaDia(d)}</option>)}</select></label>
          <label className="text-sm">Hora del bloqueo<select className="input-field mt-1" value={bloqueoHora} onChange={(e) => setBloqueoHora(e.target.value)}><option value="">Elegir…</option>{FRANJAS.filter((h) => puedeReservar(reservas, diaBloqueo, h, 30)).map((h) => <option key={h}>{h}</option>)}</select></label>
          <Button disabled={!bloqueoHora} type="submit"><LockKeyhole />Bloquear hora</Button>
          {bloqueoError && <p role="alert" className="w-full text-sm text-destructive">{bloqueoError}</p>}
        </form>
        <ul className="space-y-2">{bloqueadas.map((r) => <li key={r.id} className="flex flex-wrap items-center justify-between gap-2"><span className="text-sm">{etiquetaDia(r.fecha)} · {r.horaInicio}–{franjasDe(r.horaInicio, 60)[1]}</span><Button variant="outline" onClick={() => cancelarReserva(r.id)}><UnlockKeyhole />Liberar hora</Button></li>)}</ul>
      </section>
      {atendidas.length > 0 && <section><h2 className="mb-3 text-lg font-semibold">Atendidos esta semana ({atendidas.length})</h2><ul className="space-y-2">{atendidas.map((r) => <li key={r.id} className="text-sm"><Check className="mr-2 inline size-4 text-primary" />{r.nombre} · {etiquetaDia(r.fecha)} · {r.horaInicio} · Atendido</li>)}</ul></section>}
      <section>
        <h2 className="mb-3 text-lg font-semibold">Turnos de la semana ({activas.length})</h2>
        {activas.length === 0 && <p className="text-muted-foreground">No hay turnos esta semana.</p>}
        <ul className="space-y-3">
          {activas.map((r) => <TurnoItem key={r.id} r={r} reservas={reservas} dias={dias} />)}
        </ul>
      </section>
      {cancelados.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Cancelados esta semana ({cancelados.length})</h2>
          <ul className="space-y-3">
            {cancelados.map((r) => {
              const a = avisoCancelacion(r);
              return (
                <li key={r.id} className="rounded-xl border border-dashed border-border bg-card p-4">
                  <p className="font-semibold capitalize">{r.nombre} <span className="font-normal text-muted-foreground">· {etiquetaDia(r.fecha, { weekday: "long", day: "numeric", month: "short" })} · {r.horaInicio}</span></p>
                  <p className="mt-1 text-sm text-muted-foreground">{a.canal} simulado · {a.texto}</p>
                </li>
              );
            })}
          </ul>
          <p className="mt-2 text-xs text-muted-foreground">Estos avisos no se envían: la lógica está en src/lib/notificaciones.ts y Kodarvia la conectará al servicio real.</p>
        </section>
      )}
    </div>
  );
}

function TurnoItem({ r, reservas, dias }: { r: Reserva; reservas: Reserva[]; dias: string[] }) {
  const t = terapiaById(r.terapiaId);
  const [moviendo, setMoviendo] = useState(false);
  const [viendoAvisos, setViendoAvisos] = useState(false);
  const [fecha, setFecha] = useState(r.fecha);
  const [hora, setHora] = useState("");
  const [err, setErr] = useState("");
  const libres = FRANJAS.filter((h) => !(fecha === r.fecha && h === r.horaInicio) && puedeReservar(reservas, fecha, h, t?.duracionMinutos ?? 30, r.id));
  return (
    <li className="rounded-xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold">{r.nombre} <span className="font-normal text-muted-foreground">· {r.telefono}</span></p>
          <p className="text-sm capitalize text-muted-foreground">{etiquetaDia(r.fecha, { weekday: "long", day: "numeric", month: "short" })} · {r.horaInicio} · {t?.nombre}</p>
          {r.motivo && <p className="mt-1 text-sm">{r.motivo}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => atenderReserva(r.id)}><Check />Marcar atendido</Button>
          <Button onClick={() => setMoviendo((v) => !v)} className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-secondary">Mover</Button>
          <Button onClick={() => setViendoAvisos((v) => !v)} className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-secondary">Avisos</Button>
          <Button onClick={() => { if (confirm(`¿Cancelar el turno de ${r.nombre}?`)) cancelarReserva(r.id); }}
            className="rounded-lg bg-destructive px-3 py-2 text-sm text-destructive-foreground">Cancelar turno</Button>
        </div>
      </div>
      {moviendo && (
        <div className="mt-3 flex flex-wrap items-end gap-2 border-t border-border pt-3">
          <label className="text-sm">Día
            <select className="input-field mt-1 capitalize" value={fecha} onChange={(e) => { setFecha(e.target.value); setHora(""); }}>
              {dias.map((d) => <option key={d} value={d}>{etiquetaDia(d)}</option>)}
            </select>
          </label>
          <label className="text-sm">Hora libre
            <select className="input-field mt-1" value={hora} onChange={(e) => setHora(e.target.value)}>
              <option value="">Elegir…</option>
              {libres.map((h) => <option key={h}>{h}</option>)}
            </select>
          </label>
          <Button disabled={!hora} onClick={() => { const res = moverReserva(r.id, fecha, hora); if (res.ok) setMoviendo(false); else setErr(res.error); }}
            className="rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground disabled:opacity-50">Guardar</Button>
          {err && <p className="w-full text-sm text-destructive">{err}</p>}
        </div>
      )}
      {viendoAvisos && (
        <ul className="mt-3 space-y-2 border-t border-border pt-3">
          {avisosDe(r).map((a) => (
            <li key={a.id} className="text-sm">
              <p className="font-medium">{a.canal} <span className="font-normal text-muted-foreground">· {a.horaPrevista} · simulado</span></p>
              <p className="mt-0.5 text-muted-foreground">{a.texto}</p>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}
