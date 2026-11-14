import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Scroll-fade state for a scrollable panel.
 * Resets scroll position only when `resetKey` changes, not on every content
 * update (e.g. dragging a marker should not jump the panel to the top).
 */
export function useScrollFades(resetKey) {
    const scrollRef = useRef(null);
    const [showTopFade, setShowTopFade] = useState(false);
    const [showBottomFade, setShowBottomFade] = useState(false);

    const updateFades = useCallback(() => {
        const element = scrollRef.current;

        if (!element) {
            setShowTopFade(false);
            setShowBottomFade(false);
            return;
        }

        const { scrollTop, scrollHeight, clientHeight } = element;
        setShowTopFade(scrollTop > 4);
        setShowBottomFade(scrollTop + clientHeight < scrollHeight - 4);
    }, []);

    const scrollToTop = useCallback(() => {
        scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    }, []);

    useEffect(() => {
        const element = scrollRef.current;
        if (!element) return;

        element.scrollTop = 0;
        updateFades();
    }, [resetKey, updateFades]);

    useEffect(() => {
        const element = scrollRef.current;
        if (!element) return undefined;

        const observer = new ResizeObserver(updateFades);
        observer.observe(element);

        return () => observer.disconnect();
    }, [updateFades]);

    return {
        scrollRef,
        showTopFade,
        showBottomFade,
        scrollToTop,
        updateFades,
    };
}
