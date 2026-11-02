---
name: nuevo-endpoint
description: Agrega un endpoint nuevo a la API de Mentorías a Voluntad respetando la constitución (capa
s, contrato /api, dominio en español, privacidad, TDD con supertest). Usala cuando pidan crear, sumar o
 exponer una ruta, endpoint o recurso nuevo en server/.
argument-hint: "Descripción del endpoint (método, ruta, para qué sirve)"
user-invocable: true
disable-model-invocation: false
---

# Nuevo endpoint

## Pedido

```text
$ARGUMENTS
```

Leé `.specify/memory/constitution.md` antes de empezar. Los principios citados abajo (I a VI) son los d
e ese archivo.

## 1. Antes de escribir, preguntá

No escribas código hasta tener estas respuestas. Si el pedido no las contesta, hacé las preguntas en un
 solo mensaje y esperá:

1. **¿Quién lo consume?** ¿Una pantalla del client, la mentora o el colectivo?
2. **¿Qué pasa si falla?** ¿Qué errores puede devolver y qué tiene que ver quien lo llama?
3. **¿Qué valida?** Campos obligatorios, formatos, reglas de negocio y conflictos de estado.
4. **¿Devuelve algún dato personal?** Contacto de la mentora o datos de contacto del colectivo.

Con las respuestas, proponé método, ruta, cuerpo, respuesta y errores. Después seguí.

## 2. Dónde va cada cosa (principio II)

| Capa | Qué contiene |
|---|---|
| `server/routes/` | La ruta, solo HTTP: parsear, validar la forma y mapear errores a status. Sin regla
s de negocio. |
| `server/services/` | El caso de uso. Lanza `invalido`, `noEncontrado` o `conflicto` (`server/services
/errores.ts`). |
| `server/repositories/` | El acceso a los JSON de `data/`. |
| `server/domain/` | Las reglas puras, sin `fs` ni `express`. |
| `shared/types.ts` | Los tipos, compartidos entre client y server. |
| `client/src/api/` | La función de fetch, solo si una pantalla lo consume (principio VI). Ningún otro
archivo del client hace `fetch`. |

Si es un recurso nuevo, registrá el router en `server/app.ts` (`api.use("/<recurso>", ...)`), antes del
 404 final. Tomá como modelo `server/routes/mentoras.ts` y `server/services/mentoras.ts`.

## 3. Contrato de API (principio III)

- Todo va bajo `/api` y habla JSON.
- Los recursos van en plural y en kebab-case: `/api/tipos-asesoria`, `/api/sesiones/:id`.
- Los errores llevan el cuerpo `{ "error": "<mensaje en español>" }`:
  - **400**: validación.
  - **404**: el recurso no existe.
  - **409**: conflicto de estado.
- El manejador de errores de `server/app.ts` ya traduce `ErrorDeNegocio` a status y cuerpo. No armes re
spuestas de error a mano en la ruta.

## 4. Convenciones del dominio (principio V)

- Las entidades y los campos van en español: `mentoraId`, `horaInicio`, `estado`.
- Lo que crean los usuarios lleva un ID UUID v4 generado con `crypto.randomUUID()`.
- Las habilidades y los tipos de asesoría se identifican por su código en snake_case (`revision_de_codi
go`).

## 5. Privacidad (principio IV)

- El contacto de la mentora **no sale nunca**.
- Los datos de contacto del colectivo salen solo hacia quien corresponde.
- El servicio devuelve una **vista pública explícita**. Elegí los campos uno por uno y no hagas `{ ...s
esion }` ni `{ ...mentora }`: si mañana se agrega un campo privado a la entidad, no tiene que filtrarse
 solo.
- Tiene que haber un test que verifique que el dato privado no está en la respuesta. Ejemplo en `tests/
server/api/mentoras.test.ts`: `expect(JSON.stringify(res.body)).not.toContain("@example.org")`.

## 6. TDD con supertest (principio I)

1. **Primero el test.** Va en `tests/server/api/<recurso>.test.ts`. Si hay lógica nueva en `domain/`, s
umá también un test en `tests/server/domain/`.
2. **Miralo fallar.** Corré `npm test` y confirmá que falla por la razón esperada, no por un error de i
mport o de tipos.
3. **Después implementá**, de adentro hacia afuera: tipos, dominio, repositorio, servicio, ruta y, si h
ace falta, client.

Antes de escribir el test, mirá cómo lo hacen los tests existentes:

- `tests/server/api/helpers.ts`: `crearAppDePrueba()` arma la app de Express sin levantar el puerto, so
bre un `DATA_DIR` temporal copiado de `data/`, con el reloj fijo en `AHORA`. También exporta IDs de pru
eba (`VALENTINA`, `ROCIO`, `HUERTA_VIVA`) y `sesionDePrueba()`.
- `tests/server/api/mentoras.test.ts` y `tests/server/api/sesiones.test.ts`: muestran el estilo de los
casos, el 404 y el test de privacidad.

Los tests **nunca leen ni escriben en `data/`**. Usá siempre `crearAppDePrueba()`.

## 7. No cierres sin un caso borde ni sin validar

- Cubrí al menos un caso borde:
  - un id inexistente o mal formado, que tiene que dar **404** igual que `GET /api/mentoras/:id` (`{ er
ror: "La mentora no existe" }`);
  - o un campo faltante, que tiene que dar **400**.
- Antes de dar la tarea por terminada, corré los tres comandos y verificá que pasen:

```sh
npm test
npm run lint
npm run typecheck
```

Si alguno falla, arreglalo. No lo reportes como terminado.

## Checklist final

- [ ] Hice las 4 preguntas y tengo las respuestas.
- [ ] Cada pieza está en su capa y `domain/` no importa `fs` ni `express`.
- [ ] La ruta va bajo `/api`, en plural y kebab-case, y los errores son `{ error }` con 400, 404 o 409.
- [ ] Los campos están en español, los IDs nuevos usan `crypto.randomUUID()` y los códigos van en snake
_case.
- [ ] La vista pública elige los campos de forma explícita y hay un test de que no sale el dato privado
.
- [ ] El test se escribió primero y lo vi fallar.
- [ ] Hay al menos un caso borde (404 o 400).
- [ ] Pasan `npm test`, `npm run lint` y `npm run typecheck`.