import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import ServiceBadge from "@/components/ServiceBadge"
import type { Service } from "@/lib/types"

const service: Service = { id: "svc-1", name: "Corte de cabello", duration: 30, price: 500 }

describe("ServiceBadge", () => {
  it("renderiza el nombre del servicio", () => {
    render(<ServiceBadge service={service} selected={false} onSelect={() => {}} />)
    expect(screen.getByText("Corte de cabello")).toBeInTheDocument()
  })

  it("aplica estilos de seleccionado cuando selected=true", () => {
    const { container } = render(
      <ServiceBadge service={service} selected={true} onSelect={() => {}} />
    )
    const badge = container.firstChild as HTMLElement
    expect(badge).toHaveAttribute("data-selected", "true")
  })

  it("no aplica estilos de seleccionado cuando selected=false", () => {
    const { container } = render(
      <ServiceBadge service={service} selected={false} onSelect={() => {}} />
    )
    const badge = container.firstChild as HTMLElement
    expect(badge).toHaveAttribute("data-selected", "false")
  })

  it("llama a onSelect al hacer click", async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(<ServiceBadge service={service} selected={false} onSelect={onSelect} />)
    await user.click(screen.getByText("Corte de cabello"))
    expect(onSelect).toHaveBeenCalledTimes(1)
  })
})
