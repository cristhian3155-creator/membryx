---
type: community
cohesion: 0.24
members: 19
---

# Servicios de Pago y Notificacion

**Cohesion:** 0.24 - loosely connected
**Members:** 19 nodes

## Members
- [[WebhookProcessResult]] - code - src/services/webhook-service.ts
- [[buildSignedEvent()]] - code - scripts/smoke-webhook.ts
- [[checkout-service.ts]] - code - src/services/checkout-service.ts
- [[client.ts]] - code - src/db/client.ts
- [[createCheckoutIntent()]] - code - src/services/checkout-service.ts
- [[fallbackEventId()]] - code - src/services/webhook-service.ts
- [[generateReference()]] - code - src/services/checkout-service.ts
- [[getPaymentProvider()]] - code - src/integrations/index.ts
- [[getWhatsAppProvider()]] - code - src/integrations/index.ts
- [[main()]] - code - scripts/smoke-webhook.ts
- [[meta-webhook.routes.ts]] - code - src/http/routes/meta-webhook.routes.ts
- [[notification-service.ts]] - code - src/services/notification-service.ts
- [[prisma_2]] - code - src/db/client.ts
- [[processWompiWebhookEvent()]] - code - src/services/webhook-service.ts
- [[sendPaymentConfirmationNotification()]] - code - src/services/notification-service.ts
- [[sendReminderNotification()]] - code - src/services/notification-service.ts
- [[smoke-webhook.ts]] - code - scripts/smoke-webhook.ts
- [[webhook-service.ts]] - code - src/services/webhook-service.ts
- [[webhook.routes.ts]] - code - src/http/routes/webhook.routes.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Servicios_de_Pago_y_Notificacion
SORT file.name ASC
```

## Connections to other communities
- 22 edges to [[_COMMUNITY_Configuracion y Reglas de Dominio]]
- 9 edges to [[_COMMUNITY_Generacion de Datos Demo]]
- 5 edges to [[_COMMUNITY_Integracion WhatsApp]]
- 2 edges to [[_COMMUNITY_Importacion de Clientes (CSVXLSX)]]

## Top bridge nodes
- [[client.ts]] - degree 13, connects to 3 communities
- [[prisma_2]] - degree 13, connects to 3 communities
- [[webhook-service.ts]] - degree 13, connects to 2 communities
- [[checkout-service.ts]] - degree 11, connects to 2 communities
- [[notification-service.ts]] - degree 8, connects to 2 communities