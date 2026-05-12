import { useState, useEffect } from 'react';
import DeckGL from '@deck.gl/react';
import { ArcLayer } from '@deck.gl/layers';
import Map from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchApi } from "@/services/apicalls";

const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

// Inclinamos el mapa (pitch: 45) para que los arcos 3D se vean espectaculares
const INITIAL_VIEW_STATE = {
  longitude: -48.232976,
  latitude: -14.235,
  zoom: 3.5,
  pitch: 45, 
  bearing: 0
};

export default function RutasLogisticasMap() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApi("/rutas-logisticas")
      .then(res => {
        const arrayDatos = res.data ? res.data : res;
        
        if (Array.isArray(arrayDatos)) {
          setData(arrayDatos);
        }
      })
      .catch(err => console.error("Error rutas logísticas:", err))
      .finally(() => setLoading(false));
  }, []);

  const layer = new ArcLayer({
    id: 'rutas-arc-layer',
    data,
    pickable: true,
    getWidth: d => Math.max(2, Math.sqrt(d.cantidad_paquetes)), 
    getSourcePosition: d => d.origen,
    getTargetPosition: d => d.destino,
    getSourceColor: [16, 185, 129, 200], // Verde Esmeralda (Vendedor)
    getTargetColor: [59, 130, 246, 200], // Azul (Cliente)
  });

  // Formateador de moneda para el tooltip
  const formatCurrency = (val) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

  return (
    <Card className="bg-card col-span-1 h-[450px] overflow-hidden flex flex-col border-emerald-900/30">
      <CardHeader className="pb-2 shrink-0">
        <CardTitle className="text-sm font-medium">Corredores Logísticos (Origen - Destino)</CardTitle>
        <CardDescription className="text-xs">
          Visualización de rutas logísticas entre ciudades de origen y destino.
          <br />
          el color <span className="text-emerald-500 font-bold">verde</span> representa a los vendedores y el <span className="text-blue-500 font-bold">azul</span> a los clientes. El grosor de las líneas indica la cantidad de paquetes transportados.
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
              `${object.ciudad_origen.toUpperCase()} (${object.estado_origen})  ➔  ${object.ciudad_destino.toUpperCase()} (${object.estado_destino})\n` +
              `Paquetes Transportados: ${object.cantidad_paquetes}\n` +
              `Ingresos de Ruta: ${formatCurrency(object.ingresos_totales)}\n` +
              `Flete Promedio: ${formatCurrency(object.flete_promedio)}`
            )}
          >
            <Map mapStyle="mapbox://styles/mapbox/dark-v11" mapboxAccessToken={MAPBOX_ACCESS_TOKEN} />
          </DeckGL>
        )}
      </CardContent>
    </Card>
  );
}