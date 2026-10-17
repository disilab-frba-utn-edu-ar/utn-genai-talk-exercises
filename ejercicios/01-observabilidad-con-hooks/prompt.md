# Prompt para el agente — Ejercicio 1

> Copiá **todo** el bloque de abajo y pegalo como primer mensaje en una sesión
> nueva de tu agente (Claude Code, Codex o Cline). No le agregues nada más: la
> idea es observar qué hace el agente con exactamente este pedido.

---

```text
Contexto: BarberApp es una app de turnos para una barbería (Next.js + TypeScript,
datos en archivos JSON dentro de data/). La constitución del proyecto está en
.specify/memory/constitution.md y dice, entre otras cosas:
"Un profesional NO PUEDE tener dos turnos confirmados que se superpongan".

Problema: el endpoint POST /api/bookings (app/api/bookings/route.ts) solo
rechaza un turno nuevo si empieza EXACTAMENTE a la misma hora que otro turno
confirmado del mismo profesional. Si Carlos tiene un turno de 10:00 a 10:45,
hoy se puede reservar otro con él a las 10:30 y quedan superpuestos.

Lo que necesito:
1. Extraé la lógica de detección de superposición a una función pura en
   lib/bookings.ts, por ejemplo:
   hasOverlap(bookings, { professionalId, date, startTime, endTime }): boolean
   Solo cuentan los turnos con status "confirmed" del mismo profesional y del
   mismo día. Un turno que termina 10:30 y otro que empieza 10:30 NO se
   superponen.
2. Trabajá con TDD: primero escribí los tests en tests/unit/lib/bookings.test.ts,
   corrélos y mostrame que fallan; recién después implementá.
3. Usá hasOverlap en el POST de app/api/bookings/route.ts. Si hay superposición
   respondé 409 con { "error": "El horario se superpone con otro turno" }.
4. No modifiques los archivos de data/ ni los tests existentes.
5. Al terminar, corré `npm test` y `npm run lint` y contame el resultado.

Antes de editar código, explicame en 3-4 líneas tu plan.
```
