import { describe, expect, it } from "vitest";
import { FRANJAS, puedeReservar, limpiarTelefono, type Reserva } from "@/lib/agenda";

const base: Reserva = { id: "a", terapiaId: "rehabilitacion", fecha: "2026-10-12", horaInicio: "09:00", nombre: "X", telefono: "1", estado: "activa" };

describe("reglas de agenda", () => {
  it("un turno atendido sigue ocupando sus franjas", () => {
    expect(puedeReservar([{ ...base, terapiaId: "evaluacion", estado: "atendida" }], base.fecha, "09:30", 30)).toBe(false);
  });
  it("elimina letras al introducir o pegar un teléfono", () => {
    expect(limpiarTelefono("+52 ABC 55x1234-5678")).toBe("+52  551234-5678");
  });
  it("franjas cada 30 min, 8–14 y 16–19", () => {
    expect(FRANJAS[0]).toBe("08:00");
    expect(FRANJAS).toContain("13:30");
    expect(FRANJAS).not.toContain("14:00");
    expect(FRANJAS).toContain("18:30");
    expect(FRANJAS.length).toBe(18);
  });
  it("no permite dos turnos a la misma hora y fecha", () => {
    expect(puedeReservar([base], "2026-10-12", "09:00", 30)).toBe(false);
    expect(puedeReservar([base], "2026-10-13", "09:00", 30)).toBe(true);
  });
  it("una franja cancelada vuelve a estar libre", () => {
    expect(puedeReservar([{ ...base, estado: "cancelada" }], "2026-10-12", "09:00", 30)).toBe(true);
  });
  it("evaluación de 45 min ocupa dos franjas", () => {
    const ev = { ...base, terapiaId: "evaluacion" };
    expect(puedeReservar([ev], "2026-10-12", "09:30", 20)).toBe(false);
    expect(puedeReservar([], "2026-10-12", "13:30", 45)).toBe(false);
  });
  it("no se reserva en fin de semana", () => {
    expect(puedeReservar([], "2026-10-10", "09:00", 30)).toBe(false);
  });
});
