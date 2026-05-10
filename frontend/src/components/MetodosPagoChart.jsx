import { useEffect, useState } from "react";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, BarController, Tooltip, Legend } from "chart.js";
import { Bar } from "react-chartjs-2";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchApi } from "@/services/apicalls";

ChartJS.register(CategoryScale, LinearScale, BarElement, BarController, Tooltip, Legend);

export default function MetodosPagoChart() {
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchApi("/pagos-por-estado");
        
        // Filtramos para tomar solo los 5 estados con más movimientos para no saturar la gráfica
        const topEstados = [...new Set(data.map(d => d.estado))].slice(0, 5);
        const metodos = [...new Set(data.map(d => d.metodo_pago))];
        
        const colors = {
          "credit_card": "rgba(59, 130, 246, 0.8)", // Blue
          "boleto": "rgba(16, 185, 129, 0.8)",      // Emerald
          "voucher": "rgba(245, 158, 11, 0.8)",     // Amber
          "debit_card": "rgba(239, 68, 68, 0.8)"    // Red
        };

        const datasets = metodos.map(metodo => {
          return {
            label: metodo.replace("_", " ").toUpperCase(),
            data: topEstados.map(estado => {
              const record = data.find(d => d.estado === estado && d.metodo_pago === metodo);
              return record ? record.total_transacciones : 0;
            }),
            backgroundColor: colors[metodo] || "rgba(156, 163, 175, 0.8)",
          };
        });

        setChartData({ labels: topEstados, datasets });
      } catch (error) {
        console.error("Error métodos de pago:", error);
      }
    };
    loadData();
  }, []);

  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle className="text-sm font-medium">Métodos de Pago (Top 5 Estados)</CardTitle>
      </CardHeader>
      <CardContent className="h-[250px]">
        {chartData ? (
          <Bar 
            data={chartData} 
            options={{
              responsive: true, maintainAspectRatio: false,
              scales: {
                x: { stacked: true, grid: { display: false }, ticks: { color: "#a1a1aa" } },
                y: { stacked: true, grid: { color: "rgba(255, 255, 255, 0.1)" }, ticks: { color: "#a1a1aa" } }
              },
              plugins: { legend: { position: 'bottom', labels: { color: '#a1a1aa', boxWidth: 12 } } }
            }} 
          />
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground">Cargando...</div>
        )}
      </CardContent>
    </Card>
  );
}