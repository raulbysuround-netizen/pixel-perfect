import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { FRANJAS, etiquetaDia, franjasDe, puedeReservar, semana, terapiaById, type Reserva } from "@/lib/agenda";
import { ADMIN_PASSWORD } from "@/lib/config";
import { cancelarReserva, moverReserva, useReservas } from "@/lib/store";
import { SemanaNav, WeekGrid, useSemana } from "@/components/WeekGrid";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Panel de la clínica — Motio Rehab" },
      { name: "description", content: "Gestión interna de turnos de Motio Rehab." },
      { property: "og:title", content: "Panel de la clínica — Motio Rehab" },
      { property: "og:description", content: "Gestión interna de turnos de Motio Rehab." },
      { name: "robots", content: "noindex" },
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
      <button className="w-full rounded-xl bg-primary py-3 font-semibold text-primary-foreground">Entrar</button>
    </form>
  );
}

function Panel({ onSalir }: { onSalir: () => void }) {
  const reservas = useReservas();
  const s = useSemana();
  const dias = semana(s.lunes);
  const activas = reservas.filter((r) => r.estado === "activa" && dias.includes(r.fecha))
    .sort((a, b) => (a.fecha + a.horaInicio).localeCompare(b.fecha + b.horaInicio));
  const enCelda = (f: string, h: string) => activas.find((r) => r.fecha === f && franjasDe(r.horaInicio, terapiaById(r.terapiaId)?.duracionMinutos ?? 30).includes(h));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold sm:text-3xl">Panel de la clínica</h1>
        <button onClick={onSalir} className="rounded-lg border border-border px-3 py-2 text-sm">Cerrar sesión</button>
      </div>
      <SemanaNav {...s} />
      <WeekGrid lunes={s.lunes} cell={(f, h) => {
        const r = enCelda(f, h);
        if (!r) return null;
        const inicio = r.horaInicio === h;
        return <span className={`block truncate rounded-md px-2 py-1.5 text-xs ${inicio ? "bg-primary font-medium text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>{inicio ? r.nombre : "↳"}</span>;
      }} />
      <section>
        <h2 className="mb-3 text-lg font-semibold">Turnos de la semana ({activas.length})</h2>
        {activas.length === 0 && <p className="text-muted-foreground">No hay turnos esta semana.</p>}
        <ul className="space-y-3">
          {activas.map((r) => <TurnoItem key={r.id} r={r} reservas={reservas} dias={dias} />)}
        </ul>
      </section>
    </div>
  );
}

function TurnoItem({ r, reservas, dias }: { r: Reserva; reservas: Reserva[]; dias: string[] }) {
  const t = terapiaById(r.terapiaId);
  const [moviendo, setMoviendo] = useState(false);
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
        <div className="flex gap-2">
          <button onClick={() => setMoviendo((v) => !v)} className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-secondary">Mover</button>
          <button onClick={() => { if (confirm(`¿Cancelar el turno de ${r.nombre}?`)) cancelarReserva(r.id); }}
            className="rounded-lg bg-destructive px-3 py-2 text-sm text-destructive-foreground">Cancelar turno</button>
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
          <button disabled={!hora} onClick={() => { const res = moverReserva(r.id, fecha, hora); if (res.ok) setMoviendo(false); else setErr(res.error); }}
            className="rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground disabled:opacity-50">Guardar</button>
          {err && <p className="w-full text-sm text-destructive">{err}</p>}
        </div>
      )}
    </li>
  );
}
