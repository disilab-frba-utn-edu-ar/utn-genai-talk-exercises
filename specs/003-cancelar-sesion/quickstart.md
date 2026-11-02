# Quickstart: Cancelar una sesión reservada

## Automático

```bash
npm test          # domain, api y client
npm run lint
npm run typecheck
```

Tests clave:

- `tests/server/domain/cancelacion.test.ts`: exactamente 24 h → permitida; 24 h − 1 ms →
  `fuera_de_plazo`; inicio = ahora → `ya_ocurrio`; cancelada → `ya_cancelada`; el resultado
  no cambia con la zona horaria del proceso.
- `tests/server/api/sesiones.test.ts`: GET con `cancelacion`; PATCH 200/400/404/409; el
  horario vuelve a ofrecerse; el listado no expone `id` ni el motivo.
- `tests/client/SesionPage.test.tsx` y `tests/client/ReservaPage.test.tsx`: detalle,
  copiar enlace, cancelar con y sin motivo, mensajes de rechazo, redirección después de reservar.

## Manual (`npm run dev` → http://localhost:5173)

1. Reservar una sesión para dentro de 2 días o más. Se llega a `/sesiones/<id>` con
   "¡Sesión confirmada!", el enlace, el botón **Copiar enlace** y el aviso de guardarlo.
2. Recargar la página: se sigue viendo el detalle (sin el título de recién reservada).
3. **Cancelar sesión** → escribir un motivo → **Confirmar cancelación**. El estado pasa a
   "Cancelada", con el motivo y la fecha de cancelación.
4. Volver a la mentora, mismo tipo y día: el horario vuelve a ofrecerse.
5. Reservar una sesión para hoy o mañana a menos de 24 h: la página no ofrece cancelar y
   explica el plazo.
6. Abrir `/sesiones/no-existe`: "sesión no encontrada" con enlace al inicio.
7. Repetir 1–3 con teclado solo y con la ventana en 375 px.

Al reservar y cancelar en dev, la app escribe en `data/sesiones.json` (es lo esperable).
Al terminar, `npm run seed` regenera los datos de prueba: crea sesiones nuevas a partir de
hoy, no restaura las que había. Nadie edita `data/` a mano y los tests nunca escriben ahí.
