# Guion de demostración

## Preparar el escenario

```bash
npm run db:reset:demo
npm run dev
```

Abrir `http://localhost:3000`, login con el admin configurado.

## 1. Dashboard con datos demo

`/dashboard` — muestra clientes activos, próximos a vencer, vencidos, pagos e ingresos del periodo,
estado de Wompi/Twilio/scheduler. Con la base demo recién sembrada: 255 activos, 44 próximos a vencer
(10 en cada uno de D-3/D-2/D-1/D-0 + los 4 clientes nombrados), 102 vencidos, 500 clientes en total.

## 2. Cliente demo → pago → webhook → renovación

1. `/dashboard/customers`, buscar "Demo Cliente D-0" (o cualquier cliente).
2. Abrir el cliente, elegir un plan, clic en "Generar link de pago".
   - **Requiere `WOMPI_*` configuradas** (ver ENVIRONMENT.md); si no, se muestra el error de
     configuración de forma clara en vez de fallar en silencio.
3. Completar el pago en Wompi Sandbox (tarjetas/Nequi/PSE de prueba: ver
   https://docs.wompi.co/docs/colombia/datos-de-prueba-en-sandbox/).
4. Wompi envía el evento al webhook público (`/webhooks/wompi`, debe estar registrado en el dashboard de
   Wompi apuntando al dominio HTTPS desplegado).
5. Volver al detalle del cliente: pago registrado como `APPROVED`, membresía renovada con la fecha
   correcta, notificación de confirmación con su estado de envío.

### Sin credenciales Wompi todavía

Se puede demostrar el mismo pipeline (webhook → pago → renovación → notificación, incluida
deduplicación) sin Wompi real:

```bash
WOMPI_PUBLIC_KEY=pub_test WOMPI_INTEGRITY_SECRET=int_test WOMPI_EVENTS_SECRET=evt_test \
  npx tsx scripts/smoke-webhook.ts
```

Este script crea su propio cliente y pago de prueba, firma un evento válido, lo envía dos veces (para
mostrar la deduplicación), envía un evento DECLINED (para mostrar que no renueva), y un evento con firma
inválida (para mostrar el rechazo con 400) — y limpia sus propios datos al final.

## 3. Recordatorios D-3/D-2/D-1/D-0

```bash
npm run scheduler:run
```

Revisar `/dashboard/notifications`: los clientes "Demo Cliente D-3/D-2/D-1/D-0" (y los 40 del bucket
masivo) reciben su recordatorio correspondiente. Si `TWILIO_*` no está configurado, el estado queda
`FAILED` con el motivo explícito — la lógica de selección de destinatarios ya quedó demostrada
igualmente.

## 4. Pago que cancela recordatorios futuros

1. Tomar "Demo Cliente D-2" y generar/aprobar un pago (real o vía `smoke-webhook.ts` adaptando la
   referencia).
2. Ejecutar `npm run scheduler:run` de nuevo.
3. Verificar en `/dashboard/customers/<id>` que no se genera un nuevo recordatorio D-1/D-0 para el ciclo
   ya renovado (la nueva fecha de vencimiento cae fuera de la ventana de recordatorio).

## 5. Importación

`/dashboard/import` → descargar plantilla → subir con "Confirmar importación" sin marcar (modo
validación) → marcar y volver a subir para aplicar.
