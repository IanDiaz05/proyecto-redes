import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Terminal, Shield, Database, Activity } from "lucide-react";

export default function ApiDocs() {
  const endpoints = [
    { method: "GET", path: "/kpis-resumen", desc: "Métricas globales del Data Warehouse." },
    { method: "GET", path: "/ventas-por-estado", desc: "Ventas consolidadas por región (Barras)." },
    { method: "GET", path: "/top-categorias", desc: "Top 10 de categorías con más ingresos." },
    { method: "GET", path: "/ventas-por-trimestre", desc: "Estacionalidad y ventas por trimestre." },
    { method: "GET", path: "/ventas-por-dia-semana", desc: "Ingresos consolidados por día de la semana." },
    { method: "GET", path: "/kpi-satisfaccion", desc: "Score de reseñas y porcentaje positivo." },
    { method: "GET", path: "/pedido/{order_id}", desc: "Detalle completo de un pedido específico." },
    { method: "GET", path: "/relacion-precio-flete", desc: "Comparación de precio vs flete por categoría." },
    { method: "GET", path: "/heatmap-estado-mes", desc: "Densidad de ventas por estado a lo largo del tiempo." },
    { method: "GET", path: "/resenas-negativas-por-categoria", desc: "Alertas de calidad y peores categorías." },
    { method: "GET", path: "/rendimiento-vendedores", desc: "Score, ventas y total de pedidos por vendedor." },
    { method: "GET", path: "/mapa-vendedores", desc: "Coordenadas geográficas y datos de vendedores." },
    { method: "GET", path: "/pagos-por-estado", desc: "Métodos de pago preferidos por región." },
    { method: "GET", path: "/ticket-promedio-mensual", desc: "Línea de tendencia del ticket promedio a lo largo de los meses." },
    { method: "GET", path: "/precios-por-categoria", desc: "Rango de precios (Mínimo, Máximo, Promedio)." },
    { method: "GET", path: "/top-clientes-por-gasto", desc: "Top 10 de clientes con mayor gasto (Whales)." },
    { method: "GET", path: "/pedidos-sin-resena", desc: "Total y porcentaje de pedidos en punto ciego (sin reseña)." },
    { method: "GET", path: "/comparativa-anual", desc: "Crecimiento de ingresos y pedidos año contra año." },
    { method: "GET", path: "/telemetria-vivo", desc: "Últimos 20 registros del puerto UDP en tiempo real." },
    { method: "GET", path: "/balance-protocolos", desc: "Carga de la red (TCP vs UDP)." },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Documentación de la API</h1>
        <p className="text-muted-foreground">Interactúa con nuestro backend RESTful construido en FastAPI.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        
        {/* Columna Izquierda: Arquitectura y Autenticación */}
        <div className="md:col-span-1 space-y-6 min-w-0">
          <Card className="bg-card">
            <CardHeader>
              <CardTitle className="text-md flex items-center gap-2">
                <Database className="w-4 h-4 text-blue-500" />
                Arquitectura
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-4">
              <p>
                Este proyecto utiliza un modelo de base de datos en <strong>Esquema de Estrella (Star Schema)</strong>, separando las tablas de hechos (`fact_sales`, `fact_payments`) de las dimensiones (`dim_customers`, `dim_products`).
              </p>
              <p>
                Además, cuenta con un pipeline de ingesta dual que procesa registros del E-commerce vía HTTP/TCP y telemetría de sensores en tiempo real escuchando en un puerto UDP.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-emerald-900/30">
            <CardHeader>
              <CardTitle className="text-md flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-500" />
                Autenticación (Postman)
              </CardTitle>
              <CardDescription>Header requerido para todas las peticiones.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* AÑADIDO: w-full al contenedor */}
              <div className="bg-zinc-950 p-3 rounded-md border border-zinc-800 font-mono text-xs overflow-x-auto w-full">
                <div className="text-zinc-500 mb-1"># Agregar en la pestaña "Headers" de Postman</div>
                <div className="flex justify-between">
                  <span className="text-sky-400">Key:</span>
                  <span className="text-zinc-300">X-API-Key</span>
                </div>
                {/* AÑADIDO: flex-col para móviles, break-all para el token largo */}
                <div className="flex flex-col sm:flex-row sm:justify-between mt-1 gap-1 sm:gap-0">
                  <span className="text-sky-400">Value:</span>
                  <span className="text-emerald-400 font-bold break-all">afauERmBjUYhRvQYnAfTRp5g4DwwXecTC78y2SNXJB1Mwpm6zSGggu1dr4ZDs5tA</span>
                </div>
              </div>
              <div className="bg-zinc-950 p-3 rounded-md border border-zinc-800 font-mono text-xs overflow-x-auto w-full mt-2">
                 <div className="text-zinc-500 mb-1"># Base URL</div>
                 {/* AÑADIDO: break-all para la URL */}
                 <div className="text-zinc-300 break-all">https://api-dw.iandigitals.com/api/datos</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Columna Derecha: Lista de Endpoints */}
        <div className="md:col-span-2 min-w-0">
          <Card className="bg-card flex flex-col h-[58vh]">
            <CardHeader className="shrink-0">
              <CardTitle className="text-md flex items-center gap-2">
                <Terminal className="w-4 h-4 text-purple-500" />
                Endpoints Disponibles
              </CardTitle>
              <CardDescription>Añade estos paths a la Base URL para realizar tus pruebas.</CardDescription>
            </CardHeader>
            
            <CardContent className="flex-1 overflow-y-auto pr-4 space-y-3 pb-6">
              {endpoints.map((ep, idx) => (
                <div key={idx} className="flex flex-col xl:flex-row xl:items-center justify-between p-3 rounded-lg bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors">
                  <div className="flex items-center gap-3 mb-2 xl:mb-0">
                    <Badge variant="outline" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 font-mono shrink-0">
                      {ep.method}
                    </Badge>
                    <code className="text-sm font-mono text-zinc-900 dark:text-zinc-100 font-semibold break-all">
                      {ep.path}
                    </code>
                  </div>
                  <span className="text-xs text-muted-foreground xl:max-w-[50%] xl:text-right">
                    {ep.desc}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}