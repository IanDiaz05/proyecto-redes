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
        const labels = data.map((item) => item.origen);
        const values = data.map((item) => item.total);

        setChartData({
          labels,
          datasets: [
            {
              label: "Total de Registros",
              data: values,
              backgroundColor: ["rgba(53, 16, 185, 0.8)", "rgba(199, 246, 59, 0.8)"],
              borderColor: ["rgba(53, 16, 185, 0.8)", "rgba(199, 246, 59, 0.8)"],
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
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
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
              animation: { duration: 0 },
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