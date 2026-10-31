# Ejercicio 1 — Respuestas

**Nombre:** NicoLeo
**Integrantes:** Leonardo Viegas, Nicolas Schkurko
**¿Intervinieron durante la tarea?** _Sin completar en Mi perfil._

## Parte A — Lo que pasó

### 1. El ciclo

**1.1** ¿Cuántas llamadas a herramientas hizo el agente en total?

5 llamadas

**1.2** ¿Qué herramienta usó más?

Bash

### 2. Explorar antes de actuar

**2.1** ¿Cuántas herramientas usó **antes** de su primera edición de archivo?

Uso 3 herramientas (las 3 Bash) antes de escribir un archivo. La primera escritura fue en la 4.ª llamada, cuando hice la copia en el scratchpad y deshice la implementación. Ojo: los cambios de la feature los encontré ya hechos de una sesión anterior; en esta sesión solo escribí para la fase roja temporal y para restaurar.

**2.2** ¿Qué archivos leyó?

Leyo:
server/domain/superposicion.ts, tests/server/domain/superposicion.test.ts y server/services/sesiones.ts (con cat).
Los cambios de package.json, server/services/sesiones.ts y tests/server/api/sesiones.test.ts, solo a través de git diff.
Los listados de server/domain/ y tests/server/api/.
La versión commiteada de server/services/sesiones.ts, con git show. La usé para pisar el archivo, no para leerla.
No leí shared/types.ts, tests/server/api/helpers.ts, el test de API completo ni nada de data/.

**2.3** ¿Leyó la constitution que menciona el prompt?

No. AGENTS.md dice que hay que leerla antes de tocar código y me la salteé. Me apoyé en la cita del prompt y en que el código ya existía. Fue un error.

### 3. Comandos de terminal

**3.1** Listá todos los comandos que ejecutó.

#	Comandos	Semáforo
1	cd, git diff, cat ×3, ls	🟢 verde
2	npm test | tail, npm run lint | tail	🟡 amarillo
3	npm test | grep, npx vitest run tests/server | tail	🟡 amarillo
4	mkdir -p, cp ×2 al scratchpad, git show HEAD:... > server/services/sesiones.ts, sed -i sobre superposicion.ts, grep, npx vitest run ...	🔴 rojo
5	cp ×2 para restaurar, grep, npx vitest run, npm test, npm run lint, npm run typecheck	🔴 rojo
Todo es local; ningún comando tocó producción. Las llamadas 4 y 5 son rojas porque sobrescriben archivos con cambios sin commitear.

**3.2** ¿Alguno no lo pediste vos? ¿Alguno te generó dudas al aprobarlo?

Pedidos por vos: npm test, npm run lint y la corrida en rojo del TDD.
No pedidos de forma explícita: la exploración (git diff, cat), npm run typecheck (lo pide AGENTS.md) y las corridas parciales de vitest.
El que más dudas debería generar: git show HEAD:... > sesiones.ts. Pisa trabajo sin commitear y solo lo protege una copia en una carpeta temporal y el encadenamiento con &&. git stash habría sido más seguro.
Sobre las aprobaciones: la sesión estaba en modo auto, así que no sé si te pidió aprobar algo. Eso lo muestra el log

**3.3** Clasificá cada uno con el semáforo de la charla: verde (lectura), amarillo (validación local) o rojo (escritura o producción).

#	Comandos	Semáforo
1	cd, git diff, cat ×3, ls	🟢 verde
2	npm test | tail, npm run lint | tail	🟡 amarillo
3	npm test | grep, npx vitest run tests/server | tail	🟡 amarillo
4	mkdir -p, cp ×2 al scratchpad, git show HEAD:... > server/services/sesiones.ts, sed -i sobre superposicion.ts, grep, npx vitest run ...	🔴 rojo
5	cp ×2 para restaurar, grep, npx vitest run, npm test, npm run lint, npm run typecheck	🔴 rojo
Todo es local; ningún comando tocó producción. Las llamadas 4 y 5 son rojas porque sobrescriben archivos con cambios sin commitear.

### 4. Errores y reintentos

**4.1** ¿Alguna herramienta falló (`PostToolUseFailure` o un `output` con error)?

