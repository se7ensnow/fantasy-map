import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import {
    getMapById,
    updateMap,
    createMap,
    uploadImage,
    subscribeToTileProgress,
} from "../api/maps";
import {
    getLocations,
    createLocation,
    updateLocation,
    deleteLocation,
} from "@/api/locations";

import MapForm from "../components/MapForm";
import TilesUploader from "../components/TilesUploader";
import EditableMapViewer from "@/components/EditableMapViewer";

import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";

export default function MapEditPage() {
    const { map_id } = useParams();
    const navigate = useNavigate();

    const [map, setMap] = useState(null);
    const [locations, setLocations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [tilesReadyMessage, setTilesReadyMessage] = useState("");
    const [progressData, setProgressData] = useState(null);
    const [error, setError] = useState("");

    const unsubscribeRef = useRef(null);

    useEffect(() => {
        async function fetchData() {
            try {
                setLoading(true);

                if (map_id) {
                    const mapData = await getMapById(map_id);
                    setMap(mapData);

                    const locationsData = await getLocations(map_id);
                    setLocations(locationsData);
                } else {
                    setMap({
                        title: "",
                        description: "",
                        tags: [],
                        visibility: "private",
                    });
                    setLocations([]);
                }
            } catch (err) {
                setError(err.message || "Failed to load map");
                console.error(err);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [map_id]);

    useEffect(() => {
        return () => {
            unsubscribeRef.current?.();
        };
    }, []);

    const refreshMapData = async () => {
        if (!map_id) return;

        const updatedMap = await getMapById(map_id);
        setMap(updatedMap);

        if (updatedMap.has_tiles) {
            const locationsData = await getLocations(map_id);
            setLocations(locationsData);
        }
    };

    const handleMapSubmit = async (title, description, tags, visibility) => {
        try {
            setLoading(true);

            if (map_id) {
                await updateMap(map_id, title, description, tags, visibility);
                toast.success("Map updated successfully");

                const updatedMap = await getMapById(map_id);
                setMap(updatedMap);
            } else {
                const newMap = await createMap(title, description, tags, visibility);
                toast.success("Map created successfully");
                navigate(`/maps/${newMap.id}/edit`);
            }
        } catch (err) {
            toast.error(err.message || "Failed to save map");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleUploadImage = async (file) => {
        if (!map_id) {
            toast.error("You must create the map first before uploading image.");
            return;
        }

        try {
            setTilesReadyMessage("");
            setProgressData(null);
            setIsProcessing(true);

            const result = await uploadImage(map_id, file);

            if (!result?.job_id) {
                setIsProcessing(false);
                toast.error("Progress tracking is unavailable: job_id was not returned.");
                return;
            }

            unsubscribeRef.current?.();

            unsubscribeRef.current = subscribeToTileProgress(result.job_id, {
                onProgress: (payload) => {
                    setProgressData(payload);
                },
                onDone: async (payload) => {
                    setProgressData(payload);
                    setIsProcessing(false);
                    setTilesReadyMessage("Tiles are ready.");
                    unsubscribeRef.current = null;

                    try {
                        await refreshMapData();
                    } catch (err) {
                        console.error(err);
                    }
                },
                onError: (payload) => {
                    setProgressData(payload);
                    setIsProcessing(false);
                    unsubscribeRef.current = null;
                    toast.error(payload?.message || "Tile processing failed");
                },
            });
        } catch (err) {
            setIsProcessing(false);
            toast.error(err.message || "Failed to upload image");
            console.error(err);
        }
    };

    const handleAddLocation = async (newLocation) => {
        if (!map_id) {
            toast.error("You must save the map first.");
            return;
        }
        try {
            const created = await createLocation(newLocation);
            setLocations([...locations, created]);
        } catch (err) {
            toast.error(err.message || "Failed to add location");
            console.error(err);
        }
    };

    const handleDeleteLocation = async (locationId) => {
        try {
            await deleteLocation(locationId);
            setLocations(locations.filter((loc) => loc.id !== locationId));
        } catch (err) {
            toast.error(err.message || "Failed to delete location");
            console.error(err);
        }
    };

    const handleUpdateLocation = async (locationId, updatedLocation) => {
        try {
            const saved = await updateLocation(locationId, updatedLocation);
            setLocations(locations.map((loc) => (loc.id === saved.id ? saved : loc)));
        } catch (err) {
            toast.error(err.message || "Failed to update location");
            console.error(err);
        }
    };

    const hasTiles = !!map?.has_tiles;

    if (error) {
        return <p className="text-status-danger p-4">{error}</p>;
    }

    if (!map) {
        return <p className="p-4 text-text-heading">Loading map...</p>;
    }

    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle className="text-text-heading">
                        {map_id ? "Edit Map" : "Create Map"}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <MapForm
                        initialTitle={map.title}
                        initialDescription={map.description}
                        initialTags={(map.tags || []).filter(Boolean)}
                        initialVisibility={map.visibility}
                        onSubmit={handleMapSubmit}
                        loading={loading}
                    />
                </CardContent>
            </Card>

            {map_id && (
                <>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-text-heading">Upload Tiles</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <TilesUploader
                                onSubmit={handleUploadImage}
                                isProcessing={isProcessing}
                                successMessage={tilesReadyMessage}
                                progressData={progressData}
                            />
                        </CardContent>
                    </Card>

                    {hasTiles && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-text-heading">Edit Locations</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <EditableMapViewer
                                    map={map}
                                    locations={locations}
                                    onAddLocation={handleAddLocation}
                                    onDeleteLocation={handleDeleteLocation}
                                    onUpdateLocation={handleUpdateLocation}
                                />
                            </CardContent>
                        </Card>
                    )}
                </>
            )}

            <div className="flex justify-end px-8 pb-8">
                <Button
                    variant="outline"
                    onClick={() => navigate(map_id ? `/maps/${map_id}` : "/profile")}
                    className="w-32"
                >
                    View Map
                </Button>
            </div>
        </div>
    );
}