import { useEffect, useState } from "react";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from "chart.js";
import { Line } from "react-chartjs-2";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchApi } from "@/services/apicalls";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

export default function MonthlyTicketChart() {
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchApi("/ticket-promedio-mensual");
        
        // Formatear etiquetas como "Mes/Año"
        const labels = data.map(d => `${d.mes}/${d.año.toString().slice(-2)}`);
        
        setChartData({
          labels,
          datasets: [
            {
              label: "Ticket Promedio (USD)",
              data: data.map(d => d.ticket_promedio),
              borderColor: "rgba(168, 85, 247, 1)", // Purple 500
              backgroundColor: "rgba(168, 85, 247, 0.1)",
              fill: true,
              tension: 0.4,
              borderWidth: 2,
              pointRadius: 0, // Ocultar puntos para una línea más limpia
              pointHitRadius: 10,
            }
          ]
        });
      } catch (error) {
        console.error("Error ticket mensual:", error);
      }
    };
    loadData();
  }, []);

  return (
    <Card className="col-span-1 md:col-span-2 bg-card">
      <CardHeader>
        <CardTitle className="text-sm font-medium">Tendencia del Ticket Promedio Mensual</CardTitle>
      </CardHeader>
      <CardContent className="h-[300px]">
        {chartData ? (
          <Line 
            data={chartData} 
            options={{
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                x: { grid: { display: false }, ticks: { color: "#a1a1aa", maxTicksLimit: 12 } },
                y: { grid: { color: "rgba(255, 255, 255, 0.1)" }, ticks: { color: "#a1a1aa" } }
              },
              plugins: { legend: { display: false } } // Ocultamos leyenda por ser 1 sola métrica
            }} 
          />
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground">Cargando...</div>
        )}
      </CardContent>
    </Card>
  );
}