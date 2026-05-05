import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

export default function DeleteMapModal({
    open,
    onClose,
    onConfirm,
    mapTitle,
    loading = false,
}) {
    const { t } = useTranslation();
    const [value, setValue] = useState("");

    useEffect(() => {
        if (!open) {
            setValue("");
        }
    }, [open]);

    const isMatch = useMemo(
        () => value.trim() === (mapTitle || "").trim(),
        [value, mapTitle]
    );

    useEffect(() => {
        if (!open) return;

        const handleEsc = (e) => {
            if (e.key === "Escape" && !loading) {
                onClose?.();
            }
        };

        window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, [open, loading, onClose]);

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-overlay-backdrop/50 px-2 py-4 md:px-4"
            onClick={() => {
                if (!loading) onClose?.();
            }}
        >
            <div
                className="w-full max-w-lg rounded-2xl border border-border-emphasis bg-surface-panel p-4 shadow-card md:p-6"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="space-y-4">
                    <div>
                        <h2 className="text-xl font-bold text-text-heading md:text-2xl">
                            {t("deleteMapModal.title")}
                        </h2>
                        <p className="mt-2 text-sm leading-relaxed text-text-primary md:text-base">
                            {t("deleteMapModal.description")}
                        </p>
                    </div>

                    <div className="rounded-lg border border-border-default/60 bg-surface-paper/60 p-3">
                        <p className="mb-1 text-xs text-text-muted md:text-sm">
                            {t("deleteMapModal.mapTitleLabel")}
                        </p>
                        <p className="break-words font-semibold text-text-heading">
                            {mapTitle}
                        </p>
                    </div>

                    <div className="space-y-2">
                        <label
                            htmlFor="delete-map-confirmation"
                            className="block text-sm font-medium text-text-heading"
                        >
                            {t("deleteMapModal.confirmationLabel")}
                        </label>
                        <input
                            id="delete-map-confirmation"
                            type="text"
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                            autoFocus
                            disabled={loading}
                            className="
                                w-full rounded-md border border-border-default
                                bg-surface-input px-3 py-2
                                text-sm text-text-primary outline-none
                                focus:border-border-emphasis md:text-base
                            "
                            placeholder={mapTitle}
                        />
                    </div>

                    {!isMatch && value.length > 0 && (
                        <p className="text-sm font-medium text-status-warning-ink">
                            {t("deleteMapModal.mismatch")}
                        </p>
                    )}

                    <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-end">
                        <Button
                            variant="outline"
                            onClick={onClose}
                            disabled={loading}
                            className="w-full sm:w-auto"
                        >
                            {t("actions.cancel")}
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={onConfirm}
                            disabled={!isMatch || loading}
                            className="w-full sm:w-auto"
                        >
                            {loading
                                ? t("deleteMapModal.deleting")
                                : t("deleteMapModal.deleteMap")}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}