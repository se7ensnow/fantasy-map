import { useEffect, useMemo, useState } from "react";
import { Monitor, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { applyTheme, loadTheme, saveTheme, watchSystemTheme } from "@/lib/theme";

const ORDER = ["system", "light", "dark"];

function labelFor(theme) {
    if (theme === "light") return "Light";
    if (theme === "dark") return "Dark";
    return "System";
}

export default function ThemeToggle() {
    const [theme, setTheme] = useState(() => loadTheme());

    useEffect(() => {
        applyTheme(theme);
        saveTheme(theme);
    }, [theme]);

    useEffect(() => {
        return watchSystemTheme(() => {
            if (loadTheme() === "system") applyTheme("system");
        });
    }, []);

    const nextTheme = () => {
        const idx = ORDER.indexOf(theme);
        setTheme(ORDER[(idx + 1) % ORDER.length]);
    };

    const { Icon, title } = useMemo(() => {
        const l = labelFor(theme);
        return {
            Icon: theme === "light" ? Sun : theme === "dark" ? Moon : Monitor,
            title: `Theme: ${l} (click to switch)`,
        };
    }, [theme]);

    const label = labelFor(theme);

    return (
        <div className="flex items-center">
            <Button
                type="button"
                variant="ghost"
                onClick={nextTheme}
                className={[
                    // выглядит как “контрол”
                    "h-9 px-2 rounded-xl border",
                    "bg-surface-page/30 hover:bg-surface-page/50",
                    "border-border-default/40 hover:border-border-emphasis/60",
                    "text-text-heading hover:text-accent-primary",
                    "transition-colors",
                ].join(" ")}
                title={title}
                aria-label={title}
            >
                <Icon className="mr-1" />
                {/* На мобиле можно скрыть текст, на md+ показать */}
                <span className="hidden md:inline text-sm font-semibold">
                    {label}
                </span>
            </Button>
        </div>
    );
}