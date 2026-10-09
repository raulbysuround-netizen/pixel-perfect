# Motio Rehab — Reserva de turnos

App web para que los pacientes de Motio Rehab (México) reserven turnos viendo la agenda real y la clínica gestione la semana.

**Previsualización:** https://id-preview--bbf494ac-5494-408d-a7e2-d41bdb5fb7ea.lovable.app

## Pantallas
- `/` Reserva: terapia → día → hora libre → datos → "Confirmar turno".
- `/agenda` Agenda semanal pública (libre/ocupado), lunes a viernes 8:00–14:00 y 16:00–19:00.
- `/admin` Panel de la clínica (pide clave): ver, cancelar, mover turnos y reiniciar los datos de ejemplo.

## Cómo ejecutarlo
```bash
bun install      # o npm install
bun run dev      # abre http://localhost:8080
bunx vitest run  # pruebas de reglas de agenda
```

## Qué está simulado
- **Sin backend:** todo se guarda en el `localStorage` del navegador (claves `fisio.reservas.v1` y `fisio.terapias.v1`). Kodarvia integrará backend, políticas y despliegue.
- **Sin servicios externos:** no hay correo, WhatsApp ni pagos conectados; la confirmación del turno es local.
- **Datos de ejemplo:** la primera vez se crean 5 reservas ficticias en la semana actual (Lucía Fernández, Marcos Díaz, Elena Ruiz, Javier Moreno, Carmen López), con teléfonos mexicanos inventados.

## Reiniciar los datos de ejemplo
Dos formas:
1. En `/admin` (tras entrar con la clave), botón **"Reiniciar datos"**.
2. Manual: borra las claves `fisio.reservas.v1` y `fisio.terapias.v1` desde las herramientas del navegador (Application → Local Storage) y recarga.

## Reglas de agenda
Una evaluación de 45 min ocupa dos franjas de 30 min; nunca puede haber dos turnos solapados. Las reglas viven en `src/lib/agenda.ts` con pruebas en `src/test/agenda.test.ts`.

## Cambiar la clave del panel
Edita `src/lib/config.ts` → `ADMIN_PASSWORD` (por defecto `fisio2026`).
Nota: al ser una app sin servidor, la clave protege la pantalla pero no es seguridad real; los datos viven en cada navegador.

## Entrega

**Opción A — por Lovable (más directa).** Desde el botón **Share** (arriba a la derecha) invita a **partners@kodarvia.com** con rol *Editor* (o *Viewer* para solo revisar). La URL de previsualización de arriba se abre iniciando sesión en Lovable con la cuenta invitada.

**Opción B — con GitHub (revisión automática del código).** En el menú **(+)** del cuadro de chat → **GitHub** → **Connect project**, y luego invita al usuario de GitHub **@kodarvia** como colaborador del repositorio. El código se sincroniza solo en ambas direcciones.

Ambas opciones dejan la app visible en la URL de previsualización; no hace falta publicar el proyecto para la revisión.
