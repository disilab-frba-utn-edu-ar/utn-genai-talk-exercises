import { Link, useSearchParams } from "react-router"
import { api } from "../api/client"
import Chip from "../components/Chip"
import { Cargando, ErrorCarga, Vacio } from "../components/Estado"
import MentoraCard from "../components/MentoraCard"
import { useCarga } from "../hooks/useCarga"

export default function InicioPage() {
  const [params, setParams] = useSearchParams()
  const habilidad = params.get("habilidad") ?? ""

  const habilidades = useCarga("habilidades", api.habilidades)
  const mentoras = useCarga(`mentoras:${habilidad}`, () => api.mentoras(habilidad || undefined))

  const filtrar = (id: string) => setParams(id && id !== habilidad ? { habilidad: id } : {})

  return (
    <>
      <section className="portada portada-con-vineta">
        <div>
          <p className="sobretitulo prompt">Para colectivos</p>
          <h1>
            Encontrá a alguien que te ayude a <span className="acento">destrabar</span> tu proyecto
          </h1>
          <p className="bajada">
            Personas con experiencia en desarrollo donan horas de mentoría. Elegí según lo que necesitás y reservá una
            sesión gratuita.
          </p>
        </div>
        {/* Ilustración: cuenta en una viñeta de qué se trata la app. Decorativa, el texto de al lado ya lo dice. */}
        <div className="vineta" aria-hidden="true">
          <p className="globo">
            <span className="globo-quien">Colectivo</span>
            Nuestra API creció sin orden y ya no sabemos dónde tocar…
          </p>
          <p className="globo globo-respuesta">
            <span className="globo-quien">Mentora</span>
            ¡Charlemos de capas! En una hora lo ordenamos.
          </p>
        </div>
      </section>

      <p className="atajo-por-tipo">
        ¿No sabés a quién elegir?{" "}
        <Link to="/reservar-por-tipo" className="boton boton-secundario">
          Reservá por tipo de asesoría <span aria-hidden="true">→</span>
        </Link>
      </p>

      {habilidades.estado === "lista" && (
        <section className="filtros" aria-label="Filtrar por habilidad">
          <div className="chips">
            <Chip activo={!habilidad} onClick={() => filtrar("")}>
              Todas
            </Chip>
            {habilidades.datos.map((h) => (
              <Chip key={h.id} activo={habilidad === h.id} onClick={() => filtrar(h.id)}>
                {h.titulo}
              </Chip>
            ))}
          </div>
        </section>
      )}

      {mentoras.estado === "cargando" && <Cargando texto="Buscando mentoras…" />}
      {mentoras.estado === "error" && <ErrorCarga mensaje={mentoras.error} onReintentar={mentoras.recargar} />}
      {mentoras.estado === "lista" && mentoras.datos.length === 0 && (
        <Vacio titulo="Ninguna mentora tiene esa habilidad todavía">
          <button type="button" className="boton boton-secundario" onClick={() => filtrar("")}>
            Ver todas las mentoras
          </button>
        </Vacio>
      )}
      {mentoras.estado === "lista" && mentoras.datos.length > 0 && (
        <section className="grilla" aria-label="Mentoras">
          {mentoras.datos.map((mentora) => (
            <MentoraCard
              key={mentora.id}
              mentora={mentora}
              habilidades={habilidades.estado === "lista" ? habilidades.datos : []}
            />
          ))}
        </section>
      )}
    </>
  )
}
