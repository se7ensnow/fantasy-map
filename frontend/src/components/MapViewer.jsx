import { useState } from "react";
import { useTranslation } from "react-i18next";

import MapViewerControls from "@/components/MapViewerControls";
import MapViewerLayout from "@/components/MapViewerLayout";
import MobileSheet from "@/components/MobileSheet";
import LocationPanel from "@/components/LocationPanel";
import useViewerLayout from "@/hooks/useViewerLayout";
import { useViewerChrome } from "@/hooks/useViewerChrome";

export default function MapViewer({ map, locations }) {
    const { t } = useTranslation();
    const [selectedLocation, setSelectedLocation] = useState(null);

    const {
        isFullscreen,
        panelMode,
        panelShown,
        setPanelMode,
        togglePanel,
        showPanel,
        toggleFullscreen,
    } = useViewerChrome();

    const isSideLayout = useViewerLayout() === "side";

    const handleSelectLocation = (location) => {
        setSelectedLocation(location);
        showPanel();
    };

    const renderControls = ({ floating }) => (
        <MapViewerControls
            floating={floating}
            isFullscreen={isFullscreen}
            showPanel={panelShown}
            onTogglePanel={togglePanel}
            onToggleFullscreen={toggleFullscreen}
        />
    );

    const panel = <LocationPanel location={selectedLocation} title={t("mapViewer.detailsTitle")} />;

    return (
        <MapViewerLayout
            map={map}
            locations={locations}
            selectedLocationId={selectedLocation?.id ?? null}
            onSelectLocation={handleSelectLocation}
            renderControls={renderControls}
            sidePanel={panel}
            mobileSheet={
                <MobileSheet
                    mode={panelMode}
                    onRequestMode={setPanelMode}
                    visibleHeight={280}
                    label={t("mapViewer.detailsPanel")}
                >
                    <LocationPanel location={selectedLocation} />
                </MobileSheet>
            }
            showMobileSheet={Boolean(selectedLocation) && panelShown}
            isFullscreen={isFullscreen}
            panelShown={panelShown}
            isSideLayout={isSideLayout}
        />
    );
}
