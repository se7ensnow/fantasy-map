import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import AppToaster from "@/components/AppToaster";
import { applyTheme, loadTheme } from "./lib/theme";
import "./i18n";

applyTheme(loadTheme());

createRoot(document.getElementById("root")).render(
    <StrictMode>
        <App />
        <AppToaster />
    </StrictMode>
);