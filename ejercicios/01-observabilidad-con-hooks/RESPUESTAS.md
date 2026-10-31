# Ejercicio 1 — Respuestas

**Nombre:** _Sin completar en Mi perfil._
**¿Intervinieron durante la tarea?** _Sin completar en Mi perfil._

## Parte A — Lo que pasó

### 1. El ciclo

**1.1** ¿Cuántas llamadas a herramientas hizo el agente en total?

Herramientas usadas:
    25  run_commands
    18  editor
    16  read_files

**1.2** ¿Qué herramienta usó más?

Lo que mas uso fue run_commands

### 2. Explorar antes de actuar

**2.1** ¿Cuántas herramientas usó **antes** de su primera edición de archivo?

//services//sesion…
       + 343s  ejecutar           npm run typecheck
       + 347s  ejecutar           npm run lint
       + 353s  ejecutar           npm run dev
       + 384s  ejecutar           node server/index.js 2>&1
       + 386s  ejecutar           tsx server/index.ts
       + 388s  ejecutar           node_modules/.bin/tsx server/index.ts

estos son los primeros que ejecuto por la cantidad de segundos, y en el log primero que armamos dio que uso 3 herramientas.

**2.2** ¿Qué archivos leyó?

Archivos leídos:
     6  server/services/sesiones.ts
     2  tests/server/domain/fechas.test.ts
     2  tests/server/api/sesiones.test.ts
     2  tests/server/api/helpers.ts
     1  .specify/memory/constitution.md
     1  server/domain
     1  tests
     1  server/services
     1  server/domain/fechas.ts
     1  server/domain/horarios.ts
     1  server/domain/mentoras.ts
     1  server/domain/validaciones.ts
     1  server/routes/sesiones.ts
     1  shared/types.ts
     1  tests/server/domain/superposicion.test.ts
     1  data/mentoras.json

**2.3** ¿Leyó la constitution que menciona el prompt?

Si, lo leyo.

### 3. Comandos de terminal

**3.1** Listá todos los comandos que ejecutó.

