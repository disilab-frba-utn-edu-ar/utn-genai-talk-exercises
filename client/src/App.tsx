import { Route, Routes } from "react-router"
import Ejercicios from "../../ejercicios/app/Ejercicios"
import { SddPage } from "../../ejercicios/app/Setup"
import Metricas from "../../metricas/app/Metricas"
import Layout from "./components/Layout"
import ConfirmacionPage from "./pages/ConfirmacionPage"
import InicioPage from "./pages/InicioPage"
import NoEncontradaPage from "./pages/NoEncontradaPage"
import ReservaPage from "./pages/ReservaPage"
import ReservaPorTipoPage from "./pages/ReservaPorTipoPage"

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<InicioPage />} />
        <Route path="mentoras/:id" element={<ReservaPage />} />
        <Route path="reservar-por-tipo" element={<ReservaPorTipoPage />} />
        <Route path="confirmacion" element={<ConfirmacionPage />} />
        <Route path="spec-driven-development" element={<SddPage />} />
        <Route path="ejercicios/*" element={<Ejercicios />} />
        <Route path="metricas" element={<Metricas />} />
        <Route path="*" element={<NoEncontradaPage />} />
      </Route>
    </Routes>
  )
}
