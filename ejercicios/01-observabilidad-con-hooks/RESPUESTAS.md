# Ejercicio 1 — Respuestas

**Nombre:** _Sin completar en Mi perfil._
**¿Intervinieron durante la tarea?** _Sin completar en Mi perfil._

## Parte A — Lo que pasó

### 1. El ciclo

**1.1** ¿Cuántas llamadas a herramientas hizo el agente en total?

10

**1.2** ¿Qué herramienta usó más?

bash

**1.3** Agrupalas en las familias de la charla: búsqueda de código, control de versiones, validación local, navegador, servicios.

El agente realizó 10 llamadas a herramientas, todas mediante Bash.

- **Búsqueda y lectura de código:** utilizó `Get-Content` para consultar la constitución del proyecto, los servicios, los tipos compartidos, los tests existentes y las especificaciones.
- **Control de versiones:** utilizó `git diff`, `git diff --stat`, `git diff --check` y `git status --short` para revisar los cambios.
- **Validación local:** ejecutó `npm test`, `npm run lint` y `npm run typecheck` para verificar la solución. Los 27 tests específicos terminaron correctamente.
- **Navegador:** no utilizó herramientas de navegador.
- **Servicios externos:** no se registraron llamadas a servicios externos.

Además, utilizó Bash para crear y modificar archivos del código y de las pruebas.

Todo esto se observa en `npm run logs:resumen` y `npm run logs:timeline`.

### 2. Explorar antes de actuar

**2.1** ¿Cuántas herramientas usó **antes** de su primera edición de archivo?

Utilizó **3 llamadas a herramientas** antes de editar archivos por primera vez.

Según `npm run logs:timeline`, las primeras tres llamadas (+4 s, +9 s y +23 s) fueron consultas mediante `Get-Content`. Recién en la cuarta llamada (+34 s) comenzó a crear archivos para las pruebas.

**2.2** ¿Qué archivos leyó?

Antes de realizar modificaciones, el agente consultó:

- `.specify/memory/constitution.md`
- Archivos de `server/services/`
- `shared/types.ts`
- `tests/server/api/sesiones.test.ts`
- `server/domain/fechas.ts`
- `package.json`
- `specs/001-reservar-sesion/spec.md`
- `specs/001-reservar-sesion/tasks.md`

También consultó archivos adicionales mediante comandos `Get-Content`, aunque sus nombres completos aparecen truncados en el resumen del log.

**2.3** ¿Leyó la constitution que menciona el prompt?

**Sí.** En la primera llamada a herramientas, a los +4 segundos, ejecutó:

`Get-Content .specify/memory/constitution.md`

Esto demuestra que consultó la constitución del proyecto antes de comenzar a modificar el código, respetando el orden esperado por el ejercicio.

### 3. Comandos de terminal

**3.1** Listá todos los comandos que ejecutó.

Según `npm run logs:timeline`, el agente realizó 10 llamadas a Bash:

1. `Get-Content` para leer la constitución, servicios, tipos y pruebas.
2. `Get-Content` para leer `sesiones.test.ts`, `fechas.ts`, `package.json` y otros archivos.
3. `Get-Content` para leer `spec.md` y `tasks.md`.
4. Un comando con `@' ... '@` para escribir pruebas de superposición.
5. Otro comando con `@' ... '@` para implementar `haySuperposicion` y ejecutar pruebas.
6. `npm run lint`.
7. `git diff --stat; git diff -- server/services/sesiones.ts tests/server/api/sesiones.test.ts; git status --short`.
8. `npm run typecheck`.
9. `npm test -- tests/server/domain/superposicion.test.ts tests/server/api/superposicion.test.ts tests/server/api/sesiones.test.ts`.
10. Un comando de PowerShell para comprobar los saltos de línea del README, seguido de `git diff --check` y `git status --short`.

Los comandos largos están truncados en el resumen, por lo que algunos están descriptos y no reproducidos literalmente.

