#!/usr/bin/env node
// Prueba de humo contra el server levantado (npm run dev): pega al endpoint y chequea
// el status, que la respuesta sea JSON, la forma de los errores y que no se filtre contacto.
//
// Uso: node .claude/skills/nuevo-endpoint/scripts/probar-endpoint.mjs <METODO> <ruta> <status> [cuerpo-json]
// Ej.:  node .../probar-endpoint.mjs GET /api/mentoras/no-existe 404

const [metodo, rutaCruda, statusEsperado, cuerpo] = process.argv.slice(2)
const base = process.env.API_URL ?? "http://127.0.0.1:3001"

// Git Bash en Windows convierte "/api/x" en "C:/Program Files/Git/api/x": recortamos desde "/api/".
// También se acepta "api/x" sin la barra inicial.
const desde = `/${rutaCruda ?? ""}`.replaceAll("\\", "/").lastIndexOf("/api/")
const ruta = desde >= 0 ? `/${rutaCruda ?? ""}`.replaceAll("\\", "/").slice(desde) : undefined

if (!metodo || !ruta || !statusEsperado) {
  console.error("Uso: probar-endpoint.mjs <METODO> </api/ruta> <status> [cuerpo-json]")
  process.exit(2)
}

const fallas = []
let respuesta
try {
  respuesta = await fetch(base + ruta, {
    method: metodo.toUpperCase(),
    headers: { "Content-Type": "application/json" },
    body: cuerpo,
  })
} catch {
  console.error(`No hay server en ${base}. Levantalo con \`npm run dev\` y volvé a probar.`)
  process.exit(2)
}

const texto = await respuesta.text()
let json
try {
  json = JSON.parse(texto)
} catch {
  fallas.push("la respuesta no es JSON")
}

if (respuesta.status !== Number(statusEsperado)) {
  fallas.push(`status ${respuesta.status}, se esperaba ${statusEsperado}`)
}
if (respuesta.status >= 400) {
  if (![400, 404, 409].includes(respuesta.status)) fallas.push(`status de error ${respuesta.status}: solo 400, 404 o 409`)
  const claves = json && typeof json === "object" ? Object.keys(json) : []
  if (claves.length !== 1 || typeof json.error !== "string") fallas.push('el error no tiene la forma { "error": "..." }')
}
if (/contacto/i.test(texto)) {
  fallas.push("la respuesta menciona \"contacto\": revisá que sea alguien autorizado a verlo (principio IV)")
}

console.log(`${metodo.toUpperCase()} ${ruta} → ${respuesta.status}`)
console.log(texto.length > 500 ? `${texto.slice(0, 500)}…` : texto)
if (fallas.length) {
  console.error(`\nFALLA:\n- ${fallas.join("\n- ")}`)
  process.exit(1)
}
console.log("\nOK")
