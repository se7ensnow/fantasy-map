// src/lib/theme.js
const STORAGE_KEY = "theme"; // "light" | "dark" | "system"

export function getSystemTheme() {
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function loadTheme() {
    return localStorage.getItem(STORAGE_KEY) || "system";
}

export function saveTheme(theme) {
    localStorage.setItem(STORAGE_KEY, theme);
}

export function applyTheme(theme) {
    const root = document.documentElement;
    const actual = theme === "system" ? getSystemTheme() : theme;

    root.classList.toggle("dark", actual === "dark");
    root.dataset.theme = theme;
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