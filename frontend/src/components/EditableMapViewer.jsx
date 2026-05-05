import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import OpenLayersMap from "./OpenLayersMap";
import EditorPanel from "./EditorPanel";
import EditableMapViewerControls from "./EditableMapViewerControls";
import MobileEditorSheet from "./MobileEditorSheet";
import { STORAGE_URL } from "@/config";
import useViewerLayout from "@/hooks/useViewerLayout";

export default function EditableMapViewer({
    map,
    locations,
    onAddLocation,
    onDeleteLocation,
    onUpdateLocation,
}) {
    const { t } = useTranslation();

    const [selectedLocation, setSelectedLocation] = useState(null);
    const [addMode, setAddMode] = useState(false);
    const [newLocationCoords, setNewLocationCoords] = useState(null);
    const [isFullscreen, setIsFullscreen] = useState(false);

    // "hidden" | "peek" | "full"
    const [panelMode, setPanelMode] = useState("hidden");

    const layoutMode = useViewerLayout();
    const isSideLayout = layoutMode === "side";
    const panelShown = panelMode !== "hidden";

    useEffect(() => {
        if (!isFullscreen) return;

        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        return () => {
            document.body.style.overflow = prevOverflow;
        };
    }, [isFullscreen]);

    const clearSelection = () => {
        setSelectedLocation(null);
        setAddMode(false);
        setNewLocationCoords(null);
        setPanelMode("hidden");
    };

    const handleTogglePanel = () => {
        setPanelMode((prev) => (prev === "hidden" ? "peek" : "hidden"));
    };

    const handleToggleFullscreen = () => {
        setIsFullscreen((prev) => !prev);
    };

    const handleToggleAddMode = () => {
        setAddMode((prev) => {
            const next = !prev;
        
            setSelectedLocation(null);
            setNewLocationCoords(null);
            setPanelMode("hidden");
        
            return next;
        });
    };

    const handleSelectLocation = (loc) => {
        setSelectedLocation(loc);
        setAddMode(false);
        setNewLocationCoords(null);
        setPanelMode("peek");
    };

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
        setPanelMode("hidden");
    };

    const handleSaveEditedLocation = (locationData) => {
        if (!selectedLocation) return;

        const fullLocationData = {
            ...locationData,
            map_id: map.id,
        };

        onUpdateLocation(selectedLocation.id, fullLocationData);
        setSelectedLocation(null);
        setPanelMode("hidden");
    };

    const handleDeleteLocation = (locationId) => {
        onDeleteLocation(locationId);
        setSelectedLocation(null);
        setPanelMode("hidden");
    };

    const mapViewport = (
        <div
            className={[
                "relative h-full w-full overflow-hidden rounded-md md:rounded-xl",
                addMode
                    ? "ring-2 ring-status-success-border/70 shadow-[0_0_0_1px_rgba(34,197,94,0.18)]"
                    : "",
            ].join(" ")}
        >
            <OpenLayersMap
                mapId={map.id}
                storageUrl={STORAGE_URL}
                tilesVersion={map.tiles_version}
                width={map.width}
                height={map.height}
                maxZoom={map.max_zoom}
                locations={locations}
                addMode={addMode}
                previewCoord={newLocationCoords}
                onMapClick={(coords) => {
                    setNewLocationCoords(coords);
                    setPanelMode("peek");
                }}
                onSelectLocation={handleSelectLocation}
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

            {!(isFullscreen && isSideLayout && panelShown) && (
                <EditableMapViewerControls
                    isFullscreen={isFullscreen}
                    showPanel={panelShown}
                    addMode={addMode}
                    onTogglePanel={handleTogglePanel}
                    onToggleFullscreen={handleToggleFullscreen}
                    onToggleAddMode={handleToggleAddMode}
                />
            )}

            {addMode && !newLocationCoords && (
                <div className="pointer-events-none absolute left-1/2 top-4 z-10 -translate-x-1/2">
                    <div className="rounded-full border border-border-default bg-surface-panel/90 px-4 py-2 text-sm text-text-heading shadow-md backdrop-blur-sm">
                        {t("editableMapViewer.hints.clickMapToPlace")}
                    </div>
                </div>
            )}
        </div>
    );

    const sidePanel = (
        <div className="w-1/3 min-h-0">
            <EditorPanel
                title={t("editableMapViewer.title")}
                selectedLocation={selectedLocation}
                addMode={addMode}
                newLocationCoords={newLocationCoords}
                onSaveNewLocation={handleSaveNewLocation}
                onSaveEditedLocation={handleSaveEditedLocation}
                onDeleteLocation={handleDeleteLocation}
                onClearSelection={clearSelection}
            />
        </div>
    );

    const fullscreenSidePanelCluster = (
        <div className="absolute top-4 bottom-4 right-4 z-20">
            <div className="relative h-full w-[520px] max-w-[50vw]">
                <div className="absolute right-full top-0 mr-3 z-30">
                    <EditableMapViewerControls
                        isFullscreen={isFullscreen}
                        showPanel={panelShown}
                        addMode={addMode}
                        onTogglePanel={handleTogglePanel}
                        onToggleFullscreen={handleToggleFullscreen}
                        onToggleAddMode={handleToggleAddMode}
                        floating={false}
                    />
                </div>

                <div className="h-full rounded-xl border border-border-default bg-surface-panel/95 shadow-2xl backdrop-blur-sm">
                    <EditorPanel
                        title={t("editableMapViewer.title")}
                        selectedLocation={selectedLocation}
                        addMode={addMode}
                        newLocationCoords={newLocationCoords}
                        onSaveNewLocation={handleSaveNewLocation}
                        onSaveEditedLocation={handleSaveEditedLocation}
                        onDeleteLocation={handleDeleteLocation}
                        onClearSelection={clearSelection}
                    />
                </div>
            </div>
        </div>
    );

    return (
        <div className={isFullscreen ? "fixed inset-0 z-50 bg-background/95 p-3 sm:p-4" : ""}>
            <div
                className={
                    isFullscreen
                        ? [
                              "relative h-full overflow-hidden rounded-2xl bg-surface-panel/70 shadow-2xl backdrop-blur-sm",
                              addMode
                                  ? "ring-2 ring-status-success-border"
                                  : "ring-1 ring-border-emphasis",
                          ].join(" ")
                        : "relative"
                }
            >
                {!isFullscreen && (
                    <>
                        {isSideLayout ? (
                            <div className="flex h-[80vh] gap-4">
                                <div className="relative flex-1 overflow-hidden rounded-xl">
                                    {mapViewport}
                                </div>

                                {panelShown && sidePanel}
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <div className="h-[62vh] overflow-hidden rounded-md">
                                    {mapViewport}
                                </div>

                                {panelShown && (
                                    <div className="min-h-[260px]">
                                        <EditorPanel
                                            title={t("editableMapViewer.title")}
                                            selectedLocation={selectedLocation}
                                            addMode={addMode}
                                            newLocationCoords={newLocationCoords}
                                            onSaveNewLocation={handleSaveNewLocation}
                                            onSaveEditedLocation={handleSaveEditedLocation}
                                            onDeleteLocation={handleDeleteLocation}
                                            onClearSelection={clearSelection}
                                        />
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}

                {isFullscreen && (
                    <>
                        <div className="absolute inset-0">
                            <div className="relative -top-px -left-px h-[calc(100%+2px)] w-[calc(100%+2px)]">
                                {mapViewport}
                            </div>

                            {isSideLayout && panelShown && fullscreenSidePanelCluster}
                        </div>

                        {!isSideLayout && panelShown && (
                            <MobileEditorSheet
                                mode={panelMode}
                                title={t("editableMapViewer.title")}
                                selectedLocation={selectedLocation}
                                addMode={addMode}
                                newLocationCoords={newLocationCoords}
                                onSaveNewLocation={handleSaveNewLocation}
                                onSaveEditedLocation={handleSaveEditedLocation}
                                onDeleteLocation={handleDeleteLocation}
                                onClearSelection={clearSelection}
                                onRequestMode={setPanelMode}
                            />
                        )}
                    </>
                )}
            </div>
        </div>
    );
}