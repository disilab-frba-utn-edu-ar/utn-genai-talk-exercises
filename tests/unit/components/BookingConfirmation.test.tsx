import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import BookingConfirmation from "@/components/BookingConfirmation"
import type { Booking, Professional, Service } from "@/lib/types"

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

const booking: Booking = {
  id: "book-1",
  professionalId: "prof-1",
  serviceId: "svc-1",
  clientName: "Juan Pérez",
  clientPhone: "11-1234-5678",
  date: "2026-04-22",
  startTime: "10:00",
  endTime: "10:30",
  status: "confirmed",
}

describe("BookingConfirmation", () => {
  it("muestra el nombre del profesional", () => {
    render(<BookingConfirmation professional={professional} service={service} booking={booking} />)
    expect(screen.getByText(/Carlos Méndez/)).toBeInTheDocument()
  })

  it("muestra el nombre del servicio", () => {
    render(<BookingConfirmation professional={professional} service={service} booking={booking} />)
    expect(screen.getByText("Corte de cabello")).toBeInTheDocument()
  })

  it("muestra la fecha formateada (día y mes en español)", () => {
    render(<BookingConfirmation professional={professional} service={service} booking={booking} />)
    // 2026-04-22 → "22 de abril"
    expect(screen.getByText(/22 de abril/i)).toBeInTheDocument()
  })

  it("muestra el horario de inicio del turno", () => {
    render(<BookingConfirmation professional={professional} service={service} booking={booking} />)
    expect(screen.getByText(/10:00/)).toBeInTheDocument()
  })
})
