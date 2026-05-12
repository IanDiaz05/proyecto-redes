import KpiCards from "@/components/KpiCards"
import GlobalSatisfactionCard from "@/components/GlobalSatisfactionCard"
import ProtocolBalanceChart from "@/components/ProtocolBalanceChart"
import AnnualGrowthChart from "@/components/AnnualGrowthChart"
import MonthlyTicketChart from "@/components/MonthlyTicketChart"
import RutasLogisticasMap from "@/components/RutasLogisticasMap"
import VentasRecientesTable from "@/components/VentasRecientesTable"

export default function ResumenGeneral() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500 overflow-x-hidden">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Resumen General</h1>
        <p className="text-muted-foreground">Métricas globales de negocio y estado de red.</p>
      </div>
      
      {/* Fila 1: KPIs Principales + Satisfacción */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-4 lg:grid-cols-5">
        <div className="md:col-span-4 min-w-0">
          <KpiCards />
        </div>
        <div className="md:col-span-1 min-w-0">
          <GlobalSatisfactionCard />
        </div>
      </div>
      
      {/* Fila 2: Tabla Reciente y Mapa Logístico */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        <div className="md:col-span-1 min-w-0">
          <VentasRecientesTable />
        </div>
        <div className="md:col-span-2 min-w-0">
          <RutasLogisticasMap />
        </div>
      </div>

      {/* Fila 3: Gráficas de Tendencia y Protocolos */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        <div className="md:col-span-2 min-w-0">
          <AnnualGrowthChart />
        </div>
        <div className="md:col-span-1 min-w-0">
          <ProtocolBalanceChart />
        </div>
      </div>

      {/* Fila 4: Ticket Promedio */}
      <div className="grid gap-4 grid-cols-1 mt-2">
        <div className="min-w-0 w-full">
          <MonthlyTicketChart />
        </div>
      </div>

    </div>
  )
}