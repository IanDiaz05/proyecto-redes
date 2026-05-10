import { useEffect, useState } from "react";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from "chart.js";
import { Bar } from "react-chartjs-2";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchApi } from "@/services/apicalls";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function PriceRangeChart() {
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchApi("/precios-por-categoria");
        const topData = data.slice(0, 8); // Top 8 para no saturar
        
        setChartData({
          labels: topData.map(d => d.categoria.replace(/_/g, ' ')),
          datasets: [
            {
              label: "Rango de Precios (USD)",
              // Le pasamos un array [min, max] para crear la barra flotante
              data: topData.map(d => [d.precio_minimo, d.precio_maximo]), 
              backgroundColor: "rgba(245, 158, 11, 0.8)", // Amber 500
              borderRadius: 4,
            }
          ]
        });
      } catch (error) {
        console.error("Error al cargar rango de precios:", error);
      }
    };
    loadData();
  }, []);

  return (
    <Card className="col-span-1 md:col-span-2 bg-card">
      <CardHeader>
        <CardTitle className="text-sm font-medium">Amplitud de Precios por Categoría (Min - Max)</CardTitle>
      </CardHeader>
      <CardContent className="h-[300px]">
        {chartData ? (
          <Bar 
            data={chartData} 
            options={{
              indexAxis: 'y', // La hacemos horizontal
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                x: { grid: { color: "rgba(255, 255, 255, 0.1)" }, ticks: { color: "#a1a1aa" } },
                y: { grid: { display: false }, ticks: { color: "#a1a1aa", font: { size: 10 } } }
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