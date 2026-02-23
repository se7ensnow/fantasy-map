import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createShareId, deleteShareId, getShareId } from "@/api/maps";

function buildShareUrl(shareId) {
  const base = window.location.origin;
  return `${base}/maps/share/${shareId}`;
}

export default function ShareMapModal({ open, onClose, mapId, mapTitle }) {
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
        toast.error(e.message || "Failed to load share link");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [open, mapId]);

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
      if (id) toast.success("Share link created");
    } catch (e) {
      toast.error(e.message || "Failed to create share link");
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
        toast.success("Share link disabled");
      } else {
        toast.error("Failed to disable share link");
      }
    } catch (e) {
      toast.error(e.message || "Failed to disable share link");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied");
    } catch {
      try {
        const el = document.createElement("textarea");
        el.value = shareUrl;
        document.body.appendChild(el);
        el.select();
        document.execCommand("copy");
        document.body.removeChild(el);
        toast.success("Link copied");
      } catch {
        toast.error("Failed to copy");
      }
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg bg-[rgba(252,247,233,0.97)] border border-amber-700/40 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle className="text-xl">
              Share map{mapTitle ? `: ${mapTitle}` : ""}
            </CardTitle>

            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </CardHeader>

          <CardContent className="space-y-4">
            {loading && (
              <div className="text-sm text-amber-900/70">Loading…</div>
            )}

            {!loading && !shareId && (
              <div className="space-y-3">
                <div className="text-sm text-amber-900/80">
                  No share link yet. Create one to share with friends.
                </div>
                <Button onClick={handleCreate} disabled={loading}>
                  Create share link
                </Button>
              </div>
            )}

            {!loading && shareId && (
              <div className="space-y-3">
                <div className="text-sm text-amber-900/80">
                  Anyone with this link can open the map:
                </div>

                <div className="flex items-center gap-2">
                  <input
                    className="flex-1 h-10 rounded-md border border-amber-700/30 bg-white/70 px-3 text-sm"
                    value={shareUrl}
                    readOnly
                  />
                  <Button onClick={handleCopy} disabled={!shareUrl}>
                    Copy
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="destructive" onClick={handleDisable} disabled={loading}>
                    Disable link
                  </Button>
                  <div className="text-xs text-amber-900/60">
                    Disabling invalidates the link.
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