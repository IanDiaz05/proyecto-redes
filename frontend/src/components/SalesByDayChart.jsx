import { useEffect, useState } from "react";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from "chart.js";
import { Bar } from "react-chartjs-2";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchApi } from "@/services/apicalls";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function SalesByDayChart() {
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchApi("/ventas-por-dia-semana");
        
        // Mapeo para traducir los días si están en inglés
        const diasES = {
          "Monday": "Lunes", "Tuesday": "Martes", "Wednesday": "Miércoles",
          "Thursday": "Jueves", "Friday": "Viernes", "Saturday": "Sábado", "Sunday": "Domingo"
        };

        setChartData({
          labels: data.map(d => diasES[d.dia] || d.dia),
          datasets: [
            {
              label: "Ingresos Totales",
              data: data.map(d => d.ingresos_totales),
              backgroundColor: "rgba(16, 185, 129, 0.8)", // Emerald 500
              borderRadius: 4,
            }
          ]
        });
      } catch (error) {
        console.error("Error al cargar ventas por día:", error);
      }
    };
    loadData();
  }, []);

  return (
    <Card className="col-span-1 md:col-span-2 bg-card">
      <CardHeader>
        <CardTitle className="text-sm font-medium">Ingresos por Día de la Semana</CardTitle>
      </CardHeader>
      <CardContent className="h-[250px]">
        {chartData ? (
          <Bar 
            data={chartData} 
            options={{
              responsive: true,
              maintainAspectRatio: false,
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