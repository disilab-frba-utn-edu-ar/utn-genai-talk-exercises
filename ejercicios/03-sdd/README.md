# Ejercicio 3 — Implementar una feature con Spec-Driven Development

> **Charla:** bloque 3.2.2 · *Spec-Driven Development* (qué es SDD, una spec por
> dentro, el flujo, una skill, hooks, dónde falla).
>
> **Duración estimada:** 2 a 3 horas.
> **Requisito:** haber hecho el ejercicio 1 (los hooks de logs siguen activos).

## Objetivo

Llevar una feature desde la idea hasta el código pasando por las etapas del
flujo que vimos en la charla, **con validación humana entre cada paso**:

```
Constitution → Specify → Clarify → Plan → Tasks → Implement
  (estándares)  (el qué)   (dudas)   (el cómo) (trabajo chico) (construir)
        ✋          ✋          ✋         ✋          ✋
```

La herramienta es [Spec Kit](https://github.com/github/spec-kit), que ya está
instalado en el repo (`.specify/`). Lo que se evalúa no es que la feature quede
perfecta: es **cómo usaste el método** y **dónde pusiste tu criterio**.

> «Se delega la formalización, no el criterio.»

## Antes de empezar: leé lo que ya existe

1. `.specify/memory/constitution.md` — la constitution del proyecto. Es el
   contexto permanente que el agente tiene que respetar en cada etapa.
   Fijate en las restricciones de dominio y en los principios I (test-first),
   II (capas) y IV (privacidad): son los que más se ponen a prueba en las
   iteraciones.
2. `specs/001-reservar-sesion/` — **la base de este proyecto se construyó con
   este mismo flujo**: la reserva de sesiones que ya funciona salió de esa
   spec. Mirá la forma de `spec.md` (intención, escenarios, requisitos,
   criterios medibles; sin tecnología), `plan.md`, `research.md`,
   `data-model.md`, `contracts/api.md` y `tasks.md`: es el formato que vas a
   producir. Comparar la spec con el código que hoy existe en `server/` y
   `client/` es la mejor forma de entender qué aporta cada etapa.

## 1. Elegí la feature

El backlog de producto está en [`iteraciones.md`](./iteraciones.md). Usá la
iteración que te asigne el docente o, si no hay asignación:

| Iteración | Tamaño | Recomendada para |
|---|---|---|
| 1 — Cancelar una sesión | Chica | Primera vez con SDD |
| 2 — Cupo mensual de horas por mentora | Chica a media | Primera vez con SDD |
| 3 — Ausencias en la agenda | Media | **Opción por defecto** |
| 4 — "Cualquier mentora disponible" | Media | Quien ya terminó otra |
| 5 — Solicitudes de sesión y revelado de contacto | Grande | Grupos de 2-3 |

Antes de escribir la spec, leé los **casos borde para pensar** de tu
iteración: son las decisiones de negocio que la spec tiene que tomar.

## 2. Prepará Spec Kit para tu agente

Las etapas de Spec Kit ya están instaladas como **skills** en
`.claude/skills/speckit-*`, con scripts de **PowerShell** (`.specify/scripts/powershell/`).

| Tu entorno | Qué hacer |
|---|---|
| Claude Code o Cline en **Windows** | Nada: ya está listo (Cline también lee `.claude/skills/`). |
| Claude Code o Cline en **macOS / Linux** | Reinicializar con scripts `sh` (ver abajo). |
| Codex (cualquier SO) | Reinicializar para Codex: sus skills van en `.agents/skills/`. |

Spec Kit se instala con [`uv`](https://docs.astral.sh/uv/):

```bash
# Claude Code / Cline en macOS o Linux
uvx --from git+https://github.com/github/spec-kit.git specify init --here --ai claude --ai-skills --script sh

# Codex (usá --script ps en Windows)
uvx --from git+https://github.com/github/spec-kit.git specify init --here --ai codex --ai-skills --script sh
```

> ⚠️ `specify init --here` escribe sobre el repo. **Hacé commit antes** y al
> terminar revisá `git status` / `git diff`. Si te pisó la constitution,
> restaurala con `git checkout -- .specify/memory/constitution.md`. Si algún
> flag cambió de nombre, mirá `specify init --help`.

Cómo se invoca cada etapa (son skills, así que también podés pedirlo en
lenguaje natural: *"usá la skill speckit-specify para …"*):

| Etapa | Claude Code | Codex | Cline |
|---|---|---|---|
| Specify | `/speckit-specify <descripción>` | `$speckit-specify <descripción>` | "Usá la skill speckit-specify: <descripción>" |
| Clarify | `/speckit-clarify` | `$speckit-clarify` | "Usá la skill speckit-clarify" |
| Plan | `/speckit-plan` | `$speckit-plan` | "Usá la skill speckit-plan" |
| Tasks | `/speckit-tasks` | `$speckit-tasks` | "Usá la skill speckit-tasks" |
| Analyze (opcional) | `/speckit-analyze` | `$speckit-analyze` | "Usá la skill speckit-analyze" |
| Implement | `/speckit-implement` | `$speckit-implement` | "Usá la skill speckit-implement" |

## 3. Recorré el flujo (con ✋ entre cada paso)

Arrancá limpiando los logs para medir solo este ejercicio:

```bash
npm run logs:limpiar
```

### 3.1 Specify — el qué

Pasale al agente la iteración elegida **con tus palabras**, no copiando el
texto de `iteraciones.md` entero. Ejemplo para la iteración 3:

```text
/speckit-specify Las mentoras necesitan cargar ausencias en su agenda
(vacaciones, parciales, feriados, una reunión puntual). Una ausencia puede ser
de uno o varios días completos o de una franja horaria de un día. Los horarios
afectados no tienen que ofrecerse cuando un colectivo reserva. El motivo de la
ausencia es privado: el colectivo solo ve que no hay horario.
```

✋ **Revisá `spec.md` antes de seguir.** Chequeá que tenga las cuatro partes de
la charla: **intención, escenarios de aceptación (Dado/Cuando/Entonces),
requisitos verificables y criterios medibles**. Y que **no mencione
tecnología**: la spec describe producto y negocio. Corregí a mano o pedile
cambios al agente todas las veces que haga falta.

### 3.2 Clarify — lo que no definimos

Corré `clarify`. El agente te va a hacer preguntas: **respondelas vos**, con
criterio de negocio. No aceptes la "opción recomendada" sin pensarla.

✋ Anotá en `RESPUESTAS.md` las preguntas que te hizo y qué respondiste.

### 3.3 Plan — el cómo técnico

Corré `plan`. Revisá `plan.md`, `research.md`, `data-model.md` y `contracts/`.

✋ Verificá que el plan respete la constitution y que el *Constitution Check*
del `plan.md` no sea un trámite: ¿TDD con tests en `tests/server/domain`,
`tests/server/api` (con `DATA_DIR` temporal) y `tests/client`? ¿la regla nueva
vive en `server/domain/` sin IO? ¿rutas en plural y kebab-case, errores
`{ error }` con 400/404/409? ¿UUID v4? ¿ningún dato privado en endpoints
públicos? ¿el fetch en `client/src/api/` y estados cargando/error/vacío? Si no
la respeta, frená y corregilo.

### 3.4 Tasks — trabajo chico y revisable

Corré `tasks` (y opcionalmente `analyze` para chequear consistencia entre
artefactos).

✋ Leé `tasks.md`: ¿cada tarea es chica? ¿los tests aparecen **antes** que la
implementación? ¿hay tareas que no se desprenden de la spec?

### 3.5 Implement — construir

Corré `implement`. Podés hacerlo por fases (pedile que se detenga al final de
cada una) para revisar sobre la marcha.

✋ Al terminar:

```bash
npm test
npm run lint
npm run typecheck
npm run build
npm run dev      # probalo a mano en http://localhost:5173
```

Si en el ejercicio 2 conectaste el MCP de Playwright, pedile al agente que
verifique el flujo en el navegador contra los escenarios de aceptación de tu
`spec.md`.

## 4. Desafío extra — un hook que haga cumplir el método

En la charla vimos que un hook es **validación determinística entre etapas**:
no depende de que el modelo se acuerde.

```
tasks      → ¿leíste la constitution?    si no, no avanza
plan       → ¿la spec está aprobada?     si no, no avanza
implement  → ¿existe un plan para esto?  si no, no avanza
```

Escribí un hook `PreToolUse` (en el agente que uses) que **bloquee** cualquier
edición de archivos dentro de `server/`, `client/src/` o `shared/` si la
feature activa (`.specify/feature.json`, que apunta a la carpeta de
`specs/`) **no tiene `tasks.md`**. Pistas:

- Partí de `scripts/agent-logs/log-hook.mjs`: ya sabe leer el JSON del evento.
- En Claude Code (y en Codex, que copia el mismo contrato), un hook bloquea saliendo con **código 2** y
  explicando el motivo por `stderr` (el agente lo recibe como feedback).
- En Cline, el hook bloquea imprimiendo `{"cancel": true, "errorMessage": "..."}`.
- Probalo: borrá temporalmente `tasks.md` y pedile al agente que edite un
  componente o un servicio. Tiene que aparecer el bloqueo en el log.
- Variante más exigente (el otro extremo del flujo): que bloquee la edición de
  `plan.md` si `spec.md` todavía tiene marcas `[NEEDS CLARIFICATION]`, o que
  no deje editar código de `server/` sin que antes exista un test nuevo en
  `tests/` en la misma sesión (TDD forzado por el harness).

## 5. Entrega

1. Un commit (o PR) con: `specs/00X-<feature>/` completo, el código y los tests.
2. `ejercicios/03-sdd/RESPUESTAS.md` completo.
3. La salida de `npm run logs:resumen -- --todas` pegada al final de las
   respuestas.

## Preguntas

### Sobre el método

1. ¿Cuántas veces corregiste la `spec.md` antes de aprobarla? Mostrá un
   ejemplo concreto de algo que el agente asumió y que vos cambiaste.
2. ¿Qué preguntas hizo `clarify`? ¿Alguna era una decisión de negocio que el
   agente **no** debería haber tomado solo? De los *casos borde para pensar*
   de tu iteración en `iteraciones.md`, ¿cuáles cubrió la spec, cuáles
   preguntó `clarify` y cuáles no aparecieron nunca?
3. ¿El `plan.md` respetó la constitution? Citá un principio que el agente
   aplicó y, si existió, uno que ignoró o interpretó mal. ¿Tu feature
   necesitó **enmendar** la constitution (por ejemplo, un estado nuevo de
   sesión)? Si fue así, ¿lo propuso el agente o lo detectaste vos?
4. En la charla: *«un malentendido en la spec que no se frena llega al
   código»*. ¿Encontraste en la implementación algo que venía de un error de
   la spec, el plan o las tasks? ¿En qué etapa lo detectaste?

### Sobre los logs (evidencia)

5. Comparando con el ejercicio 1: ¿cuántas llamadas a herramientas y cuánto
   tiempo llevó cada etapa? ¿Qué etapa fue la más "cara"?
6. Durante `implement`, ¿el agente releyó `spec.md`/`plan.md`/`tasks.md`? ¿Con
   qué frecuencia? ¿Qué dice eso sobre cómo usa el contexto? Si hiciste el
   ejercicio 2, ¿se disparó la skill `nuevo-endpoint` al crear los endpoints
   nuevos, o el plan ya traía todo ese criterio?
7. ¿Los tests se escribieron y corrieron **antes** que la implementación (TDD,
   principio I)? Demostralo con la línea de tiempo del log.

### Para pensar

8. *«Dónde falla»*: specs ambiguas, contexto de más, aprobar sin leer, el humano
   como aprobador. ¿En cuál de esos cuatro casi caíste? ¿Qué lo evitó (o no)?
9. ¿Para esta feature valió la pena SDD o era más rápido un prompt directo como
   en el ejercicio 1? ¿Cuándo usarías cada uno?
10. Si tuvieras que escribir una skill para mejorar **una** de las etapas en
    este proyecto, ¿cuál sería y qué criterio le pondrías adentro?