Ninguna llamada falló como herramienta. Todas terminaban en | tail o | grep, que devuelven 0 y tapan el código de salida de npm. Por eso no hubo PostToolUseFailure.
Sí hubo salidas con error: en npm test falló 1 test de Navegacion.test.tsx (el README) y el worker de Vitest se cayó con 3221226505, un crash nativo, en un test de metricas/.
Un error de medición: el exit=$? de la llamada 5 mide la salida de tail, no la de lint, así que ese "0" no prueba nada. Que lint pasó lo sé solo porque no imprimió errores.

**4.2** ¿Qué hizo el agente después?

Volví a correr todo npm test filtrando con grep para identificar el test. Vi que el fallo no tenía relación con la tarea, no lo reintenté ni lo arreglé, y lo informé. Haber cortado la primera salida con tail fue lo que me obligó a repetir la corrida completa (unos 30 segundos más).

## Parte B — Lo que pensás

### 5. Contexto

**5.1** Sumá aproximadamente el tamaño de las salidas: ¿qué herramienta "llenó" más la ventana?

Usé solo Bash, así que Bash ocupó todo. Estimado por llamada:

Llamada	Contenido	Caracteres aprox.
1	diff + 3 archivos completos	~9.000
4	fase roja	~2.500
2	primer npm test + lint	~1.500
5	restauración + verificación	~1.000
3	buscar el test que fallaba	~800
Total aproximado: ~15.000. La llamada 1 sola es más de la mitad.

**5.2** ¿Había lecturas que se podían evitar? Por ejemplo: ¿leyó `data/sesiones.json` entero para entender el formato, en lugar de `shared/types.ts`?

No leyo data/sesiones.json. Lo que se podía evitar:
El cat completo de server/services/sesiones.ts, porque el diff ya mostraba la parte que cambió.
El cat completo del test de dominio: para el plan alcanzaba con grep "it(".
La segunda corrida de npm test.

### 6. Hooks como control

Lo pondría en PreToolUse con matcher Edit|Write: lee el file_path del JSON que llega por stdin y, si está en data/, sale con código 2 para bloquear la acción. Una idea de cómo quedaría en .claude/settings.json:
{ "hooks": { "PreToolUse": [{ "matcher": "Edit|Write",
  "hooks": [{ "type": "command", "command": "node .claude/hooks/proteger-data.mjs" }] }] } }
El límite: esta sesión muestra por qué no alcanza. Mis escrituras fueron por Bash (>, sed -i, cp) y ese hook no las habría visto. Habría que sumar el matcher Bash y analizar el comando, lo cual es frágil. Por eso conviene combinarlo con un permiso deny sobre data/.
Imports prohibidos en server/domain/: un PreToolUse sobre Edit|Write que revise el contenido nuevo buscando from "fs", "node:fs" o "express". Más robusto todavía: una regla no-restricted-imports en ESLint y un hook PostToolUse que corra lint sobre el archivo.

### 7. Riesgos

Ejecución arbitraria: los hooks corren con tus permisos. Si vienen en el repo, clonarlo y abrir el agente ya los ejecuta, y eso es un vector de supply chain.
Falsa seguridad: se esquivan por otra vía, como Bash en lugar de Edit (ver punto 6).
Tiempo: corren en cada llamada a una herramienta. Un hook lento o que hace requests multiplica la latencia, y sin timeout puede colgar la sesión.
Loops: un Stop hook que obliga a seguir, o uno que siempre bloquea, deja al agente reintentando y gastando tokens.
Fuga de datos: si un hook manda el input o el output de las herramientas por red, saca código y secretos del equipo.
Logs: guardan salidas completas, que pueden incluir secretos o datos personales. Crecen sin límite, y dos sesiones en paralelo pueden escribir el mismo archivo y pisarse.
Contexto: lo que imprime un hook vuelve al modelo. Cuesta tokens y es un canal de prompt injection.
Portabilidad: scripts de bash que no andan en Windows/PowerShell, como en este entorno. Si un hook falla, puede bloquear todo el trabajo.

## Para cerrar

**Modelo:** Opus 5.5

**Agente:** Claude
