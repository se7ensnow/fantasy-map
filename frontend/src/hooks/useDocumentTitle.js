import { useEffect } from "react";

const APP_NAME = "Fantasy Maps";

/** Keeps `document.title` in sync with the current page. */
export function useDocumentTitle(title) {
    useEffect(() => {
        document.title = title ? `${title} · ${APP_NAME}` : APP_NAME;
    }, [title]);
}
