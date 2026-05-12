import { useEffect, useState } from "react";
import { Chart as ChartJS, LinearScale, PointElement, Tooltip, Legend } from "chart.js";
import { Scatter } from "react-chartjs-2";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { fetchApi } from "@/services/apicalls";

ChartJS.register(LinearScale, PointElement, Tooltip, Legend);

export default function RelacionPrecioFleteChart() {
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchApi("/relacion-precio-flete");
        
        setChartData({
          datasets: [
            {
              label: "Categorías",
              // En Scatter, 'x' e 'y' son obligatorios. Usaremos Precio(x) vs Flete(y)
              data: data.map(d => ({
                x: d.precio_promedio,
                y: d.flete_promedio,
                categoria: d.categoria // Guardamos para el tooltip
              })),
              backgroundColor: "rgba(239, 68, 68, 0.7)", // Red 500
              pointRadius: 6,
              pointHoverRadius: 8,
            }
          ]
        });
      } catch (error) {
        console.error("Error al cargar relación precio-flete:", error);
      }
    };
    loadData();
  }, []);

  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle className="text-sm font-medium">Relación Precio Promedio vs Flete</CardTitle>
        <CardDescription className="text-xs">
          Cada punto es una categoría de producto: a la derecha, productos caros; arriba, envíos costosos.
        </CardDescription>
      </CardHeader>
      <CardContent className="h-[350px]">
        {chartData ? (
          <Scatter 
            data={chartData} 
            options={{
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                x: { 
                  title: { display: true, text: 'Precio Promedio (USD)', color: '#a1a1aa' },
                  grid: { color: "rgba(255, 255, 255, 0.1)" }, 
                  ticks: { color: "#a1a1aa" } 
                },
                y: { 
                  title: { display: true, text: 'Flete Promedio (USD)', color: '#a1a1aa' },
                  grid: { color: "rgba(255, 255, 255, 0.1)" }, 
                  ticks: { color: "#a1a1aa" } 
                }
              },
              plugins: { 
                legend: { display: false },
                tooltip: {
                  callbacks: {
                    label: (ctx) => {
                      const d = ctx.raw;
                      return `${d.categoria}: Precio $${d.x} | Flete $${d.y}`;
                    }
                  }
                }
              }
            }} 
          />
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground">Cargando...</div>
        )}
      </CardContent>
    </Card>
  );
}