$ ls -la C:\Users\Alumno\Desktop\Practica_Shih_Tropeano_DISILAB\utn-genai-talk-exercises\server\domain\
  $ ["Get-ChildItem -Path 'C:\Users\Alumno\Desktop\Practica_Shih_Tropeano_DISILAB\utn-genai-talk-exercises\server\domain\'"]  
  $ dir C:\Users\Alumno\Desktop\Practica_Shih_Tropeano_DISILAB\utn-genai-talk-exercises\server\domain
  $ dir C:\Users\Alumno\Desktop\Practica_Shih_Tropeano_DISILAB\utn-genai-talk-exercises\tests\server
  $ dir C:\Users\Alumno\Desktop\Practica_Shih_Tropeano_DISILAB\utn-genai-talk-exercises\tests\server\domain
  $ dir C:\Users\Alumno\Desktop\Practica_Shih_Tropeano_DISILAB\utn-genai-talk-exercises\tests\server\api
  $ dir C:\Users\Alumno\Desktop\Practica_Shih_Tropeano_DISILAB\utn-genai-talk-exercises\server\services
  $ dir C:\Users\Alumno\Desktop\Practica_Shih_Tropeano_DISILAB\utn-genai-talk-exercises\server\routes
  $ dir C:\Users\Alumno\Desktop\Practica_Shih_Tropeano_DISILAB\utn-genai-talk-exercises\shared
  $ npm test -- --run tests/server/domain/superposicion.test.ts
  $ npm test -- --run tests/server/domain/superposicion.test.ts
  $ npm test -- --run tests/server/domain/superposicion.test.ts
  $ npm test -- --run tests/server/domain/superposicion.test.ts
  $ npm test -- --run tests/server/domain/superposicion.test.ts
  $ npm test -- --run tests/server/api/sesiones.test.ts
  $ ["node -e " "const { crearAppDePrueba } = require('./tests/server/api/helpers'); const { sesionDePrueba } = require('./tests/server/api/help…
  $ ["powershell -Command \"\$npm_test = npm test -- --run 'tests/server/api/sesiones.test.ts\$tests/server/api/sesiones.test.ts 409 si hay una …
  $ ["powershell -Command \"(Get-Content 'C:\Users\Alumno\Desktop\Practica_Shih_Tropeano_DISILAB\utn-genai-talk-exercises\tests\server\api\helpe…
  $ dir C:\Users\Alumno\Desktop\Practica_Shih_Tropeano_DISILAB\utn-genai-talk-exercises\data
  $ ["powershell -Command \"(Get-Content 'C:\Users\Alumno\Desktop\Practica_Shih_Tropeano_DISILAB\utn-genai-talk-exercises\tests\server\api\helpe…
  $ npm test -- --run tests/server/api/sesiones.test.ts
  $ npm test -- --run tests/server/api/sesiones.test.ts
  $ {"commands":"[\"powershell -Command \"\n\" Set-Content -Path 'C:\\Users\\Alumno\\Desktop\\Practica_Shih_Tropeano_DISILAB\\utn-genai-talk-exe…
  $ cat C:\Users\Alumno\Desktop\Practica_Shih_Tropeano_DISILAB\utn-genai-talk-exercises\server\services\sesiones.ts | head -60
  $ ["powershell -Command \"Get-Content -Path 'C:\\Users\\Alumno\\Desktop\\Practica_Shih_Tropeano_DISILAB\\utn-genai-talk-exercises\\server\\ser…

**3.2** ¿Alguno no lo pediste vos? ¿Alguno te generó dudas al aprobarlo?

Algunos no fueron pedidos, y algunos generaron dudas, pero las justificaciones de Cline para utilizarlos nos llamaban a que le demos permiso.

**3.3** Clasificá cada uno con el semáforo de la charla: verde (lectura), amarillo (validación local) o rojo (escritura o producción).

$ ls -la C:\Users\Alumno\Desktop\Practica_Shih_Tropeano_DISILAB\utn-genai-talk-exercises\server\domain\
  $ ["Get-ChildItem -Path 'C:\Users\Alumno\Desktop\Practica_Shih_Tropeano_DISILAB\utn-genai-talk-exercises\server\domain\'"]  
  $ dir C:\Users\Alumno\Desktop\Practica_Shih_Tropeano_DISILAB\utn-genai-talk-exercises\server\domain
  $ dir C:\Users\Alumno\Desktop\Practica_Shih_Tropeano_DISILAB\utn-genai-talk-exercises\tests\server
  $ dir C:\Users\Alumno\Desktop\Practica_Shih_Tropeano_DISILAB\utn-genai-talk-exercises\tests\server\domain
  $ dir C:\Users\Alumno\Desktop\Practica_Shih_Tropeano_DISILAB\utn-genai-talk-exercises\tests\server\api
  $ dir C:\Users\Alumno\Desktop\Practica_Shih_Tropeano_DISILAB\utn-genai-talk-exercises\server\services
  $ dir C:\Users\Alumno\Desktop\Practica_Shih_Tropeano_DISILAB\utn-genai-talk-exercises\server\routes
  $ dir C:\Users\Alumno\Desktop\Practica_Shih_Tropeano_DISILAB\utn-genai-talk-exercises\shared
  $ npm test -- --run tests/server/domain/superposicion.test.ts
  $ npm test -- --run tests/server/domain/superposicion.test.ts
  $ npm test -- --run tests/server/domain/superposicion.test.ts
  $ npm test -- --run tests/server/domain/superposicion.test.ts
  $ npm test -- --run tests/server/domain/superposicion.test.ts
  $ npm test -- --run tests/server/api/sesiones.test.ts

los npm test son amarillo por la validación del programa
los comandos dir son verde por la lectura de cada carpeta para seguir trabajando.

### 4. Errores y reintentos

**4.1** ¿Alguna herramienta falló (`PostToolUseFailure` o un `output` con error)?

No, ninguna herramienta fallo. El unico fallo fue cuando cancelamos una peticion.

**4.2** ¿Qué hizo el agente después?

Siguio trabajando, busco otra alternativa y nos volvio a pedir verificación.

## Parte B — Lo que pensás

### 5. Contexto

**5.1** Sumá aproximadamente el tamaño de las salidas: ¿qué herramienta "llenó" más la ventana?

Salida que volvió al modelo (caracteres, por herramienta):
     72195  read_files
     46433  run_commands

la suma da: 118528 caracteres

**5.2** ¿Había lecturas que se podían evitar? Por ejemplo: ¿leyó `data/sesiones.json` entero para entender el formato, en lugar de `shared/types.ts`?

El agente leyo shared/types.ts, asi que se ahorro el leer todo el formato para entender que tenia que hacer o de que manera trabajar.

Archivos leídos:
     8  server/services/sesiones.ts
     1  server/index.ts
     1  server/config.ts
     1  server/app.ts
     1  server/repositories/index.ts
     1  server/repositories/json-store.ts
     1  shared/types.ts
     1  server/domain/mentoras.ts

### 6. Hooks como control

_Sin responder._

### 7. Riesgos

_Sin responder._

## Para cerrar

**Modelo:** Nemotron 3.5 Lighting Free (free) (medium)

**Agente:** Cline
