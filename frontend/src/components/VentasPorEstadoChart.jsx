import { useEffect, useState } from "react";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from "chart.js";
import { Bar } from "react-chartjs-2";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchApi } from "@/services/apicalls";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function VentasPorEstadoChart() {
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchApi("/ventas-por-estado");
        const topStates = data.slice(0, 10); // Top 10 estados
        
        setChartData({
          labels: topStates.map(d => d.estado),
          datasets: [
            {
              label: "Ingresos Totales (USD)",
              data: topStates.map(d => d.ingresos_totales),
              backgroundColor: "rgba(59, 130, 246, 0.8)", // Blue 500
              borderRadius: 4,
            }
          ]
        });
      } catch (error) {
        console.error("Error al cargar ventas por estado:", error);
      }
    };
    loadData();
  }, []);

  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle className="text-sm font-medium">Top 10 Estados por Ingresos</CardTitle>
      </CardHeader>
      <CardContent className="h-[350px]">
        {chartData ? (
          <Bar 
            data={chartData} 
            options={{
              indexAxis: 'y', // Barra horizontal
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                x: { grid: { color: "rgba(255, 255, 255, 0.1)" }, ticks: { color: "#a1a1aa" } },
                y: { grid: { display: false }, ticks: { color: "#a1a1aa" } }
              },
              plugins: { legend: { display: false } }
            }} 
          />
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground">Cargando...</div>
        )}
      </CardContent>
    </Card>
  );
}