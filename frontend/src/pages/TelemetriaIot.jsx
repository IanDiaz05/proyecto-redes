import LiveTelemetryChart from "@/components/LiveTelemetryChart";
import IotStatusCards from "@/components/IotStatusCards";
import { Server } from "lucide-react";

export default function TelemetriaIot() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Telemetría IoT</h1>
          <p className="text-muted-foreground">Monitorización de sensores de planta en tiempo real.</p>
        </div>
        
        {/* Indicador de transmisión en vivo estilo consola */}
        <div className="hidden md:flex items-center gap-2 bg-zinc-900 text-emerald-400 px-3 py-1.5 rounded-md border border-zinc-800 text-xs font-mono shadow-inner">
          <Server className="w-4 h-4" />
          <span>UDP_PORT: LISTENING</span>
          <span className="relative flex h-2 w-2 ml-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
        </div>
      </div>
      
      {/* Fila 1: KPIs en vivo */}
      <IotStatusCards />

      {/* Fila 2: Gráfica de monitorización fluida */}
      <div className="grid gap-4 grid-cols-1">
        <LiveTelemetryChart />
      </div>
    </div>
  );
}