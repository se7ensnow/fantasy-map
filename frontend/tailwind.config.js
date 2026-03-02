/** @type {import('tailwindcss').Config} */

export default {
    content: [
        "./index.html",
        "./src/**/*.{js,jsx,ts,tsx}",
    ],
    darkMode: "class",
    theme: {
        extend: {
            fontFamily: {
                serif: ["Merriweather", "serif"],
                display: ['"Cormorant Garamond"', "serif"],
                tag: ["Cinzel", "serif"],
            },

            colors: {
                /* =========================
                   Surface
                   ========================= */
                "surface-page": "rgb(var(--surface-page) / <alpha-value>)",
                "surface-panel": "rgb(var(--surface-panel) / <alpha-value>)",
                "surface-input": "rgb(var(--surface-input) / <alpha-value>)",
                "surface-paper": "rgb(var(--surface-paper) / <alpha-value>)",

                /* =========================
                   Text
                   ========================= */
                "text-primary": "rgb(var(--text-primary) / <alpha-value>)",
                "text-heading": "rgb(var(--text-heading) / <alpha-value>)",
                "text-link": "rgb(var(--text-link) / <alpha-value>)",
                "text-muted": "rgb(var(--text-muted) / <alpha-value>)",
                "text-link-hover": "rgb(var(--text-link-hover) / <alpha-value>)",
                "text-on-accent": "rgb(var(--text-on-accent) / <alpha-value>)",

                /* =========================
                   Borders
                   ========================= */
                "border-default": "rgb(var(--border-default) / <alpha-value>)",
                "border-emphasis": "rgb(var(--border-emphasis) / <alpha-value>)",

                /* =========================
                   Accent
                   ========================= */
                "accent-primary": "rgb(var(--accent-primary) / <alpha-value>)",
                "accent-primary-hover": "rgb(var(--accent-primary-hover) / <alpha-value>)",
                "accent-ink": "rgb(var(--accent-ink) / <alpha-value>)",
                "accent-text": "rgb(var(--accent-text) / <alpha-value>)",

                /* =========================
                   Overlay
                   ========================= */
                "overlay-backdrop": "rgb(var(--overlay-backdrop) / <alpha-value>)",

                /* =========================
                   Interaction states
                   ========================= */

                "state-selected": "rgb(var(--state-selected-bg) / <alpha-value>)",
                "state-hover": "rgb(var(--state-hover-bg) / <alpha-value>)",

                /* =========================
                   Status (toast, destructive, etc.)
                   ========================= */
                "status-toast-bg": "rgb(var(--status-toast-bg) / <alpha-value>)",

                "status-danger": "rgb(var(--status-danger) / <alpha-value>)",
                "status-danger-hover": "rgb(var(--status-danger-hover) / <alpha-value>)",

                "status-error-ink": "rgb(var(--status-error-ink) / <alpha-value>)",
                "status-error-border": "rgb(var(--status-error-border) / <alpha-value>)",

                "status-success-ink": "rgb(var(--status-success-ink) / <alpha-value>)",
                "status-success-border": "rgb(var(--status-success-border) / <alpha-value>)",

                "status-info-ink": "rgb(var(--status-info-ink) / <alpha-value>)",
                "status-info-border": "rgb(var(--status-info-border) / <alpha-value>)",

                "status-warning-ink": "rgb(var(--status-warning-ink) / <alpha-value>)",
                "status-warning-border": "rgb(var(--status-warning-border) / <alpha-value>)",

                /* =========================
                   Markdown (separate palette)
                   ========================= */
                "md-text": "rgb(var(--md-text) / <alpha-value>)",
                "md-strong": "rgb(var(--md-strong) / <alpha-value>)",
                "md-heading": "rgb(var(--md-heading) / <alpha-value>)",
                "md-link": "rgb(var(--md-link) / <alpha-value>)",
                "md-link-hover": "rgb(var(--md-link-hover) / <alpha-value>)",
                "md-quote-border": "rgb(var(--md-quote-border) / <alpha-value>)",
                "md-quote-text": "rgb(var(--md-quote-text) / <alpha-value>)",
                "md-hr": "rgb(var(--md-hr) / <alpha-value>)",
                "md-code-bg": "rgb(var(--md-code-bg) / <alpha-value>)",
                "md-code-border": "rgb(var(--md-code-border) / <alpha-value>)",
                "md-code-text": "rgb(var(--md-code-text) / <alpha-value>)",
                "md-pre-bg": "rgb(var(--md-pre-bg) / <alpha-value>)",
                "md-pre-border": "rgb(var(--md-pre-border) / <alpha-value>)",
                "md-table-border": "rgb(var(--md-table-border) / <alpha-value>)",
                "md-th-bg": "rgb(var(--md-th-bg) / <alpha-value>)",
                "md-th-text": "rgb(var(--md-th-text) / <alpha-value>)",
            },

            boxShadow: {
                "card": "var(--shadow-card)",
                "card-hover": "var(--shadow-card-hover)",
            },
        },
    },
    plugins: [],
};