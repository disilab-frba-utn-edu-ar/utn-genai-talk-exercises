import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import BookingClient from "@/components/BookingClient"
import type { Professional, Service, Slot } from "@/lib/types"

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }))
vi.mock("@/lib/api", () => ({
  createBooking: vi.fn().mockResolvedValue({
    id: "new-id",
    professionalId: "prof-1",
    serviceId: "svc-1",
    clientName: "Test",
    clientPhone: "123",
    date: "2026-04-22",
    startTime: "10:00",
    endTime: "10:30",
    status: "confirmed",
  }),
}))

const professional: Professional = {
  id: "prof-1",
  name: "Carlos Méndez",
  role: "Barbero Senior",
  bio: "Bio",
  avatar: "/avatars/carlos.jpg",
  serviceIds: ["svc-1"],
  targetAudience: ["men"],
  workingHours: {
    monday: { start: "09:00", end: "18:00" },
    tuesday: { start: "09:00", end: "18:00" },
    wednesday: { start: "09:00", end: "18:00" },
    thursday: { start: "09:00", end: "18:00" },
    friday: { start: "09:00", end: "18:00" },
    saturday: null,
  },
}

const service: Service = { id: "svc-1", name: "Corte de cabello", duration: 30, price: 500 }

const slot: Slot = { startTime: "10:00", endTime: "10:30", available: true }

describe("BookingClient", () => {
  it("renderiza BookingConfirmation cuando hay slot disponible", () => {
    render(
      <BookingClient
        professional={professional}
        service={service}
        nextSlot={{ date: "2026-04-22", slot }}
      />
    )
    expect(screen.getByText(/Carlos Méndez/)).toBeInTheDocument()
    expect(screen.getByText(/Corte de cabello/)).toBeInTheDocument()
  })

  it("muestra mensaje de sin disponibilidad cuando nextSlot es null", () => {
    render(
      <BookingClient
        professional={professional}
        service={service}
        nextSlot={null}
      />
    )
    const matches = screen.getAllByText(/sin disponibilidad|no hay turnos/i)
    expect(matches.length).toBeGreaterThan(0)
  })

  it("muestra botón 'Elegir otro profesional' cuando nextSlot es null", () => {
    render(
      <BookingClient
        professional={professional}
        service={service}
        nextSlot={null}
      />
    )
    expect(screen.getByRole("button", { name: /elegir otro/i })).toBeInTheDocument()
  })

  it("muestra botón Confirmar cuando hay slot disponible", () => {
    render(
      <BookingClient
        professional={professional}
        service={service}
        nextSlot={{ date: "2026-04-22", slot }}
      />
    )
    expect(screen.getByRole("button", { name: /confirmar/i })).toBeInTheDocument()
  })

  // T026 [US2] — sin disponibilidad: botón navega a /
  it("el botón Elegir otro profesional navega a / cuando nextSlot es null", async () => {
    const user = userEvent.setup()
    render(
      <BookingClient
        professional={professional}
        service={service}
        nextSlot={null}
      />
    )
    await user.click(screen.getByRole("button", { name: /elegir otro/i }))
    expect(screen.getByRole("button", { name: /elegir otro/i })).toBeInTheDocument()
  })

  it("muestra BookingConfirmation tras confirmar exitosamente", async () => {
    const user = userEvent.setup()
    render(
      <BookingClient
        professional={professional}
        service={service}
        nextSlot={{ date: "2026-04-22", slot }}
      />
    )
    await user.click(screen.getByRole("button", { name: /confirmar/i }))
    // Después del POST exitoso, el mock de createBooking retorna booking confirmado
    await screen.findByText(/turno confirmado/i)
    expect(screen.getByText(/Carlos Méndez/)).toBeInTheDocument()
  })

  it("muestra error cuando createBooking falla", async () => {
    const { createBooking } = await import("@/lib/api")
    vi.mocked(createBooking).mockRejectedValueOnce(new Error("El horario ya está reservado"))
    const user = userEvent.setup()
    render(
      <BookingClient
        professional={professional}
        service={service}
        nextSlot={{ date: "2026-04-22", slot }}
      />
    )
    await user.click(screen.getByRole("button", { name: /confirmar/i }))
    await screen.findByText(/el horario ya está reservado/i)
  })
})
