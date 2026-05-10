import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchApi } from "@/services/apicalls";

export default function TopCategoriesTable() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await fetchApi("/top-categorias");
        // Limitamos a los top 6 para no saturar el dashboard visualmente
        setCategories(data.slice(0, 6)); 
      } catch (error) {
        console.error("Error al cargar top categorías:", error);
      } finally {
        setLoading(false);
      }
    };
    loadCategories();
  }, []);

  const formatCurrency = (value) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  const formatCategoryName = (name) => {
    return name.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  return (
    <Card className="col-span-1 md:col-span-2 bg-card">
      <CardHeader>
        <CardTitle className="text-sm font-medium">Top Categorías por Ingresos</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Categoría</TableHead>
                <TableHead className="text-right">Items Vendidos</TableHead>
                <TableHead className="text-right">Ingresos Totales</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((cat, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">
                    {formatCategoryName(cat.categoria)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="secondary">
                      {new Intl.NumberFormat('en-US').format(cat.items_vendidos)} unids
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-semibold text-emerald-500 dark:text-emerald-400">
                    {formatCurrency(cat.ingresos_totales)}
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