# Prompt para el agente — Ejercicio 1

> Copiá **todo** el bloque de abajo y pegalo como primer mensaje en una sesión
> nueva de tu agente (Claude Code, Codex o Cline). No le agregues nada más: la
> idea es observar qué hace el agente con exactamente este pedido.

---

```text
Contexto: Mentorías a Voluntad es una app donde personas mentoras donan horas
de asesoramiento y los colectivos (fundaciones, ONGs, asambleas) reservan
sesiones. Es un repo full stack: client/ (Vite + React + TypeScript) y server/
(Express + TypeScript en capas: routes → services → repositories → domain),
con los datos en archivos JSON dentro de data/. La constitution del proyecto
está en .specify/memory/constitution.md y dice, entre otras cosas:
"Una mentora NO PUEDE tener dos sesiones confirmadas que se superpongan".

Problema: el endpoint POST /api/sesiones solo rechaza una sesión nueva si otra
sesión confirmada de la misma mentora, el mismo día, empieza EXACTAMENTE a la
misma hora. Si una mentora tiene una revisión de código de 10:00 a 11:00, hoy
un colectivo puede reservarle otra sesión de 10:30 a 11:15 y quedan
superpuestas.

Lo que necesito:
1. Extraé la detección de superposición a una función pura en server/domain/,
   por ejemplo:
   haySuperposicion(sesiones, { mentoraId, fecha, horaInicio, horaFin }): boolean
   Solo cuentan las sesiones con estado "confirmada" de la misma mentora y de
   la misma fecha. Una sesión que termina 10:30 y otra que empieza 10:30 NO se
   superponen. La función no hace IO.
2. Trabajá con TDD: primero escribí los tests en
   tests/server/domain/superposicion.test.ts y un test de la API en
   tests/server/api/ que espere el 409; corrélos y mostrame que fallan; recién
   después implementá.
3. Usá haySuperposicion en el caso de uso de crear sesión (capa de servicios).
   Si hay superposición, la API responde 409 con
   { "error": "El horario se superpone con otra sesión de la mentora" }.
4. No modifiques los archivos de data/ ni los tests existentes.
5. Al terminar, corré `npm test` y `npm run lint` y contame el resultado.

Antes de editar código, explicame en 3-4 líneas tu plan.
```
