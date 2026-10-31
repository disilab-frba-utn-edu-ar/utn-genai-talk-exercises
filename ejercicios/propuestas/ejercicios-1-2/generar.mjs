// Genera la maqueta de la consigna por etapas a partir de las consignas reales (ejercicios/0X-*/ejercicio.json),
// con el mismo markdown, los mismos diagramas y el mismo CSS que el visor. Así la propuesta no se desfasa de main.
//
//   node --experimental-strip-types ejercicios/propuestas/ejercicios-1-2/generar.mjs
//
// Escribe index.html al lado de este archivo.
import { readFileSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { Marked } from "marked"
import { diagramas } from "../../app/diagramas.ts"

const aca = dirname(fileURLToPath(import.meta.url))
const raiz = join(aca, "../../..")
const leer = (ruta) => readFileSync(join(raiz, ruta), "utf8")

/* ── Markdown: el mismo renderer que ejercicios/app/Markdown.tsx ── */
const escapar = (texto) => texto.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
const marked = new Marked({
  renderer: {
    code({ text, lang }) {
      const diagrama = lang ? diagramas[lang] : undefined
      if (diagrama) return diagrama
      const etiqueta = lang === "text" ? "Copiar prompt" : "Copiar"
      return `<div class="codigo"><button type="button" class="boton-copiar" data-copiar>${etiqueta}</button><pre><code>${escapar(text)}</code></pre></div>`
    },
    link({ href, title, tokens }) {
      const texto = this.parser.parseInline(tokens)
      if (/^https?:\/\//.test(href) || /^\/[a-z-]+$/.test(href)) {
        const clase = title === "boton" ? ' class="boton boton-enlace"' : ""
        return `<a href="${escapar(href)}"${clase} target="_blank" rel="noreferrer">${texto}</a>`
      }
      return `<span class="enlace-repo" title="${escapar(href)}">${texto}</span>`
    },
  },
})
const md = (lineas) => `<div class="markdown">${marked.parse(lineas.join("\n"), { async: false })}</div>`
const enLinea = (texto) => marked.parseInline(texto, { async: false })

/* ── Paneles de la API: el markup de ejercicios/app/ProbarApi.tsx, con respuestas simuladas ── */
const aMinutos = (h) => Number(h.slice(0, 2)) * 60 + Number(h.slice(3))
const aHora = (m) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`
const DESDE = aMinutos("18:30"), HASTA = aMinutos("20:30")
const enEscala = (i, f) => `left:${((i - DESDE) / (HASTA - DESDE)) * 100}%;width:${((f - i) / (HASTA - DESDE)) * 100}%`
const PEDIDOS = [
  { titulo: "Estrategia de testing (45 min) a las 19:00", tipoAsesoriaId: "estrategia_de_testing", horaInicio: "19:00", minutos: 45 },
  { titulo: "Revisión de código (30 min) a las 19:30", tipoAsesoriaId: "revision_de_codigo", horaInicio: "19:30", minutos: 30 },
]
const TURNOS = PEDIDOS.map((p) => ({ inicio: aMinutos(p.horaInicio), fin: aMinutos(p.horaInicio) + p.minutos }))
const CRUCE = { inicio: Math.max(...TURNOS.map((t) => t.inicio)), fin: Math.min(...TURNOS.map((t) => t.fin)) }
const FECHA = "2026-11-04"

const gantt = `<figure class="gantt" aria-label="Llamada 1 de 19:00 a 19:45, llamada 2 de 19:30 a 20:00: se pisan de 19:30 a 19:45.">
${TURNOS.map((t, i) => `<div class="gantt-fila" aria-hidden="true"><span class="gantt-etiqueta">Llamada ${i + 1}</span><div class="gantt-pista"><span class="gantt-barra" style="${enEscala(t.inicio, t.fin)}">${aHora(t.inicio)}–${aHora(t.fin)}</span><span class="gantt-cruce" style="${enEscala(CRUCE.inicio, CRUCE.fin)}"></span></div></div>`).join("")}
<div class="gantt-fila" aria-hidden="true"><span></span><div class="gantt-pista gantt-eje">${[0, 1, 2, 3, 4].map((k) => `<span style="left:${k * 25}%">${aHora(DESDE + k * 30)}</span>`).join("")}</div></div>
</figure>`

const pedido = (numero, titulo, metodo, ruta, respuesta, cuerpo) => `<div class="pedido">
<p class="pedido-titulo">Llamada ${numero}: ${escapar(titulo)}</p>
<div class="pedido-linea"><span class="pedido-metodo">${metodo}</span><input class="pedido-ruta" aria-label="Ruta de la llamada ${numero}" value="${escapar(ruta)}" spellcheck="false"><button type="button" class="boton" data-simular='${escapar(JSON.stringify(respuesta))}'>Enviar</button></div>
${cuerpo ? `<details class="pp-body"><summary class="pedido-etiqueta">Body</summary><textarea class="editor-respuestas pedido-cuerpo" spellcheck="false">${escapar(cuerpo)}</textarea></details>` : ""}
<div class="pp-respuesta"></div>
</div>`

const cuerpoDe = (p) => JSON.stringify({ mentoraId: "8f3c2a1e-4b5d-4c6e-9f70-1a2b3c4d5e01", tipoAsesoriaId: p.tipoAsesoriaId, colectivoId: "c0e1a2b3-0000-4000-8000-000000000001", proyecto: "Prueba de superposicion", contactoNombre: "Ana", contactoEmail: "ana@example.org", fecha: FECHA, horaInicio: p.horaInicio }, null, 2)
const sesion = (p, fin) => ({ id: "b1e5…", mentoraId: "8f3c2a1e-…", tipoAsesoriaId: p.tipoAsesoriaId, colectivoId: "c0e1a2b3-…", proyecto: "Prueba de superposicion", contactoNombre: "Ana", contactoEmail: "ana@example.org", fecha: FECHA, horaInicio: p.horaInicio, horaFin: fin, estado: "confirmada" })

function probarApi(arreglado) {
  const respuestas = [
    { estado: 201, cuerpo: sesion(PEDIDOS[0], "19:45") },
    arreglado ? { estado: 409, cuerpo: { error: "El horario se superpone con otra sesión de la mentora" } } : { estado: 201, cuerpo: sesion(PEDIDOS[1], "20:00") },
  ]
  return `<aside class="anexo-en-linea probar-api" aria-label="Probar la API">
<p class="pedido-nota">Las dos van a la misma mentora, el <strong>${FECHA}</strong> (el primer día con las 19:00 libre). Mandá la 1 y después la 2.</p>
${gantt}
<div class="pp-pedidos">${PEDIDOS.map((p, i) => pedido(i + 1, p.titulo, "POST", "/api/sesiones", respuestas[i], cuerpoDe(p))).join("")}</div>
<p class="pp-maqueta">Maqueta: las respuestas están simuladas${arreglado ? " como si el agente ya hubiera arreglado el bug" : ""}.</p>
</aside>`
}

const publica = { id: "3f9c…", mentoraId: "8f3c2a1e-…", tipoAsesoriaId: "revision_de_codigo", colectivoId: "c0e1a2b3-…", proyecto: "Huerta comunitaria", fecha: "2026-11-09", horaInicio: "18:00", horaFin: "18:30", estado: "confirmada" }
const consultarSesiones = `<aside class="anexo-en-linea probar-api" aria-label="Consultar sesiones"><div class="pp-pedidos">
${pedido(1, "Una sesión que existe", "GET", "/api/sesiones/3f9c…", { estado: 200, cuerpo: publica })}
${pedido(2, "Una sesión que no existe", "GET", "/api/sesiones/no-existe", { estado: 404, cuerpo: { error: "No existe la sesión" } })}
${pedido(3, "El listado que ya existía", "GET", "/api/sesiones", { estado: 200, cuerpo: [publica, "…"] })}</div>
<p class="pp-maqueta">Maqueta: las respuestas están simuladas como si el agente ya hubiera creado el endpoint.</p>
</aside>`

/* ── Consigna partida en pantallas ── */
function anexoHtml(anexo, opciones = {}) {
  if (anexo.componente === "probar-api") return probarApi(opciones.arreglado)
  if (anexo.componente === "consultar-sesiones") return consultarSesiones
  return `<aside class="anexo-en-linea" aria-label="${escapar(anexo.titulo)}">${md(anexo.markdown)}</aside>`
}

/** Las líneas entre `desde` (incluida) y `hasta` (excluida), con los anexos en línea donde dice el JSON. */
function tramo(ejercicio, desde, hasta) {
  const c = ejercicio.consigna
  const i = c.indexOf(desde)
  const f = hasta ? c.indexOf(hasta, i + 1) : c.length
  if (i < 0 || f < 0) throw new Error(`${ejercicio.titulo}: no encontré «${i < 0 ? desde : hasta}»`)
  const lineas = c.slice(i, f)
  let html = "", buffer = []
  for (const linea of lineas) {
    buffer.push(linea)
    const anexo = ejercicio.anexos.find((a) => a.insertarDespuesDe === linea)
    if (anexo) { html += md(buffer) + anexoHtml(anexo); buffer = [] }
  }
  return html + md(buffer)
}

function pantalla(ejercicio, p) {
  let html = p.anexo ? anexoHtml(ejercicio.anexos.find((a) => a.titulo === p.anexo)) : tramo(ejercicio, p.desde, p.hasta)
  if (p.agregar === "probar-api-arreglado") html += probarApi(true)
  return { titulo: p.titulo, html }
}

/* ── Preguntas: una caja por cada sub-pregunta ── */
function preguntas(ejercicio) {
  const partes = []
  let parte = null, pregunta = null, sub = null, n = 0
  const cerrar = () => { sub = null }
  for (const { desde, hasta } of ejercicio.preguntas) {
    const c = ejercicio.consigna
    const i = c.indexOf(desde)
    const lineas = c.slice(i, hasta ? c.indexOf(hasta, i + 1) : c.length)
    for (const linea of lineas) {
      let m
      if ((m = linea.match(/^#{2,3} (.+)$/))) {
        if (/^Paso \d/.test(m[1])) continue
        parte = { nombre: m[1].replace(/^Parte [A-Z] — /, "").replace(/^Preguntas? sobre /, ""), preguntas: [] }
        parte.nombre = parte.nombre[0].toUpperCase() + parte.nombre.slice(1)
        partes.push(parte); pregunta = null; cerrar(); continue
      }
      if ((m = linea.match(/^(\d+)\. \*\*(.+?)\*\*\s*(.*)$/))) {
        if (!parte) { parte = { nombre: "Preguntas", preguntas: [] }; partes.push(parte) }
        n = Number(m[1])
        pregunta = { n, titulo: m[2].replace(/\.$/, ""), intro: m[3], subs: [], pista: "" }
        parte.preguntas.push(pregunta); cerrar(); continue
      }
      if (!pregunta) continue
      if ((m = linea.match(/^\s+- (.*)$/))) { sub = { texto: m[1] }; pregunta.subs.push(sub); continue }
      if ((m = linea.match(/^\s+> ?(.*)$/))) { pregunta.pista += (pregunta.pista ? " " : "") + m[1]; cerrar(); continue }
      if (/^\s+\S/.test(linea)) {
        if (sub) sub.texto += " " + linea.trim()
        else pregunta.intro += " " + linea.trim()
      }
    }
  }
  return partes.map((p) => ({
    nombre: p.nombre,
    preguntas: p.preguntas.map((q) => ({
      n: q.n,
      titulo: enLinea(q.titulo),
      opcional: /opcional|si la hiciste/i.test(q.intro + p.nombre),
      intro: q.intro.trim() ? enLinea(q.intro.trim()) : "",
      pista: q.pista ? enLinea(q.pista.trim()) : "",
      subs: (q.subs.length ? q.subs.map((s) => s.texto) : [q.intro.trim()]).map(enLinea),
    })),
  }))
}

/* ── Qué pantalla va en cada etapa: cortes por líneas exactas de cada consigna ── */
const ETAPAS = {
  "01-observabilidad-con-hooks": [
    { nombre: "Contexto técnico", bajada: "Qué es un hook, cómo está configurado tu agente y cómo comprobar que el log graba.", pantallas: [
      { titulo: "Qué es un hook", desde: "## Qué es un hook", hasta: "Acá todos los hooks llaman al mismo script," },
      { titulo: "Cómo está configurado cada agente", desde: "Acá todos los hooks llaman al mismo script,", hasta: "## Antes de empezar" },
      { titulo: "Activá los hooks", desde: "Después, activá los hooks según tu agente:", hasta: "### Verificá que funciona" },
      { titulo: "Verificá que funciona", desde: "### Verificá que funciona", hasta: "## Paso 1 — Darle la tarea al agente" },
    ] },
    { nombre: "Contexto del ejercicio", bajada: "Qué vas a observar, la regla que el agente tiene que respetar y el bug que va a arreglar.", pantallas: [
      { titulo: "Objetivo", desde: "## Objetivo", hasta: "## Qué es un hook" },
      { titulo: "La constitution", desde: "## Antes de empezar", hasta: "Después, activá los hooks según tu agente:" },
      { titulo: "Mirá el bug", desde: "### Antes: mirá el bug con tus propios ojos", hasta: "### Ahora sí: el pedido" },
    ] },
    { nombre: "Qué tenés que hacer", bajada: "Pasarle el prompt al agente, leer el log y probar el arreglo.", pantallas: [
      { titulo: "El pedido", desde: "### Ahora sí: el pedido", hasta: "3. Dejalo trabajar. Aprobá o rechazá los permisos que pida **leyendo qué" },
      { titulo: "Mientras trabaja", desde: "3. Dejalo trabajar. Aprobá o rechazá los permisos que pida **leyendo qué", hasta: "## Paso 2 — Leer los logs" },
      { titulo: "Leer los logs", desde: "## Paso 2 — Leer los logs", hasta: "## Paso 3 — Probar la app modificada" },
      { titulo: "Probar la app modificada", desde: "## Paso 3 — Probar la app modificada", hasta: "## Paso 4 — Responder", agregar: "probar-api-arreglado" },
      { titulo: "Entrega", desde: "## Entrega" },
    ] },
  ],
  "02-skill-y-mcp": [
    { nombre: "Contexto técnico", bajada: "Qué es una skill, qué es un MCP y dónde va cada uno según tu agente.", pantallas: [
      { titulo: "Skill y MCP", desde: "## Objetivo", hasta: "---" },
      { titulo: "El tablero de Métricas", anexo: "El tablero de Métricas" },
      { titulo: "Dónde va la skill", desde: "Creá la skill en la carpeta que lee tu agente:", hasta: "Tiene que tener las dos partes que vimos en la charla:" },
      { titulo: "El encabezado de la skill", desde: "Tiene que tener las dos partes que vimos en la charla:", hasta: "**Abajo, el criterio** (markdown común): cómo lo hacemos *nosotros*. Como" },
      { titulo: "Conectar el MCP", desde: "### B.1 Conectalo", hasta: "### Pregunta sobre el MCP conectado" },
    ] },
    { nombre: "Contexto del ejercicio", bajada: "Por qué nace la skill y qué decisión de privacidad tiene el endpoint que le vas a pedir.", pantallas: [
      { titulo: "El problema", desde: "### A.1 El problema", hasta: "### A.2 Escribila" },
      { titulo: "La privacidad del endpoint", desde: "### A.4 La privacidad del endpoint", hasta: "Verificalo vos, cuando el agente haya creado `GET /api/sesiones/:id`: pedí una sesión" },
    ] },
    { nombre: "Qué tenés que hacer", bajada: "Escribir la skill, comprobar que se dispara, conectar el navegador y usarlo.", pantallas: [
      { titulo: "El criterio de la skill (1 de 2)", desde: "**Abajo, el criterio** (markdown común): cómo lo hacemos *nosotros*. Como", hasta: "- [ ] **Convenciones del dominio** (principio V)." },
      { titulo: "El criterio de la skill (2 de 2)", desde: "- [ ] **Convenciones del dominio** (principio V).", hasta: "### A.3 ¿Se dispara?" },
      { titulo: "¿Se dispara?", desde: "### A.3 ¿Se dispara?", hasta: "### Preguntas sobre la skill" },
      { titulo: "Verificá el endpoint", desde: "Verificalo vos, cuando el agente haya creado `GET /api/sesiones/:id`: pedí una sesión", hasta: "### Preguntas sobre la privacidad y el contexto" },
      { titulo: "Usá el navegador", desde: "### B.2 Usalo", hasta: "### Preguntas sobre lo que hizo en el navegador" },
      { titulo: "Mirá lo que pasó", desde: "### B.3 Mirá lo que pasó", hasta: "### Preguntas sobre las herramientas del MCP" },
      { titulo: "Parte C, opcional (1 de 3)", desde: "## Parte C (opcional) — Una skill que se dispara por el archivo: códigos de habilidad", hasta: "### C.2 Separá script de criterio" },
      { titulo: "Parte C, opcional (2 de 3)", desde: "### C.2 Separá script de criterio", hasta: "### C.3 Probalo sin nombrarla" },
      { titulo: "Parte C, opcional (3 de 3)", desde: "### C.3 Probalo sin nombrarla", hasta: "### Pregunta sobre la Parte C (si la hiciste)" },
      { titulo: "Entrega", desde: "## Entrega" },
    ] },
  ],
}

const datos = {}
for (const [id, etapas] of Object.entries(ETAPAS)) {
  const ejercicio = JSON.parse(leer(`ejercicios/${id}/ejercicio.json`))
  // La línea de "Charla" (y el requisito) del principio va en la cabecera.
  const fin = ejercicio.consigna.findIndex((l, i) => i > 1 && l.startsWith("## "))
  datos[id] = {
    titulo: ejercicio.titulo,
    numero: Number(id.slice(0, 2)),
    minutos: ejercicio.minutos,
    charla: md(ejercicio.consigna.slice(1, fin)),
    etapas: etapas.map((e) => ({ nombre: e.nombre, bajada: e.bajada, pantallas: e.pantallas.map((p) => pantalla(ejercicio, p)) })),
    partes: preguntas(ejercicio),
    placeholder: ejercicio.placeholder ?? "",
  }
}

const css = leer("client/src/styles.css") + "\n" + leer("ejercicios/app/ejercicios.css")
const plantilla = readFileSync(join(aca, "plantilla.html"), "utf8")
const html = plantilla
  .replace("/*CSS-DEL-VISOR*/", () => css)
  .replace("/*DATOS*/", () => `const DATOS = ${JSON.stringify(datos).replace(/</g, "\\u003c")};`)
writeFileSync(join(aca, "index.html"), html)
console.log(`index.html: ${Object.values(datos).map((d) => `${d.titulo} (${d.etapas.reduce((s, e) => s + e.pantallas.length, 0)} pantallas, ${d.partes.flatMap((p) => p.preguntas).reduce((s, q) => s + q.subs.length, 0)} cajas)`).join(" · ")}`)
