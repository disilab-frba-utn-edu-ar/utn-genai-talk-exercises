import { Route, Routes } from "react-router"
import Ejercicios from "../../ejercicios/app/Ejercicios"
import Layout from "./components/Layout"
import ConfirmacionPage from "./pages/ConfirmacionPage"
import InicioPage from "./pages/InicioPage"
import NoEncontradaPage from "./pages/NoEncontradaPage"
import ReservaPage from "./pages/ReservaPage"

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<InicioPage />} />
        <Route path="mentoras/:id" element={<ReservaPage />} />
        <Route path="confirmacion" element={<ConfirmacionPage />} />
        <Route path="ejercicios/*" element={<Ejercicios />} />
        <Route path="*" element={<NoEncontradaPage />} />
      </Route>
    </Routes>
  )
}
