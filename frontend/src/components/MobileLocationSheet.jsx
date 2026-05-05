import React, { useEffect, useMemo, useRef, useState } from "react";
import LocationPanel from "./LocationPanel";

const SHEET_VISIBLE_HEIGHT = 280;
const MIN_DRAG = 10;

export default function MobileLocationSheet({
    mode, // "hidden" | "peek" | "full"
    location,
    onRequestMode,
}) {
    const [isMounted, setIsMounted] = useState(mode !== "hidden");
    const [dragOffset, setDragOffset] = useState(0);
    const [isDragging, setIsDragging] = useState(false);

    const startYRef = useRef(null);
    const lastDeltaRef = useRef(0);
    const activePointerIdRef = useRef(null);

    useEffect(() => {
        if (mode !== "hidden") {
            setIsMounted(true);
            return;
        }

        const timeoutId = window.setTimeout(() => {
            setIsMounted(false);
            setDragOffset(0);
            setIsDragging(false);
        }, 260);

        return () => window.clearTimeout(timeoutId);
    }, [mode]);

    const viewportHeight = useMemo(() => window.innerHeight, []);
    const peekOffsetPx = Math.max(0, viewportHeight - SHEET_VISIBLE_HEIGHT);

    const baseOffsetPx =
        mode === "full"
            ? 0
            : mode === "peek"
              ? peekOffsetPx
              : viewportHeight;

    useEffect(() => {
        if (!isDragging) return;

        const handlePointerMove = (e) => {
            if (
                activePointerIdRef.current !== null &&
                e.pointerId !== activePointerIdRef.current
            ) {
                return;
            }
            if (startYRef.current == null) return;

            const deltaY = e.clientY - startYRef.current;
            lastDeltaRef.current = deltaY;

            if (mode === "full") {
                setDragOffset(Math.max(0, deltaY));
            } else {
                setDragOffset(deltaY);
            }
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

        const handlePointerUp = (e) => {
            if (
                activePointerIdRef.current !== null &&
                e.pointerId !== activePointerIdRef.current
            ) {
                return;
            }
            finishDrag();
        };

        const handlePointerCancel = () => {
            finishDrag();
        };

        window.addEventListener("pointermove", handlePointerMove);
        window.addEventListener("pointerup", handlePointerUp);
        window.addEventListener("pointercancel", handlePointerCancel);

        return () => {
            window.removeEventListener("pointermove", handlePointerMove);
            window.removeEventListener("pointerup", handlePointerUp);
            window.removeEventListener("pointercancel", handlePointerCancel);
        };
    }, [isDragging, mode, onRequestMode, peekOffsetPx]);

    if (!isMounted) return null;

    const effectiveDragOffset =
        mode === "full"
            ? Math.max(0, dragOffset)
            : dragOffset;

    const translateYPx = baseOffsetPx + effectiveDragOffset;

    const handlePointerDown = (e) => {
        startYRef.current = e.clientY;
        lastDeltaRef.current = 0;
        activePointerIdRef.current = e.pointerId;
        setIsDragging(true);
    };

    return (
        <div className="fixed inset-0 z-[60] p-2 sm:p-4 pointer-events-none">
            <div
                className="absolute inset-x-2 bottom-2 top-2 overflow-hidden rounded-2xl border border-border-emphasis bg-surface-panel/95 shadow-2xl pointer-events-auto sm:inset-x-4 sm:bottom-4 sm:top-4"
                style={{
                    transform: `translateY(${translateYPx}px)`,
                    transition: isDragging
                        ? "none"
                        : "transform 260ms cubic-bezier(0.22, 1, 0.36, 1)",
                    willChange: "transform",
                }}
            >
                <div
                    className="absolute inset-x-0 top-0 z-20 flex justify-center py-3 touch-none"
                    onPointerDown={handlePointerDown}
                >
                    <div className="h-1.5 w-12 rounded-full bg-border-default/80" />
                </div>

                <div className="h-full pt-8">
                    <LocationPanel location={location} />
                </div>
            </div>
        </div>
    );
}