---
type: community
cohesion: 0.14
members: 28
---

# Generacion de Datos Demo

**Cohesion:** 0.14 - loosely connected
**Members:** 28 nodes

## Members
- [[DerivedMembershipStatus]] - code - src/domain/membership.ts
- [[FIRST_NAMES]] - code - scripts/seed-demo.ts
- [[LAST_NAMES]] - code - scripts/seed-demo.ts
- [[PLAN_CODES]] - code - scripts/seed-demo.ts
- [[PLAN_DEFINITIONS]] - code - src/config/index.ts
- [[PlanCode]] - code - src/config/index.ts
- [[RenewalInput]] - code - src/domain/membership.ts
- [[RenewalResult]] - code - src/domain/membership.ts
- [[applyApprovedPayment()]] - code - src/services/membership-service.ts
- [[applyImport()]] - code - src/services/import-service.ts
- [[businessToday()]] - code - src/domain/dates.ts
- [[computeRenewal()]] - code - src/domain/membership.ts
- [[d()]] - code - tests/unit/membership.test.ts
- [[dateOnlyToLuxon()]] - code - src/domain/dates.ts
- [[dates.ts]] - code - src/domain/dates.ts
- [[daysBetween()]] - code - src/domain/dates.ts
- [[deriveMembershipStatus()]] - code - src/domain/membership.ts
- [[membership-service.ts]] - code - src/services/membership-service.ts
- [[membership.test.ts]] - code - tests/unit/membership.test.ts
- [[membership.ts]] - code - src/domain/membership.ts
- [[mulberry32()]] - code - scripts/seed-demo.ts
- [[randomName()]] - code - scripts/seed-demo.ts
- [[randomPhone()]] - code - scripts/seed-demo.ts
- [[reset-demo.ts]] - code - scripts/reset-demo.ts
- [[resetDemo()]] - code - scripts/reset-demo.ts
- [[seed-demo.ts]] - code - scripts/seed-demo.ts
- [[seedDemo()]] - code - scripts/seed-demo.ts
- [[toDateOnly()]] - code - src/domain/dates.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Generacion_de_Datos_Demo
SORT file.name ASC
```

## Connections to other communities
- 21 edges to [[_COMMUNITY_Configuracion y Reglas de Dominio]]
- 9 edges to [[_COMMUNITY_Servicios de Pago y Notificacion]]
- 7 edges to [[_COMMUNITY_Importacion de Clientes (CSVXLSX)]]

## Top bridge nodes
- [[seed-demo.ts]] - degree 19, connects to 2 communities
- [[membership-service.ts]] - degree 14, connects to 2 communities
- [[businessToday()]] - degree 10, connects to 2 communities
- [[toDateOnly()]] - degree 10, connects to 2 communities
- [[dates.ts]] - degree 9, connects to 2 communities