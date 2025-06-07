import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { getMapById, updateMap, createMap, uploadImage } from "../api/maps";
import { getLocations, createLocation, updateLocation, deleteLocation } from "@/api/locations";
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
    const [error, setError] = useState("");

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
                    description: ""
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

    const handleMapSubmit = async (title, description) => {
        try {
            setLoading(true);
            if (map_id) {
                await updateMap(map_id, title, description);
                toast.success("Map updated successfully");
                const updatedMap = await getMapById(map_id);
                setMap(updatedMap);
            } else {
                const newMap = await createMap(title, description);
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
            await uploadImage(map_id, file);
            toast.success("Image uploaded successfully");
            setIsProcessing(true);
        } catch (err) {
            toast.error(err.message || "Failed to upload image");
            console.error(err);
        }
    };

    useEffect(() => {
        if (!isProcessing) return;

        const interval = setInterval(async () => {
            try {
                const updatedMap = await getMapById(map_id);
                setMap(updatedMap);

                if (updatedMap.tiles_path) {
                    setIsProcessing(false);
                    toast.success("Tiles are ready!");
                }
            } catch (err) {
                console.error(err);
            }
        }, 2000);

        return () => clearInterval(interval);
    }, [isProcessing, map_id])

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
            setLocations(locations.filter(loc => loc.id !== locationId));
        } catch (err) {
            toast.error(err.message || "Failed to delete location");
            console.error(err);
        }
    };

    const handleUpdateLocation = async (locationId, updatedLocation) => {
        try {
            const saved = await updateLocation(locationId, updatedLocation);
            setLocations(locations.map(loc => loc.id === saved.id ? saved : loc));
        } catch (err) {
            toast.error(err.message || "Failed to update location");
            console.error(err);
        }
    };

    if (error) {
        return <p className="text-red-500">{error}</p>;
    }

    if (!map) {
        return <p>Loading map...</p>;
    }

    return (
      <div className="space-y-8">
        <Card>
            <CardHeader>
                <CardTitle>{map_id ? "Edit Map" : "Create Map"}</CardTitle>
            </CardHeader>
            <CardContent>
                <MapForm
                    initialTitle={map.title}
                    initialDescription={map.description}
                    onSubmit={handleMapSubmit}
                    loading={loading}
                />
            </CardContent>
        </Card>
        {map_id && (
            <>
                <Card>
                    <CardHeader>
                        <CardTitle>Upload Tiles</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <TilesUploader onSubmit={handleUploadImage} />
                        {isProcessing && (
                            <div className="flex items-center gap-2 text-amber-600 font-bold mt-2 animate-pulse">
                                <svg
                                    className="animate-spin h-6 w-6 text-amber-600"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                    ></circle>
                                    <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8v8H4z"
                                    ></path>
                                </svg>
                                <span>Processing tiles... Please wait.</span>
                            </div>
                        )}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Edit Locations</CardTitle>
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