import { useEffect, useState } from "react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchApi } from "@/services/apicalls";

// Registrar elementos de Chart.js
ChartJS.register(ArcElement, Tooltip, Legend);

export default function ProtocolBalanceChart() {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchApi("/balance-protocolos");
        
        // Formatear datos para Chart.js
        const labels = data.map((item) => item.origen);
        const values = data.map((item) => item.total);

        setChartData({
          labels,
          datasets: [
            {
              label: "Total de Registros",
              data: values,
              backgroundColor: [
                "rgba(16, 185, 129, 0.8)", // Emerald 500 (TCP)
                "rgba(59, 130, 246, 0.8)", // Blue 500 (UDP)
              ],
              borderColor: [
                "rgba(16, 185, 129, 1)",
                "rgba(59, 130, 246, 1)",
              ],
              borderWidth: 1,
            },
          ],
        });
      } catch (error) {
        console.error("Error cargando balance de protocolos", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  return (
    <Card className="col-span-1 bg-card">
      <CardHeader>
        <CardTitle className="text-sm font-medium">Balance de Protocolos (TCP vs UDP)</CardTitle>
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
                legend: { position: 'bottom', labels: { color: '#a1a1aa' } }
              }
            }} 
          />
        ) : (
          <div className="text-sm text-muted-foreground">Datos no disponibles</div>
        )}
      </CardContent>
    </Card>
  );
}