import React, { useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import LocationDetails from "./LocationDetails";
import LocationEditor from "./LocationEditor";
import { NGINX_URL } from "@/config";
import { Button } from "@/components/ui/button";
import L from "leaflet";

const BOUNDS = [
    [-66, -180],
    [500, 180]
];

function AddLocationHandler({ onMapClick }) {
    useMapEvents({
        click(e) {
            const { lat, lng } = e.latlng;
            onMapClick({ x: lng, y: lat });
        }
    });
    return null;
}

export default function EditableMapViewer({ map, locations, onAddLocation, onDeleteLocation, onUpdateLocation }) {
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [addMode, setAddMode] = useState(false);
    const [newLocationCoords, setNewLocationCoords] = useState(null);

    const handleMapClick = (coords) => {
        if (addMode) {
            setNewLocationCoords(coords);
        }
    };

    const handleSaveNewLocation = (locationData) => {
        if (!newLocationCoords) return;

        const fullLocationData = {
            ...locationData,
            map_id: map.id,
            x: newLocationCoords.x,
            y: newLocationCoords.y
        };

        onAddLocation(fullLocationData);
        setAddMode(false);
        setNewLocationCoords(null);
    };

    const handleSaveEditedLocation = (locationData) => {
        if (!selectedLocation) return;

        const fullLocationData = {
            ...locationData,
            map_id: map.id
        };

        onUpdateLocation(selectedLocation.id, fullLocationData);
        setSelectedLocation(null);
    }

    return (
        <div className="flex h-[80vh] gap-4">
            <div className="flex-1 border rounded overflow-hidden relative">
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
                                click: () => {
                                    setSelectedLocation(loc);
                                    setAddMode(false);
                                    setNewLocationCoords(null);
                                }
                            }}
                        />
                    ))}

                    {addMode && <AddLocationHandler onMapClick={handleMapClick} />}

                    {newLocationCoords && (
                        <Marker position={[newLocationCoords.y, newLocationCoords.x]} />
                    )}
                </MapContainer>
            </div>

            <div className="w-1/3 p-4 border rounded bg-[rgba(252,247,233,0.95)] overflow-y-auto flex flex-col gap-4">
                {/* Верхний блок с заголовком + кнопкой */}
                <div className="flex justify-between items-center mb-2">
                    <h2 className="text-xl font-bold">Locations</h2>
                    <Button
                        onClick={() => {
                            setAddMode(!addMode);
                            setSelectedLocation(null);
                            setNewLocationCoords(null);
                        }}
                    >
                        {addMode ? "Cancel Add" : "Add Location"}
                    </Button>
                </div>

                {/* Контент правой панели */}
                {addMode && newLocationCoords ? (
                    <LocationEditor
                        coords={newLocationCoords}
                        onSave={handleSaveNewLocation}
                        onCancel={() => {
                            setAddMode(false);
                            setNewLocationCoords(null);
                        }}
                    />
                ) : selectedLocation ? (
                    <>
                        <LocationEditor
                            location={selectedLocation}
                            onSave={handleSaveEditedLocation}
                            onCancel={() => {
                                setSelectedLocation(null);
                            }}
                        />
                        <div className="mt-4 space-x-2">
                            <Button
                                variant="destructive"
                                onClick={() => {
                                    onDeleteLocation(selectedLocation.id);
                                    setSelectedLocation(null);
                                }}
                            >
                                Delete Location
                            </Button>
                        </div>
                    </>
                ) : (
                    <p className="text-amber-900">Select a location on the map or click "Add Location" to create a new one.</p>
                )}
            </div>
        </div>
    );
}