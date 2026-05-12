import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { fetchApi } from "@/services/apicalls"
import { DollarSign, ShoppingCart, Activity, Truck } from "lucide-react"

export default function KpiCards() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const loadKpis = async () => {
      try {
        const result = await fetchApi("/kpis-resumen")
        setData(result)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadKpis()
  }, [])

  // Formateador de moneda para USD/BRL (el dataset es brasileño, pero usamos formato estándar)
  const formatCurrency = (value) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)

  if (error) {
    return <div className="text-destructive font-semibold">Error al cargar KPIs: {error}</div>
  }

  const kpiConfig = [
    {
      title: "Ingresos Totales",
      value: data ? formatCurrency(data.total_ventas) : null,
      icon: <DollarSign className="h-4 w-4 text-muted-foreground"/>,
    },
    {
      title: "Total Pedidos",
      value: data ? new Intl.NumberFormat('en-US').format(data.total_pedidos) : null,
      icon: <ShoppingCart className="h-4 w-4 text-muted-foreground"/>,
    },
    {
      title: "Ticket Promedio",
      value: data ? formatCurrency(data.ticket_promedio) : null,
      icon: <Activity className="h-4 w-4 text-muted-foreground"/>,
    },
    {
      title: "Total Flete",
      value: data ? formatCurrency(data.total_flete) : null,
      icon: <Truck className="h-4 w-4 text-muted-foreground"/>,
    }
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {kpiConfig.map((kpi, index) => (
        <Card className="bg-card" key="{index}">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {kpi.title}
            </CardTitle>
            {kpi.icon}
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-[120px]"/>
            ) : (
              <div className="text-2xl font-bold">{kpi.value}</div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}