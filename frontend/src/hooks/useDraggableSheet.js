import { useCallback, useEffect, useRef, useState } from "react";

import { useViewportHeight } from "./useViewportHeight";

const MIN_DRAG = 10;
const ANIMATION_MS = 260;

/**
 * Shared drag-to-resize logic for the mobile bottom sheets.
 *
 * Modes: "hidden" | "peek" | "full".
 */
export function useDraggableSheet({ mode, onRequestMode, visibleHeight }) {
    const [isMounted, setIsMounted] = useState(mode !== "hidden");
    const [dragOffset, setDragOffset] = useState(0);
    const [isDragging, setIsDragging] = useState(false);

    const startYRef = useRef(null);
    const lastDeltaRef = useRef(0);
    const activePointerIdRef = useRef(null);

    const viewportHeight = useViewportHeight();
    const peekOffsetPx = Math.max(0, viewportHeight - visibleHeight);

    useEffect(() => {
        if (mode !== "hidden") {
            setIsMounted(true);
            return undefined;
        }

        const timeoutId = window.setTimeout(() => {
            setIsMounted(false);
            setDragOffset(0);
            setIsDragging(false);
        }, ANIMATION_MS);

        return () => window.clearTimeout(timeoutId);
    }, [mode]);

    useEffect(() => {
        if (!isDragging) return undefined;

        const handlePointerMove = (event) => {
            if (
                activePointerIdRef.current !== null &&
                event.pointerId !== activePointerIdRef.current
            ) {
                return;
            }
            if (startYRef.current == null) return;

            const deltaY = event.clientY - startYRef.current;
            lastDeltaRef.current = deltaY;

            setDragOffset(mode === "full" ? Math.max(0, deltaY) : deltaY);
        };

        const finishDrag = () => {
            const deltaY = lastDeltaRef.current;

            if (mode === "peek") {
                if (deltaY < -MIN_DRAG) {
                    onRequestMode("full");
                } else if (deltaY > MIN_DRAG) {
                    onRequestMode("hidden");
                }
            } else if (mode === "full") {
                const finalOffset = Math.max(0, deltaY);

                if (finalOffset > peekOffsetPx) {
                    onRequestMode("hidden");
                } else if (deltaY > MIN_DRAG) {
                    onRequestMode("peek");
                }
            }

            setIsDragging(false);
            startYRef.current = null;
            activePointerIdRef.current = null;
            lastDeltaRef.current = 0;
            setDragOffset(0);
        };

        const handlePointerUp = (event) => {
            if (
                activePointerIdRef.current !== null &&
                event.pointerId !== activePointerIdRef.current
            ) {
                return;
            }
            finishDrag();
        };

        window.addEventListener("pointermove", handlePointerMove);
        window.addEventListener("pointerup", handlePointerUp);
        window.addEventListener("pointercancel", finishDrag);

        return () => {
            window.removeEventListener("pointermove", handlePointerMove);
            window.removeEventListener("pointerup", handlePointerUp);
            window.removeEventListener("pointercancel", finishDrag);
        };
    }, [isDragging, mode, onRequestMode, peekOffsetPx]);

    const handlePointerDown = useCallback((event) => {
        startYRef.current = event.clientY;
        lastDeltaRef.current = 0;
        activePointerIdRef.current = event.pointerId;
        setIsDragging(true);
    }, []);

    const baseOffsetPx =
        mode === "full" ? 0 : mode === "peek" ? peekOffsetPx : viewportHeight;

    const translateYPx = baseOffsetPx + (mode === "full" ? Math.max(0, dragOffset) : dragOffset);

    if (!isMounted) {
        return { isMounted, isDragging, translateYPx: viewportHeight, handlePointerDown };
    }

    return { isMounted, isDragging, translateYPx, handlePointerDown };
}
