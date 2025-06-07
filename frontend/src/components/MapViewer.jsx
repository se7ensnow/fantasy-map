import React, { useState } from "react";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import LocationDetails from "./LocationDetails";
import { NGINX_URL } from "@/config";
import L from "leaflet";

const BOUNDS = [
    [-66, -180],
    [500, 180]
];

export default function MapViewer({ map, locations }) {
    const [selectedLocation, setSelectedLocation] = useState(null);

    return (
        <div className="flex h-[80vh] gap-4">
            <div className="flex-1 border rounded overflow-hidden">
                <MapContainer
                    crs={L.CRS.EPSG3857}
                    center={[60, 0]}
                    zoom={3}
                    minZoom={2}
                    maxZoom={map.max_zoom}
                    style={{ height: "100%", width: "100%" }}
                >
                    <TileLayer
                        url={`${NGINX_URL}/tiles/${map.id}/{z}/{x}/{y}.png`}
                        tileSize={256}
                        noWrap={true}
                        minZoom={2}
                        maxZoom={5}
                    />

                    {locations.map((loc) => (
                        <Marker
                            key={loc.id}
                            position={[loc.y, loc.x]}
                            eventHandlers={{
                                click: () => setSelectedLocation(loc)
                            }}
                        />
                    ))}
                </MapContainer>
            </div>

            {/* Правая панель */}
            <div className="w-1/3 p-4 border rounded bg-[rgba(252,247,233,0.95)] overflow-y-auto flex flex-col gap-4">
                {/* Верхний заголовок */}
                <div className="flex justify-between items-center mb-2">
                    <h2 className="text-xl font-bold">Locations</h2>
                </div>

                {/* Контент: либо Details, либо сообщение */}
                {selectedLocation ? (
                    <LocationDetails location={selectedLocation} />
                ) : (
                    <p className="text-amber-900">Select a location on the map to view details.</p>
                )}
            </div>
        </div>
    );
}