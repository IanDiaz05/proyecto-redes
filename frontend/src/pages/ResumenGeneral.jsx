import KpiCards from "@/components/KpiCards"
import GlobalSatisfactionCard from "@/components/GlobalSatisfactionCard"
import ProtocolBalanceChart from "@/components/ProtocolBalanceChart"
import AnnualGrowthChart from "@/components/AnnualGrowthChart"
import MonthlyTicketChart from "@/components/MonthlyTicketChart"
import MapaClientes from "@/components/MapaClientes"

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
          <MapaClientes />
        </div>
      </div>

      {/* Fila 3: Gráficas de Tendencia y Línea de Tiempo */}
      <div className="grid gap-4 md:grid-cols-3">
        <AnnualGrowthChart />
        <div className="md:col-span-1 flex flex-col">
          <MonthlyTicketChart />
        </div>
      </div>
    </div>
  )
}