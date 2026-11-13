import { useEffect, useState } from "react";

function getViewportHeight() {
    if (typeof window === "undefined") return 0;
    return window.visualViewport?.height ?? window.innerHeight;
}

/** Tracks visual viewport height so bottom sheets survive rotation/resize. */
export function useViewportHeight() {
    const [height, setHeight] = useState(getViewportHeight);

    useEffect(() => {
        const update = () => setHeight(getViewportHeight());

        window.addEventListener("resize", update);
        window.visualViewport?.addEventListener("resize", update);

        return () => {
            window.removeEventListener("resize", update);
            window.visualViewport?.removeEventListener("resize", update);
        };
    }, []);

    return height;
}
