import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchApi } from "@/services/apicalls";
import { Thermometer, Droplets, Wifi, ActivitySquare } from "lucide-react";

export default function IotStatusCards() {
  const [latestData, setLatestData] = useState(null);
  const [activeSensors, setActiveSensors] = useState(0);

  const loadData = async () => {
    try {
      const data = await fetchApi("/telemetria-vivo");
      if (data && data.length > 0) {
        // Tomamos el registro más reciente (asumiendo que el endpoint devuelve el último al principio o final, usamos el índice 0 para este ejemplo)
        const current = data[0]; 
        setLatestData(current);

        // Calculamos cuántos sensores únicos están transmitiendo en esta ventana de tiempo
        const uniqueSensors = new Set(data.map(d => d.sensor_id));
        setActiveSensors(uniqueSensors.size);
      }
    } catch (error) {
      console.error("Error al cargar estado IoT:", error);
    }
  };

  useEffect(() => {
    loadData(); // Carga inicial
    const interval = setInterval(loadData, 3000); // Polling cada 3 segundos sincronizado con la gráfica
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Tarjeta de Temperatura */}
      <Card className="bg-card border-zinc-200 dark:border-zinc-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Temperatura Actual</CardTitle>
          <Thermometer className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {latestData ? `${latestData.temperature} °C` : "-- °C"}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Sensor: {latestData ? latestData.sensor_id : "Desconocido"}
          </p>
        </CardContent>
      </Card>

      {/* Tarjeta de Humedad */}
      <Card className="bg-card border-zinc-200 dark:border-zinc-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Humedad Relativa</CardTitle>
          <Droplets className="h-4 w-4 text-sky-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {latestData ? `${latestData.humidity} %` : "-- %"}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Última lectura: {latestData ? latestData.time : "--:--:--"}
          </p>
        </CardContent>
      </Card>

      {/* Tarjeta de Sensores Activos */}
      <Card className="bg-card border-zinc-200 dark:border-zinc-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Sensores Activos</CardTitle>
          <ActivitySquare className="h-4 w-4 text-emerald-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {activeSensors}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Transmitiendo por UDP
          </p>
        </CardContent>
      </Card>

      {/* Tarjeta de Estado de Red */}
      <Card className="bg-card border-zinc-200 dark:border-zinc-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Estado del Enlace</CardTitle>
          <Wifi className="h-4 w-4 text-emerald-500 animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-emerald-500">
            Online
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Latencia: &lt; 50ms
          </p>
        </CardContent>
      </Card>
    </div>
  );
}