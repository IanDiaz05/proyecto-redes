import { useEffect, useState } from "react";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, BarController, Tooltip, Legend } from "chart.js";
import { Bar } from "react-chartjs-2";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchApi } from "@/services/apicalls";

ChartJS.register(CategoryScale, LinearScale, BarElement, BarController, Tooltip, Legend);

export default function VentasPorTrimestreChart() {
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchApi("/ventas-por-trimestre");
        
        setChartData({
          labels: data.map(d => `Q${d.trimestre} ${d.año}`),
          datasets: [
            {
              label: "Ingresos (USD)",
              data: data.map(d => d.ingresos_totales),
              backgroundColor: "rgba(168, 85, 247, 0.8)", // Purple 500
              borderRadius: 4,
            }
          ]
        });
      } catch (error) {
        console.error("Error ventas por trimestre:", error);
      }
    };
    loadData();
  }, []);

  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle className="text-sm font-medium">Estacionalidad (Ventas por Trimestre)</CardTitle>
      </CardHeader>
      <CardContent className="h-[250px]">
        {chartData ? (
          <Bar 
            data={chartData} 
            options={{
              responsive: true, maintainAspectRatio: false,
              scales: {
                x: { grid: { display: false }, ticks: { color: "#a1a1aa" } },
                y: { grid: { color: "rgba(255, 255, 255, 0.1)" }, ticks: { color: "#a1a1aa" } }
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