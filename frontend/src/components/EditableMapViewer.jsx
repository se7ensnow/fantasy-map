import React, { useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import LocationEditor from "./LocationEditor";
import OpenLayersMap from "./OpenLayersMap";
import { NGINX_URL } from "@/config";
import { Button } from "@/components/ui/button";

const BOUNDS = [
    [-66, -180],
    [500, 180]
];

export default function EditableMapViewer({ map, locations, onAddLocation, onDeleteLocation, onUpdateLocation }) {
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [addMode, setAddMode] = useState(false);
    const [newLocationCoords, setNewLocationCoords] = useState(null);

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
                <OpenLayersMap
                    mapId={map.id}
                    nginxUrl={NGINX_URL}
                    width={map.width}
                    height={map.height}
                    maxZoom={map.max_zoom}
                    locations={locations}
                    addMode={addMode}
                    previewCoord={newLocationCoords}
                    onMapClick={(coords) => {
                        setNewLocationCoords(coords);
                    }}
                    onSelectLocation={(loc) => {
                        setSelectedLocation(loc);
                        setAddMode(false);
                        setNewLocationCoords(null);
                    }}
                    selectedLocationId={selectedLocation?.id ?? null}
                    editMode={!!selectedLocation && !addMode}
                    onMoveLocation={({ id, x, y }) => {
                        setSelectedLocation((prev) => {
                            if (!prev || prev.id !== id) return prev;
                            return { ...prev, x, y };
                        });
                    }}
                    markerIconUrl="/marker.svg"
                />
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