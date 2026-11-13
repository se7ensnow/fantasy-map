import { Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import ScrollPanel from "@/components/ScrollPanel";
import LocationEditor from "@/components/LocationEditor";
import EmptyState from "@/components/EmptyState";

export default function EditorPanel({
    title,
    selectedLocation,
    addMode,
    newLocationCoords,
    onSaveNewLocation,
    onSaveEditedLocation,
    onDeleteLocation,
    onClearSelection,
    className = "",
}) {
    const { t } = useTranslation();

    const resetKey = addMode
        ? `new-${newLocationCoords ? "placed" : "waiting"}`
        : selectedLocation?.id ?? "empty";

    const renderContent = () => {
        if (addMode) {
            if (newLocationCoords) {
                return (
                    <LocationEditor
                        key={`new-${newLocationCoords.x}-${newLocationCoords.y}`}
                        coords={newLocationCoords}
                        onSave={onSaveNewLocation}
                        onCancel={onClearSelection}
                    />
                );
            }

            return (
                <div
                    className="rounded border border-border-default bg-surface-paper/70 p-4 text-text-heading shadow-sm"
                    role="status"
                >
                    {t("editableMapViewer.emptyStateAddMode")}
                </div>
            );
        }

        if (selectedLocation) {
            return (
                <>
                    <LocationEditor
                        key={selectedLocation.id}
                        location={selectedLocation}
                        onSave={onSaveEditedLocation}
                        onCancel={onClearSelection}
                    />

                    <div className="mt-4">
                        <Button
                            variant="destructive"
                            onClick={() => onDeleteLocation(selectedLocation.id)}
                        >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                            {t("editableMapViewer.actions.deleteLocation")}
                        </Button>
                    </div>
                </>
            );
        }

        return (
            <EmptyState
                title={t("editableMapViewer.emptyStateTitle")}
                description={t("editableMapViewer.emptyState")}
            />
        );
    };

    return (
        <ScrollPanel title={title} resetKey={resetKey} className={className}>
            {renderContent()}
        </ScrollPanel>
    );
}
