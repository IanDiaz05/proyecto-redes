import { useState, useEffect } from 'react';
import DeckGL from '@deck.gl/react';
import { ScatterplotLayer } from '@deck.gl/layers';
import Map from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchApi } from "@/services/apicalls";

const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

// Vista inicial centrada en Brasil
const INITIAL_VIEW_STATE = {
  longitude: -48.232976,
  latitude: -14.235,
  zoom: 3.5,
  pitch: 0,
  bearing: 0
};

export default function MapaSellers() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApi("/mapa-vendedores")
      .then(res => {
        // Filtramos para evitar errores si vienen coordenadas nulas
        const validData = res.filter(d => d.longitude && d.latitude);
        setData(validData);
      })
      .catch(err => console.error("Error mapa vendedores:", err))
      .finally(() => setLoading(false));
  }, []);

  const layer = new ScatterplotLayer({
    id: 'sellers-layer',
    data,
    pickable: true,
    opacity: 0.8,
    stroked: true,
    filled: true,
    radiusScale: 30,
    radiusMinPixels: 2,
    radiusMaxPixels: 50,
    lineWidthMinPixels: 1,
    getPosition: d => [d.longitude, d.latitude],
    // El radio depende de los ingresos (ajusta el divisor según tus datos reales)
    getRadius: d => Math.sqrt(d.ingresos_totales) * 2,
    getFillColor: [16, 185, 129], // Emerald 500
    getLineColor: [4, 120, 87],   // Emerald 700
  });

  return (
    <Card className="bg-card col-span-1 h-[450px] overflow-hidden flex flex-col">
      <CardHeader className="pb-2 shrink-0">
        <CardTitle className="text-sm font-medium">Distribución de Vendedores (Por Ingresos)</CardTitle>
      </CardHeader>
      <CardContent className="p-0 flex-1 relative">
        {loading ? (
          <div className="h-full w-full p-4"><Skeleton className="h-full w-full rounded-md" /></div>
        ) : (
          <DeckGL
            initialViewState={INITIAL_VIEW_STATE}
            controller={true}
            layers={[layer]}
            getTooltip={({object}) => object && `${object.ciudad}, ${object.estado}\nIngresos: $${object.ingresos_totales.toLocaleString()}\nPedidos: ${object.total_pedidos}`}
          >
            {/* Usamos el tema oscuro nativo de mapbox */}
            <Map mapStyle="mapbox://styles/mapbox/dark-v11" mapboxAccessToken={MAPBOX_ACCESS_TOKEN} />
          </DeckGL>
        )}
      </CardContent>
    </Card>
  );
}