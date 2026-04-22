import { useEffect, useState } from "react";

function getLayoutMode() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const isLandscape = width > height;

    // Портретный телефон -> stack
    if (width < 768 && !isLandscape) return "stack";

    // Ландшафтный телефон / планшет / десктоп -> side
    if (isLandscape) return "side";

    // Узкий планшет в портрете -> side тоже удобнее
    if (width >= 768) return "side";

    return "stack";
}

export default function useViewerLayout() {
    const [layoutMode, setLayoutMode] = useState(getLayoutMode);

    useEffect(() => {
        const onResize = () => {
            setLayoutMode(getLayoutMode());
        };

        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, []);

    return layoutMode;
}