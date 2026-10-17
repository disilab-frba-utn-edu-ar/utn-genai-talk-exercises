import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import FormularioContacto from "../../client/src/components/FormularioContacto"
import { colectivos } from "./fixtures"

describe("FormularioContacto", () => {
  it("habilita confirmar solo con todos los datos válidos y los envía", async () => {
    const onConfirmar = vi.fn()
    render(<FormularioContacto colectivos={colectivos} enviando={false} onConfirmar={onConfirmar} />)
    const confirmar = screen.getByRole("button", { name: "Confirmar sesión" })
    expect(confirmar).toBeDisabled()

    await userEvent.selectOptions(screen.getByLabelText("Colectivo"), "c1")
    await userEvent.type(screen.getByLabelText("¿Qué necesitan resolver?"), "Revisar el formulario")
    await userEvent.type(screen.getByLabelText("Nombre de contacto"), "Ana")
    await userEvent.type(screen.getByLabelText("Email de contacto"), "ana@example.org")
    expect(confirmar).toBeEnabled()

    await userEvent.click(confirmar)
    expect(onConfirmar).toHaveBeenCalledWith({
      colectivoId: "c1",
      proyecto: "Revisar el formulario",
      contactoNombre: "Ana",
      contactoEmail: "ana@example.org",
    })
  })

  it("avisa si el email no es válido", async () => {
    render(<FormularioContacto colectivos={colectivos} enviando={false} onConfirmar={vi.fn()} />)
    const email = screen.getByLabelText("Email de contacto")
    await userEvent.type(email, "ana@")
    await userEvent.tab()

    expect(email).toHaveAttribute("aria-invalid", "true")
    expect(screen.getByText("Ingresá un email válido")).toBeInTheDocument()
  })
})
