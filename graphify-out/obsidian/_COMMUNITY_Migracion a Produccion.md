---
type: community
cohesion: 1.00
members: 2
---

# Migracion a Produccion

**Cohesion:** 1.00 - tightly connected
**Members:** 2 nodes

## Members
- [[Production Database Separation]] - rationale - PRODUCTION_MIGRATION.md
- [[Production Wompi Credentials]] - rationale - PRODUCTION_MIGRATION.md

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Migracion_a_Produccion
SORT file.name ASC
```
