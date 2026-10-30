# Propuesta: ejercicios 1 y 2 por pasos

Mockup navegable: [`index.html`](./index.html) (abrilo en el navegador). Tiene tres variantes
visuales para el mismo contenido y el inventario completo de preguntas.

## La idea

- Cada ejercicio se parte en **pasos cortos**. Cada paso tiene: una línea de objetivo, las
  acciones numeradas, **lo que deberías ver** (salida de terminal, timeline o respuesta de la API)
  y, si corresponde, **las preguntas que se responden con lo que acabás de ver**.
- Los **comandos y tips** salen del texto y van **al costado, como nota a mano con una flecha** a
  la acción que los necesita. En celular la nota baja debajo de la acción y la flecha apunta hacia
  arriba.
- Las preguntas dejan de estar todas juntas al final: aparecen en el paso donde se juntó la
  evidencia.

## Variantes

| Variante | Cómo se ve | A favor | En contra |
|---|---|---|---|
| **A · Asistente** | Un paso por pantalla, barra de progreso arriba, Anterior / Siguiente. | Foco total, se siente guiado. | No se ve el ejercicio completo; volver atrás a buscar un comando cuesta. |
| **B · Recorrido** | Todos los pasos en una columna unida por una línea; notas en el margen derecho. | Se lee como un cuaderno, se puede escanear todo. | Página larga. |
| **C · Hacé / Deberías ver** | Cada paso partido en dos: acciones con casillas a la izquierda, lo esperado a la derecha. | Lo más concreto: comparás tu pantalla con la de referencia. | Ocupa más ancho; en celular se apila. |

Mi recomendación: **B como base, con las casillas de C** (tildar acciones) y el bloque
"deberías ver" de C dentro de cada paso.

## Pasos

### Ejercicio 1 — Observar al agente con hooks (30 min)

1. **Preparar y activar los hooks** — instalar, seed, dev; `/hooks`; mensaje trivial →
   `logs:resumen`; `logs:limpiar`.
2. **Ver el bug** — dos reservas superpuestas (19:00 y 19:30) → la segunda da 201. Diagrama de
   las dos franjas pisándose. `npm run seed`.
3. **Darle la tarea** — sesión nueva, prompt tal cual, aprobar leyendo, no intervenir.
4. **Leer el log** — `logs:resumen`, `logs:timeline`, JSONL para el detalle. → preguntas 1, 2, 3, 4, 7.
5. **Probar el arreglo** — la segunda reserva ahora da 409; test, lint, typecheck; `git status`
   sin `data/` ni tests tocados. → pregunta 6.
6. **Pensar y entregar** — timeline a archivo, commit, push, Terminé. → preguntas 9, 10.

### Ejercicio 2 — Escribir una skill y conectar un MCP (45 min)

1. **Escribir la skill** — carpeta según agente, encabezado, criterio en 7 puntos.
2. **¿Se dispara sola?** — sesión nueva con la pregunta, otra con el pedido sin nombrarla,
   buscarla en la timeline, contar intentos. → preguntas 1, 3 (con la 2 adentro).
3. **Revisar la privacidad** — decisión de producto en 2 líneas; GET existente y 404. → preguntas 4, 5.
4. **Conectar el navegador** — `claude mcp add …` / config de Codex / panel de Cline; `/mcp`.
   → pregunta 6+7.
5. **Que reserve en el navegador** — prompt, captura, herramientas MCP en el resumen, seed.
   → preguntas 8, 9, 11 (opcional).
6. **Entregar** — `git status` esperado, commit, push; parte C plegada. → pregunta 12 (opcional).

## Todas las preguntas y qué propongo

Hoy: ejercicio 1 tiene **10 preguntas (25 sub-preguntas)**; ejercicio 2, **12 preguntas
(26 sub-preguntas)**.

### Ejercicio 1

