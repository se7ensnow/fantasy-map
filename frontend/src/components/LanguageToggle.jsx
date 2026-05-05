import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Languages, Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

const LANGUAGES = [
    { code: "en", shortLabel: "EN", labelKey: "language.english" },
    { code: "ru", shortLabel: "RU", labelKey: "language.russian" },
];

export default function LanguageToggle({ compact = false }) {
    const { t, i18n } = useTranslation();
    const [open, setOpen] = useState(false);
    const boxRef = useRef(null);

    const currentLanguage = i18n.language?.startsWith("ru") ? "ru" : "en";

    const current = useMemo(
        () => LANGUAGES.find((lang) => lang.code === currentLanguage) ?? LANGUAGES[0],
        [currentLanguage]
    );

    useEffect(() => {
        function handleClickOutside(event) {
            if (!boxRef.current) return;
            if (!boxRef.current.contains(event.target)) {
                setOpen(false);
            }
        }

        function handleEscape(event) {
            if (event.key === "Escape") {
                setOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleEscape);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleEscape);
        };
    }, []);

    const changeLanguage = async (lng) => {
        if (lng === currentLanguage) {
            setOpen(false);
            return;
        }

        await i18n.changeLanguage(lng);
        localStorage.setItem("language", lng);
        setOpen(false);
    };

    return (
        <div ref={boxRef} className="relative">
            <Button
                type="button"
                variant="ghost"
                onClick={() => setOpen((prev) => !prev)}
                className={[
                    compact
                        ? "h-9 rounded-xl border px-2"
                        : "h-9 rounded-xl border px-2",
                    "bg-surface-page/30 hover:bg-surface-page/50",
                    "border-border-default/40 hover:border-border-emphasis/60",
                    "text-text-heading hover:text-accent-primary",
                    "transition-colors",
                ].join(" ")}
                title={t("language.switchLanguage")}
                aria-label={t("language.switchLanguage")}
                aria-haspopup="menu"
                aria-expanded={open}
            >
                <Languages className={compact ? "h-4 w-4" : "mr-1 h-4 w-4"} />
                {!compact && (
                    <span className="hidden text-sm font-semibold md:inline">
                        {current.shortLabel}
                    </span>
                )}
                {!compact && <ChevronDown className="ml-1 h-4 w-4" />}
            </Button>

            {open && (
                <div
                    className="
                        absolute right-0 z-50 mt-2 w-44 overflow-hidden rounded-xl border
                        border-border-default/40 bg-surface-panel/95 shadow-card backdrop-blur-sm
                    "
                    role="menu"
                >
                    {LANGUAGES.map((lang) => {
                        const isActive = lang.code === currentLanguage;

                        return (
                            <button
                                key={lang.code}
                                type="button"
                                role="menuitem"
                                onClick={() => changeLanguage(lang.code)}
                                className={[
                                    "flex w-full items-center justify-between px-3 py-2 text-sm transition-colors",
                                    isActive
                                        ? "bg-state-selected font-semibold text-text-heading"
                                        : "text-text-primary hover:bg-state-hover",
                                ].join(" ")}
                            >
                                <span>{t(lang.labelKey)}</span>
                                {isActive && <Check className="h-4 w-4" />}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}