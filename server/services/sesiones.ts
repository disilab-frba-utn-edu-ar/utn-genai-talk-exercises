import { randomUUID } from "node:crypto"
import type { Sesion, SesionPublica } from "@shared/types"
import { aHora, aMinutos, fechaDe } from "../domain/fechas"
import { estaDentroDeDisponibilidad } from "../domain/horarios"
import { puedeDar } from "../domain/mentoras"
import { haySuperposicion } from "../domain/superposicion"
import { validarNuevaSesion } from "../domain/validaciones"
import type { Repositorios } from "../repositories"
import { conflicto, invalido, noEncontrado } from "./errores"

/** Vista pública de una sesión: sin los datos de contacto del colectivo (Principio IV). */
function aSesionPublica(sesion: Sesion): SesionPublica {
  // Campo por campo: un dato privado que se agregue a Sesion no se filtra solo.
  return {
    id: sesion.id,
    mentoraId: sesion.mentoraId,
    tipoAsesoriaId: sesion.tipoAsesoriaId,
    colectivoId: sesion.colectivoId,
    proyecto: sesion.proyecto,
    fecha: sesion.fecha,
    horaInicio: sesion.horaInicio,
    horaFin: sesion.horaFin,
    estado: sesion.estado,
  }
}

export function crearServicioSesiones(repos: Repositorios, reloj: () => Date) {
  return {
    listar(filtros: { mentoraId?: string; fecha?: string }): SesionPublica[] {
      return repos.sesiones
        .listar()
        .filter((s) => !filtros.mentoraId || s.mentoraId === filtros.mentoraId)
        .filter((s) => !filtros.fecha || s.fecha === filtros.fecha)
        .map(aSesionPublica)
    },

    obtener(id: string): SesionPublica {
      const sesion = repos.sesiones.buscar(id)
      if (!sesion) throw noEncontrado("La sesión no existe")
      return aSesionPublica(sesion)
    },

    crear(datos: unknown): Sesion {
      const validacion = validarNuevaSesion(datos)
      if (!validacion.ok) throw invalido(validacion.error)
      const nueva = validacion.valor

      const mentora = repos.mentoras.buscar(nueva.mentoraId)
      if (!mentora) throw noEncontrado("La mentora no existe")
      const tipo = repos.tiposAsesoria.buscar(nueva.tipoAsesoriaId)
      if (!tipo) throw noEncontrado("El tipo de asesoría no existe")
      if (!repos.colectivos.buscar(nueva.colectivoId)) throw noEncontrado("El colectivo no existe")
      if (!puedeDar(mentora, tipo)) throw invalido("La mentora no ofrece ese tipo de asesoría")

      const ahora = reloj()
      const hoy = fechaDe(ahora)
      const minutosAhora = ahora.getHours() * 60 + ahora.getMinutes()
      if (nueva.fecha < hoy || (nueva.fecha === hoy && aMinutos(nueva.horaInicio) <= minutosAhora)) {
        throw invalido("No se puede reservar una sesión en el pasado")
      }

      const horaFin = aHora(aMinutos(nueva.horaInicio) + tipo.duracionMinutos)
      if (!estaDentroDeDisponibilidad(mentora.disponibilidad, nueva.fecha, nueva.horaInicio, horaFin)) {
        throw invalido("El horario está fuera de la disponibilidad de la mentora")
      }

      if (haySuperposicion(repos.sesiones.listar(), { ...nueva, horaFin })) {
        throw conflicto("El horario se superpone con otra sesión de la mentora")
      }

      const sesion: Sesion = { id: randomUUID(), ...nueva, horaFin, estado: "confirmada" }
      repos.sesiones.agregar(sesion)
      return sesion
    },
  }
}
