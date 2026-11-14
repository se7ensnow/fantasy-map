import { cn } from "@/lib/utils";
import OpenLayersMap from "@/components/OpenLayersMap";
import { STORAGE_URL } from "@/config";

/**
 * Shared viewport/layout for the read-only and editable map viewers.
 * Keeps fullscreen, side-panel and stacked layouts consistent in one place.
 */
export default function MapViewerLayout({
    map,
    locations,
    selectedLocationId,
    addMode = false,
    previewCoord = null,
    onMapClick,
    onSelectLocation,
    editMode = false,
    onMoveLocation,
    renderControls,
    sidePanel,
    mobileSheet,
    showMobileSheet = false,
    hint,
    isFullscreen,
    panelShown,
    isSideLayout,
    sidePanelContainerClass = "w-1/3 min-h-0",
    sidePanelWidthClass = "w-[480px] max-w-[48vw]",
    mapHeightClass = "h-[80vh]",
    stackMapHeightClass = "h-[62vh]",
    stackPanelClass = "min-h-[220px]",
}) {
    const mapViewport = (
        <div
            className={cn(
                "relative h-full w-full overflow-hidden rounded-md md:rounded-xl",
                addMode &&
                    "shadow-[0_0_0_1px_rgba(34,197,94,0.18)] ring-2 ring-status-success-border/70"
            )}
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
                previewCoord={previewCoord}
                onMapClick={onMapClick}
                onSelectLocation={onSelectLocation}
                selectedLocationId={selectedLocationId}
                editMode={editMode}
                onMoveLocation={onMoveLocation}
                markerIconUrl="/marker.svg"
            />

            {!(isFullscreen && isSideLayout && panelShown) &&
                renderControls?.({ floating: true })}

            {addMode && hint}
        </div>
    );

    return (
        <div className={isFullscreen ? "fixed inset-0 z-50 bg-surface-page/95 p-3 sm:p-4" : ""}>
            <div
                className={
                    isFullscreen
                        ? cn(
                              "relative h-full overflow-hidden rounded-2xl bg-surface-panel/70 shadow-2xl backdrop-blur-sm",
                              addMode
                                  ? "ring-2 ring-status-success-border"
                                  : "ring-1 ring-border-emphasis"
                          )
                        : "relative"
                }
            >
                {!isFullscreen &&
                    (isSideLayout ? (
                        <div className={cn("flex gap-4", mapHeightClass)}>
                            <div className="relative flex-1 overflow-hidden rounded-xl">
                                {mapViewport}
                            </div>

                            {panelShown && (
                                <div className={sidePanelContainerClass}>{sidePanel}</div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <div
                                className={cn(
                                    "overflow-hidden rounded-md",
                                    stackMapHeightClass
                                )}
                            >
                                {mapViewport}
                            </div>

                            {panelShown && (
                                <div className={stackPanelClass}>{sidePanel}</div>
                            )}
                        </div>
                    ))}

                {isFullscreen && (
                    <>
                        <div className="absolute inset-0">
                            <div className="relative -left-px -top-px h-[calc(100%+2px)] w-[calc(100%+2px)]">
                                {mapViewport}
                            </div>

                            {isSideLayout && panelShown && (
                                <div className="absolute bottom-4 right-4 top-4 z-20">
                                    <div
                                        className={cn(
                                            "relative h-full",
                                            sidePanelWidthClass
                                        )}
                                    >
                                        <div className="absolute right-full top-0 z-30 mr-3">
                                            {renderControls?.({ floating: false })}
                                        </div>

                                        <div className="h-full rounded-xl border border-border-default bg-surface-panel/95 shadow-2xl backdrop-blur-sm">
                                            {sidePanel}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {!isSideLayout && showMobileSheet && mobileSheet}
                    </>
                )}
            </div>
        </div>
    );
}
