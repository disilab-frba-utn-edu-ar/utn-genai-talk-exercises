# Feature Specification: Métricas de agentes en tiempo real

**Feature Branch**: `feature/metricas-agentes`
**Created**: 2026-10-27
**Status**: Approved
**Input**: "Un dashboard que lea los logs de los hooks (`logs/<agente>/<sesión>.jsonl`) de Claude Code, Codex CLI y Cline y muestre en vivo qué hacen los agentes, para la charla y para el ejercicio 1."

## Clarifications

### Session 2026-10-27 (decisiones de Luciano)

- Q: ¿Dónde vive y cómo se llama? → A: Separado del producto Mentorías, igual que `/ejercicios`. Se llama **Métricas**: ruta `/metricas` y link "Métricas" en el nav. La UI vive en `metricas/app/`; el servidor, en sus propios archivos de las capas de `server/` y montado como router aparte, sin tocar los servicios de Mentorías.
- Q: ¿Se oculta el link hasta terminar el ejercicio 1? → A: No, se muestra siempre.
- Q: ¿Se modifica el hook? → A: Sí (fase C1): `toolUseId`, subagente, rutas de `apply_patch` y los campos que cada agente documenta (modelo, duración, éxito, turno). Todo campo nuevo es opcional y compatible con logs viejos; el hook se mantiene legible porque los alumnos lo leen.
- Q: ¿Acceso de red? → A: El servidor escucha solo en `127.0.0.1` (API y Vite). El router de métricas además rechaza con 403 lo que no venga de loopback.
- Q: ¿Modo detalle? → A: Sí, muestra comandos completos con secretos redactados. Apagado por defecto y se activa con un toggle en la UI (sin variable de entorno nueva).
- Q: ¿Logs archivados? → A: Sí, el dashboard elige entre los logs actuales y cada carpeta de `logs/archivo/<fecha>`.
- Q: ¿Fixtures? → A: Armadas a partir del log real de Claude y de la forma documentada de los payloads de Codex y Cline.

## User Scenarios & Testing

### User Story 1 — Ver en vivo qué hace el agente (P1)

**Acceptance Scenarios**:

1. **Given** `/metricas` abierta y un agente trabajando, **When** el hook agrega una línea al log, **Then** el dashboard se actualiza en pocos segundos sin recargar y muestra "● En vivo".
2. **Given** una herramienta empezó y no terminó, **Then** se muestra como "ahora ejecutando…".
3. **Given** la conexión en vivo falla 3 veces seguidas, **Then** el cliente pasa a consultar cada 5 s y lo indica.
4. **Given** no hay logs, **Then** ve un estado vacío que explica cómo generarlos (con link al ejercicio 1). Si el servidor no responde, ve un error que pregunta si está corriendo `npm run dev`.

### User Story 2 — Entender y comparar agentes (P1)

**Acceptance Scenarios**:

1. **Given** logs de varios agentes, **Then** ve sesiones, prompts, llamadas a herramientas, tasa de fallas, tiempo activo y caracteres devueltos al modelo, eventos por minuto por agente, herramientas más usadas, acciones por tipo, duraciones p50/p95, archivos leídos y escritos, binarios de shell, subagentes y skills.
2. **Given** un agente que no reporta fallas (Codex), **Then** la tasa se muestra "n/d", nunca 0 %.
3. **Given** un gráfico, **Then** tiene un botón "Ver como tabla".

### User Story 3 — Filtrar y elegir el origen (P2)

1. Filtra por agente, sesión y ventana (15 min, 1 h, 24 h, todo).
2. Elige entre "Actual" y cada carpeta `logs/archivo/<fecha>`.
3. Ve la línea de tiempo de la sesión elegida.

### User Story 4 — Modo detalle (P3)

1. **Given** el toggle apagado (por defecto), **Then** no se ve ningún comando completo, solo binarios.
2. **Given** el toggle encendido, **Then** ve los comandos recientes con `sk-…`, `ghp_…`, `Bearer …`, emails y `--token=…` redactados.

### User Story 5 — Tokens, modelos y costo (P2, pedido posterior de Luciano)

