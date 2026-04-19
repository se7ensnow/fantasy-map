import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createShareId, deleteShareId, getShareId } from "@/api/maps";

function buildShareUrl(shareId) {
    const base = window.location.origin;
    return `${base}/maps/share/${shareId}`;
}

export default function ShareMapModal({ open, onClose, mapId, mapTitle }) {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [shareId, setShareId] = useState(null);

    const shareUrl = useMemo(() => (shareId ? buildShareUrl(shareId) : ""), [shareId]);

    useEffect(() => {
        if (!open || !mapId) return;

        let cancelled = false;

        async function load() {
            try {
                setLoading(true);
                const data = await getShareId(mapId);
                if (!cancelled) setShareId(data?.share_id ?? null);
            } catch (e) {
                toast.error(e.message || t("shareModal.errors.failedToLoad"));
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        load();

        return () => {
            cancelled = true;
        };
    }, [open, mapId, t]);

    useEffect(() => {
        if (!open) return;
        function onKeyDown(e) {
            if (e.key === "Escape") onClose?.();
        }
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [open, onClose]);

    async function handleCreate() {
        try {
            setLoading(true);
            const data = await createShareId(mapId);
            const id = data?.share_id ?? null;
            setShareId(id);
            if (id) toast.success(t("shareModal.toasts.created"));
        } catch (e) {
            toast.error(e.message || t("shareModal.errors.failedToCreate"));
        } finally {
            setLoading(false);
        }
    }

    async function handleDisable() {
        try {
            setLoading(true);
            const ok = await deleteShareId(mapId);
            if (ok) {
                setShareId(null);
                toast.success(t("shareModal.toasts.disabled"));
            } else {
                toast.error(t("shareModal.errors.failedToDisable"));
            }
        } catch (e) {
            toast.error(e.message || t("shareModal.errors.failedToDisable"));
        } finally {
            setLoading(false);
        }
    }

    async function handleCopy() {
        if (!shareUrl) return;
        try {
            await navigator.clipboard.writeText(shareUrl);
            toast.success(t("shareModal.toasts.copied"));
        } catch {
            try {
                const el = document.createElement("textarea");
                el.value = shareUrl;
                document.body.appendChild(el);
                el.select();
                document.execCommand("copy");
                document.body.removeChild(el);
                toast.success(t("shareModal.toasts.copied"));
            } catch {
                toast.error(t("shareModal.errors.failedToCopy"));
            }
        }
    }

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50">
            <div
                className="absolute inset-0 bg-overlay-backdrop/40"
                onClick={onClose}
                aria-hidden="true"
            />

            <div className="absolute inset-0 flex items-center justify-center p-4">
                <Card variant="surface" className="w-full max-w-lg shadow-lg bg-surface-panel/95">
                    <CardHeader className="flex flex-row items-center justify-between gap-3">
                        <CardTitle className="text-xl">
                            {mapTitle
                                ? t("shareModal.titleWithName", { name: mapTitle })
                                : t("shareModal.title")}
                        </CardTitle>

                        <Button variant="outline" onClick={onClose}>
                            {t("actions.close")}
                        </Button>
                    </CardHeader>

                    <CardContent className="space-y-4">
                        {loading && (
                            <div className="text-sm text-text-heading/70">
                                {t("shareModal.loading")}
                            </div>
                        )}

                        {!loading && !shareId && (
                            <div className="space-y-3">
                                <div className="text-sm text-text-heading/80">
                                    {t("shareModal.noLink")}
                                </div>
                                <Button onClick={handleCreate} disabled={loading}>
                                    {t("shareModal.createLink")}
                                </Button>
                            </div>
                        )}

                        {!loading && shareId && (
                            <div className="space-y-3">
                                <div className="text-sm text-text-heading/80">
                                    {t("shareModal.linkDescription")}
                                </div>

                                <div className="flex items-center gap-2">
                                    <input
                                        className="flex-1 h-10 rounded-md border px-3 text-sm bg-surface-input text-text-primary border-border-default/30"
                                        value={shareUrl}
                                        readOnly
                                    />
                                    <Button onClick={handleCopy} disabled={!shareUrl}>
                                        {t("actions.copy")}
                                    </Button>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Button variant="destructive" onClick={handleDisable} disabled={loading}>
                                        {t("shareModal.disableLink")}
                                    </Button>
                                    <div className="text-xs text-text-heading/60">
                                        {t("shareModal.disableHint")}
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}