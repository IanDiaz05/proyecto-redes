import { useEffect, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  BarController,
  LineController,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Chart } from "react-chartjs-2"; // Usamos Chart genérico para gráficas mixtas
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchApi } from "@/services/apicalls";

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, BarController, LineController, Title, Tooltip, Legend);

export default function AnnualGrowthChart() {
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchApi("/comparativa-anual");
        
        setChartData({
          labels: data.map(d => d.año),
          datasets: [
            {
              type: "line",
              label: "Total Pedidos",
              data: data.map(d => d.total_pedidos),
              borderColor: "rgba(59, 130, 246, 1)", // Blue 500
              backgroundColor: "rgba(59, 130, 246, 0.5)",
              borderWidth: 2,
              yAxisID: "y1", // Eje secundario
            },
            {
              type: "bar",
              label: "Ingresos (USD)",
              data: data.map(d => d.ingresos_totales),
              backgroundColor: "rgba(16, 185, 129, 0.8)", // Emerald 500
              borderRadius: 4,
              yAxisID: "y", // Eje principal
            }
          ]
        });
      } catch (error) {
        console.error("Error comparativa anual:", error);
      }
    };
    loadData();
  }, []);

  return (
    <Card className="col-span-1 md:col-span-2 bg-card">
      <CardHeader>
        <CardTitle className="text-sm font-medium">Crecimiento Anual (Ingresos vs Pedidos)</CardTitle>
      </CardHeader>
      <CardContent className="h-[300px]">
        {chartData ? (
          <Chart 
            type="bar"
            data={chartData} 
            options={{
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                x: { grid: { display: false }, ticks: { color: "#a1a1aa" } },
                y: { 
                  type: "linear", 
                  display: true, 
                  position: "left",
                  grid: { color: "rgba(255, 255, 255, 0.1)" },
                  ticks: { color: "#a1a1aa" }
                },
                y1: {
                  type: "linear",
                  display: true,
                  position: "right",
                  grid: { drawOnChartArea: false }, // Evitar que se crucen las líneas de la cuadrícula
                  ticks: { color: "#3b82f6" }
                }
              },
              plugins: { legend: { labels: { color: '#a1a1aa' } } }
            }} 
          />
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground">Cargando...</div>
        )}
      </CardContent>
    </Card>
  );
}