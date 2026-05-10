import { useEffect, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchApi } from "@/services/apicalls";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function LiveTelemetryChart() {
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: []
  });

  const fetchData = async () => {
    try {
      const data = await fetchApi("/telemetria-vivo");
      
      // Invertimos los datos si vienen del más reciente al más antiguo para que el gráfico fluya de izq a der
      const sortedData = data.reverse(); 

      setChartData({
        labels: sortedData.map(item => item.time),
        datasets: [
          {
            label: "Temperatura (°C)",
            data: sortedData.map(item => item.temperature),
            borderColor: "rgba(239, 68, 68, 1)", // Red 500
            backgroundColor: "rgba(239, 68, 68, 0.1)",
            borderWidth: 2,
            tension: 0.4, // Suaviza la línea
            pointRadius: 2,
          },
          {
            label: "Humedad (%)",
            data: sortedData.map(item => item.humidity),
            borderColor: "rgba(56, 189, 248, 1)", // Sky 400
            backgroundColor: "rgba(56, 189, 248, 0.1)",
            borderWidth: 2,
            tension: 0.4,
            pointRadius: 2,
          }
        ],
      });
    } catch (error) {
      console.error("Error al obtener telemetría:", error);
    }
  };

  useEffect(() => {
    // Carga inicial
    fetchData();

    // Configurar Polling cada 3 segundos
    const interval = setInterval(() => {
      fetchData();
    }, 3000);

    // Limpiar el intervalo cuando el componente se desmonte
    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="col-span-1 md:col-span-2 lg:col-span-3 bg-card">
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          Telemetría en Vivo (UDP)
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="h-[300px]">
        {chartData.labels.length > 0 ? (
          <Line
            data={chartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              animation: {
                duration: 0 // Desactivamos animaciones para evitar parpadeos en las actualizaciones constantes
              },
              scales: {
                y: {
                  grid: { color: "rgba(255, 255, 255, 0.1)" },
                  ticks: { color: "#a1a1aa" }
                },
                x: {
                  grid: { display: false },
                  ticks: { color: "#a1a1aa", maxTicksLimit: 10 } // No saturar el eje X
                }
              },
              plugins: {
                legend: { labels: { color: '#a1a1aa' } }
              }
            }}
          />
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            Esperando datos de sensores...
          </div>
        )}
      </CardContent>
    </Card>
  );
}