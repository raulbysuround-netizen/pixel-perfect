import { describe, expect, it } from "vitest";
import { type Reserva } from "@/lib/agenda";
import { avisoCancelacion, avisosDe } from "@/lib/notificaciones";

const r: Reserva = {
  id: "t1", terapiaId: "evaluacion", fecha: "2026-10-12", horaInicio: "09:00",
  nombre: "Lucía Fernández", telefono: "55 1234 5678", estado: "activa",
};

describe("avisos simulados", () => {
  it("un turno activo genera un SMS de confirmación y un WhatsApp de recordatorio", () => {
    const a = avisosDe(r);
    expect(a.map((x) => x.canal)).toEqual(["SMS", "WhatsApp"]);
    expect(a.map((x) => x.tipo)).toEqual(["confirmacion", "recordatorio"]);
    expect(a.every((x) => x.estado === "simulado")).toBe(true);
  });
  it("los mensajes llevan la terapia, la hora y el teléfono del paciente", () => {
    const avisos = avisosDe(r);
    const sms = avisos[0]!;
    const wa = avisos[1]!;
    expect(sms.texto.startsWith("Motio Rehab")).toBe(true);
    expect(sms.texto).toContain("Evaluación inicial");
    expect(sms.texto).toContain("09:00");
    expect(sms.texto).toContain("55 1234 5678");
    expect(wa.texto).toContain("recordamos");
  });
  it("el recordatorio sale 24 h antes del turno", () => {
    const prev = avisosDe(r)[1]!.horaPrevista;
    expect(prev).toContain("24 h antes");
    expect(prev).toMatch(/\b11\b/);
  });
  it("al cancelar se genera un SMS que lo dice claro", () => {
    const c = avisoCancelacion({ ...r, estado: "cancelada" });
    expect(c.canal).toBe("SMS");
    expect(c.texto).toContain("cancelado");
    expect(c.direccion).toBe("55 1234 5678");
  });
});
