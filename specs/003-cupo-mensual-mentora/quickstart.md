# Quickstart: Cupo mensual de horas por mentora

1. `npm run seed` y `npm run dev`.
2. En `data/mentoras.json`, agregá `"cupoMensualHoras": 2` a una mentora (ej. Valentina).
3. Abrí http://localhost:5173: su tarjeta dice "Le quedan 2 h este mes".
4. Reservá dos asesorías de 60 min en el mes: la tarjeta pasa a "Sin cupo este mes" y la
   disponibilidad de ese mes queda vacía.
5. `POST /api/sesiones` con una reserva que excede el cupo → `409`.
6. Una mentora sin `cupoMensualHoras` no muestra texto de cupo y no tiene límite.
7. `npm test && npm run lint && npm run typecheck`.
