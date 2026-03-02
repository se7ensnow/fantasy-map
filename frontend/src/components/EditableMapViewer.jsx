import React, { useState } from "react";
import LocationEditor from "./LocationEditor";
import OpenLayersMap from "./OpenLayersMap";
import { NGINX_URL } from "@/config";
import { Button } from "@/components/ui/button";

export default function EditableMapViewer({
    map,
    locations,
    onAddLocation,
    onDeleteLocation,
    onUpdateLocation,
}) {
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [addMode, setAddMode] = useState(false);
    const [newLocationCoords, setNewLocationCoords] = useState(null);

    const handleSaveNewLocation = (locationData) => {
        if (!newLocationCoords) return;

        const fullLocationData = {
            ...locationData,
            map_id: map.id,
            x: newLocationCoords.x,
            y: newLocationCoords.y,
        };

        onAddLocation(fullLocationData);
        setAddMode(false);
        setNewLocationCoords(null);
    };

    const handleSaveEditedLocation = (locationData) => {
        if (!selectedLocation) return;

        const fullLocationData = {
            ...locationData,
            map_id: map.id,
        };

        onUpdateLocation(selectedLocation.id, fullLocationData);
        setSelectedLocation(null);
    };

    return (
        <div className="flex h-[80vh] gap-4">
            {/* Map */}
            <div className="flex-1 rounded overflow-hidden relative">
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

            {/* Right panel */}
            <div className="w-1/3 p-4 rounded bg-surface-panel/95 overflow-y-auto flex flex-col gap-4">
                <div className="flex justify-between items-center mb-2">
                    <h2 className="text-xl font-bold text-text-heading">Locations</h2>

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
                            onCancel={() => setSelectedLocation(null)}
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
                    <p className="text-text-heading">
                        Select a location on the map or click "Add Location" to create a new
                        one.
                    </p>
                )}
            </div>
        </div>
    );
}