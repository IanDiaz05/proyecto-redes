import KpiCards from "@/components/KpiCards"
import GlobalSatisfactionCard from "@/components/GlobalSatisfactionCard"
import ProtocolBalanceChart from "@/components/ProtocolBalanceChart"
import AnnualGrowthChart from "@/components/AnnualGrowthChart"
import MonthlyTicketChart from "@/components/MonthlyTicketChart"
import RutasLogisticasMap from "@/components/RutasLogisticasMap"
import VentasRecientesTable from "@/components/VentasRecientesTable"

export default function ResumenGeneral() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Resumen General</h1>
        <p className="text-muted-foreground">Métricas globales de negocio y estado de red.</p>
      </div>
      
      {/* Fila 1: KPIs Principales + Satisfacción */}
      <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-5">
        <div className="md:col-span-4">
          <KpiCards />
        </div>
        <div className="md:col-span-1">
          <GlobalSatisfactionCard />
        </div>
      </div>
      
      {/* Fila 2: Mapa de calor y Protocolos */}
      <div className="grid gap-4 md:grid-cols-3">
        <ProtocolBalanceChart />
        <div className="md:col-span-2">
          <RutasLogisticasMap />
        </div>
      </div>

      {/* Fila 3: Gráficas de Tendencia y Tabla de ordenes */}
      <div className="grid gap-4 md:grid-cols-3">
        <AnnualGrowthChart />
        {/* mini tabla con 6 ordenes recientes */}
        <div className="md:col-span-1">
          <VentasRecientesTable />
        </div>
      </div>

      {/* Fila 4: Ticket Promedio */}
      <div className="grid gap-4 md:grid-cols-3 mt-2">
        <div className="md:col-span-3">
          <MonthlyTicketChart />
        </div>
      </div>

    </div>
  )
}