1. **Given** transcripciones locales de los agentes, **Then** ve el uso de tokens (entrada, salida y caché si existe) por minuto y por agente, y el total por sesión.
2. **Given** una sesión, **Then** ve qué modelo usó cada agente y si cambió de modelo dentro de la sesión.
3. **Given** una tabla de precios versionada en el repo, **Then** ve el costo estimado por modelo y el total. Si un modelo no está en la tabla, el costo es "n/d", nunca 0; si falta el precio de algunos modelos, el total se marca como parcial.

## Requirements

- **FR-001**: Los datos no reportados por un agente son `null` ("n/d"), nunca 0.
- **FR-002**: **Privacidad** (Principio IV): nunca salen del servidor `prompt`, `lastMessage`, `output`, el texto de `error` ni el `input` crudo. De los prompts solo se usa la cantidad. Los errores solo se cuentan por herramienta. Los comandos se muestran como binario (más subcomando de una lista blanca). Las rutas son relativas al repo y las externas se muestran como `(fuera del repo)/<nombre>`. Los ids de sesión se acortan a 8 caracteres.
- **FR-003**: Escucha solo en `127.0.0.1` y 403 para no-loopback en el router de métricas.
- **FR-004**: Lectura incremental por offset; líneas inválidas se ignoran; si `logs/` no existe o se mueve (`logs:limpiar`), el estado queda vacío y se recupera con el próximo evento.
- **FR-005**: Tiempo real con SSE, disparado por `fs.watch` con respaldo de polling.
- **FR-006**: Sin librerías de gráficos: SVG propio, accesible, con tabla alternativa.
- **FR-007**: Compatible con logs viejos (eventos en snake_case de Cline, sin `toolUseId`).
- **FR-008**: Los hooks no mandan tokens: salen de las transcripciones locales de cada agente (ver "Fuentes de tokens"). De esos archivos solo se extraen modelo, tokens y timestamps; nunca el contenido de los mensajes (FR-002 se extiende a ellos).
- **FR-009**: Los archivos se ubican por la ruta `transcript_path` que guarda el hook (campo opcional `transcriptPath`) o, si no está, por los lugares estándar de cada agente. Solo se leen archivos bajo `~/.claude`, `~/.codex`, `~/.cline` y el `globalStorage` de VS Code; la ruta nunca sale del servidor.
- **FR-010**: Precios en `metricas/precios-modelos.json` (USD por millón de tokens), con fecha de actualización y fuente oficial anotadas. Es configuración versionada: no hay variables de entorno nuevas. El costo es una estimación a precio de lista de la API.

## Supuestos sobre los payloads (no confirmados con logs reales)

Fuente: Claude Code, la doc oficial (code.claude.com/docs/en/hooks), confirmada. Para Codex y Cline **no se pudo abrir la doc oficial** desde el entorno de desarrollo (error de DNS en `developers.openai.com` y `docs.cline.bot`). Lo que sigue sale de guías de terceros y de resultados de búsqueda, y no se vio en un log real:

| Dato | Claude Code | Codex CLI | Cline |
|---|---|---|---|
| `toolUseId` | `tool_use_id` en Pre/Post/PostToolUseFailure (doc oficial) | `tool_use_id` (**supuesto**, guías de terceros) | **No documentado.** Se lee de forma tolerante: `toolUseId`, `toolCallId`, `callId`, `id` dentro de `preToolUse`/`postToolUse` |
| Subagente | `agent_id`, `agent_type` (doc oficial; presentes si el hook corre dentro de un subagente o con `--agent`) | `agent_id`/`agent_type` (**supuesto**; se leen igual) | Sin dato |
| Modelo | `model` solo en SessionStart, no siempre (doc oficial) | `model` en todos los eventos (**supuesto**) | **Desconocido**: tolerante (`model`, `modelId`, `taskMetadata.model`) |
| Turno | `prompt_id` (doc oficial) | `turn_id` (**supuesto**) | Sin dato |
| Duración | `duration_ms` en Post/PostToolUseFailure (doc oficial, opcional) | Sin dato: se calcula emparejando Pre/Post por `toolUseId` | `postToolUse.executionTimeMs` |
| Éxito/falla | Evento `PostToolUseFailure`, `error`, `is_interrupt` | Sin evento de falla: `null` | `postToolUse.success` |
| Rutas de `apply_patch` | n/a | Texto del parche en el input (`input`/`patch`/`command`), con líneas `*** Add/Update/Delete File: <ruta>` (**supuesto**) | n/a |
| Tokens y costo | No (sale de la transcripción) | No (sale del rollout) | No (sale de `ui_messages.json`) |

