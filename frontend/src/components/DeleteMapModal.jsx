import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

export default function DeleteMapModal({
    open,
    onClose,
    onConfirm,
    mapTitle,
    loading = false,
}) {
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
            className="fixed inset-0 z-[100] flex items-center justify-center bg-overlay-backdrop/50 px-4"
            onClick={() => {
                if (!loading) onClose?.();
            }}
        >
            <div
                className="
                    w-full max-w-lg rounded-2xl border border-border-emphasis
                    bg-surface-panel shadow-card p-6
                "
                onClick={(e) => e.stopPropagation()}
            >
                <div className="space-y-4">
                    <div>
                        <h2 className="text-2xl font-bold text-text-heading">
                            Delete map
                        </h2>
                        <p className="mt-2 text-text-primary leading-relaxed">
                            This action cannot be undone. To confirm deletion,
                            type the map title exactly as shown below.
                        </p>
                    </div>

                    <div className="rounded-lg border border-border-default/60 bg-surface-paper/60 p-3">
                        <p className="text-sm text-text-muted mb-1">Map title</p>
                        <p className="font-semibold text-text-heading break-words">
                            {mapTitle}
                        </p>
                    </div>

                    <div className="space-y-2">
                        <label
                            htmlFor="delete-map-confirmation"
                            className="block text-sm font-medium text-text-heading"
                        >
                            Type map title to confirm
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
                                text-text-primary outline-none
                                focus:border-border-emphasis
                            "
                            placeholder={mapTitle}
                        />
                    </div>

                    {!isMatch && value.length > 0 && (
                        <p className="text-sm text-status-warning-ink font-medium">
                            The entered title does not match.
                        </p>
                    )}

                    <div className="flex justify-end gap-3 pt-2">
                        <Button
                            variant="outline"
                            onClick={onClose}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={onConfirm}
                            disabled={!isMatch || loading}
                        >
                            {loading ? "Deleting..." : "Delete Map"}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}