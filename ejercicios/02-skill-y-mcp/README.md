# Ejercicio 2 — Escribir una skill y conectar un MCP

> **Charla:** bloque 2.1.3 *Skills* (el mismo pedido, eso es una skill, una
> skill por dentro, cómo el agente la encuentra, cuándo nace una skill) y 2.1.1
> *Context engineering* (las palancas: skills y MCP entran al contexto solo
> cuando se usan).
>
> **Duración estimada:** 1 a 1,5 horas.
> **Requisito:** ejercicio 1 hecho; los hooks siguen registrando todo, y los
> vas a usar para comprobar que la skill y el MCP se activaron.

## Objetivo

Dos piezas del harness que se suman al agente:

| | Qué aporta | En la charla |
|---|---|---|
| **Skill** | **Criterio**: cómo hacemos las cosas en *este* repo. Escrito una vez, versionado con el código. | «Documentar el criterio en el repositorio» |
| **MCP** | **Herramientas** nuevas: el agente puede observar y actuar sobre algo que antes no veía (acá, un navegador). | «Sumar herramientas amplía lo observable» |

```bash
npm run logs:limpiar    # medí solo este ejercicio
```

---

## Parte A — Una skill: `nuevo-endpoint`

### A.1 El problema

En el ejercicio 1 le explicaste al agente, dentro del prompt, varias reglas del
proyecto: dónde van los tests, qué código HTTP devolver, que la lógica vaya a
`lib/`, que no toque `data/`... Si mañana le pedís otro endpoint, **se lo vas
a tener que repetir**. Ese es el momento en que nace una skill.

### A.2 Escribila

Creá la skill en la carpeta que lee tu agente:

| Agente | Ubicación |
|---|---|
| Claude Code | `.claude/skills/nuevo-endpoint/SKILL.md` |
| Cline | `.claude/skills/nuevo-endpoint/SKILL.md` (Cline también lee `.claude/skills/`; o `.cline/skills/`) |
| Codex | `.agents/skills/nuevo-endpoint/SKILL.md` |

> Mirá las skills que ya tiene el repo (`.claude/skills/shadcn/`,
> `.claude/skills/speckit-specify/`) como referencia de formato.

Tiene que tener las dos partes que vimos en la charla:

**Arriba, el encabezado** (frontmatter YAML). Determina **cuándo** se activa:

```markdown
---
name: nuevo-endpoint
description: <qué trabajo hace + en qué momento usarla>
---
```

Recordá: «Ayuda con la API» no dispara nunca. La `description` tiene que
**nombrar el trabajo y nombrar el momento**, con las palabras que vos vas a
usar al pedirlo (endpoint, ruta, API, handler, `app/api`...).

**Abajo, el criterio** (markdown común). Cómo lo hacemos *nosotros*. Como
mínimo tiene que cubrir:

- [ ] **Antes de escribir, preguntá**: ¿quién lo consume? ¿qué pasa si falla?
      ¿qué valida?
- [ ] **Dónde va cada cosa**: rutas en `app/api/<recurso-en-plural>/...`
      (principio VI de la constitution), lógica pura en `lib/`, tipos en
      `lib/types.ts`.
- [ ] **Next.js de esta versión**: este repo usa Next 16 y tiene cambios
      respecto de lo que el modelo conoce (ver `AGENTS.md`). Indicá que antes
      de escribir un route handler lea la guía en `node_modules/next/dist/docs/`
      (por ejemplo, cómo se reciben los `params` de una ruta dinámica).
- [ ] **Contrato de errores**: `400` validación, `404` no existe, `409`
      conflicto; cuerpo `{ "error": "<mensaje en español>" }`.
- [ ] **TDD** (principio I): primero el test en `tests/unit/...`, verlo
      fallar, después implementar.
- [ ] **No se negocia**: no escribir en `data/` desde los tests; IDs con
      `crypto.randomUUID()` (principio VII).
- [ ] **Nunca cerrar sin un caso borde** y sin correr `npm test` y `npm run lint`.

Opcional (recordá *«una skill no es un script»*): si hay un paso
determinístico, como chequear que el endpoint responde, ponelo en
`nuevo-endpoint/scripts/` y hacé que la skill lo invoque.

### A.3 ¿Se dispara?

1. Sesión nueva. Preguntale al agente: **"¿Cuándo usarías la skill
   nuevo-endpoint?"** Si la respuesta no coincide con lo que querías, mejorá la
   `description`.
2. Sesión nueva. Pedile, **sin nombrar la skill**:

   ```text
   Necesito un endpoint para obtener el detalle de un turno por su id:
   GET /api/bookings/[id]. Si no existe, 404.
   ```

3. Revisá el log: `npm run logs:timeline`. ¿Aparece la skill? (En Claude Code
   se ve como herramienta `Skill`; en Codex y Cline, como una lectura del
   `SKILL.md`). ¿Siguió el criterio que escribiste?

