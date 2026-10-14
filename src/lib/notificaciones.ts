// Avisos automáticos SIMULADOS (sin red, sin almacenamiento).
// La lógica vive aquí y se muestra en pantalla marcada como "simulado":
// en esta demo no se envía ningún correo, WhatsApp ni SMS real.
import { etiquetaDia, parseFecha, terapiaById, type Reserva } from "./agenda";

export type Canal = "SMS" | "WhatsApp";
export type TipoAviso = "confirmacion" | "recordatorio" | "cancelacion";

export type Aviso = {
  id: string;
  canal: Canal;
  tipo: TipoAviso;
  para: string;
  direccion: string;
  horaPrevista: string;
  texto: string;
  estado: "simulado";
};

const diaLargo = (r: Reserva) => etiquetaDia(r.fecha, { weekday: "long", day: "numeric", month: "long" });
const nombreTerapia = (r: Reserva) => terapiaById(r.terapiaId)?.nombre ?? "tu sesión";

/** Momento en que saldría el recordatorio: 24 h antes del turno. */
function hace24h(fecha: string, hora: string) {
  const [h = 0, m = 0] = hora.split(":").map(Number);
  const d = parseFecha(fecha);
  d.setHours(h - 24, m, 0, 0);
  return d.toLocaleString("es-MX", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

/** Avisos que se mandarían por un turno activo: confirmación + recordatorio. */
export function avisosDe(r: Reserva): Aviso[] {
  const t = nombreTerapia(r);
  const dia = diaLargo(r);
  const base = { para: r.nombre, direccion: r.telefono, estado: "simulado" as const };
  return [
    {
      ...base,
      id: `${r.id}-confirmacion`,
      canal: "SMS",
      tipo: "confirmacion",
      horaPrevista: "Al confirmar el turno",
      texto: `Motio Rehab: turno confirmado — ${t}, ${dia} a las ${r.horaInicio}. Si no puedes venir, avísanos al ${r.telefono}.`,
    },
    {
      ...base,
      id: `${r.id}-recordatorio`,
      canal: "WhatsApp",
      tipo: "recordatorio",
      horaPrevista: `24 h antes (${hace24h(r.fecha, r.horaInicio)})`,
      texto: `Motio Rehab: te recordamos tu ${t} ${dia} a las ${r.horaInicio}. Si necesitas cambiarlo, responde este mensaje.`,
    },
  ];
}

/** Aviso que se mandaría al cancelar un turno. */
export function avisoCancelacion(r: Reserva): Aviso {
  const t = nombreTerapia(r);
  return {
    para: r.nombre,
    direccion: r.telefono,
    estado: "simulado",
    id: `${r.id}-cancelacion`,
    canal: "SMS",
    tipo: "cancelacion",
    horaPrevista: "Al cancelar el turno",
    texto: `Motio Rehab: tu turno de ${t} del ${diaLargo(r)} a las ${r.horaInicio} quedó cancelado. Para elegir otra hora, entra en nuestra agenda.`,
  };
}
