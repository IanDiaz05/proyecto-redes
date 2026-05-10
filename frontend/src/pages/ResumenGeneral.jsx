import KpiCards from "@/components/KpiCards"
import ProtocolBalanceChart from "@/components/ProtocolBalanceChart"

export default function ResumenGeneral() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Resumen General</h1>
        <p className="text-muted-foreground">Métricas globales y estado de la red.</p>
      </div>
      
      <KpiCards />
      
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        <ProtocolBalanceChart />
        {/* Aquí agregaremos la Gráfica Anual y el Ticket Promedio más adelante */}
      </div>
    </div>
  )
}