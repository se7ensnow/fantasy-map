import { useEffect } from "react";

import { useLatest } from "./useLatest";

/** Calls `handler` on pointer events outside of `ref`. */
export function useClickOutside(ref, handler, enabled = true) {
    const handlerRef = useLatest(handler);

    useEffect(() => {
        if (!enabled) return undefined;

        const handlePointerDown = (event) => {
            const element = ref.current;
            if (!element || element.contains(event.target)) return;

            handlerRef.current?.(event);
        };

        document.addEventListener("mousedown", handlePointerDown);
        return () => document.removeEventListener("mousedown", handlePointerDown);
    }, [ref, enabled, handlerRef]);
}
