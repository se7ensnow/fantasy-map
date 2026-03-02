import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Toaster } from "sonner";
import "./index.css";
import App from "./App.jsx";
import { applyTheme, loadTheme } from "./lib/theme";

applyTheme(loadTheme());

createRoot(document.getElementById("root")).render(
    <StrictMode>
        <App />
        <Toaster
            position="bottom-right"
            richColors
            toastOptions={{
                className: "bg-surface-panel text-text-heading border border-border-default",
                success: {
                    className: "bg-surface-panel text-status-success border border-status-success",
                },
                error: {
                    className: "bg-surface-panel text-status-danger border border-status-danger",
                },
                info: {
                    className: "bg-surface-panel text-status-info border border-status-info",
                },
                warning: {
                    className: "bg-surface-panel text-status-warning border border-status-warning",
                },
            }}
        />
    </StrictMode>
);