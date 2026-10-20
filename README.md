# Motio Rehab — Reserva de turnos

App web para que los pacientes de Motio Rehab (México) reserven turnos viendo la agenda real y la clínica gestione la semana.

**Demo pública (publicación solicitada al entregar):** https://pixel-perfect-booking-06.lovable.app

**Previsualización de trabajo (requiere acceso):** https://id-preview--bbf494ac-5494-408d-a7e2-d41bdb5fb7ea.lovable.app

## Pantallas
- `/` Reserva: terapia → día → hora libre → datos → "Confirmar turno".
- `/agenda` Agenda semanal pública (libre/ocupado), lunes a viernes 8:00–14:00 y 16:00–19:00.
- `/admin` Panel de la clínica (pide clave): ver, cancelar, mover turnos, marcar atendidos, bloquear/liberar horas y reiniciar los datos de ejemplo.
- `/centro` Servicios del catálogo y horarios de la demo. Dirección, Google Maps, redes y horarios oficiales pendientes de materiales de Kodarvia; no se han inventado enlaces.

## Cómo ejecutarlo
```bash
bun install      # o npm install
bun run dev      # abre http://localhost:8080
bunx vitest run  # pruebas de reglas de agenda
```

## Qué está simulado
- **Sin backend:** todo se guarda en el `localStorage` del navegador (claves `fisio.reservas.v1` y `fisio.terapias.v1`). Kodarvia integrará backend, políticas y despliegue.
- **Avisos automáticos (SMS y WhatsApp):** la lógica está escrita en `src/lib/notificaciones.ts` (con pruebas en `src/test/notificaciones.test.ts`) y se ve en pantalla, pero **no se envía nada**. Cada turno activo genera dos avisos simulados: un **SMS de confirmación** al confirmar y un **WhatsApp de recordatorio 24 h antes**. Al cancelar se genera un **SMS de cancelación**. Los tres van dirigidos al teléfono que escribió el paciente y aparecen marcados como *simulados* únicamente en `/admin` (botón **Avisos** de cada turno y la lista **Cancelados esta semana**).
- **WhatsApp manual:** la confirmación incluye «Enviar resumen por WhatsApp». Abre `https://wa.me/?text=…` con paciente, terapia, fecha y hora; el usuario elige destinatario y confirma el envío en WhatsApp. No hay envío automático ni API conectada. No se incluye el motivo de consulta.
- **Correo:** no se simula ningún envío porque el formulario de reserva no pide correo al paciente.
- **Pagos:** no hay cobros ni pasarela. La app no pide tarjeta, no muestra precios y no hace ningún cargo: el turno se confirma sin pago.
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

La demo pública se publica para revisión por petición del usuario. El repositorio debe permanecer privado con acceso a Kodarvia. La demo solo guarda datos en cada navegador, no comparte reservas entre personas.


## Dónde está cada cosa
- `src/routes/`: reserva, agenda, panel y centro; `__root.tsx` contiene navegación y aviso global de almacenamiento.
- `src/lib/agenda.ts`: disponibilidad, duración y validación de teléfono.
- `src/lib/store.ts`: persistencia local, datos ficticios, bloqueos y estados de turnos.
- `src/lib/notificaciones.ts`: textos simulados y enlace manual de WhatsApp.
- `src/lib/config.ts`: clave de demostración.
- `src/components/WeekGrid.tsx`: agenda semanal.
- `src/styles.css`: identidad visual; `src/test/`: pruebas.

## Bloqueos, atendidos y almacenamiento
Cada bloqueo ocupa 30 minutos; no se puede bloquear una franja ocupada. «Liberar hora» vuelve a habilitarla. «Marcar atendido» conserva el turno y sus franjas como ocupadas; ya no admite mover ni cancelar. Reiniciar datos también elimina los bloqueos.
El teléfono elimina letras al escribir o pegar y se valida otra vez antes de guardar. Si localStorage está bloqueado o lleno, aparece un aviso: los cambios siguen en memoria durante esa página pero pueden perderse al recargar. No introducir datos reales sensibles en esta demo pública.
