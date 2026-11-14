import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

import {
    createMap,
    getMapById,
    updateMap,
} from "@/api/maps";
import {
    createLocation,
    deleteLocation,
    getLocations,
    updateLocation,
} from "@/api/locations";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import EditableMapViewer from "@/components/EditableMapViewer";
import ErrorState from "@/components/ErrorState";
import LoadingState from "@/components/LoadingState";
import MapForm from "@/components/MapForm";
import TilesUploader from "@/components/TilesUploader";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useTileProcessing } from "@/hooks/useTileProcessing";

function createEmptyMap() {
    return {
        title: "",
        description: "",
        tags: [],
        visibility: "private",
        status: "draft",
    };
}

export default function MapEditPage() {
    const { t } = useTranslation();
    const { map_id } = useParams();
    const navigate = useNavigate();

    const [map, setMap] = useState(null);
    const [locations, setLocations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [loadRevision, setLoadRevision] = useState(0);

    const refreshMapData = useCallback(async () => {
        if (!map_id) return;

        const updatedMap = await getMapById(map_id);
        setMap(updatedMap);

        if (updatedMap.status === "ready") {
            const locationsData = await getLocations(map_id);
            setLocations(locationsData);
        } else {
            setLocations([]);
        }
    }, [map_id]);

    const tiles = useTileProcessing({
        mapId: map_id,
        onCompleted: refreshMapData,
    });

    useEffect(() => {
        let cancelled = false;

        async function fetchData() {
            setLoading(true);
            setError(null);

            try {
                if (map_id) {
                    const mapData = await getMapById(map_id);
                    if (cancelled) return;

                    setMap(mapData);

                    const locationsData =
                        mapData.status === "ready"
                            ? await getLocations(map_id)
                            : [];

                    if (!cancelled) setLocations(locationsData);
                } else {
                    setMap(createEmptyMap());
                    setLocations([]);
                }
            } catch (fetchError) {
                if (cancelled) return;

                setError(fetchError);
                console.error(fetchError);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        fetchData();

        return () => {
            cancelled = true;
        };
    }, [map_id, loadRevision]);

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
        } catch (saveError) {
            toast.error(saveError.message || t("mapEdit.errors.failedToSaveMap"));
            console.error(saveError);
        } finally {
            setLoading(false);
        }
    };

    const handleAddLocation = async (newLocation) => {
        if (!map_id) {
            toast.error(t("mapEdit.errors.saveMapBeforeAddLocation"));
            throw new Error("Map is not saved yet");
        }

        try {
            const created = await createLocation(newLocation);
            setLocations((previous) => [...previous, created]);
        } catch (locationError) {
            toast.error(
                locationError.message || t("mapEdit.errors.failedToAddLocation")
            );
            console.error(locationError);
            throw locationError;
        }
    };

    const handleDeleteLocation = async (locationId) => {
        try {
            await deleteLocation(locationId);
            setLocations((previous) =>
                previous.filter((location) => location.id !== locationId)
            );
        } catch (locationError) {
            toast.error(
                locationError.message || t("mapEdit.errors.failedToDeleteLocation")
            );
            console.error(locationError);
            throw locationError;
        }
    };

    const handleUpdateLocation = async (locationId, updatedLocation) => {
        try {
            const saved = await updateLocation(locationId, updatedLocation);
            setLocations((previous) =>
                previous.map((location) =>
                    location.id === saved.id ? saved : location
                )
            );
        } catch (locationError) {
            toast.error(
                locationError.message || t("mapEdit.errors.failedToUpdateLocation")
            );
            console.error(locationError);
            throw locationError;
        }
    };

    useDocumentTitle(
        map?.title || (map_id ? undefined : t("mapEdit.titles.createMap"))
    );

    if (error) {
        return (
            <div className="p-3 md:p-8">
                <ErrorState
                    title={t("mapEdit.errors.failedToLoadMap")}
                    message={error.message}
                    onRetry={() => setLoadRevision((value) => value + 1)}
                    retryLabel={t("actions.retry")}
                />
            </div>
        );
    }

    if (!map) {
        return <LoadingState label={t("mapEdit.loading")} />;
    }

    const isReady = map.status === "ready";
    const isDraft = map.status === "draft";
    const willBePublicWhenReady = isDraft && map.visibility === "public";

    return (
        <div className="space-y-3 p-1 md:space-y-8 md:p-8">
            <MapForm
                initialTitle={map.title}
                initialDescription={map.description}
                initialTags={(map.tags || []).filter(Boolean)}
                initialVisibility={map.visibility}
                onSubmit={handleMapSubmit}
                loading={loading}
            />

            {map_id && (
                <>
                    <TilesUploader
                        onSubmit={tiles.upload}
                        isProcessing={tiles.isProcessing}
                        successMessage={tiles.successMessage}
                        progressData={tiles.progressData}
                        errorMessage={tiles.errorMessage}
                        errorDetails={tiles.errorDetails}
                    />

                    {isDraft && (
                        <Card>
                            <CardContent className="p-3 md:p-6">
                                <div className="max-w-2xl rounded-xl border border-border-default/40 bg-surface-paper/70 p-4">
                                    <div className="text-sm font-semibold text-text-heading">
                                        {t("mapEdit.draft.title")}
                                    </div>
                                    <div className="mt-1 text-sm leading-6 text-text-primary">
                                        {t("mapEdit.draft.description")}
                                    </div>

                                    {willBePublicWhenReady && (
                                        <div className="mt-2 text-sm leading-6 text-text-muted">
                                            {t("mapEdit.draft.publicWhenReady")}
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {isReady && (
                        <Card className="overflow-hidden">
                            <CardHeader className="px-3 pb-2 pt-3 md:px-6 md:pb-6 md:pt-6">
                                <CardTitle className="text-text-heading">
                                    {t("mapEdit.titles.editLocations")}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-1 md:p-6">
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

            {map_id && (
                <div className="flex flex-col gap-2 px-1 pb-4 md:items-end md:px-8 md:pb-8">
                    <Button
                        variant="outline"
                        onClick={() => navigate(`/maps/${map_id}`)}
                        className="w-full md:w-32"
                        disabled={!isReady}
                        title={
                            !isReady
                                ? t("mapEdit.viewMap.availableAfterUpload")
                                : undefined
                        }
                    >
                        {t("mapEdit.viewMap.button")}
                    </Button>

                    {!isReady && (
                        <p className="text-xs text-text-muted md:max-w-xs md:text-right">
                            {t("mapEdit.viewMap.availableAfterUpload")}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
