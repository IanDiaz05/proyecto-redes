import { useState, useEffect } from "react";
import { fetchApi } from "@/services/apicalls";

export default function LatencyMonitor() {
  const [latency, setLatency] = useState(null);
  const [status, setStatus] = useState("loading"); // loading, online, slow, offline

  useEffect(() => {
    const checkLatency = async () => {
      const start = Date.now();
      try {
        // Usamos cualquier endpoint ligero para el ping
        await fetchApi("/ventas-recientes");
        const end = Date.now();
        const rtt = end - start;
        
        setLatency(rtt);
        if (rtt < 150) setStatus("online");
        else if (rtt < 500) setStatus("slow");
        else setStatus("slow");
      } catch (error) {
        setStatus("offline");
        setLatency(null);
      }
    };

    checkLatency();
    const interval = setInterval(checkLatency, 30000); // Check cada 30 seg
    return () => clearInterval(interval);
  }, []);

  const statusStyles = {
    loading: "bg-zinc-500",
    online: "bg-emerald-500",
    slow: "bg-amber-500",
    offline: "bg-red-500"
  };

  return (
    <div className="flex shrink-0 items-center space-x-3 bg-zinc-100 dark:bg-zinc-900 px-3 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-800 transition-all duration-500">
      <span className="relative flex h-2 w-2">
        {status !== "offline" && (
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${statusStyles[status]} opacity-75`}></span>
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${statusStyles[status]}`}></span>
      </span>
      <span className="text-[10px] sm:text-xs text-zinc-700 dark:text-zinc-300 font-medium font-mono uppercase tracking-wider">
        {status === "loading" && "Iniciando..."}
        {status === "online" && `API: ${latency}ms`}
        {status === "slow" && `API Lenta: ${latency}ms`}
        {status === "offline" && "Sin Conexión"}
      </span>
    </div>
  );
}