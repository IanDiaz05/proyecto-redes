import TopCategoriesTable from "@/components/TopCategoriesTable"

export default function VentasEcommerce() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Ventas E-commerce</h1>
        <p className="text-muted-foreground">Análisis detallado del Data Warehouse (Tráfico TCP).</p>
      </div>
      
      <div className="grid gap-4 grid-cols-1 xl:grid-cols-2">
        <TopCategoriesTable />
        {/* Aquí agregaremos Ventas por Estado, Trimestre, etc. */}
      </div>
    </div>
  )
}