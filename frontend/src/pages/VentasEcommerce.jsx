import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TopCategoriesTable from "@/components/TopCategoriesTable";
import NegativeReviewsTable from "@/components/NegativeReviewsTable";
import PriceRangeChart from "@/components/PriceRangeChart";
import SalesByDayChart from "@/components/SalesByDayChart";
import VentasPorEstadoChart from "@/components/VentasPorEstadoChart";
import RelacionPrecioFleteChart from "@/components/RelacionPrecioFleteChart";
import VentasPorTrimestreChart from "@/components/VentasPorTrimestreChart";
import MetodosPagoChart from "@/components/MetodosPagoChart";
import TopClientesTable from "@/components/TopClientesTable";
import PedidosSinResenaCard from "@/components/PedidosSinResenaCard";
import MapaClientes from "@/components/MapaClientes";
import MapaSellers from "@/components/MapaSellers";

export default function VentasEcommerce() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Ventas E-commerce</h1>
        <p className="text-muted-foreground">Análisis de catálogo, comportamiento de compra y logística.</p>
      </div>
      
      <Tabs defaultValue="catalogo" className="w-full">
        {/* Navegación de las pestañas */}
        <TabsList className="flex h-auto w-full overflow-x-auto justify-start p-1 md:grid md:grid-cols-3 mb-8 bg-zinc-200 dark:bg-zinc-800/50">
          <TabsTrigger value="catalogo" className="whitespace-nowrap px-4">
            Catálogo y Calidad
          </TabsTrigger>
          <TabsTrigger value="logistica" className="whitespace-nowrap px-4">
            Logística y Geografía
          </TabsTrigger>
          <TabsTrigger value="comportamiento" className="whitespace-nowrap px-4">
            Comportamiento del Cliente
          </TabsTrigger>
        </TabsList>

        {/* Pestaña 1: Catálogo */}
        <TabsContent value="catalogo" className="space-y-4">
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
            <div className="lg:col-span-2"><TopCategoriesTable /></div>
            <div className="lg:col-span-1"><NegativeReviewsTable /></div>
          </div>
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
            <PriceRangeChart />
            <SalesByDayChart />
          </div>
        </TabsContent>

        <TabsContent value="logistica" className="space-y-4">
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
            <VentasPorEstadoChart />
            <RelacionPrecioFleteChart />
          </div>
          
          {/* Nueva fila con los Mapas Interactivos */}
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 mt-6">
            <MapaClientes />
            <MapaSellers />
          </div>
        </TabsContent>

        {/* Pestaña 3: Comportamiento */}
        <TabsContent value="comportamiento" className="space-y-4">
          {/* Fila 1: Estacionalidad y Pagos */}
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
            <VentasPorTrimestreChart />
            <MetodosPagoChart />
          </div>
          
          {/* Fila 2: Whales y Alerta de Reseñas */}
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <TopClientesTable />
            </div>
            <div className="lg:col-span-1">
              <PedidosSinResenaCard />
            </div>
          </div>
        </TabsContent>

      </Tabs>
    </div>
  );
}