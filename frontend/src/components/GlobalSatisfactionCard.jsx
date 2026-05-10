import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchApi } from "@/services/apicalls";
import { Star, ThumbsUp } from "lucide-react";

export default function GlobalSatisfactionCard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const result = await fetchApi("/kpi-satisfaccion");
        setData(result);
      } catch (error) {
        console.error("Error al cargar satisfacción:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  return (
    <Card className="bg-card">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">Satisfacción Global</CardTitle>
        <Star className="h-4 w-4 text-yellow-500" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-2 w-full" />
          </div>
        ) : data ? (
          <div className="space-y-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
                {data.score_promedio}
              </span>
              <span className="text-sm text-muted-foreground">/ 5.0</span>
            </div>
            
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <ThumbsUp className="h-3 w-3" /> {data.pct_positivas}% Positivas
                </span>
                <span>{new Intl.NumberFormat('en-US').format(data.total_resenas)} reseñas</span>
              </div>
              <Progress value={data.pct_positivas} className="h-2" />
            </div>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">Sin datos</span>
        )}
      </CardContent>
    </Card>
  );
}