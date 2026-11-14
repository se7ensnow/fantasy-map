import { useCallback, useEffect, useState } from "react";

/**
 * Shared viewer state: fullscreen mode, details panel mode and body scroll lock.
 * Panel modes: "hidden" | "peek" | "full".
 */
export function useViewerChrome() {
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [panelMode, setPanelMode] = useState("hidden");

    const panelShown = panelMode !== "hidden";

    useEffect(() => {
        if (!isFullscreen) return undefined;

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [isFullscreen]);

    useEffect(() => {
        if (!isFullscreen) return undefined;

        const handleKeyDown = (event) => {
            if (event.key === "Escape") {
                setIsFullscreen(false);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isFullscreen]);

    const togglePanel = useCallback(() => {
        setPanelMode((mode) => (mode === "hidden" ? "peek" : "hidden"));
    }, []);

    const showPanel = useCallback(() => setPanelMode("peek"), []);
    const hidePanel = useCallback(() => setPanelMode("hidden"), []);
    const toggleFullscreen = useCallback(() => setIsFullscreen((value) => !value), []);

    return {
        isFullscreen,
        panelMode,
        panelShown,
        setPanelMode,
        togglePanel,
        showPanel,
        hidePanel,
        toggleFullscreen,
    };
}
