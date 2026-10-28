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

export const diagramas: Record<string, string> = {
  "ciclo-agentico": cicloAgentico,
}
