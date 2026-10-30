import "@testing-library/jest-dom/vitest"
import { cleanup } from "@testing-library/react"

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  localStorage.clear() // el progreso de los ejercicios y el temporizador no pasan de un test a otro
})
