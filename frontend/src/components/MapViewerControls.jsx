import {
    Expand,
    MapPinPlus,
    PanelRightClose,
    PanelRightOpen,
    Shrink,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function MapViewerControls({
    isFullscreen,
    showPanel,
    onTogglePanel,
    onToggleFullscreen,
    onToggleAddMode,
    addMode = false,
    showAddMode = false,
    floating = true,
}) {
    const { t } = useTranslation();

    return (
        <div
            className={cn(
                floating
                    ? "absolute right-2 top-2 z-40 flex flex-col gap-2 md:right-3 md:top-3"
                    : "flex flex-col gap-2"
            )}
        >
            <Button
                type="button"
                size="icon"
                variant="ghost"
                className="map-control-btn"
                title={showPanel ? t("mapViewer.hidePanel") : t("mapViewer.showPanel")}
                aria-label={
                    showPanel ? t("mapViewer.hidePanel") : t("mapViewer.showPanel")
                }
                aria-pressed={showPanel}
                onClick={onTogglePanel}
            >
                {showPanel ? (
                    <PanelRightClose className="h-4 w-4" aria-hidden="true" />
                ) : (
                    <PanelRightOpen className="h-4 w-4" aria-hidden="true" />
                )}
            </Button>

            <Button
                type="button"
                size="icon"
                variant="ghost"
                className="map-control-btn"
                title={
                    isFullscreen
                        ? t("mapViewer.exitFullscreen")
                        : t("mapViewer.enterFullscreen")
                }
                aria-label={
                    isFullscreen
                        ? t("mapViewer.exitFullscreen")
                        : t("mapViewer.enterFullscreen")
                }
                aria-pressed={isFullscreen}
                onClick={onToggleFullscreen}
            >
                {isFullscreen ? (
                    <Shrink className="h-4 w-4" aria-hidden="true" />
                ) : (
                    <Expand className="h-4 w-4" aria-hidden="true" />
                )}
            </Button>

            {showAddMode && (
                <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className={cn(
                        "map-control-btn",
                        addMode &&
                            "bg-status-success-border/15 ring-2 ring-status-success-border/60"
                    )}
                    title={
                        addMode
                            ? t("editableMapViewer.actions.cancelAdd")
                            : t("editableMapViewer.actions.addLocation")
                    }
                    aria-label={
                        addMode
                            ? t("editableMapViewer.actions.cancelAdd")
                            : t("editableMapViewer.actions.addLocation")
                    }
                    aria-pressed={addMode}
                    onClick={onToggleAddMode}
                >
                    <MapPinPlus className="h-4 w-4" aria-hidden="true" />
                </Button>
            )}
        </div>
    );
}