| # | Pregunta | Sub-preguntas hoy | Propuesta | Por qué |
|---|---|---|---|---|
| 1 | El ciclo | total de llamadas · la más usada · familias | **Mantener** | Arma el vocabulario del resto. |
| 2 | Explorar antes de actuar | herramientas antes de editar · archivos leídos · ¿leyó la constitution? | **Mantener** | Rápida y con evidencia clara. |
| 3 | TDD de verdad | ¿respetó el orden? · ¿falló por no compilar o por la regla? | **Mantener** | Es la central. |
| 4 | Comandos de terminal | ~~listá todos~~ · ¿alguno no lo pediste / te hizo dudar? · semáforo | **Recortar** | Listar es copiar del resumen. |
| 5 | Errores y reintentos | ¿falló alguna? · ¿qué hizo después? | **Fusionar con 4** | Muchas veces no falla nada. |
| 6 | El resultado | ¿coincide test/lint/typecheck? · ~~¿tocó data/ o corrió seed?~~ · ~~¿modificó tests?~~ · ¿respetó capas? | **Recortar** | Lo tachado pasa a la checklist del paso 5 (`git status`). |
| 7 | Contexto | ¿qué llenó más la ventana? · ¿lecturas evitables? | **Mantener** | Prepara el ejercicio 2. |
| 8 | Comparar (opcional) | diferencias con otro agente | **Sacar** | Depende de otra persona; mejor como puesta en común en la charla. |
| 9 | Hooks como control | ¿en qué evento? · ¿por qué hook y no AGENTS.md? | **Mantener** | Es la idea de harness engineering. |
| 10 | Riesgos | ~~buscá emails con regex~~ · ¿qué datos sensibles? · ¿versionar el log? | **Recortar** | El comando de búsqueda ocupa más que la pregunta. |

Quedan **8 preguntas, ~15 sub-preguntas**.

### Ejercicio 2

| # | Pregunta | Sub-preguntas hoy | Propuesta | Por qué |
|---|---|---|---|---|
| 1 | La description | pegala · cuántas versiones + session · qué cambió | **Mantener** | Lo que más se aprende. |
| 2 | Cuándo se cargó | ¿antes o después de leer código? | **Fusionar con 3** | Misma timeline. |
| 3 | ¿Siguió el criterio? | dos reglas en el diff · ¿ignoró alguna? | **Mantener** | Une skill y código. |
| 4 | Privacidad | ¿incluye email? · ¿por skill, constitution o azar? · ~~¿hay test?~~ · ~~¿coherente con GET /api/sesiones?~~ | **Recortar** | Lo tachado va a la checklist de entrega. |
| 5 | Prompt contra skill | ¿qué ya no hace falta? · ¿qué sí? | **Mantener** | Justifica la skill. |
| 6 | Contexto (skill) | ¿por qué importa? · ¿y todo en AGENTS.md? | **Fusionar con 7** | Preguntan lo mismo. |
| 7 | Costo de MCP conectados | ¿cuántas herramientas? · ¿conviene tener muchos? | **Fusionar con 6** | Una sola pregunta de contexto. |
| 8 | Lo que encontró | ¿problema real que los tests no veían? · ¿qué no pudo verificar? | **Mantener** | Muestra qué agrega el navegador. |
| 9 | Permisos | color en el semáforo · ~~qué permisos diste~~ · ¿qué no darías en producción? | **Recortar** | Lo tachado está en el log. |
| 10 | Herramientas usadas | cuáles y cuántas · cuál devolvió más | **Sacar** | Repite la 1.1 y el tablero de Métricas ya lo muestra. |
| 11 | Skill que usa el MCP | encabezado + criterio | **Opcional** | Para quien termina antes. |
| 12 | Skill por archivo (parte C) | ¿se disparó? · glob · script vs criterio | **Opcional** | Va con la parte C. |

Quedan **7 preguntas obligatorias + 2 opcionales**.

## Explicaciones redundantes que salen

**Ejercicio 1:** el objetivo largo (queda una línea por paso) · descripción del proyecto y mapa del
repo (ya están en el índice y en el prompt) · tabla de configuración por agente (pasa a nota) ·
explicación del archivo de `logs:limpiar` · párrafo de `AGENT_LOG_MAX_CHARS` / `AGENT_LOG_RAW` ·
avisos de terminal maximizada, puerto 5174 y `&&` en PowerShell (notas, solo donde aplican) ·
"dejá `npm run dev` corriendo" y "Ver aplicación" duplicados · pistas dentro de las preguntas (se
vuelven el "deberías ver").

**Ejercicio 2:** tabla Skill vs MCP del objetivo · explicación larga del frontmatter (nota) ·
checklist de criterio en prosa (7 etiquetas con detalle plegado) · recuadro de privacidad de 15
líneas (2 líneas + "por qué" plegado) · nota de PowerShell 5 (dentro del desplegable) · "B.3 Mirá
lo que pasó" (pasa a acción del paso 5) · tabla de entrega (la reemplaza el `git status` esperado).

## Para decidir

- ¿Qué variante (o combinación) llevamos al visor?
- ¿Estamos de acuerdo con sacar 1.8 y 2.10?
- Las salidas de "deberías ver" son ilustrativas: ¿las generamos con una corrida real antes de la
  charla?
