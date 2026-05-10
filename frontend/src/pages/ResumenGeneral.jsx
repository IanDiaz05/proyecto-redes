import KpiCards from "@/components/KpiCards"
import GlobalSatisfactionCard from "@/components/GlobalSatisfactionCard"
import ProtocolBalanceChart from "@/components/ProtocolBalanceChart"
import AnnualGrowthChart from "@/components/AnnualGrowthChart"
import MonthlyTicketChart from "@/components/MonthlyTicketChart"

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
      
      {/* Fila 2: Gráficas de Tendencia y Protocolos */}
      <div className="grid gap-4 md:grid-cols-3">
        <AnnualGrowthChart />
        <ProtocolBalanceChart />
      </div>

      {/* Fila 3: Gráfica de línea de tiempo */}
      <div className="grid gap-4 md:grid-cols-2">
        <MonthlyTicketChart />
      </div>
    </div>
  )
}