import { appendFileSync, mkdirSync, mkdtempSync, renameSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { crearRepositorioLogs } from "../../../server/repositories/logs-agentes"

const linea = (obj: object) => JSON.stringify(obj) + "\n"
const nueva = () => mkdtempSync(join(tmpdir(), "logs-"))
function escribir(dir: string, agente: string, sesion: string, ...entradas: object[]) {
  mkdirSync(join(dir, agente), { recursive: true })
  appendFileSync(join(dir, agente, `${sesion}.jsonl`), entradas.map(linea).join(""))
}

describe("repositorio de logs de agentes", () => {
  it("una carpeta inexistente es un log vacío, no un error", () => {
    const lector = crearRepositorioLogs(join(nueva(), "no-existe")).lector("actual")!
    expect(lector.actualizar()).toBe(false)
    expect(lector.entradas()).toEqual([])
  })

  it("lee todos los archivos y solo agrega lo nuevo en las lecturas siguientes", () => {
    const dir = nueva()
    escribir(dir, "claude", "s1", { event: "a" }, { event: "b" })
    const lector = crearRepositorioLogs(dir).lector("actual")!
    expect(lector.actualizar()).toBe(true)
    expect(lector.entradas().map((e) => e.event)).toEqual(["a", "b"])
    expect(lector.actualizar()).toBe(false) // sin cambios

    escribir(dir, "claude", "s1", { event: "c" })
    escribir(dir, "codex", "s2", { event: "d" })
    expect(lector.actualizar()).toBe(true)
    expect(lector.entradas().map((e) => e.event).sort()).toEqual(["a", "b", "c", "d"])
  })

  it("una línea escrita a la mitad espera a completarse (también con caracteres multibyte)", () => {
    const dir = nueva()
    const archivo = join(dir, "claude", "s1.jsonl")
    mkdirSync(join(dir, "claude"))
    const completa = linea({ event: "ñandú ✓" })
    const bytes = Buffer.from(completa)
    writeFileSync(archivo, bytes.subarray(0, 18)) // corta en medio de un carácter de 3 bytes
    const lector = crearRepositorioLogs(dir).lector("actual")!
    lector.actualizar()
    expect(lector.entradas()).toEqual([])
    appendFileSync(archivo, bytes.subarray(18))
    lector.actualizar()
    expect(lector.entradas()).toEqual([{ event: "ñandú ✓" }])
  })

  it("ignora las líneas que no son JSON, igual que logs:resumen", () => {
    const dir = nueva()
    mkdirSync(join(dir, "claude"))
    writeFileSync(join(dir, "claude", "s1.jsonl"), `basura\n${linea({ event: "ok" })}{"roto":\n`)
    const lector = crearRepositorioLogs(dir).lector("actual")!
    lector.actualizar()
    expect(lector.entradas()).toEqual([{ event: "ok" }])
  })

  it("si el archivo se trunca o se reemplaza, lo relee desde el principio", () => {
    const dir = nueva()
    escribir(dir, "claude", "s1", { event: "a" }, { event: "b" }, { event: "c" })
    const lector = crearRepositorioLogs(dir).lector("actual")!
    lector.actualizar()
    writeFileSync(join(dir, "claude", "s1.jsonl"), linea({ event: "z" }))
    expect(lector.actualizar()).toBe(true)
    expect(lector.entradas()).toEqual([{ event: "z" }])
  })

  it("si la carpeta se mueve como hace logs:limpiar, queda vacío y se recupera con el próximo evento", () => {
    const dir = nueva()
    escribir(dir, "claude", "s1", { event: "a" })
    const repo = crearRepositorioLogs(dir)
    const lector = repo.lector("actual")!
    lector.actualizar()

    mkdirSync(join(dir, "archivo", "2026-10-27T17-00-00-000Z"), { recursive: true })
    renameSync(join(dir, "claude"), join(dir, "archivo", "2026-10-27T17-00-00-000Z", "claude"))
    expect(lector.actualizar()).toBe(true)
    expect(lector.entradas()).toEqual([])

    escribir(dir, "claude", "s1", { event: "nuevo" })
    lector.actualizar()
    expect(lector.entradas()).toEqual([{ event: "nuevo" }])
  })

  it("'actual' no incluye logs/archivo", () => {
    const dir = nueva()
    escribir(dir, "claude", "s1", { event: "actual" })
    escribir(join(dir, "archivo", "2026-10-27T17-00-00-000Z"), "claude", "viejo", { event: "viejo" })
    const lector = crearRepositorioLogs(dir).lector("actual")!
    lector.actualizar()
    expect(lector.entradas()).toEqual([{ event: "actual" }])
  })

  it("lista los orígenes: actual y cada carpeta archivada, la más nueva primero", () => {
    const dir = nueva()
    for (const f of ["2026-10-20T10-00-00-000Z", "2026-10-25T10-00-00-000Z"]) mkdirSync(join(dir, "archivo", f), { recursive: true })
    writeFileSync(join(dir, "archivo", "suelto.jsonl"), "") // un archivo suelto no es un origen
    const ids = crearRepositorioLogs(dir).origenes().map((o) => o.id)
    expect(ids).toEqual(["actual", "archivo/2026-10-25T10-00-00-000Z", "archivo/2026-10-20T10-00-00-000Z"])
  })

  it("lee un origen archivado y rechaza los que no existen o intentan salir de logs/", () => {
    const dir = nueva()
    escribir(join(dir, "archivo", "2026-10-20T10-00-00-000Z"), "cline", "k", { event: "viejo" })
    const repo = crearRepositorioLogs(dir)
    const lector = repo.lector("archivo/2026-10-20T10-00-00-000Z")!
    lector.actualizar()
    expect(lector.entradas()).toEqual([{ event: "viejo" }])
    for (const malo of ["archivo/otra", "archivo/..", "archivo/../../etc", "../x", "cualquier-cosa", "archivo/"]) {
      expect(repo.lector(malo), malo).toBeUndefined()
    }
    rmSync(dir, { recursive: true })
  })
})
