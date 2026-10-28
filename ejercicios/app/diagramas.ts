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

export const diagramas: Record<string, string> = {
  "ciclo-agentico": cicloAgentico,
  "flujo-sdd": flujoSdd,
}
