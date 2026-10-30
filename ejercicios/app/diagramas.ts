/*
 * Diagramas que reemplazan bloques ASCII de las consignas. En el JSON, el bloque de código lleva
 * el nombre del diagrama como lenguaje (```ciclo-agentico) y conserva el ASCII como respaldo.
 */

type Direccion = "der" | "izq" | "arriba" | "abajo"

const actor = (area: string, nombre: string, detalle = "") =>
  `<span class="ciclo-actor" style="grid-area:${area}"><span class="ciclo-nombre">${nombre}</span>${
    detalle ? `<span class="ciclo-detalle">${detalle}</span>` : ""
  }</span>`

const hook = (area: string, nombre: string) =>
  `<span class="ciclo-hook ciclo-hook-${area}" style="grid-area:${area}"><span class="ciclo-tag">hook</span>${nombre}</span>`

const flecha = (direccion: Direccion, area: string, texto = "", clase = "") =>
  `<span class="ciclo-flecha ciclo-${direccion} ${clase}" style="grid-area:${area}">${texto ? `<span>${texto}</span>` : ""}</span>`

const cicloAgentico = `<figure class="diagrama ciclo" aria-label="Ciclo agéntico: vos mandás un prompt (hook UserPromptSubmit) al modelo; el modelo pide una tool (hook PreToolUse), el harness la ejecuta (hook PostToolUse) y el resultado vuelve al modelo como evidencia. Se repite hasta que el modelo ya no pide tools (hook Stop).">
<div class="ciclo-mapa" aria-hidden="true">
<span class="ciclo-bucle"><span>↻ ciclo agéntico · se repite mientras el modelo pida tools</span></span>
${actor("vos", "Vos")}
${flecha("der", "fprompt", "prompt")}
${hook("ups", "UserPromptSubmit")}
${flecha("der", "fentra")}
${actor("modelo", "Modelo", "decide, no ejecuta")}
${flecha("der", "fpide", "pide una tool")}
${hook("pre", "PreToolUse")}
${flecha("abajo", "fbaja")}
${actor("harness", "Harness", "ejecuta la tool")}
${flecha("izq", "fizq")}
${hook("post", "PostToolUse")}
${flecha("arriba", "fevid", '<em class="ciclo-solo-movil">↻ vuelve al modelo con el </em>resultado = evidencia<em class="ciclo-solo-movil">, y se repite mientras pida tools</em>', "ciclo-retorno")}
${flecha("arriba", "fstop", "ya no pide más tools")}
${hook("stop", "Stop")}
</div>
<figcaption><span><i class="ciclo-muestra-hook"></i>hook: lo corre el harness siempre, en ese punto del ciclo</span><span><i class="ciclo-muestra-actor"></i>quién actúa</span></figcaption>
</figure>`

/* Pasos en fila unidos por una línea; `entre` va entre cada tarjeta y la siguiente. */
type Paso = { nombre: string; detalle: string }

const pasos = (lista: Paso[], { entre = "" } = {}) =>
  `<ol class="pasos" style="--pasos-n:${lista.length}">${lista
    .map(
      (p, i) =>
        `<li><span class="pasos-numero">${String(i + 1).padStart(2, "0")}</span><span class="pasos-nombre">${p.nombre}</span><span class="pasos-detalle">${p.detalle}</span>${
          i < lista.length - 1 ? entre : ""
        }</li>`,
    )
    .join("")}</ol>`

const flujoSdd = `<figure class="diagrama" aria-label="Flujo de Spec-Driven Development: Constitution, Specify, Clarify, Plan, Tasks e Implement, con validación humana entre cada etapa.">
${pasos(
  [
    { nombre: "Constitution", detalle: "estándares" },
    { nombre: "Specify", detalle: "el qué" },
    { nombre: "Clarify", detalle: "dudas" },
    { nombre: "Plan", detalle: "el cómo" },
    { nombre: "Tasks", detalle: "trabajo chico" },
    { nombre: "Implement", detalle: "construir" },
  ],
  { entre: `<span class="pasos-control" role="img" aria-label="validación humana">✋</span>` },
)}
<figcaption><span><span class="pasos-control-muestra" aria-hidden="true">✋</span>validación humana: revisás vos antes de pasar a la etapa siguiente</span></figcaption>
</figure>`

