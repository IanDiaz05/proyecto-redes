import { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchApi } from "@/services/apicalls";
import { Clock, Copy, Check } from "lucide-react";

export default function VentasRecientesTable() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await fetchApi("/ventas-recientes");
        const arrayDatos = res.data ? res.data : res;
        
        if (Array.isArray(arrayDatos)) {
          setData(arrayDatos.slice(0, 9)); 
        }
      } catch (error) {
        console.error("Error al cargar ventas recientes:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);

  const formatCurrency = (val) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

  const shortId = (id) => id.includes('-') ? id.split('-')[1].substring(0, 8) : id.substring(0, 8);

  // copiar al portapapeles
  const handleCopy = (fullId) => {
    navigator.clipboard.writeText(fullId);
    setCopiedId(fullId);
    
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  return (
    <Card className="bg-card col-span-1 h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-2 shrink-0">
        <CardTitle className="text-sm font-medium">Live Feed (Últimos Pedidos)</CardTitle>
        <Clock className="h-4 w-4 text-muted-foreground animate-pulse" />
      </CardHeader>
      <CardContent className="p-0 flex-1 overflow-x-auto">
        {loading ? (
          <div className="space-y-3 p-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-800">
                <TableHead className="h-8 text-[10px] uppercase">ID</TableHead>
                <TableHead className="h-8 text-[10px] uppercase">Categoría</TableHead>
                <TableHead className="h-8 text-[10px] uppercase text-center">Destino</TableHead>
                <TableHead className="h-8 text-[10px] uppercase text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((venta, idx) => (
                <TableRow key={idx} className="border-zinc-800/50 hover:bg-zinc-800/20">
                  
                  {/* Celda del ID Interactiva */}
                  <TableCell className="font-mono text-xs font-medium text-zinc-400">
                    <div 
                      className="group flex items-center gap-1.5 cursor-pointer hover:text-zinc-200 transition-colors"
                      onClick={() => handleCopy(venta.order_id)}
                      title="Copiar ID completo"
                    >
                      <span>{shortId(venta.order_id)}</span>
                      {copiedId === venta.order_id ? (
                        <Check className="h-3 w-3 text-emerald-500" />
                      ) : (
                        <Copy className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </div>
                  </TableCell>

                  <TableCell className="text-[11px] capitalize max-w-[100px] truncate">
                    {venta.categoria.replace(/_/g, ' ')}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className="text-[9px] px-1 py-0 border-cyan-500/20 text-cyan-600">
                      {venta.estado_cliente}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-semibold text-emerald-500 text-xs">
                    {formatCurrency(venta.total_value)}
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