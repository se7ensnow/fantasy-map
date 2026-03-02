import React, { useMemo, useState } from "react";
import "leaflet/dist/leaflet.css";
import LocationDetails from "./LocationDetails";
import OpenLayersMap from "./OpenLayersMap";
import { NGINX_URL } from "@/config";

export default function MapViewer({ map, locations }) {
    const [selectedLocation, setSelectedLocation] = useState(null);

    // bounds/center тут уже не используются — можно удалить, чтобы не было “мертвого” кода
    // (раньше нужно было для react-leaflet)
    // const bounds = useMemo(() => [[0, 0], [map.height, map.width]], [map.height, map.width]);
    // const center = useMemo(() => [map.height / 2, map.width / 2], [map.height, map.width]);

    return (
        <div className="flex h-[80vh] gap-4">
            <div className="flex-1 rounded overflow-hidden">
                <OpenLayersMap
                    mapId={map.id}
                    nginxUrl={NGINX_URL}
                    width={map.width}
                    height={map.height}
                    maxZoom={map.max_zoom}
                    locations={locations}
                    onSelectLocation={setSelectedLocation}
                    selectedLocationId={selectedLocation?.id ?? null}
                />
            </div>

            <div className="w-1/3 p-4 rounded bg-surface-panel/95 overflow-y-auto flex flex-col gap-4">
                <div className="flex justify-between items-center mb-2">
                    <h2 className="text-xl font-bold text-text-heading">Locations</h2>
                </div>

                {selectedLocation ? (
                    <LocationDetails location={selectedLocation} />
                ) : (
                    <p className="text-text-heading">
                        Select a location on the map to view details.
                    </p>
                )}
            </div>
        </div>
    );
}