const puertasSdd = `<figure class="diagrama" aria-label="Validaciones entre etapas: tasks, ¿leíste la constitution?; plan, ¿la spec está aprobada?; implement, ¿existe un plan para esto? Si no, no avanza.">
<ul class="puertas">${[
  ["tasks", "¿leíste la constitution?"],
  ["plan", "¿la spec está aprobada?"],
  ["implement", "¿existe un plan para esto?"],
]
  .map(
    ([etapa, pregunta]) =>
      `<li><span class="puerta-etapa">${etapa}</span><span class="puerta-pregunta">${pregunta}</span><span class="puerta-barrera">si no, no avanza</span></li>`,
  )
  .join("")}</ul>
</figure>`

/* Etapas del flujo SDD, en vertical: qué hacer y qué revisar en cada una, con un ✋ entre etapa y etapa. */
const etapa = (nombre: string, detalle: string, hacer: string, revisar: string) =>
  `<span class="etapas-nombre">${nombre} <span>${detalle}</span></span><span class="etapas-hacer">${hacer}</span><span class="etapas-revisar"><b>Revisá:</b> ${revisar}</span>`

const etapasSdd = `<figure class="diagrama" aria-label="Etapas del flujo, con qué hacer y qué revisar en cada una antes de pasar a la siguiente.">
<ol class="etapas">${[
  etapa(
    "Constitution",
    "los estándares",
    "Ya existe en <code>.specify/memory/constitution.md</code>: leela antes de arrancar.",
    "las restricciones de dominio y los principios I (test-first), II (capas) y IV (privacidad).",
  ),
  etapa(
    "Specify",
    "el qué",
    "Contale la historia al agente con tus palabras, sin copiar la tarjeta.",
    "intención, escenarios Dado/Cuando/Entonces, requisitos verificables y criterios medibles. Sin tecnología.",
  ),
  etapa(
    "Clarify",
    "las dudas",
    "Respondé vos, con criterio de negocio: no aceptes la opción recomendada sin pensarla.",
    "que los casos borde de tu historia queden decididos en la spec.",
  ),
  etapa(
    "Plan",
    "el cómo",
    "Leé <code>plan.md</code>, <code>research.md</code>, <code>data-model.md</code> y <code>contracts/</code>.",
    "el <em>Constitution Check</em>: tests en las tres carpetas de <code>tests/</code>, la regla en <code>server/domain/</code> sin IO y nada privado en endpoints públicos.",
  ),
  etapa(
    "Tasks",
    "trabajo chico",
    "Si querés, corré después <code>analyze</code> para chequear que los artefactos sean consistentes.",
    "tareas chicas y tests antes del código. Si la skill los da por opcionales, manda la constitution.",
  ),
  etapa(
    "Implement",
    "construir",
    "Pedile que frene al final de cada fase para revisar sobre la marcha.",
    "que los tests pasen y que funcione: cerralo con el paso 4.",
  ),
]
  .map((e, i, todas) => {
    const control = i < todas.length - 1 ? `<span class="etapas-control" role="img" aria-label="validación humana">✋</span>` : ""
    return `<li>${e}${control}</li>`
  })
  .join("")}</ol>
</figure>`

const carpeta = (nombre: string, descripcion: string, chips: string[], { etiqueta = "", capas = false } = {}) =>
  `<li><span class="repo-carpeta">${nombre}</span><span class="repo-desc">${descripcion}</span><span class="repo-chips${
    capas ? " repo-capas" : ""
  }">${etiqueta ? `<span class="repo-etiqueta">${etiqueta}</span>` : ""}${chips.map((c) => `<span class="repo-chip">${c}</span>`).join("")}</span></li>`

const mapaRepo = `<figure class="diagrama" aria-label="Estructura del repo: client, server en capas (routes, services, repositories y domain), shared, data y tests.">
<ul class="repo">${[
  carpeta("client/", "Vite + React + TypeScript", ["/", "/mentoras/:id", "/confirmacion"], { etiqueta: "pantallas" }),
  carpeta("server/", "Express + TypeScript", ["routes", "services", "repositories", "domain"], { etiqueta: "en capas", capas: true }),
  carpeta("shared/", "tipos compartidos", ["shared/types.ts"]),
  carpeta("data/", "archivos JSON", ["mentoras", "habilidades", "tipos de asesoría", "colectivos", "sesiones"]),
  carpeta("tests/", "Vitest", ["tests/server/domain", "tests/server/api (supertest)", "tests/client"]),
].join("")}</ul>
</figure>`

export const diagramas: Record<string, string> = {
  "ciclo-agentico": cicloAgentico,
  "flujo-sdd": flujoSdd,
  "puertas-sdd": puertasSdd,
  "etapas-sdd": etapasSdd,
  "mapa-repo": mapaRepo,
}
