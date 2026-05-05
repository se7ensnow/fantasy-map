import React, { useEffect, useState } from "react";
import OpenLayersMap from "./OpenLayersMap";
import MapViewerControls from "./MapViewerControls";
import LocationPanel from "./LocationPanel";
import MobileLocationSheet from "./MobileLocationSheet";
import { STORAGE_URL } from "@/config";
import useViewerLayout from "@/hooks/useViewerLayout";

export default function MapViewer({ map, locations }) {
    const [selectedLocation, setSelectedLocation] = useState(null);
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

    const handleSelectLocation = (location) => {
        setSelectedLocation(location);
        setPanelMode("peek");
    };

    const handleTogglePanel = () => {
        setPanelMode((prev) => (prev === "hidden" ? "peek" : "hidden"));
    };

    const handleToggleFullscreen = () => {
        setIsFullscreen((prev) => !prev);
    };

    const mapViewport = (
        <div className="relative h-full w-full overflow-hidden rounded-md md:rounded-xl">
            <OpenLayersMap
                mapId={map.id}
                storageUrl={STORAGE_URL}
                tilesVersion={map.tiles_version}
                width={map.width}
                height={map.height}
                maxZoom={map.max_zoom}
                locations={locations}
                onSelectLocation={handleSelectLocation}
                selectedLocationId={selectedLocation?.id ?? null}
            />

            {/* обычные кнопки на карте.
                если fullscreen + side + panelShown, то кнопки рендерим рядом с панелью ниже */}
            {!(isFullscreen && isSideLayout && panelShown) && (
                <MapViewerControls
                    isFullscreen={isFullscreen}
                    showPanel={panelShown}
                    onTogglePanel={handleTogglePanel}
                    onToggleFullscreen={handleToggleFullscreen}
                />
            )}
        </div>
    );

    const sidePanel = (
        <div className="w-1/3 min-h-0">
            <LocationPanel location={selectedLocation} />
        </div>
    );

    const fullscreenSidePanelCluster = (
        <div className="absolute top-4 bottom-4 right-4 z-20">
            <div className="relative h-full w-[480px] max-w-[48vw]">
                <div className="absolute right-full top-0 mr-3 z-30">
                    <MapViewerControls
                        isFullscreen={isFullscreen}
                        showPanel={panelShown}
                        onTogglePanel={handleTogglePanel}
                        onToggleFullscreen={handleToggleFullscreen}
                        floating={false}
                    />
                </div>

                <div className="h-full rounded-xl border border-border-default bg-surface-panel/95 shadow-2xl backdrop-blur-sm">
                    <LocationPanel location={selectedLocation} />
                </div>
            </div>
        </div>
    );

    return (
        <div className={isFullscreen ? "fixed inset-0 z-50 bg-background/95 p-3 sm:p-4" : ""}>
            <div
                className={
                    isFullscreen
                        ? "relative h-full overflow-hidden rounded-2xl border border-border-emphasis bg-surface-panel/70 shadow-2xl backdrop-blur-sm"
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
                                    <div className="min-h-[220px]">
                                        <LocationPanel location={selectedLocation} />
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

                        {!isSideLayout && selectedLocation && panelShown && (
                            <MobileLocationSheet
                                mode={panelMode}
                                location={selectedLocation}
                                onRequestMode={setPanelMode}
                            />
                        )}
                    </>
                )}
            </div>
        </div>
    );
}