// Pure scheduling rules (no browser APIs) — tested in src/test/agenda.test.ts
export type Terapia = { id: string; nombre: string; duracionMinutos: number };
export type Reserva = {
  id: string;
  terapiaId: string;
  fecha: string; // YYYY-MM-DD
  horaInicio: string; // HH:MM
  nombre: string;
  telefono: string;
  motivo?: string;
  estado: "activa" | "cancelada" | "atendida" | "bloqueada";
};

export const TERAPIAS: Terapia[] = [
  { id: "evaluacion", nombre: "Evaluación inicial", duracionMinutos: 45 },
  { id: "rehabilitacion", nombre: "Sesión de rehabilitación", duracionMinutos: 30 },
  { id: "control", nombre: "Sesión de control", duracionMinutos: 20 },
];

const BLOQUES: [number, number][] = [
  [8 * 60, 14 * 60],
  [16 * 60, 19 * 60],
];
const PASO = 30;
const toHM = (m: number) =>
  `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
const toMin = (hm: string) => {
  const [h = 0, m = 0] = hm.split(":").map(Number);
  return h * 60 + m;
};

export const FRANJAS: string[] = BLOQUES.flatMap(([a, b]) => {
  const out: string[] = [];
  for (let m = a; m < b; m += PASO) out.push(toHM(m));
  return out;
});

export const terapiaById = (id: string) => TERAPIAS.find((t) => t.id === id);

/** Franjas (HH:MM) que ocupa un turno según su duración. */
export function franjasDe(horaInicio: string, duracion: number): string[] {
  const n = Math.ceil(duracion / PASO);
  const start = toMin(horaInicio);
  return Array.from({ length: n }, (_, k) => toHM(start + k * PASO));
}

export function ocupadas(reservas: Reserva[], fecha: string, excluirId?: string): Set<string> {
  const set = new Set<string>();
  for (const r of reservas) {
    if (r.estado === "cancelada" || r.fecha !== fecha || r.id === excluirId) continue;
    const t = terapiaById(r.terapiaId);
    franjasDe(r.horaInicio, t?.duracionMinutos ?? PASO).forEach((f) => set.add(f));
  }
  return set;
}

export function esDiaLaborable(fecha: string) {
  const d = parseFecha(fecha).getDay();
  return d >= 1 && d <= 5;
}

export const limpiarTelefono = (telefono: string) => telefono.replace(/[^0-9+()\s-]/g, "");
export const telefonoValido = (telefono: string) => /^[+()\d\s-]+$/.test(telefono) && /\d/.test(telefono);

export function puedeReservar(
  reservas: Reserva[],
  fecha: string,
  hora: string,
  duracion: number,
  excluirId?: string,
): boolean {
  if (!esDiaLaborable(fecha)) return false;
  const necesarias = franjasDe(hora, duracion);
  // Debe caber en un mismo bloque horario
  const fin = toMin(hora) + duracion;
  const dentro = BLOQUES.some(([a, b]) => toMin(hora) >= a && fin <= b);
  if (!dentro || !necesarias.every((f) => FRANJAS.includes(f))) return false;
  const occ = ocupadas(reservas, fecha, excluirId);
  return necesarias.every((f) => !occ.has(f));
}

// ---- Fechas (locales) ----
export const parseFecha = (s: string) => {
  const [y = 1970, m = 1, d = 1] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};
export const fmtFecha = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const addDias = (s: string, n: number) => {
  const d = parseFecha(s);
  d.setDate(d.getDate() + n);
  return fmtFecha(d);
};
export function lunesDe(s: string) {
  const d = parseFecha(s);
  const diff = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - diff);
  return fmtFecha(d);
}
export const semana = (lunes: string) => [0, 1, 2, 3, 4].map((i) => addDias(lunes, i));
export const etiquetaDia = (s: string, opts: Intl.DateTimeFormatOptions = { weekday: "short", day: "numeric", month: "short" }) =>
  parseFecha(s).toLocaleDateString("es-MX", opts);
