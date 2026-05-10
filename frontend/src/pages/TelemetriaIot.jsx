import LiveTelemetryChart from "@/components/LiveTelemetryChart"

export default function TelemetriaIot() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Telemetría IoT</h1>
        <p className="text-muted-foreground">Monitoreo de sensores en tiempo real (Tráfico UDP).</p>
      </div>
      
      <div className="grid gap-4 grid-cols-1">
        <LiveTelemetryChart />
      </div>
    </div>
  )
}