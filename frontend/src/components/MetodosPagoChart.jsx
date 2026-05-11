import { useEffect, useState } from "react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchApi } from "@/services/apicalls";

// Registramos el ArcElement necesario para gráficas de pastel/dona
ChartJS.register(ArcElement, Tooltip, Legend);

export default function MetodosPagoChart() {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Llamamos a tu nuevo endpoint optimizado
        const data = await fetchApi("/distribucion-pagos");
        
        // Mapeo de colores manteniendo la paleta de tu dashboard
        const bgColors = {
          "credit_card": "rgba(59, 130, 246, 0.8)", // Blue 500
          "boleto": "rgba(16, 185, 129, 0.8)",      // Emerald 500
          "voucher": "rgba(245, 158, 11, 0.8)",     // Amber 500
          "debit_card": "rgba(239, 68, 68, 0.8)"    // Red 500
        };

        const borderColors = {
          "credit_card": "rgba(59, 130, 246, 1)",
          "boleto": "rgba(16, 185, 129, 1)",
          "voucher": "rgba(245, 158, 11, 1)",
          "debit_card": "rgba(239, 68, 68, 1)"
        };

        setChartData({
          // Limpiamos los textos (ej: credit_card -> CREDIT CARD)
          labels: data.map(d => d.metodo.replace("_", " ").toUpperCase()),
          datasets: [
            {
              label: "Distribución",
              // Usamos el porcentaje directamente para el tamaño de las rebanadas
              data: data.map(d => d.porcentaje),
              backgroundColor: data.map(d => bgColors[d.metodo] || "rgba(156, 163, 175, 0.8)"),
              borderColor: data.map(d => borderColors[d.metodo] || "rgba(156, 163, 175, 1)"),
              borderWidth: 1,
            }
          ]
        });
      } catch (error) {
        console.error("Error cargando distribución de pagos:", error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  return (
    <Card className="bg-card h-full">
      <CardHeader>
        <CardTitle className="text-sm font-medium">Distribución Global de Pagos</CardTitle>
      </CardHeader>
      <CardContent className="flex justify-center h-[250px] pb-4">
        {loading ? (
          <Skeleton className="w-48 h-48 rounded-full" />
        ) : chartData ? (
          <Doughnut 
            data={chartData} 
            options={{
              responsive: true, 
              maintainAspectRatio: false,
              plugins: { 
                // Colocamos la leyenda a la derecha para que la dona quede más grande
                legend: { 
                  position: 'right', 
                  labels: { color: '#a1a1aa', boxWidth: 12, font: { size: 11 } } 
                },
                // Personalizamos el tooltip para que muestre el símbolo de porcentaje
                tooltip: {
                  callbacks: {
                    label: (context) => ` ${context.label}: ${context.raw}%`
                  }
                }
              }
            }} 
          />
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground">Datos no disponibles</div>
        )}
      </CardContent>
    </Card>
  );
}