import { cpSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import type { Mentora, Sesion } from "@shared/types"
import request from "supertest"
import { createApp } from "../../../server/app"

/** "Ahora" fijo para los tests: domingo 18/10/2026 al mediodía. */
export const AHORA = new Date(2026, 9, 18, 12, 0)

// IDs de data/ usados en los tests.
export const VALENTINA = "8f3c2a1e-4b5d-4c6e-9f70-1a2b3c4d5e01" // lunes y miércoles 18 a 21 · react, testing, accesibilidad
export const ROCIO = "8f3c2a1e-4b5d-4c6e-9f70-1a2b3c4d5e06" // sin disponibilidad
export const HUERTA_VIVA = "c0e1a2b3-0000-4000-8000-000000000001"

/**
 * Crea la app sobre una copia temporal de data/ (Principio I: los tests nunca
 * escriben en data/). `sesiones` reemplaza el contenido de sesiones.json.
 */
export function crearAppDePrueba(sesiones: Sesion[] = [], extra: Partial<Parameters<typeof createApp>[0]> = {}) {
  const dataDir = mkdtempSync(join(tmpdir(), "mentorias-"))
  cpSync(join(process.cwd(), "data"), dataDir, { recursive: true })
  writeFileSync(join(dataDir, "sesiones.json"), JSON.stringify(sesiones), "utf-8")
  const app = createApp({ dataDir, reloj: () => AHORA, ...extra })
  return { app, api: request(app), dataDir }
}

/**
 * Como `crearAppDePrueba`, pero fija el cupo mensual de las mentoras indicadas
 * en la copia temporal de `mentoras.json` (nunca en `data/`).
 */
export function crearAppConCupo(cupos: Record<string, unknown>, sesiones: Sesion[] = []) {
  const prueba = crearAppDePrueba(sesiones)
  const archivo = join(prueba.dataDir, "mentoras.json")
  const mentoras = JSON.parse(readFileSync(archivo, "utf-8")) as Mentora[]
  const conCupo = mentoras.map((m) => (m.id in cupos ? { ...m, cupoMensualHoras: cupos[m.id] } : m))
  writeFileSync(archivo, JSON.stringify(conCupo), "utf-8")
  return prueba
}

export function sesionDePrueba(extra: Partial<Sesion> = {}): Sesion {
  return {
    id: "00000000-0000-4000-8000-000000000001",
    mentoraId: VALENTINA,
    tipoAsesoriaId: "revision_de_codigo",
    colectivoId: HUERTA_VIVA,
    proyecto: "Revisar el formulario de inscripción",
    contactoNombre: "Ana",
    contactoEmail: "ana@example.org",
    fecha: "2026-10-19",
    horaInicio: "18:00",
    horaFin: "18:30",
    estado: "confirmada",
    ...extra,
  }
}
