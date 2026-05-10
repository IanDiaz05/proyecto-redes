import { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fetchApi } from "@/services/apicalls";
import { Crown } from "lucide-react";

export default function TopClientesTable() {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetchApi("/top-clientes-por-gasto")
      .then(res => setData(res.slice(0, 5)))
      .catch(err => console.error("Error top clientes:", err));
  }, []);

  const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

  return (
    <Card className="bg-card">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-amber-500">Top 5 Clientes (Whales)</CardTitle>
        <Crown className="h-4 w-4 text-amber-500" />
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ubicación</TableHead>
              <TableHead className="text-center">Pedidos</TableHead>
              <TableHead className="text-right">Gasto Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((cliente, idx) => (
              <TableRow key={idx}>
                <TableCell className="text-xs">
                  {cliente.ciudad}, <span className="font-bold">{cliente.estado}</span>
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="outline">{cliente.total_pedidos}</Badge>
                </TableCell>
                <TableCell className="text-right font-medium text-emerald-500">
                  {formatCurrency(cliente.gasto_total)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}