#!/usr/bin/env node
// Genera data/sesiones.json con sesiones de ejemplo en los próximos días.
//
//   npm run seed                         → regenera el archivo (pisa lo que haya)
//   node scripts/seed.mjs --si-falta     → solo lo crea si no existe (lo usa `npm run dev`)
//
// Las fechas son relativas a hoy para que la agenda nunca quede en el pasado.

import { randomUUID } from "node:crypto"
import { existsSync, readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"

const dataDir = process.env.DATA_DIR ?? join(process.cwd(), "data")
const destino = join(dataDir, "sesiones.json")

if (process.argv.includes("--si-falta") && existsSync(destino)) process.exit(0)

const leer = (archivo) => JSON.parse(readFileSync(join(dataDir, archivo), "utf-8"))
const mentoras = leer("mentoras.json")
const tipos = leer("tipos-asesoria.json")
const colectivos = leer("colectivos.json")

const DIAS = ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"]
const PROYECTOS = [
  "Formulario de inscripción a la huerta comunitaria",
  "Catálogo online de la biblioteca popular",
  "Sistema de turnos para el comedor del barrio",
  "Mapa de puntos de reciclaje",
]

const pad = (n) => String(n).padStart(2, "0")
const aFecha = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const aMinutos = (hora) => {
  const [h, m] = hora.split(":").map(Number)
  return h * 60 + m
}
const aHora = (minutos) => `${pad(Math.floor(minutos / 60))}:${pad(minutos % 60)}`

const sesiones = []
let i = 0

for (const mentora of mentoras) {
  const tipo = tipos.find((t) => t.habilidades.some((h) => mentora.habilidades.includes(h)))
  if (!tipo) continue

  let diasConSesion = 0
  for (let offset = 1; offset <= 10 && diasConSesion < 3; offset++) {
    const dia = new Date()
    dia.setDate(dia.getDate() + offset)
    const rango = mentora.disponibilidad[DIAS[dia.getDay()]]
    if (!rango) continue

    // Una sesión por día disponible, al principio del rango, en días alternos.
    if (offset % 2 === 0) continue
    const inicio = aMinutos(rango.inicio)
    const colectivo = colectivos[i % colectivos.length]

    sesiones.push({
      id: randomUUID(),
      mentoraId: mentora.id,
      tipoAsesoriaId: tipo.id,
      colectivoId: colectivo.id,
      proyecto: PROYECTOS[i % PROYECTOS.length],
      contactoNombre: "Equipo de " + colectivo.nombre,
      contactoEmail: `contacto${i + 1}@example.org`,
      fecha: aFecha(dia),
      horaInicio: aHora(inicio),
      horaFin: aHora(inicio + tipo.duracionMinutos),
      estado: "confirmada",
    })
    diasConSesion++
    i++
  }
}

writeFileSync(destino, JSON.stringify(sesiones, null, 2) + "\n", "utf-8")
console.log(`[seed] ${sesiones.length} sesiones de ejemplo en ${destino}`)