**3.2** ¿Alguno no lo pediste vos? ¿Alguno te generó dudas al aprobarlo?

Sí. No solicité cada comando individualmente; le pedí al agente que solucionara el bug siguiendo las instrucciones del ejercicio.

Codex decidió por su cuenta consultar archivos, crear pruebas, modificar código, ejecutar validaciones y revisar Git.

Los comandos que más precaución requerían eran los de escritura mediante PowerShell (`@' ... '@`), porque podían modificar archivos del proyecto.

También observé que ejecutó comandos para investigar un fallo de pruebas relacionado con el README, aunque ese problema no formaba parte del bug solicitado.

No se registraron comandos de despliegue ni llamadas a servicios externos.

**3.3** Clasificá cada uno con el semáforo de la charla: verde (lectura), amarillo (validación local) o rojo (escritura o producción).

**🟢 Verde — Lectura (3 llamadas)**

1. `Get-Content` para consultar la constitución, servicios y tipos.
2. `Get-Content` para revisar pruebas existentes y archivos del proyecto.
3. `Get-Content` para leer las especificaciones y tareas.

**🟡 Amarillo — Validación local (5 llamadas)**

6. `npm run lint`: análisis estático.
7. `git diff` y `git status`: inspección de cambios.
8. `npm run typecheck`: verificación de tipos.
9. `npm test`: ejecución de pruebas.
10. Comprobación de saltos de línea del README, `git diff --check` y `git status --short`.

**🔴 Rojo — Escritura (2 llamadas)**

4. Comando PowerShell con `@' ... '@` para crear archivos de pruebas.
5. Comando PowerShell con `@' ... '@` para implementar la solución y modificar archivos.

**Resumen:** 3 verdes, 5 amarillos y 2 rojos. Ningún comando de producción o despliegue.

### 4. Errores y reintentos

**4.1** ¿Alguna herramienta falló (`PostToolUseFailure` o un `output` con error)?

Sí. El log registra un fallo durante la ejecución de las pruebas.

En el resultado de una llamada a Bash aparece `Failed Tests 1`, correspondiente al test `Navegacion.test.tsx`, que verificaba la coincidencia entre la documentación del README y la mostrada en la aplicación.

El error se relacionaba con los saltos de línea CRLF del archivo README, no directamente con la funcionalidad de superposición de reservas.

No se observa un evento `PostToolUseFailure` explícito, pero sí una salida de herramienta que contiene un error de test.

**4.2** ¿Qué hizo el agente después?

El agente continuó trabajando y verificando su solución.

1. Ejecutó `npm run lint`, que terminó correctamente.
2. Revisó los cambios mediante `git diff` y `git status`.
3. Ejecutó `npm run typecheck`, que también terminó correctamente.
4. Volvió a ejecutar los tests específicos de superposición y reservas: los 27 pasaron.
5. Investigó el error del README comprobando sus saltos de línea mediante PowerShell.

Finalmente, informó que había implementado la solución, que los tests específicos pasaban y que persistía un fallo ajeno al cambio en `Navegacion.test.tsx`.

**No corrigió ese fallo adicional**, sino que lo identificó y lo comunicó en su respuesta final.

## Parte B — Lo que pensás

### 5. Contexto

**5.1** Sumá aproximadamente el tamaño de las salidas: ¿qué herramienta "llenó" más la ventana?

_Sin responder._

**5.2** ¿Había lecturas que se podían evitar? Por ejemplo: ¿leyó `data/sesiones.json` entero para entender el formato, en lugar de `shared/types.ts`?

_Sin responder._

### 6. Hooks como control

**6.1** ¿En qué evento lo pondrías?

_Sin responder._

**6.2** ¿Por qué tiene que ser un hook y no una instrucción en `AGENTS.md` o en la constitution?

_Sin responder._

### 7. Riesgos

_Sin responder._

## Para cerrar

**Modelo:** _Sin completar en Mi perfil._

**Agente:** _Sin completar en Mi perfil._
