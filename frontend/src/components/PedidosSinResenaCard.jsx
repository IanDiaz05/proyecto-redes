import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { fetchApi } from "@/services/apicalls";
import { EyeOff } from "lucide-react";

export default function PedidosSinResenaCard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchApi("/pedidos-sin-resena")
      .then(res => setData(res))
      .catch(err => console.error("Error sin reseña:", err));
  }, []);

  return (
    <Card className="bg-card">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">Punto Ciego (Sin Reseñas)</CardTitle>
        <EyeOff className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {data ? (
          <div className="space-y-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">{data.pct_sin_resena}%</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {new Intl.NumberFormat('en-US').format(data.pedidos_sin_resena)} de {new Intl.NumberFormat('en-US').format(data.total_pedidos)} pedidos no tienen feedback.
            </p>
            <Progress value={data.pct_sin_resena} className="h-2 bg-zinc-800" />
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">Cargando...</span>
        )}
      </CardContent>
    </Card>
  );
}