### Fuentes de tokens y modelo (C7)

| Agente | Fuente | Estado |
|---|---|---|
| Claude Code | `transcript_path` (campo común de los hooks, doc oficial). JSONL: líneas `type: "assistant"` con `timestamp`, `message.id`, `message.model` y `message.usage` (`input_tokens`, `output_tokens`, `cache_read_input_tokens`, `cache_creation_input_tokens`, y `cache_creation.ephemeral_5m/1h_input_tokens`) | **Confirmado con el transcript real de una sesión** (el contenido del archivo no está en la doc; la doc solo dice que `transcript_path` es la ruta y que se escribe de forma asíncrona). Cada `message.id` se repite en una línea por bloque de contenido con el mismo `usage`: se deduplica por id. `input_tokens` no incluye caché. Los subagentes tienen su propio archivo: no se cuentan |
| Codex CLI | `~/.codex/sessions/AAAA/MM/DD/rollout-<fecha>-<session_id>.jsonl` (y `archived_sessions/`). Eventos `event_msg` con `payload.type: "token_count"` y `payload.info.{total_token_usage,last_token_usage}`; el modelo viene del `turn_context` activo (`payload.model`) | `TokenUsage` (`input_tokens`, `cached_input_tokens`, `output_tokens`, `reasoning_output_tokens`, `total_tokens`), `TokenUsageInfo` y `TurnContextItem.model` **confirmados en el código fuente de Codex** (`codex-rs/protocol/src/protocol.rs`). **Supuestos** (guías de terceros, sin log real): la ruta de los archivos, los tipos `event_msg`/`turn_context`, que `cached_input_tokens` está incluido en `input_tokens` (se resta para obtener la entrada no cacheada) y que los reintentos repiten el mismo `token_count` (se ignoran los repetidos). Los archivos `.jsonl.zst` no se leen |
| Cline | `~/.cline/data/tasks/<taskId>/ui_messages.json` o el `globalStorage` de `saoudrizwan.claude-dev` de VS Code. Array JSON de mensajes `{ts, type, say, text}`; en `say: "api_req_started"` el `text` es un JSON con los tokens | Ubicación del archivo **confirmada solo por una guía de terceros**. **Supuestos** sin confirmar: los nombres `tokensIn`, `tokensOut`, `cacheWrites`, `cacheReads` (se leen también variantes) y que `tokensIn` no incluye la caché. El modelo no figura en ese archivo: se toma del campo `model` de los hooks si existe; si no, "desconocido" y sin costo |

Si la fuente no se encuentra o cambia de formato, esa sesión muestra "n/d" en tokens y costo (nunca 0) y el resto del dashboard sigue funcionando.

**Precios.** Anthropic: confirmados en la página oficial (consultada el 2026-10-27). OpenAI (GPT-5, GPT-5.x y sus variantes Codex) y Google (Gemini 2.5): las páginas oficiales no se pueden abrir desde el entorno de desarrollo (error de DNS), así que los valores se tomaron del contenido de esas páginas que devuelve la búsqueda restringida a los dominios oficiales, y solo se cargaron los que coinciden entre la página de cada modelo y la de precios. Quedaron afuera, por no poder confirmarse, gpt-5.3-codex (dos tablas sin aclarar el tramo), gpt-5.1-codex-max, los modelos Pro, los Gemini con precio promocional que cambia de fecha y los 3.x en preview. Otros modelos habituales en Cline (DeepSeek, Qwen, Grok, etc.) tampoco se cargaron: su costo es "n/d" hasta que se agreguen desde la fuente oficial. La fecha y el link de cada fuente están en `metricas/precios-modelos.json`.

Si el nombre de un campo cambia, el hook lo ignora sin romper: el campo queda `undefined` y el dashboard muestra "n/d".

## Success Criteria

- **SC-001**: Un evento nuevo en el log aparece en el dashboard en menos de 3 s.
- **SC-002**: Ningún dato de FR-002 aparece en el JSON del snapshot (test de privacidad).
- **SC-003**: `npm test`, `lint` y `typecheck` pasan; sin scroll horizontal desde 375px.
