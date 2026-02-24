import React, { useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import LocationDetails from "./LocationDetails";
import OpenLayersMap from "./OpenLayersMap";
import { NGINX_URL } from "@/config";
import L from "leaflet";

export default function MapViewer({ map, locations }) {
  const [selectedLocation, setSelectedLocation] = useState(null);

  // bounds в CRS.Simple: [[y0,x0],[y1,x1]]
  const bounds = useMemo(
    () => [[0, 0], [map.height, map.width]],
    [map.height, map.width]
  );

  // центр карты в пикселях
  const center = useMemo(
    () => [map.height / 2, map.width / 2],
    [map.height, map.width]
  );

  return (
    <div className="flex h-[80vh] gap-4">
        <div className="flex-1 border rounded overflow-hidden">
            <OpenLayersMap
              mapId={map.id}
              nginxUrl={NGINX_URL}
              width={map.width}
              height={map.height}
              maxZoom={map.max_zoom}
              locations={locations}
              onSelectLocation={setSelectedLocation}
            />
        </div>

      <div className="w-1/3 p-4 border rounded bg-[rgba(252,247,233,0.95)] overflow-y-auto flex flex-col gap-4">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-bold">Locations</h2>
        </div>

        {selectedLocation ? (
          <LocationDetails location={selectedLocation} />
        ) : (
          <p className="text-amber-900">Select a location on the map to view details.</p>
        )}
      </div>
    </div>
  );
}