// Video de introducción de cada ejercicio, por id de carpeta: un vistazo a los pasos antes de leer la consigna.
// Los archivos se sirven desde client/public/videos/. Tienen música y efectos; se pueden pausar para leer con calma.
// La duración es la que muestra el reproductor (m:ss, redondeada hacia abajo).
export type VideoIntro = { src: string; poster: string; duracion: string; descripcion: string }

export const videosIntro: Record<string, VideoIntro> = {
  "01-observabilidad-con-hooks": {
    src: "/videos/01-observabilidad-con-hooks.mp4",
    poster: "/videos/01-observabilidad-con-hooks.jpg",
    duracion: "0:25",
    descripcion:
      "En 25 segundos: preparás el entorno, le das la tarea al agente, leés en el log cada paso que registran los hooks, probás la app modificada y respondés citando el log.",
  },
  "02-skill-y-mcp": {
    src: "/videos/02-skill-y-mcp.mp4",
    poster: "/videos/02-skill-y-mcp.jpg",
    duracion: "0:29",
    descripcion:
      "En 30 segundos: escribís la skill nuevo-endpoint, probás que se dispara sola, cuidás la privacidad del endpoint, conectás el navegador con Playwright MCP y mirás en el log lo que hizo.",
  },
  "03-sdd": {
    src: "/videos/03-sdd.mp4",
    poster: "/videos/03-sdd.jpg",
    duracion: "0:34",
    descripcion:
      "En 34 segundos: tomás una historia del tablero, preparás Spec Kit, recorrés las etapas revisando entre cada una, lo probás, respondés las preguntas del cierre y entregás.",
  },
}
