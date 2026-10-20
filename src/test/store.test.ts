import { beforeEach, describe, expect, it, vi } from "vitest";

describe("gestión local", () => {
  beforeEach(() => { localStorage.clear(); vi.resetModules(); });
  it("bloquea 30 minutos, persiste y permite liberar la hora", async () => {
    const store = await import("@/lib/store");
    const bloqueo = store.bloquearHora("2026-11-02", "08:00");
    expect(bloqueo.ok).toBe(true);
    expect(store.bloquearHora("2026-11-02", "08:00").ok).toBe(false);
    const input = { terapiaId: "control", fecha: "2026-11-02", horaInicio: "08:00", nombre: "Prueba", telefono: "5512345678" };
    expect(store.crearReserva(input).ok).toBe(false);
    expect(store.crearReserva({ ...input, horaInicio: "08:30" }).ok).toBe(true);
    if (!bloqueo.ok) throw new Error("No se creó el bloqueo");
    expect(JSON.parse(localStorage.getItem("fisio.reservas.v1") ?? "[]").find((r: {id: string}) => r.id === bloqueo.reserva.id).estado).toBe("bloqueada");
    store.cancelarReserva(bloqueo.reserva.id);
    expect(store.crearReserva(input).ok).toBe(true);
  });
  it("marca atendido y no permite mover ni liberar ese turno", async () => {
    const store = await import("@/lib/store");
    const res = store.crearReserva({ terapiaId: "evaluacion", fecha: "2026-11-02", horaInicio: "09:00", nombre: "Prueba", telefono: "5512345678" });
    if (!res.ok) throw new Error(res.error);
    store.atenderReserva(res.reserva.id);
    store.cancelarReserva(res.reserva.id);
    expect(JSON.parse(localStorage.getItem("fisio.reservas.v1") ?? "[]").find((r: {id: string}) => r.id === res.reserva.id).estado).toBe("atendida");
    expect(store.moverReserva(res.reserva.id, "2026-11-02", "11:00").ok).toBe(false);
  });
  it("rechaza letras en el teléfono incluso fuera del formulario", async () => {
    const store = await import("@/lib/store");
    expect(store.crearReserva({ terapiaId: "control", fecha: "2026-11-02", horaInicio: "09:00", nombre: "Prueba", telefono: "55ABC123" }).ok).toBe(false);
  });
});