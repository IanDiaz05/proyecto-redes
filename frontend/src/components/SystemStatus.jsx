import { useState, useEffect } from "react";
import { fetchApi } from "@/services/apicalls";

export default function SystemStatus() {
  const [status, setStatus] = useState(null);

  useEffect(() => {
    const getStatus = async () => {
      try {
        const res = await fetchApi("/sistema-estado");
        // Extraemos los datos validando la estructura del JSON
        setStatus(res.data ? res.data : res);
      } catch (e) {
        console.error("Error cargando estado del sistema");
      }
    };
    
    getStatus();
    // Actualizamos cada 10 segundos para ver fluctuar los req/min en vivo
    const interval = setInterval(getStatus, 10000); 
    return () => clearInterval(interval);
  }, []);

  if (!status) return null;

  const isUdpActive = status.estado_ingesta_udp === "Activa";
  const isTcpActive = status.estado_ingesta_tcp === "Activa";

  // Función para extraer solo la hora de "2026-05-12 14:43:16" -> "14:43:16"
  const getTime = (datetime) => datetime ? datetime.split(" ")[1] : "--:--:--";

  return (
    <div className="px-3 py-4 space-y-3">
      {/* Cabecera del bloque */}
      <div className="flex items-center justify-between px-1">
         <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
           DW Healthcheck
         </p>
         <span className="text-[9px] text-zinc-600 font-mono">{status.version_api}</span>
      </div>
      
      <div className="space-y-2 font-mono">
        {/* Bloque 1: Almacenamiento */}
        <div className="flex justify-between text-[11px]">
          <span className="text-zinc-500">Registros DW:</span>
          <span className="text-zinc-300">{(status.total_registros_dw || 0).toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-[11px]">
          <span className="text-zinc-500">Órdenes Únicas:</span>
          <span className="text-zinc-300">{(status.total_ordenes_unicas || 0).toLocaleString()}</span>
        </div>

        {/* Separador */}
        <div className="h-px bg-zinc-200 dark:bg-zinc-800/80 my-2"></div>

        {/* Bloque 2: Tráfico y Pipelines */}
        <div className="flex justify-between items-center text-[11px]">
          <span className="text-zinc-500">Ingesta TCP (Web):</span>
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] text-zinc-500">{status.registros_tcp_ultimo_minuto} req/m</span>
            <span className={`w-1.5 h-1.5 rounded-full ${isTcpActive ? 'bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]' : 'bg-red-500'}`}></span>
          </div>
        </div>
        <div className="flex justify-between items-center text-[11px]">
          <span className="text-zinc-500">Ingesta UDP (IoT):</span>
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] text-zinc-500">{status.registros_udp_ultimo_minuto} req/m</span>
            <span className={`w-1.5 h-1.5 rounded-full ${isUdpActive ? 'bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]' : 'bg-red-500'}`}></span>
          </div>
        </div>

        {/* Separador */}
        <div className="h-px bg-zinc-200 dark:bg-zinc-800/80 my-2"></div>

        {/* Bloque 3: Tiempos */}
        <div className="flex flex-col text-[10px] gap-1">
          <div className="flex justify-between">
            <span className="text-zinc-500 italic">Última Escucha:</span>
            <span className="text-zinc-400">{getTime(status.ultima_sincronizacion)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500 italic">Hora Servidor:</span>
            <span className="text-zinc-400">{getTime(status.timestamp_servidor)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}