// Cómo se dibuja un tramo de la consigna: el markdown y, en el medio, los anexos (el prompt a copiar,
// los paneles para probar la API). Lo usan la consigna corrida y cada pantalla de la consigna por etapas.
import { conAnexosEnLinea, type Anexo } from "./contenido"
import Markdown from "./Markdown"
import ProbarApi from "./ProbarApi"
import { useTerminado } from "./progreso"

export function AnexoEnLinea({ anexo }: { anexo: Anexo }) {
  const habilitado = useTerminado(anexo.soloSiTerminado ?? "")
  if (anexo.soloSiTerminado && !habilitado) return null
  if (anexo.componente === "probar-api") return <ProbarApi />
  return (
    <aside id={anexo.archivo} className="anexo-en-linea" aria-label={anexo.titulo}>
      <Markdown texto={anexo.markdown.join("\n")} />
    </aside>
  )
}

/** Un tramo de la consigna, con los anexos en línea (el prompt aparece justo debajo de "Copiá el prompt…"). */
export default function Consigna({ lineas, anexos }: { lineas: string[]; anexos: Anexo[] }) {
  return conAnexosEnLinea(lineas, anexos).map((b, i) =>
    b.tipo === "markdown" ? <Markdown key={i} texto={b.texto} /> : <AnexoEnLinea key={i} anexo={b.anexo} />,
  )
}
