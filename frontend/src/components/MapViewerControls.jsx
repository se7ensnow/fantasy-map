import React from "react";
import { useTranslation } from "react-i18next";
import { Expand, Shrink, PanelRightClose, PanelRightOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function MapViewerControls({
    isFullscreen,
    showPanel,
    onTogglePanel,
    onToggleFullscreen,
    floating = true,
}) {
    const { t } = useTranslation();

    const wrapperClass = floating
        ? "absolute right-2 top-2 z-40 flex flex-col gap-2 md:right-3 md:top-3"
        : "flex flex-col gap-2";

    return (
        <div className={wrapperClass}>
            <Button
                type="button"
                size="icon"
                variant="ghost"
                className="map-control-btn"
                title={showPanel ? t("mapViewer.hidePanel") : t("mapViewer.showPanel")}
                aria-label={showPanel ? t("mapViewer.hidePanel") : t("mapViewer.showPanel")}
                onClick={onTogglePanel}
            >
                {showPanel ? (
                    <PanelRightClose className="h-4 w-4" />
                ) : (
                    <PanelRightOpen className="h-4 w-4" />
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
                onClick={onToggleFullscreen}
            >
                {isFullscreen ? (
                    <Shrink className="h-4 w-4" />
                ) : (
                    <Expand className="h-4 w-4" />
                )}
            </Button>
        </div>
    );
}