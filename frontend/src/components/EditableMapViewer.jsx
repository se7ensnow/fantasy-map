import { useState } from "react";
import { useTranslation } from "react-i18next";

import EditorPanel from "@/components/EditorPanel";
import MapViewerControls from "@/components/MapViewerControls";
import MapViewerLayout from "@/components/MapViewerLayout";
import MobileSheet from "@/components/MobileSheet";
import useViewerLayout from "@/hooks/useViewerLayout";
import { useViewerChrome } from "@/hooks/useViewerChrome";

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

    const {
        isFullscreen,
        panelMode,
        panelShown,
        setPanelMode,
        togglePanel,
        showPanel,
        hidePanel,
        toggleFullscreen,
    } = useViewerChrome();

    const isSideLayout = useViewerLayout() === "side";

    const clearSelection = () => {
        setSelectedLocation(null);
        setAddMode(false);
        setNewLocationCoords(null);
        hidePanel();
    };

    const handleToggleAddMode = () => {
        setAddMode((value) => !value);
        setSelectedLocation(null);
        setNewLocationCoords(null);
        hidePanel();
    };

    const handleSelectLocation = (location) => {
        setSelectedLocation(location);
        setAddMode(false);
        setNewLocationCoords(null);
        showPanel();
    };

    const handleSaveNewLocation = async (locationData) => {
        if (!newLocationCoords) return;

        await onAddLocation({
            ...locationData,
            map_id: map.id,
            x: newLocationCoords.x,
            y: newLocationCoords.y,
        });

        setAddMode(false);
        setNewLocationCoords(null);
        hidePanel();
    };

    const handleSaveEditedLocation = async (locationData) => {
        if (!selectedLocation) return;

        await onUpdateLocation(selectedLocation.id, {
            ...locationData,
            map_id: map.id,
        });

        setSelectedLocation(null);
        hidePanel();
    };

    const handleDeleteLocation = async (locationId) => {
        await onDeleteLocation(locationId);
        setSelectedLocation(null);
        hidePanel();
    };

    const renderControls = ({ floating }) => (
        <MapViewerControls
            floating={floating}
            isFullscreen={isFullscreen}
            showPanel={panelShown}
            onTogglePanel={togglePanel}
            onToggleFullscreen={toggleFullscreen}
            showAddMode
            addMode={addMode}
            onToggleAddMode={handleToggleAddMode}
        />
    );

    const editorPanelProps = {
        title: t("editableMapViewer.title"),
        selectedLocation,
        addMode,
        newLocationCoords,
        onSaveNewLocation: handleSaveNewLocation,
        onSaveEditedLocation: handleSaveEditedLocation,
        onDeleteLocation: handleDeleteLocation,
        onClearSelection: clearSelection,
    };

    return (
        <MapViewerLayout
            map={map}
            locations={locations}
            selectedLocationId={selectedLocation?.id ?? null}
            addMode={addMode}
            previewCoord={newLocationCoords}
            onMapClick={(coords) => {
                setNewLocationCoords(coords);
                showPanel();
            }}
            onSelectLocation={handleSelectLocation}
            editMode={Boolean(selectedLocation) && !addMode}
            onMoveLocation={({ id, x, y }) => {
                setSelectedLocation((previous) => {
                    if (!previous || previous.id !== id) return previous;
                    return { ...previous, x, y };
                });
            }}
            renderControls={renderControls}
            sidePanel={<EditorPanel {...editorPanelProps} />}
            mobileSheet={
                <MobileSheet
                    mode={panelMode}
                    onRequestMode={setPanelMode}
                    visibleHeight={320}
                    label={t("editableMapViewer.title")}
                >
                    <EditorPanel {...editorPanelProps} />
                </MobileSheet>
            }
            showMobileSheet={panelShown}
            hint={
                addMode &&
                !newLocationCoords && (
                    <div className="pointer-events-none absolute left-1/2 top-4 z-10 -translate-x-1/2">
                        <div className="rounded-full border border-border-default bg-surface-panel/90 px-4 py-2 text-sm text-text-heading shadow-md backdrop-blur-sm">
                            {t("editableMapViewer.hints.clickMapToPlace")}
                        </div>
                    </div>
                )
            }
            isFullscreen={isFullscreen}
            panelShown={panelShown}
            isSideLayout={isSideLayout}
            sidePanelContainerClass="w-1/3 min-h-0"
            sidePanelWidthClass="w-[520px] max-w-[50vw]"
        />
    );
}
