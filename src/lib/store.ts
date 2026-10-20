import { useEffect, useSyncExternalStore } from "react";
import {
  TERAPIAS,
  addDias,
  fmtFecha,
  lunesDe,
  puedeReservar,
  terapiaById,
  telefonoValido,
  type Reserva,
} from "./agenda";

const KEY = "fisio.reservas.v1";
const KEY_T = "fisio.terapias.v1";
const EMPTY: Reserva[] = [];
let cache: Reserva[] | null = null;
let almacenamientoBloqueado = false;
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
    cache ??= seed();
    almacenamientoBloqueado = true;
  }
  return cache;
}

function save(next: Reserva[]) {
  cache = next;
  try { localStorage.setItem(KEY, JSON.stringify(next)); almacenamientoBloqueado = false; } catch { almacenamientoBloqueado = true; }
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  const onStorage = (e: StorageEvent) => { if (e.key === KEY) { cache = null; l(); } };
  window.addEventListener("storage", onStorage);
  return () => { listeners.delete(l); window.removeEventListener("storage", onStorage); };
}

export const useReservas = () => useSyncExternalStore(subscribe, load, () => EMPTY);

export function useAlmacenamientoBloqueado() {
  const bloqueado = useSyncExternalStore(subscribe, () => almacenamientoBloqueado, () => false);
  useEffect(() => { load(); listeners.forEach((l) => l()); }, []);
  return bloqueado;
}

export function reiniciarDatos() {
  save(seed());
}

type Res = { ok: true; reserva: Reserva } | { ok: false; error: string };

export function crearReserva(input: Omit<Reserva, "id" | "estado">): Res {
  if (!input.nombre.trim() || !input.telefono.trim()) return { ok: false, error: "Nombre y teléfono son obligatorios." };
  if (!telefonoValido(input.telefono)) return { ok: false, error: "El teléfono debe contener números, sin letras." };
  const t = terapiaById(input.terapiaId);
  if (!t) return { ok: false, error: "Tipo de terapia no válido." };
  const all = load();
  if (!puedeReservar(all, input.fecha, input.horaInicio, t.duracionMinutos))
    return { ok: false, error: "Esa franja ya no está disponible." };
  const reserva: Reserva = { ...input, nombre: input.nombre.trim(), telefono: input.telefono.trim(), id: crypto.randomUUID(), estado: "activa" };
  save([...all, reserva]);
  return { ok: true, reserva };
}

export function cancelarReserva(id: string) {
  save(load().map((r) => (r.id === id && (r.estado === "activa" || r.estado === "bloqueada") ? { ...r, estado: "cancelada" as const } : r)));
}

export function atenderReserva(id: string) {
  save(load().map((r) => r.id === id && r.estado === "activa" ? { ...r, estado: "atendida" as const } : r));
}

export function bloquearHora(fecha: string, horaInicio: string): Res {
  const all = load();
  if (!puedeReservar(all, fecha, horaInicio, 30)) return { ok: false, error: "Solo puedes bloquear una franja libre de 30 minutos." };
  const reserva: Reserva = { id: crypto.randomUUID(), terapiaId: "bloqueo", fecha, horaInicio, nombre: "Hora bloqueada", telefono: "", estado: "bloqueada" };
  save([...all, reserva]);
  return { ok: true, reserva };
}

export function moverReserva(id: string, fecha: string, horaInicio: string): Res {
  const all = load();
  const r = all.find((x) => x.id === id);
  const t = r && terapiaById(r.terapiaId);
  if (!r || !t || r.estado !== "activa") return { ok: false, error: "Solo se pueden mover turnos activos." };
  if (!puedeReservar(all, fecha, horaInicio, t.duracionMinutos, id)) return { ok: false, error: "Esa franja no está libre." };
  const movido: Reserva = { ...r, fecha, horaInicio };
  save(all.map((x) => (x.id === id ? movido : x)));
  return { ok: true, reserva: movido };
}
