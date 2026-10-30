# Tasks: Métricas de agentes

TDD (Constitución I): cada test se ve fallar antes de implementar.

- [x] C0 Specs 002 y 003
- [x] C1 Test del hook (fixtures de Claude/Codex/Cline) → `log-hook.mjs` + `clasificar.mjs` + `clasificar.d.mts`
- [x] C2 Test de dominio (incluye privacidad y redacción) → `server/domain/metricas-agentes.ts`
- [x] C3a Test del repositorio (incremental, truncado, carpeta movida, archivo) → `repositories/logs-agentes.ts`
- [x] C3b Test de API (GET, 400, loopback, SSE) → servicio + rutas; escuchar solo en 127.0.0.1
- [x] C4 Test de cliente (estados, SSE → polling, filtros) → `metricas/app/` MVP, ruta `/metricas` y link
- [x] C5 Gráficos restantes y "Ver como tabla"
- [x] C6 Capturas 375/768/1280/1920 (sin commitear), README y consigna 01
- [x] C7a Fixtures de transcripciones (Claude real, Codex y Cline documentados) y `precios-modelos.json`
- [x] C7b Hook: `transcriptPath`
- [x] C7c Test del dominio de tokens, modelos y costo → `uso-tokens.ts` y `metricas-agentes.ts`
- [x] C7d Test del repositorio de transcripciones → `transcripciones-agentes.ts`
- [x] C7e Test de API (tokens en el snapshot, SSE al crecer la transcripción) → servicio y rutas
- [x] C7f Test de cliente → KPIs, series de tokens, tabla de modelos y costo, columnas en sesiones
- [x] C7g README y consigna 01
