# Mentorías a Voluntad — Ejercicios de desarrollo con agentes de IA

Proyecto de práctica de la charla **«El proceso del diseño empleando IA
Generativa»** (UTN FRBA). Es un sistema hermano del TP **Código a Voluntad**:
acá, personas mentoras **donan horas de asesoramiento** y los colectivos
(fundaciones, ONGs, asambleas, asociaciones barriales) **reservan sesiones**
para destrabar sus proyectos de software.

La base del proyecto se construyó con **Spec-Driven Development**: la
constitution está en `.specify/memory/constitution.md` y la spec, el plan y las
tareas de la primera feature en [`specs/001-reservar-sesion/`](specs/001-reservar-sesion/).

## Configurar el entorno (Windows)

La guía paso a paso también está en la app: `npm run dev` → http://localhost:5173/configurar-entorno.
Es la misma que sigue (viene de `ejercicios/setup.json`; si la editás, corré `npm run docs:setup`).

<!-- setup:inicio -->

Todo se corre en **PowerShell** (no CMD), en Windows 10 u 11. Los pasos van en orden.

### 1. Requisitos

```powershell
winget install OpenJS.NodeJS.LTS
winget install Git.Git
```

Cerrá la terminal y abrí una PowerShell nueva (para que tome el PATH). Verificá:

```powershell
node -v
git --version
```

- **Node.js 22 LTS o 24 LTS** (`node -v` ≥ 22.12). Node 20 no sirve: ya no tiene soporte y fallan los tests de cliente.
- **Git for Windows** es requisito: lo usan los agentes y Spec Kit, y trae Git Bash.
- Spec Kit hace commits automáticos, así que configurá tu identidad de git (una sola vez):

```powershell
git config --global user.name "Tu Nombre"
git config --global user.email "tu@correo.com"
```

- Permití los scripts de PowerShell (una sola vez). Con la política `Restricted`, `npm.ps1` y los `.ps1` de Spec Kit quedan bloqueados:

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

### 2. Instalar el proyecto

```powershell
git clone <url-del-repo>
cd utn-genai-talk-exercises
npm install
```

### 3. Instalar un agente

Alcanza con uno. Siempre abrilo **desde la raíz del repo** (`utn-genai-talk-exercises`): los hooks de Codex usan rutas relativas.

**Claude Code**

```powershell
irm https://claude.ai/install.ps1 | iex
claude --version
claude
```

La primera vez abre el navegador para loguearte. Necesitás un plan Pro o Max (o una cuenta de la Console con API key).

**Codex CLI**

```powershell
npm i -g @openai/codex
codex
```

Elegí **Sign in with ChatGPT** (plan de ChatGPT de pago) o configurá una API key de OpenAI siguiendo la documentación de autenticación de Codex.

**Cline**

Instalá la extensión **Cline** desde el panel de extensiones de VS Code, abrí la carpeta del repo como workspace y, en la configuración de Cline, elegí un proveedor y pegá su API key.

### 4. Verificar

```powershell
npm test
npm run dev
```

- `npm test` tiene que pasar completo.
- `npm run dev` levanta la API en `:3001` y la web en http://localhost:5173. Si el 5173 está ocupado, Vite usa el 5174 (mirá la URL que imprime). El 3001 no cambia: si está ocupado, cerrá lo que lo usa (`netstat -ano | Select-String ":3001"`).
- Las respuestas de los ejercicios se guardan **solo con `npm run dev`**, no con `npm start`.

### 5. Antes del ejercicio 2

Bajá el navegador y precalentá el MCP de Playwright, para no esperar durante la clase:

```powershell
npx playwright install chromium
npx -y @playwright/mcp@latest --help
```

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
| Tests | Vitest · supertest · Testing Library |

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Levanta API y web con recarga en caliente |
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

## Mapa del repo

```
client/src/        ← React: pages/, components/, api/ (único lugar con fetch), hooks/
server/            ← Express: routes/ → services/ → repositories/ → domain/
shared/types.ts    ← tipos compartidos
data/              ← "base de datos" en JSON
tests/             ← server/domain · server/api · client
specs/001-…/       ← la feature base hecha con SDD (ejemplo)
.specify/          ← Spec Kit (constitution, templates, scripts)
.claude/ .codex/ .clinerules/  ← hooks de logs para cada agente
scripts/           ← seed y logger de los hooks
ejercicios/        ← consignas en JSON + su visor (/ejercicios), fuera del producto
AGENTS.md / CLAUDE.md  ← instrucciones permanentes para los agentes
```
