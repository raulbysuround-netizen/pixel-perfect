import { useSyncExternalStore } from "react";
import {
  TERAPIAS,
  addDias,
  fmtFecha,
  lunesDe,
  puedeReservar,
  terapiaById,
  type Reserva,
} from "./agenda";

const KEY = "fisio.reservas.v1";
const KEY_T = "fisio.terapias.v1";
const EMPTY: Reserva[] = [];
let cache: Reserva[] | null = null;
const listeners = new Set<() => void>();

function seed(): Reserva[] {
  const lunes = lunesDe(fmtFecha(new Date()));
  const mk = (d: number, hora: string, terapiaId: string, nombre: string, telefono: string, motivo = ""): Reserva => ({
    id: crypto.randomUUID(), terapiaId, fecha: addDias(lunes, d), horaInicio: hora, nombre, telefono, motivo, estado: "activa",
  });
  return [
    mk(0, "09:00", "evaluacion", "Lucía Fernández", "55 1234 5678", "Dolor lumbar tras correr"),
    mk(1, "10:30", "rehabilitacion", "Marcos Díaz", "55 2345 6789", "Rodilla, post operatorio"),
    mk(2, "16:00", "control", "Elena Ruiz", "33 3456 7890"),
    mk(3, "12:00", "rehabilitacion", "Javier Moreno", "81 4567 8901", "Hombro derecho"),
    mk(4, "17:30", "evaluacion", "Carmen López", "55 5678 9012", "Cervicalgia"),
  ];
}

function load(): Reserva[] {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    cache = raw ? (JSON.parse(raw) as Reserva[]) : seed();
    if (!raw) localStorage.setItem(KEY, JSON.stringify(cache));
    if (!localStorage.getItem(KEY_T)) localStorage.setItem(KEY_T, JSON.stringify(TERAPIAS));
  } catch {
    cache = seed();
  }
  return cache;
}

function save(next: Reserva[]) {
  cache = next;
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* ignore */ }
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  const onStorage = (e: StorageEvent) => { if (e.key === KEY) { cache = null; l(); } };
  window.addEventListener("storage", onStorage);
  return () => { listeners.delete(l); window.removeEventListener("storage", onStorage); };
}

export const useReservas = () => useSyncExternalStore(subscribe, load, () => EMPTY);

type Res = { ok: true } | { ok: false; error: string };

export function crearReserva(input: Omit<Reserva, "id" | "estado">): Res {
  if (!input.nombre.trim() || !input.telefono.trim()) return { ok: false, error: "Nombre y teléfono son obligatorios." };
  const t = terapiaById(input.terapiaId);
  if (!t) return { ok: false, error: "Tipo de terapia no válido." };
  const all = load();
  if (!puedeReservar(all, input.fecha, input.horaInicio, t.duracionMinutos))
    return { ok: false, error: "Esa franja ya no está disponible." };
  save([...all, { ...input, nombre: input.nombre.trim(), telefono: input.telefono.trim(), id: crypto.randomUUID(), estado: "activa" }]);
  return { ok: true };
}

export function cancelarReserva(id: string) {
  save(load().map((r) => (r.id === id ? { ...r, estado: "cancelada" as const } : r)));
}

export function moverReserva(id: string, fecha: string, horaInicio: string): Res {
  const all = load();
  const r = all.find((x) => x.id === id);
  const t = r && terapiaById(r.terapiaId);
  if (!r || !t) return { ok: false, error: "Turno no encontrado." };
  if (!puedeReservar(all, fecha, horaInicio, t.duracionMinutos, id)) return { ok: false, error: "Esa franja no está libre." };
  save(all.map((x) => (x.id === id ? { ...x, fecha, horaInicio } : x)));
  return { ok: true };
}
