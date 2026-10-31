#!/usr/bin/env node
// La guía de setup vive en ejercicios/setup.json.
// Este script copia el mismo texto al README, entre las marcas <!-- setup:inicio --> y <!-- setup:fin -->.
// npm run docs:setup → reescribe el README · npm run docs:setup -- --check → falla si quedó desactualizado

import { readFileSync, writeFileSync } from "node:fs"

const readme = new URL("../README.md", import.meta.url)
const { markdown } = JSON.parse(readFileSync(new URL("../ejercicios/setup.json", import.meta.url), "utf-8"))

const actual = readFileSync(readme, "utf-8")
const esperado = actual.replace(
  /(<!-- setup:inicio -->)[\s\S]*?(<!-- setup:fin -->)/,
  (_, abre, cierra) => `${abre}\n\n${markdown.join("\n")}\n\n${cierra}`,
)

if (process.argv.includes("--check")) {
  if (esperado !== actual) {
    console.error("El README no coincide con ejercicios/setup.json. Corré: npm run docs:setup")
    process.exit(1)
  }
} else {
  writeFileSync(readme, esperado)
}
