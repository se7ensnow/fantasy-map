// src/lib/theme.js
const STORAGE_KEY = "theme"; // "light" | "dark" | "system"

export function getSystemTheme() {
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function loadTheme() {
    try {
        return localStorage.getItem(STORAGE_KEY) || "system";
    } catch {
        // Safari private mode / blocked storage.
        return "system";
    }
}

export function saveTheme(theme) {
    try {
        localStorage.setItem(STORAGE_KEY, theme);
    } catch {
        // Persisting the preference is best-effort; the UI still works.
    }
}

export function applyTheme(theme) {
    const root = document.documentElement;
    const actual = theme === "system" ? getSystemTheme() : theme;

    root.classList.toggle("dark", actual === "dark");
    root.dataset.theme = theme;
    // Keep the browser canvas/scrollbars (and Safari toolbar) in sync before
    // the next frame instead of letting the default white show through.
    root.style.colorScheme = actual;
}

export function watchSystemTheme(onChange) {
    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!mq) return () => { };

    const handler = () => onChange(mq.matches ? "dark" : "light");

    if (mq.addEventListener) mq.addEventListener("change", handler);
    else mq.addListener(handler);

    return () => {
        if (mq.removeEventListener) mq.removeEventListener("change", handler);
        else mq.removeListener(handler);
    };
}
