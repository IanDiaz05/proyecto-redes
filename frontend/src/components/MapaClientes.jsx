import { useState, useEffect } from 'react';
import DeckGL from '@deck.gl/react';
import { HeatmapLayer } from '@deck.gl/aggregation-layers';
import Map from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchApi } from "@/services/apicalls";

const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

const INITIAL_VIEW_STATE = {
  longitude: -48.232976,
  latitude: -14.235,
  zoom: 3.5,
  pitch: 0,
  bearing: 0
};

export default function MapaClientes() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApi("/mapa-clientes")
      .then(res => {
        // Ojo: Usando latitud y longitud con "d" según tu JSON
        const validData = res.filter(d => d.longitud && d.latitud);
        setData(validData);
      })
      .catch(err => console.error("Error mapa clientes:", err))
      .finally(() => setLoading(false));
  }, []);

  const layer = new HeatmapLayer({
    id: 'customers-heatmap',
    data,
    getPosition: d => [d.longitud, d.latitud],
    getWeight: d => d.total_pedidos, // La intensidad depende de la cantidad de pedidos
    radiusPixels: 40,
    intensity: 1,
    threshold: 0.03,
    // Gradiente térmico (del azul oscuro al rojo vivo pasando por verde/amarillo)
    colorRange: [
      [25, 25, 112],  // Midnight Blue
      [59, 130, 246], // Blue 500
      [16, 185, 129], // Emerald 500
      [250, 204, 21], // Yellow 400
      [239, 68, 68]   // Red 500
    ]
  });

  return (
    <Card className="bg-card col-span-1 h-[450px] overflow-hidden flex flex-col">
      <CardHeader className="pb-2 shrink-0">
        <CardTitle className="text-sm font-medium">Densidad de Demanda (Zonas Calientes)</CardTitle>
      </CardHeader>
      <CardContent className="p-0 flex-1 relative">
        {loading ? (
          <div className="h-full w-full p-4"><Skeleton className="h-full w-full rounded-md" /></div>
        ) : (
          <DeckGL
            initialViewState={INITIAL_VIEW_STATE}
            controller={true}
            layers={[layer]}
          >
            <Map mapStyle="mapbox://styles/mapbox/dark-v11" mapboxAccessToken={MAPBOX_ACCESS_TOKEN} />
          </DeckGL>
        )}
      </CardContent>
    </Card>
  );
}