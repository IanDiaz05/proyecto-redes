import { useState, useEffect } from 'react';
import DeckGL from '@deck.gl/react';
import { ArcLayer } from '@deck.gl/layers';
import Map from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchApi } from "@/services/apicalls";

const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

const INITIAL_VIEW_STATE = {
  longitude: -48.232976,
  latitude: -14.235,
  zoom: 3.5,
  pitch: 50,
  bearing: 0
};

export default function FleteDisparidadMap() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchApi("/flete-vs-distancia") 
        .then(res => {
            const arrayDatos = res.data ? res.data : res;
            
            if (Array.isArray(arrayDatos)) {
            // FILTRO MÁGICO: Solo conservamos rutas con disparidad >= 50% (Amarillos y Rojos)
            const rutasCriticas = arrayDatos.filter(d => d.pct_flete_sobre_precio >= 50);
            
            setData(rutasCriticas);
            }
        })
        .catch(err => console.error("Error disparidad flete:", err))
        .finally(() => setLoading(false));
    }, []);

  // Lógica de Semáforo para colores según la disparidad
  const getColor = (pct) => {
    if (pct >= 100) return [239, 68, 68, 220]; // Rojo (Flete más caro que el producto)
    if (pct >= 50) return [250, 204, 21, 200];  // Amarillo (Riesgo medio)
    return [16, 185, 129, 180];                 // Verde (Saludable)
  };

  const layer = new ArcLayer({
    id: 'flete-disparidad-layer',
    data,
    pickable: true,
    getWidth: d => Math.max(1.5, Math.sqrt(d.total_envios)), // El grosor es el volumen de envíos
    getSourcePosition: d => [d.lon_origen, d.lat_origen],
    getTargetPosition: d => [d.lon_destino, d.lat_destino],
    
    // Aplicamos los colores de la alerta
    getSourceColor: d => getColor(d.pct_flete_sobre_precio),
    getTargetColor: d => getColor(d.pct_flete_sobre_precio),
    
    // Hacemos que las rutas críticas se eleven más en el mapa 3D
    getHeight: d => d.pct_flete_sobre_precio >= 100 ? 0.7 : 0.2, 
  });

  const formatCurrency = (val) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

  return (
    <Card className="bg-card col-span-1 md:col-span-2 h-[500px] overflow-hidden flex flex-col border-red-900/20">
      <CardHeader className="pb-2 shrink-0">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          Análisis Crítico: Disparidad de Flete vs Precio del Producto
        </CardTitle>
        <CardDescription className="text-xs">
          Arcos <span className="text-red-500 font-bold">rojos altos</span> indican rutas donde el envío cuesta más que el producto mismo (gasto mayor a 100%).
          <br />
          Arcos <span className="text-yellow-400 font-bold">amarillos</span> muestran rutas con disparidad entre 50% y 100% (riesgo medio).
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0 flex-1 relative">
        {loading ? (
          <div className="h-full w-full p-4"><Skeleton className="h-full w-full rounded-md" /></div>
        ) : (
          <DeckGL
            initialViewState={INITIAL_VIEW_STATE}
            controller={true}
            layers={[layer]}
            getTooltip={({object}) => object && (
              `Ruta: ${object.ciudad_origen} (${object.estado_origen}) ➔ ${object.ciudad_destino} (${object.estado_destino})\n` +
              `Distancia: ${object.distancia_km.toFixed(1)} km\n` +
              `-------------------------------------\n` +
              `Precio Promedio Prod: ${formatCurrency(object.precio_promedio)}\n` +
              `Flete Promedio: ${formatCurrency(object.flete_promedio)}\n` +
              `DISPARIDAD: ${object.pct_flete_sobre_precio.toFixed(1)}% (Costo Flete vs Prod)`
            )}
          >
            <Map mapStyle="mapbox://styles/mapbox/dark-v11" mapboxAccessToken={MAPBOX_ACCESS_TOKEN} />
          </DeckGL>
        )}
      </CardContent>
    </Card>
  );
}