# Data Model: Cupo mensual de horas por mentora

Tipos en `shared/types.ts`. No hay archivos nuevos en `data/`.

## Mentora — `mentoras.json` (cambia)

| Campo | Tipo | Notas |
|---|---|---|
| cupoMensualHoras | number? | horas por mes calendario; `>= 0`, admite fracciones (1,5). Ausente = sin límite. `0` = nunca ofrece horarios. **Privado**: no sale por la API |

## MentoraPublica (cambia)

Todos los campos de `Mentora` menos `contacto` y `cupoMensualHoras`, más:

| Campo | Tipo | Notas |
|---|---|---|
| tiposAsesoria | string[] | ya existía |
| horasRestantes | number? | horas que le quedan en el mes de la consulta. Ausente si no tiene cupo definido. `0` = "Sin cupo este mes" |

## Derivados (no se persisten)

- **Minutos consumidos(mentora, mes)** = suma de `horaFin - horaInicio` de las sesiones `confirmada`
  de la mentora con `fecha` en ese mes.
- **Minutos restantes(mentora, mes)** = `max(0, cupoMensualHoras * 60 - consumidos)`; `undefined` si no hay cupo.
- Una asesoría de `d` minutos **entra** si `restantes === undefined` o `d <= restantes`.

## Validaciones

- `cupoMensualHoras` debe ser un número finito `>= 0`. Como se carga a mano en `data/`, el
  repositorio no lo valida: el dominio trata cualquier valor no válido (negativo, `NaN`, no numérico)
  como "sin cupo definido" para no romper la lectura, y un test lo fija.

## Transiciones

- `Sesion.estado`: `confirmada → cancelada` libera las horas del mes de su `fecha`. Sin otros cambios.
