# Quickstart: Reservar por tipo de asesoría

## Levantar

```bash
npm install
npm run seed   # opcional: regenera data/sesiones.json con fechas relativas a hoy
npm run dev    # API en :3001 · web en http://localhost:5173
```

## Probar a mano

1. Abrir http://localhost:5173 y usar el enlace "¿No sabés a quién elegir? Reservá por
   tipo de asesoría".
2. Elegir "Revisión de código", un día y un horario.
3. Comprobar que aparece la mentora asignada (nombre, pronombres, presentación) y que no
   se ve ningún email de mentora.
4. Completar los datos y confirmar: la confirmación muestra esa mentora.
5. Volver al mismo día: si esa mentora era la única libre en ese horario, el horario ya no
   aparece.

## Probar la API

```bash
curl "http://localhost:3001/api/tipos-asesoria/revision_de_codigo/disponibilidad"
curl "http://localhost:3001/api/tipos-asesoria/revision_de_codigo/asignacion?fecha=2026-11-02&horaInicio=18:00"
```

## Conflicto al confirmar

Con dos pestañas en el mismo horario y la misma mentora asignada, confirmar en la
primera y después en la segunda: la segunda muestra la nueva mentora asignada (si queda
alguna libre) y pide confirmar de nuevo, o avisa que el horario ya no está disponible.

## Verificar

```bash
npm test && npm run lint && npm run typecheck
```
