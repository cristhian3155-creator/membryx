---
type: community
cohesion: 1.00
members: 1
---

# Esquema de Datos

**Cohesion:** 1.00 - tightly connected
**Members:** 1 nodes

## Members
- [[Data Schema (7 entities + scheduler_runs)]] - concept - ARCHITECTURE.md

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Esquema_de_Datos
SORT file.name ASC
```
