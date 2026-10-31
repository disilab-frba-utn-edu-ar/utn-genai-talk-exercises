# Propuesta: la consigna por etapas

Maqueta navegable: [`index.html`](./index.html). Se genera desde las consignas de `main`, así que muestra
el mismo texto, el mismo markdown, los mismos diagramas y el mismo CSS que el visor:

```bash
node --experimental-strip-types ejercicios/propuestas/ejercicios-1-2/generar.mjs
```

- `generar.mjs`: lee `ejercicios/0X-*/ejercicio.json`, corta cada consigna en pantallas (la tabla
  `ETAPAS`, con cortes por líneas exactas) y arma las preguntas con una caja por sub-pregunta.
- `plantilla.html`: la página. Lleva el CSS del visor (`client/src/styles.css` y
  `ejercicios/app/ejercicios.css`) y la navegación.

## Cómo funciona

- Cuatro secciones: **Contexto técnico**, **Contexto del ejercicio**, **Qué tenés que hacer** y **Preguntas**.
- Las tres primeras se desbloquean en orden. Cada una está partida en pantallas cortas que entran en un
  marco de alto fijo; se pasa con **Anterior / Siguiente** (o con las flechas del teclado).
- **Preguntas** está siempre abierta y es la única sección con scroll. Cada sub-pregunta tiene su caja
  y cada pregunta muestra su avance (por ejemplo, 1/3).
- Los paneles "Probar la API" y "Consultar sesiones" son los de `ProbarApi.tsx`, con respuestas
  simuladas. En "Probar la app modificada" se repite el panel, con la segunda llamada dando 409.

## Para decidir

- Qué preguntas o secciones de preguntas sacamos (hoy: 24 cajas obligatorias en el ejercicio 1 y 25 en el 2).
- Si la propuesta va al visor real: habría que llevar `ETAPAS` al JSON de cada ejercicio y reemplazar la
  página de la consigna por este recorrido.
