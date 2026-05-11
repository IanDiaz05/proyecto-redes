import { useState } from "react";
import { Search, Package, CreditCard, Star, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { fetchApi } from "@/services/apicalls";

export default function OrderSearch() {
  const [orderId, setOrderId] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [orderData, setOrderData] = useState(null);
  const [error, setError] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!orderId.trim()) return;

    setLoading(true);
    setError(null);
    setIsOpen(true); // Abrimos el modal de inmediato en estado de carga

    try {
      const result = await fetchApi(`/pedido/${orderId.trim()}`);
      setOrderData(result);
    } catch (err) {
      setError("No se pudo encontrar el pedido. Verifica que el ID sea correcto.");
      setOrderData(null);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(val);

  return (
    <>
      {/* Barra de Búsqueda Global */}
      <form onSubmit={handleSearch} className="relative hidden md:flex items-center w-full max-w-sm ml-4">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500 dark:text-zinc-400" />
        <Input
          type="text"
          placeholder="Buscar ID de pedido (ej. dbb67791e...)"
          className="w-full bg-zinc-100 dark:bg-zinc-900 border-transparent focus-visible:ring-emerald-500 pl-9 pr-4 h-9 text-sm rounded-full"
          value={orderId}
          onChange={(e) => setOrderId(e.target.value)}
        />
      </form>

      {/* Modal de Detalle de Pedido */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[600px] bg-card text-card-foreground">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-emerald-500" />
              Detalle del Pedido
            </DialogTitle>
            <DialogDescription className="break-all font-mono text-xs">
              ID: {orderId}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {loading ? (
              <div className="flex justify-center items-center py-8 text-muted-foreground">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mr-3"></div>
                Buscando registros...
              </div>
            ) : error ? (
              <div className="flex flex-col items-center gap-2 py-6 text-red-500 text-center">
                <AlertCircle className="w-8 h-8" />
                <p className="text-sm font-medium">{error}</p>
              </div>
            ) : orderData ? (
              <div className="space-y-6 animate-in fade-in">
                
                {/* Items del Pedido */}
                <div>
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-zinc-500">
                    Productos Adquiridos
                  </h3>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                    {orderData.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-zinc-100 dark:bg-zinc-900 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800">
                        <div>
                          <p className="text-sm font-medium capitalize">{item.categoria.replace(/_/g, ' ')}</p>
                          <p className="text-xs text-muted-foreground font-mono">Seller State: {item.estado_vendedor}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-emerald-500">{formatCurrency(item.total_value)}</p>
                          <p className="text-xs text-muted-foreground">Flete: {formatCurrency(item.freight_value)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Información de Pago */}
                  <div className="bg-zinc-100 dark:bg-zinc-900 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800">
                    <h3 className="text-sm font-semibold mb-2 flex items-center gap-2 text-zinc-500">
                      <CreditCard className="w-4 h-4" /> Pago
                    </h3>
                    {orderData.pagos.map((pago, idx) => (
                      <div key={idx} className="mt-2">
                        <p className="text-sm capitalize font-medium">{pago.payment_type.replace(/_/g, ' ')}</p>
                        <p className="text-xs text-muted-foreground">{pago.payment_installments} mensualidad(es)</p>
                      </div>
                    ))}
                  </div>

                  {/* Información de Reseña */}
                  <div className="bg-zinc-100 dark:bg-zinc-900 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800">
                    <h3 className="text-sm font-semibold mb-2 flex items-center gap-2 text-zinc-500">
                      <Star className="w-4 h-4" /> Satisfacción
                    </h3>
                    <div className="flex items-center gap-1 mt-3">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star 
                          key={star} 
                          className={`w-5 h-5 ${star <= orderData.resena?.review_score ? "text-yellow-500 fill-yellow-500" : "text-zinc-300 dark:text-zinc-700"}`} 
                        />
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            ) : null}
          </div>
          
          {/* Botón para cerrar */}
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setIsOpen(false)}>Cerrar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}