Si no se activó, **no le digas que la use**: cambiá la `description` y probá
de nuevo en una sesión limpia. Anotá cuántos intentos te llevó.

---

## Parte B — Conectar un MCP: el navegador

Vas a conectar el servidor MCP de **Playwright**
([`@playwright/mcp`](https://github.com/microsoft/playwright-mcp)): le da al
agente herramientas para abrir un navegador, navegar, hacer clic, completar
formularios y sacar capturas. No necesita API key.

### B.1 Conectalo

<details>
<summary><b>Claude Code</b></summary>

```bash
claude mcp add playwright --scope project -- npx -y @playwright/mcp@latest
```

Esto crea `.mcp.json` en la raíz (configuración de proyecto, versionable). Al
abrir `claude` te va a pedir aprobar el servidor del proyecto. Verificá con
`/mcp`.

</details>

<details>
<summary><b>Codex CLI</b></summary>

Agregalo en `.codex/config.toml` del repo (solo se carga si el proyecto está
marcado como confiable, como en el ejercicio 1) o en `~/.codex/config.toml`:

```toml
[mcp_servers.playwright]
command = "npx"
args = ["-y", "@playwright/mcp@latest"]
```

Verificá con `/mcp` dentro de Codex.

</details>

<details>
<summary><b>Cline</b></summary>

Cline no tiene configuración de MCP por proyecto. En el panel de Cline:
**MCP Servers → Configure → Configure MCP Servers**, y agregá:

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["-y", "@playwright/mcp@latest"],
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

</details>

> Si Playwright no encuentra un navegador, corré una vez
> `npx playwright install chromium`.

### B.2 Usalo

Levantá la app en otra terminal (`npm run dev`) y pedile al agente:

```text
Con el navegador, entrá a http://localhost:3000 y reservá un turno como
cliente: elegí un profesional y un servicio y confirmá. Después verificá con el
endpoint GET /api/bookings/[id] que hiciste antes que el turno quedó guardado
con los datos correctos. Sacá una captura de la pantalla de confirmación y
contame cualquier problema de usabilidad que encuentres.
```

Al terminar, **revertí los cambios en `data/bookings.json`** que generó la
reserva (`git checkout -- data/bookings.json`).

### B.3 Mirá lo que pasó

`npm run logs:resumen` muestra una sección **Herramientas MCP**. Las tools de
MCP aparecen con nombres como `mcp__playwright__browser_navigate` (Claude
Code y Codex) o `use_mcp_tool` (Cline).

---

## Preguntas

Respondé en [`RESPUESTAS.md`](./RESPUESTAS.md) con evidencia del log.

### Skill

1. Pegá tu `description` final. ¿Cuántas versiones probaste hasta que se
   disparó sola? ¿Qué cambió entre la primera y la última?
2. ¿En qué momento de la sesión el agente cargó la skill (antes o después de
   leer código)? Mostralo con la línea de tiempo.
3. Elegí **dos** reglas de tu skill y mostrá en el diff que el agente las
   cumplió. ¿Alguna la ignoró? ¿Por qué creés que pasó?
4. Compará este pedido (2 líneas + skill) con el prompt del ejercicio 1 (25
   líneas). ¿Qué parte del prompt del ejercicio 1 ya no hace falta escribir?
5. La charla dice: *«la skill entra con su descripción y el cuerpo solo cuando
   se usa»*. ¿Por qué eso importa para la ventana de contexto? ¿Qué pasaría si
   todo el criterio estuviera en `AGENTS.md`?

### MCP

6. ¿Qué herramientas del MCP usó el agente y cuántas veces cada una? ¿Cuál
   devolvió las salidas más grandes (mirá `output` en el log)?
7. ¿Encontró algún problema real en la app usando el navegador que no se veía
   con los tests? ¿Qué no pudo verificar?
8. En el semáforo de herramientas de la charla, ¿de qué color es un navegador
   controlado por el agente? ¿Qué permisos le diste y cuáles no le darías en un
   proyecto real?
9. Abrí la lista de herramientas del servidor (`/mcp` o el panel de MCP).
   ¿Cuántas expone? ¿Conviene tener muchos MCP conectados todo el tiempo? ¿Qué
   le cuesta eso al contexto?

### Juntando todo

10. Skill y MCP: uno aporta *criterio*, el otro *herramientas*. Proponé una
    skill para este repo que **use** el MCP de Playwright (por ejemplo,
    "verificar un flujo contra los escenarios de una spec"). Escribí solo el
    encabezado y 5-6 líneas de criterio.

## Entrega

- La skill (`SKILL.md` y, si hiciste, `scripts/`) commiteada.
- La configuración del MCP (`.mcp.json` o `.codex/config.toml`; en Cline, una
  captura de la configuración).
- El endpoint `GET /api/bookings/[id]` con sus tests.
- La captura de pantalla que sacó el agente.
- `RESPUESTAS.md` completo.
