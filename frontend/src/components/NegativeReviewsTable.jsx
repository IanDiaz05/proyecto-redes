import { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchApi } from "@/services/apicalls";
import { AlertTriangle } from "lucide-react";

export default function NegativeReviewsTable() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const result = await fetchApi("/resenas-negativas-por-categoria");
        setData(result.slice(0, 5)); // Mostramos solo el Top 5 más crítico
      } catch (error) {
        console.error("Error al cargar reseñas negativas:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const formatCategoryName = (name) => 
    name.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

  return (
    <Card className="col-span-1 bg-card border-red-900/20 dark:border-red-900/50">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-red-600 dark:text-red-400">
          Alertas de Calidad (Peores Categorías)
        </CardTitle>
        <AlertTriangle className="h-4 w-4 text-red-500" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-32 w-full" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Categoría</TableHead>
                <TableHead className="text-center">Malas Reseñas</TableHead>
                <TableHead className="text-right">Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((cat, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium text-xs">
                    {formatCategoryName(cat.categoria)}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="destructive">{cat.resenas_negativas}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-semibold text-red-500">
                    {cat.score_promedio}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}