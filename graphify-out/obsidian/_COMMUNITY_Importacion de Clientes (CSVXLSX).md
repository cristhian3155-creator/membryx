---
type: community
cohesion: 0.20
members: 14
---

# Importacion de Clientes (CSV/XLSX)

**Cohesion:** 0.20 - loosely connected
**Members:** 14 nodes

## Members
- [[EXAMPLE_ROWS]] - code - scripts/generate-import-template.ts
- [[IMPORT_COLUMNS]] - code - src/services/import-service.ts
- [[ImportRowError]] - code - src/services/import-service.ts
- [[VALID_PLAN_CODES]] - code - src/services/import-service.ts
- [[VALID_STATUSES]] - code - src/services/import-service.ts
- [[ValidImportRow]] - code - src/services/import-service.ts
- [[ValidationReport]] - code - src/services/import-service.ts
- [[generate-import-template.ts]] - code - scripts/generate-import-template.ts
- [[import-service.ts]] - code - src/services/import-service.ts
- [[lines]] - code - scripts/generate-import-template.ts
- [[outPath]] - code - scripts/generate-import-template.ts
- [[readRawRows()]] - code - src/services/import-service.ts
- [[readXlsxRows()]] - code - src/services/import-service.ts
- [[validateImportFile()]] - code - src/services/import-service.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Importacion_de_Clientes_CSV/XLSX
SORT file.name ASC
```

## Connections to other communities
- 7 edges to [[_COMMUNITY_Generacion de Datos Demo]]
- 4 edges to [[_COMMUNITY_Configuracion y Reglas de Dominio]]
- 2 edges to [[_COMMUNITY_Servicios de Pago y Notificacion]]

## Top bridge nodes
- [[import-service.ts]] - degree 22, connects to 3 communities
- [[validateImportFile()]] - degree 6, connects to 1 community