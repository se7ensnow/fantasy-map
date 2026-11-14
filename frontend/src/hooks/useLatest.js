import { useEffect, useRef } from "react";

/**
 * Keeps the latest value in a ref so event handlers and effects can read it
 * without being re-created on every render.
 */
export function useLatest(value) {
    const ref = useRef(value);

    useEffect(() => {
        ref.current = value;
    }, [value]);

    return ref;
}
