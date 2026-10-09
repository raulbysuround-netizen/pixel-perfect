# Motio Rehab — Reserva de turnos

App web para que los pacientes reserven turnos viendo la agenda real y la clínica gestione la semana.

**Previsualización:** https://id-preview--bbf494ac-5494-408d-a7e2-d41bdb5fb7ea.lovable.app

## Pantallas
- `/` Reserva: terapia → día → hora libre → datos → "Confirmar turno".
- `/agenda` Agenda semanal pública (libre/ocupado), lunes a viernes 8:00–14:00 y 16:00–19:00.
- `/admin` Panel de la clínica (pide clave): ver, cancelar y mover turnos.

## Cómo ejecutarlo
```bash
bun install      # o npm install
bun run dev      # abre http://localhost:8080
bunx vitest run  # pruebas de reglas de agenda
```

## Datos de ejemplo
Todo se guarda en el `localStorage` del navegador (claves `fisio.reservas.v1` y `fisio.terapias.v1`).
La primera vez se crean 5 reservas de prueba en la semana actual (Lucía Fernández, Marcos Díaz, Elena Ruiz, Javier Moreno, Carmen López). Son ficticias.
Para reiniciar: borra esas claves desde las herramientas del navegador (Application → Local Storage).

Una evaluación de 45 min ocupa dos franjas de 30 min; nunca puede haber dos turnos solapados.

## Cambiar la clave del panel
Edita `src/lib/config.ts` → `ADMIN_PASSWORD` (por defecto `fisio2026`).
Nota: al ser una app sin servidor, la clave protege la pantalla pero no es seguridad real; los datos viven en cada navegador.
