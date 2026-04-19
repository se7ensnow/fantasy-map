import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
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
    const { t } = useTranslation();
    const { map_id } = useParams();
    const navigate = useNavigate();

    const [map, setMap] = useState(null);
    const [locations, setLocations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [tilesReadyMessage, setTilesReadyMessage] = useState("");
    const [progressData, setProgressData] = useState(null);
    const [processingError, setProcessingError] = useState(null);
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
                setError(err.message || t("mapEdit.errors.failedToLoadMap"));
                console.error(err);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [map_id, t]);

    useEffect(() => {
        return () => {
            unsubscribeRef.current?.();
        };
    }, []);

    const refreshMapData = async () => {
        if (!map_id) return;

        const updatedMap = await getMapById(map_id);
        setMap(updatedMap);

        if (updatedMap.status === "ready") {
            const locationsData = await getLocations(map_id);
            setLocations(locationsData);
        } else {
            setLocations([]);
        }
    };

    const handleMapSubmit = async (title, description, tags, visibility) => {
        try {
            setLoading(true);

            if (map_id) {
                await updateMap(map_id, title, description, tags, visibility);
                toast.success(t("mapEdit.toasts.updated"));

                const updatedMap = await getMapById(map_id);
                setMap(updatedMap);
            } else {
                const newMap = await createMap(title, description, tags, visibility);
                toast.success(t("mapEdit.toasts.created"));
                navigate(`/maps/${newMap.id}/edit`);
            }
        } catch (err) {
            toast.error(err.message || t("mapEdit.errors.failedToSaveMap"));
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleUploadImage = async (file) => {
        if (!map_id) {
            toast.error(t("mapEdit.errors.createMapBeforeUpload"));
            return;
        }

        try {
            setTilesReadyMessage("");
            setProgressData(null);
            setProcessingError(null);
            setIsProcessing(true);

            const result = await uploadImage(map_id, file);

            if (!result?.job_id) {
                setIsProcessing(false);
                toast.error(t("mapEdit.errors.progressUnavailable"));
                return;
            }

            unsubscribeRef.current?.();

            unsubscribeRef.current = subscribeToTileProgress(result.job_id, {
                onProgress: (payload) => {
                    setProgressData(payload);
                },
                onDone: async (payload) => {
                    setProgressData(payload);
                    setProcessingError(null);
                    setIsProcessing(false);
                    setTilesReadyMessage(t("mapEdit.tiles.readyMessage"));
                    unsubscribeRef.current = null;

                    toast.success(t("mapEdit.toasts.imageProcessed"));

                    try {
                        await refreshMapData();
                    } catch (err) {
                        console.error(err);
                    }
                },
                onError: (payload) => {
                    setProgressData(payload);
                    setIsProcessing(false);
                    setTilesReadyMessage("");
                    setProcessingError({
                        message: payload?.userMessage || t("mapEdit.errors.processingFailed"),
                        details: payload?.errorDetails || null,
                    });
                    unsubscribeRef.current = null;

                    toast.error(payload?.userMessage || t("mapEdit.errors.processingFailed"));
                },
            });
        } catch (err) {
            setIsProcessing(false);
            setProcessingError({
                message: err.message || t("mapEdit.errors.failedToUploadImage"),
                details: null,
            });
            toast.error(err.message || t("mapEdit.errors.failedToUploadImage"));
            console.error(err);
        }
    };

    const handleAddLocation = async (newLocation) => {
        if (!map_id) {
            toast.error(t("mapEdit.errors.saveMapBeforeAddLocation"));
            return;
        }
        try {
            const created = await createLocation(newLocation);
            setLocations([...locations, created]);
        } catch (err) {
            toast.error(err.message || t("mapEdit.errors.failedToAddLocation"));
            console.error(err);
        }
    };

    const handleDeleteLocation = async (locationId) => {
        try {
            await deleteLocation(locationId);
            setLocations(locations.filter((loc) => loc.id !== locationId));
        } catch (err) {
            toast.error(err.message || t("mapEdit.errors.failedToDeleteLocation"));
            console.error(err);
        }
    };

    const handleUpdateLocation = async (locationId, updatedLocation) => {
        try {
            const saved = await updateLocation(locationId, updatedLocation);
            setLocations(locations.map((loc) => (loc.id === saved.id ? saved : loc)));
        } catch (err) {
            toast.error(err.message || t("mapEdit.errors.failedToUpdateLocation"));
            console.error(err);
        }
    };

    if (error) {
        return <p className="text-status-danger p-4">{error}</p>;
    }

    if (!map) {
        return <p className="p-4 text-text-heading">{t("mapEdit.loading")}</p>;
    }

    const isReady = map?.status === "ready";
    const isDraft = map?.status === "draft";
    const willBePublicWhenReady = isDraft && map?.visibility === "public";

    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle className="text-text-heading">
                        {map_id ? t("mapEdit.titles.editMap") : t("mapEdit.titles.createMap")}
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
                            <CardTitle className="text-text-heading">
                                {t("mapEdit.titles.uploadTiles")}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <TilesUploader
                                onSubmit={handleUploadImage}
                                isProcessing={isProcessing}
                                successMessage={tilesReadyMessage}
                                progressData={progressData}
                                errorMessage={processingError?.message || ""}
                                errorDetails={processingError?.details || ""}
                            />
                            <div className="mt-4 space-y-2">
                                {isDraft && (
                                    <div className="max-w-2xl rounded-xl border border-border-default/40 bg-surface-paper/70 p-4">
                                        <div className="text-sm font-semibold text-text-heading">
                                            {t("mapEdit.draft.title")}
                                        </div>
                                        <div className="mt-1 text-sm text-text-primary leading-6">
                                            {t("mapEdit.draft.description")}
                                        </div>

                                        {willBePublicWhenReady && (
                                            <div className="mt-2 text-sm text-text-muted leading-6">
                                                {t("mapEdit.draft.publicWhenReady")}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {isReady && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-text-heading">
                                    {t("mapEdit.titles.editLocations")}
                                </CardTitle>
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

            <div className="flex flex-col items-end gap-2 px-8 pb-8">
                <Button
                    variant="outline"
                    onClick={() => {
                        if (isReady) {
                            navigate(`/maps/${map_id}`);
                        }
                    }}
                    className="w-32"
                    disabled={!isReady}
                    title={!isReady ? t("mapEdit.viewMap.availableAfterUpload") : undefined}
                >
                    {t("mapEdit.viewMap.button")}
                </Button>

                {!isReady && map_id && (
                    <p className="max-w-xs text-right text-xs text-text-muted">
                        {t("mapEdit.viewMap.availableAfterUpload")}
                    </p>
                )}
            </div>
        </div>
    );
}