import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import DashboardLayout from "./layouts/DashboardLayout"

// Páginas
import ResumenGeneral from "./pages/ResumenGeneral"
import VentasEcommerce from "./pages/VentasEcommerce"
import TelemetriaIot from "./pages/TelemetriaIot"
import ApiDocs from "./pages/ApiDocs"

function App() {
  return (
    <Router>
      <DashboardLayout>
        <Routes>
          {/* Definición de Rutas */}
          <Route path="/" element={<ResumenGeneral />} />
          <Route path="/ecommerce" element={<VentasEcommerce />} />
          <Route path="/iot" element={<TelemetriaIot />} />
          <Route path="/docs" element={<ApiDocs />} />
        </Routes>
      </DashboardLayout>
    </Router>
  )
}

export default App