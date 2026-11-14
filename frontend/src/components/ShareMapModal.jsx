import { useEffect, useMemo, useState } from "react";
import { Check, Copy, Link2, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Modal from "@/components/ui/modal";
import { createShareId, deleteShareId, getShareId } from "@/api/maps";

function buildShareUrl(shareId) {
    return `${window.location.origin}/maps/share/${shareId}`;
}

export default function ShareMapModal({ open, onClose, mapId, mapTitle }) {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [shareId, setShareId] = useState(null);
    const [copied, setCopied] = useState(false);

    const shareUrl = useMemo(
        () => (shareId ? buildShareUrl(shareId) : ""),
        [shareId]
    );

    useEffect(() => {
        if (!open || !mapId) return undefined;

        let cancelled = false;

        async function load() {
            try {
                setLoading(true);
                const data = await getShareId(mapId);
                if (!cancelled) setShareId(data?.share_id ?? null);
            } catch (error) {
                toast.error(error.message || t("shareModal.errors.failedToLoad"));
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
        setCopied(false);
    }, [shareId, open]);

    useEffect(() => {
        if (!copied) return undefined;

        const timeoutId = window.setTimeout(() => setCopied(false), 2000);
        return () => window.clearTimeout(timeoutId);
    }, [copied]);

    async function handleCreate() {
        try {
            setLoading(true);
            const data = await createShareId(mapId);
            const id = data?.share_id ?? null;
            setShareId(id);
            if (id) toast.success(t("shareModal.toasts.created"));
        } catch (error) {
            toast.error(error.message || t("shareModal.errors.failedToCreate"));
        } finally {
            setLoading(false);
        }
    }

    async function handleDisable() {
        try {
            setLoading(true);
            await deleteShareId(mapId);
            setShareId(null);
            toast.success(t("shareModal.toasts.disabled"));
        } catch (error) {
            toast.error(error.message || t("shareModal.errors.failedToDisable"));
        } finally {
            setLoading(false);
        }
    }

    async function handleCopy() {
        if (!shareUrl) return;

        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            toast.success(t("shareModal.toasts.copied"));
        } catch {
            try {
                const element = document.createElement("textarea");
                element.value = shareUrl;
                element.setAttribute("readonly", "");
                element.style.position = "fixed";
                element.style.opacity = "0";
                document.body.appendChild(element);
                element.select();
                document.execCommand("copy");
                document.body.removeChild(element);
                setCopied(true);
                toast.success(t("shareModal.toasts.copied"));
            } catch {
                toast.error(t("shareModal.errors.failedToCopy"));
            }
        }
    }

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={
                mapTitle
                    ? t("shareModal.titleWithName", { name: mapTitle })
                    : t("shareModal.title")
            }
            closeLabel={t("actions.close")}
            size="md"
        >
            {loading && (
                <div className="flex items-center gap-2 text-sm text-text-heading/70" role="status">
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    {t("shareModal.loading")}
                </div>
            )}

            {!loading && !shareId && (
                <div className="space-y-3">
                    <p className="text-sm text-text-heading/80">
                        {t("shareModal.noLink")}
                    </p>

                    <Button onClick={handleCreate} disabled={loading} className="w-full sm:w-auto">
                        <Link2 className="h-4 w-4" aria-hidden="true" />
                        {t("shareModal.createLink")}
                    </Button>
                </div>
            )}

            {!loading && shareId && (
                <div className="space-y-4">
                    <p className="text-sm text-text-heading/80">
                        {t("shareModal.linkDescription")}
                    </p>

                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <Input
                            value={shareUrl}
                            readOnly
                            aria-label={t("shareModal.linkLabel")}
                            onFocus={(event) => event.target.select()}
                        />

                        <Button
                            onClick={handleCopy}
                            disabled={!shareUrl}
                            className="w-full shrink-0 sm:w-auto"
                        >
                            {copied ? (
                                <Check className="h-4 w-4" aria-hidden="true" />
                            ) : (
                                <Copy className="h-4 w-4" aria-hidden="true" />
                            )}
                            {copied ? t("shareModal.copied") : t("actions.copy")}
                        </Button>
                    </div>

                    <div className="flex flex-col gap-2 border-t border-border-default/30 pt-4 sm:flex-row sm:items-center">
                        <Button
                            variant="destructive"
                            onClick={handleDisable}
                            disabled={loading}
                            className="w-full sm:w-auto"
                        >
                            {t("shareModal.disableLink")}
                        </Button>

                        <p className="text-xs text-text-heading/60">
                            {t("shareModal.disableHint")}
                        </p>
                    </div>
                </div>
            )}
        </Modal>
    );
}
