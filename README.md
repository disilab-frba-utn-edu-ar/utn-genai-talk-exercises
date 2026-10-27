# Mentorías a Voluntad — Ejercicios de desarrollo con agentes de IA

Proyecto de práctica de la charla **«El proceso del diseño empleando IA
Generativa»** (UTN FRBA). Es un sistema hermano del TP **Código a Voluntad**:
acá, personas mentoras **donan horas de asesoramiento** y los colectivos
(fundaciones, ONGs, asambleas, asociaciones barriales) **reservan sesiones**
para destrabar sus proyectos de software.

La base del proyecto se construyó con **Spec-Driven Development**: la
constitution está en `.specify/memory/constitution.md` y la spec, el plan y las
tareas de la primera feature en [`specs/001-reservar-sesion/`](specs/001-reservar-sesion/).

## Configurar el entorno (Windows, macOS y Linux)

La guía paso a paso también está en la app: `npm run dev` → http://localhost:5173/configurar-entorno.
Es la misma que sigue (viene de `ejercicios/setup.json`; si la editás, corré `npm run docs:setup`).

<!-- setup:inicio -->

Los comandos van para **Windows (PowerShell, no CMD)**, **macOS** y **Linux**. Los pasos marcados *solo Windows* no hacen falta en los otros sistemas.

### 1. Requisitos

Necesitás **Node.js 22 LTS o 24 LTS** (`node -v` ≥ 22.12) y **Git**.

**Windows (PowerShell)**

```powershell
winget install OpenJS.NodeJS.LTS
winget install Git.Git
```

**macOS**

```bash
brew install node@22 git
```

