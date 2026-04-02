import React, { useEffect, useRef, useState } from "react";
import { ChevronUp } from "lucide-react";
import LocationDetails from "./LocationDetails";
import OpenLayersMap from "./OpenLayersMap";
import { STORAGE_URL } from "@/config";

export default function MapViewer({ map, locations }) {
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [showTopFade, setShowTopFade] = useState(false);
    const [showBottomFade, setShowBottomFade] = useState(false);
    const scrollRef = useRef(null);

    const updateFades = () => {
        const el = scrollRef.current;
        if (!el) return;

        const { scrollTop, scrollHeight, clientHeight } = el;
        setShowTopFade(scrollTop > 4);
        setShowBottomFade(scrollTop + clientHeight < scrollHeight - 4);
    };

    const scrollToTop = () => {
        const el = scrollRef.current;
        if (!el) return;

        el.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };

    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;

        el.scrollTop = 0;
        updateFades();
    }, [selectedLocation]);

    return (
        <div className="flex h-[80vh] gap-4">
            <div className="flex-1 rounded overflow-hidden">
                <OpenLayersMap
                    mapId={map.id}
                    storageUrl={STORAGE_URL}
                    tiles_version={map.tiles_version}
                    width={map.width}
                    height={map.height}
                    maxZoom={map.max_zoom}
                    locations={locations}
                    onSelectLocation={setSelectedLocation}
                    selectedLocationId={selectedLocation?.id ?? null}
                />
            </div>

            <div className="relative w-1/3 rounded bg-surface-panel/95 min-h-0 overflow-hidden">
                <div
                    ref={scrollRef}
                    onScroll={updateFades}
                    className="h-full overflow-y-auto p-4"
                >
                    {selectedLocation ? (
                        <LocationDetails location={selectedLocation} />
                    ) : (
                        <p className="text-text-heading">
                            Select a location on the map to view details.
                        </p>
                    )}
                </div>

                <button
                    type="button"
                    onClick={scrollToTop}
                    aria-label="Scroll to top"
                    className={`
                        absolute top-3 left-1/2 -translate-x-1/2 z-10
                        flex h-9 w-9 items-center justify-center
                        rounded-full border border-border-default
                        bg-surface-panel/90 text-text-heading
                        shadow-md backdrop-blur-sm
                        transition-all duration-200
                        hover:bg-surface-panel hover:scale-105
                        ${showTopFade ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}
                    `}
                >
                    <ChevronUp className="h-4 w-4" />
                </button>

                <div
                    className={`
                        pointer-events-none absolute top-0 left-0 right-0 h-10
                        bg-gradient-to-b from-surface-panel/95 to-transparent
                        transition-opacity duration-200
                        ${showTopFade ? "opacity-100" : "opacity-0"}
                    `}
                />

                <div
                    className={`
                        pointer-events-none absolute bottom-0 left-0 right-0 h-8
                        bg-gradient-to-t from-surface-panel/95 to-transparent
                        transition-opacity duration-200
                        ${showBottomFade ? "opacity-100" : "opacity-0"}
                    `}
                />
            </div>
        </div>
    );
}