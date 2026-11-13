import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Modal from "@/components/ui/modal";

export default function DeleteMapModal({
    open,
    onClose,
    onConfirm,
    mapTitle,
    loading = false,
}) {
    const { t } = useTranslation();
    const [value, setValue] = useState("");
    const inputRef = useRef(null);

    useEffect(() => {
        if (!open) {
            setValue("");
        }
    }, [open]);

    const isMatch = useMemo(
        () => value.trim() === (mapTitle || "").trim(),
        [value, mapTitle]
    );

    const handleClose = () => {
        if (!loading) onClose?.();
    };

    return (
        <Modal
            open={open}
            onClose={handleClose}
            title={t("deleteMapModal.title")}
            closeLabel={t("actions.close")}
            size="md"
            initialFocusRef={inputRef}
            footer={
                <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                    <Button
                        variant="outline"
                        onClick={handleClose}
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
            }
        >
            <div className="space-y-4">
                <div className="flex items-start gap-3 rounded-lg border border-status-error-border/50 bg-status-error-border/10 p-3">
                    <AlertTriangle
                        className="mt-0.5 h-5 w-5 shrink-0 text-status-error-ink"
                        aria-hidden="true"
                    />
                    <p className="text-sm leading-relaxed text-status-error-ink md:text-base">
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

                    <Input
                        ref={inputRef}
                        id="delete-map-confirmation"
                        type="text"
                        value={value}
                        onChange={(event) => setValue(event.target.value)}
                        disabled={loading}
                        placeholder={mapTitle}
                        autoComplete="off"
                    />
                </div>

                {value.length > 0 && (
                    <p
                        className={
                            isMatch
                                ? "text-sm font-medium text-status-success-ink"
                                : "text-sm font-medium text-status-warning-ink"
                        }
                        role="status"
                    >
                        {isMatch
                            ? t("deleteMapModal.match")
                            : t("deleteMapModal.mismatch")}
                    </p>
                )}
            </div>
        </Modal>
    );
}