`node@22` no se enlaza solo: seguí lo que imprime brew, o instalá Node con [nvm](https://github.com/nvm-sh/nvm). Para Git también sirve `xcode-select --install`.

**Linux**

```bash
nvm install 22
sudo apt install git
```

Eso usa [nvm](https://github.com/nvm-sh/nvm) y apt (Debian/Ubuntu); también podés usar el gestor de tu distro.

Abrí una terminal nueva (para que tome el PATH) y verificá, en cualquier sistema:

```bash
node -v
git --version
```

- Node 20 no sirve: ya no tiene soporte y fallan los tests de cliente.
- Spec Kit hace commits automáticos, así que configurá tu identidad de git (una sola vez, en cualquier sistema):

```bash
git config --global user.name "Tu Nombre"
git config --global user.email "tu@correo.com"
```

- **Solo Windows:** Git for Windows es requisito (trae Git Bash). Y permití los scripts de PowerShell, una sola vez: con la política `Restricted`, `npm.ps1` y los `.ps1` de Spec Kit quedan bloqueados.

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

### 2. Instalar el proyecto

Igual en los tres sistemas:

```bash
git clone https://github.com/disilab-frba-utn-edu-ar/utn-genai-talk-exercises.git
cd utn-genai-talk-exercises
npm install
```

### 3. Instalar un agente

Alcanza con uno. Siempre abrilo **desde la raíz del repo** (`utn-genai-talk-exercises`): los hooks de Codex usan rutas relativas.

**Claude Code** ([guía de instalación](https://code.claude.com/docs/en/setup))

```powershell
# Windows (PowerShell)
irm https://claude.ai/install.ps1 | iex
```

```bash
# macOS / Linux
curl -fsSL https://claude.ai/install.sh | bash
```

Después corré `claude --version` y `claude`: la primera vez abre el navegador para loguearte. Necesitás un plan Pro o Max (o una cuenta de la Console con API key).

**Codex CLI**

```bash
npm i -g @openai/codex
codex
```

Es el mismo comando en los tres sistemas. Elegí **Sign in with ChatGPT** (plan de ChatGPT de pago) o configurá una API key de OpenAI siguiendo la documentación de autenticación de Codex.

**Cline CLI** ([cline.bot/cli](https://cline.bot/cli) · [guía de instalación](https://docs.cline.bot/cline-cli/installation))

```bash
npm i -g cline
cline
```

Es el mismo comando en los tres sistemas. Requiere Node.js 22+ y una cuenta gratis de Cline o una API key de un proveedor. Cline lee las skills del proyecto desde `.claude/skills/`, así que usa las del repo sin copiarlas.

### 4. Verificar

```bash
npm test
npm run dev
```

- `npm test` tiene que pasar completo.
- `npm run dev` levanta la API en `:3001` y la web en http://localhost:5173. Si el 5173 está ocupado, Vite usa el 5174 (mirá la URL que imprime). El 3001 no cambia: si está ocupado, cerrá lo que lo usa (Windows: `netstat -ano | Select-String ":3001"`; macOS/Linux: `lsof -i :3001`).
- Las respuestas de los ejercicios se guardan **solo con `npm run dev`**, no con `npm start`.

### 5. Antes del ejercicio 2

Bajá el navegador y precalentá el MCP de Playwright, para no esperar durante la clase (igual en los tres sistemas):

```bash
npx playwright install chromium
npx -y @playwright/mcp@latest --help
```

### 6. Antes del ejercicio 3

Spec Kit necesita **Python 3.11+**, **uv** y un agente. Instalá uv ([guía de instalación](https://docs.astral.sh/uv/getting-started/installation/)):

```powershell
# Windows (PowerShell)
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
# alternativa: winget install --id=astral-sh.uv -e
```

```bash
# macOS / Linux
curl -LsSf https://astral.sh/uv/install.sh | sh
# alternativa en macOS: brew install uv
```

Si no tenés Python 3.11+, uv lo instala:

```bash
uv python install 3.12
```

Después instalá el CLI de [Spec Kit](https://github.com/github/spec-kit) y verificalo:

```bash
uv tool install specify-cli
specify --help
```

En este repo Spec Kit **ya está inicializado** (`.specify/` y las skills `speckit-*`), así que **no corras `specify init`**. El CLI es para quien quiera inicializar un proyecto propio.

<!-- setup:fin -->

`npm run dev` genera sesiones de ejemplo la primera vez. Para volver a los datos
iniciales: `npm run seed`.

## Ejercicios

Funcionan con **Claude Code**, **Codex CLI** o **Cline**. Las consignas están en
`ejercicios/` (JSON) y se leen en la app: `npm run dev` →
http://localhost:5173/ejercicios. Las respuestas se guardan desde ahí, **solo con
`npm run dev`** (no con `npm start`), en `ejercicios/<ejercicio>/RESPUESTAS.md` (el
entregable) y `respuestas.json` (para seguir editándolas).

| # | Ejercicio | Tema de la charla |
|---|---|---|
| 1 | [Observar al agente con hooks](http://localhost:5173/ejercicios/01-observabilidad-con-hooks) | Ciclo agéntico · herramientas · harness |
| 2 | [Escribir una skill y conectar un MCP](http://localhost:5173/ejercicios/02-skill-y-mcp) | Skills · context engineering |
| 3 | [Implementar una feature con SDD](http://localhost:5173/ejercicios/03-sdd) | Spec-Driven Development |

## Stack

| Capa | Tecnología |
|---|---|
| Cliente | Vite + React 19 + React Router · CSS plano |
| Servidor | Express 5 + TypeScript (tsx) en capas: routes → services → repositories → domain |
| Datos | Archivos JSON en `data/` |
| Métricas | SSE (Server-Sent Events) + `fs.watch` con polling de respaldo · gráficos en SVG propio, sin librerías |
| Tests | Vitest · supertest · Testing Library |

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Levanta API (127.0.0.1:3001) y web (127.0.0.1:5173) con recarga en caliente |
| `npm test` | Tests de dominio, API y cliente |
| `npm run lint` / `npm run typecheck` | ESLint y TypeScript |
| `npm run build` y `npm start` | Compila el cliente y lo sirve desde Express en :3001 |
| `npm run seed` | Regenera `data/sesiones.json` con sesiones en los próximos días |
| `npm run logs:resumen` / `logs:timeline` / `logs:limpiar` | Logs de los agentes (ejercicios) |

## API

| Método | Ruta | |
|---|---|---|
| GET | `/api/health` | Health check |
| GET | `/api/habilidades` · `/api/tipos-asesoria` · `/api/colectivos` | Catálogos |
| GET | `/api/mentoras?habilidad=<codigo>` | Mentoras (sin datos de contacto) |
| GET | `/api/mentoras/:id` | Una mentora |
| GET | `/api/mentoras/:id/disponibilidad?tipoAsesoriaId=<id>` | Días y horarios libres de los próximos 14 días |
| GET | `/api/sesiones?mentoraId=&fecha=` | Sesiones (sin datos de contacto) |
| POST | `/api/sesiones` | Reservar una sesión |

Contrato completo: [`specs/001-reservar-sesion/contracts/api.md`](specs/001-reservar-sesion/contracts/api.md).

## Métricas de agentes (`/metricas`)

Dashboard en vivo de lo que hacen Claude Code, Codex CLI y Cline, leído de `logs/` (los
archivos que escriben los hooks). Está **separado del producto** Mentorías, igual que
`/ejercicios`: la UI vive en `metricas/app/` y el link "Métricas" está siempre en el menú.

- **Qué muestra:** sesiones, prompts, herramientas, fallas ("n/d" si el agente no las reporta),
  eventos por minuto, acciones por tipo, duraciones p50/p95, archivos leídos y escritos, binarios de
  shell, subagentes/skills/MCP, línea de tiempo de la sesión, **tokens por minuto (por agente y por
  tipo), modelo por sesión y cambios de modelo, y costo estimado**. Se puede filtrar por agente,
  sesión y ventana, y elegir entre los logs actuales y cada carpeta de `logs/archivo/<fecha>`.
- **Tokens, modelo y costo:** los hooks no los mandan. Salen de la transcripción de cada agente
  (`~/.claude/projects/…`, `~/.codex/sessions/…`, `~/.cline/data/tasks/…`), ubicada por el
  `transcript_path` que guarda el hook o por los lugares estándar. Solo se leen modelo, tokens y
  fechas, nunca el contenido de los mensajes. Los formatos de Codex y Cline son supuestos sin
  confirmar con logs reales: están anotados en [`specs/003-dashboard-agentes/spec.md`](specs/003-dashboard-agentes/spec.md).
- **Precios:** [`metricas/precios-modelos.json`](metricas/precios-modelos.json) (USD por millón de
  tokens, con fecha y fuente oficial). Un modelo que no figura muestra "n/d", nunca 0. Hoy solo
  están los modelos de Anthropic; para Codex u otros proveedores, sumá el modelo con los precios de
  la página oficial. Es configuración versionada: no usa variables de entorno.
- **Privacidad:** no salen del servidor prompts, respuestas, salidas, errores ni argumentos de
  comandos; las rutas van relativas al repo. El **modo detalle** (toggle en la UI, apagado por
  defecto) muestra los comandos completos con `sk-…`, `ghp_…`, `Bearer …`, emails y `--token=…`
  redactados.
- **Red:** la API y la web escuchan solo en `127.0.0.1`, y el endpoint de métricas además responde
  403 a cualquier cosa que no sea loopback.
- **API:** `GET /api/metricas-agentes?origen=&agente=&sesion=&ventana=&detalle=1`,
  `GET /api/metricas-agentes/origenes` y `GET /api/metricas-agentes/eventos` (SSE).
- **Hooks:** `log-hook.mjs` guarda también `toolUseId`, `subagent`, `model`, `turn`,
  `transcriptPath` y las rutas de `apply_patch`; todos son opcionales y los logs viejos siguen
  funcionando.

## Mapa del repo

```
client/src/        ← React: pages/, components/, api/ (único lugar con fetch del producto), hooks/
server/            ← Express: routes/ → services/ → repositories/ → domain/
shared/types.ts    ← tipos compartidos
data/              ← "base de datos" en JSON
tests/             ← server/{domain,api,repositories,hooks} · client
specs/001-…/       ← la feature base hecha con SDD (ejemplo)
.specify/          ← Spec Kit (constitution, templates, scripts)
.claude/ .codex/ .clinerules/  ← hooks de logs para cada agente
scripts/           ← seed y logger de los hooks
ejercicios/        ← consignas en JSON + su visor (/ejercicios), fuera del producto
metricas/          ← dashboard de métricas de agentes (/metricas) y su tabla de precios, fuera del producto
AGENTS.md / CLAUDE.md  ← instrucciones permanentes para los agentes
```
