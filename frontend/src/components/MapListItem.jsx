import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ShareMapModal from "@/components/ShareMapModal";
import DeleteMapModal from "@/components/DeleteMapModal";

export default function MapListItem({
    map,
    onDelete,
    onEdit,
    onOpen,
    onTagClick,
    activeTags = [],
    showShare = false,
}) {
    const [shareOpen, setShareOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);

    const tags = Array.isArray(map.tags) ? map.tags : [];
    const activeSet = new Set(activeTags);

    const sortTags = (a, b) =>
        a.localeCompare(b, undefined, { sensitivity: "base" });

    const activeOnCard = tags.filter((t) => activeSet.has(t)).sort(sortTags);
    const inactiveOnCard = tags.filter((t) => !activeSet.has(t)).sort(sortTags);
    const ordered = [...activeOnCard, ...inactiveOnCard];

    const MAX_VISIBLE = 5;
    const mustShowCount = activeOnCard.length;
    const visibleCount = Math.max(mustShowCount, MAX_VISIBLE);
    const visible = ordered.slice(0, visibleCount);

    const hiddenInactiveCount = Math.max(
        0,
        inactiveOnCard.length - Math.max(0, visibleCount - mustShowCount)
    );

    const isDraft = map.status === "draft";
    const isReady = map.status === "ready";
    const canShare = showShare && isReady;
    const cardAction = isDraft ? onEdit : onOpen;

    const stopCardOpen = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleCardKeyDown = (e) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            cardAction?.();
        }
    };

    const handleActionClick = (action) => (e) => {
        stopCardOpen(e);
        action?.();
    };

    const handleTagActivate = (tag) => (e) => {
        stopCardOpen(e);
        onTagClick?.(tag);
    };

    const handleTagKeyDown = (tag) => (e) => {
        if (e.key === "Enter" || e.key === " ") {
            stopCardOpen(e);
            onTagClick?.(tag);
        }
    };

    const handleOpenShare = (e) => {
        stopCardOpen(e);
        setShareOpen(true);
    };

    const handleOpenDelete = (e) => {
        stopCardOpen(e);
        setDeleteOpen(true);
    };

    const handleConfirmDelete = async () => {
        await onDelete?.();
        setDeleteOpen(false);
    };

    return (
        <>
            <div
                role="button"
                tabIndex={0}
                onClick={() => cardAction?.()}
                onKeyDown={handleCardKeyDown}
                className="
                    rounded-lg border-2 border-border-emphasis bg-surface-panel p-4
                    shadow-card hover:shadow-card-hover
                    hover:border-border-emphasis/80
                    dark:hover:bg-state-hover/50
                    transition-[box-shadow,background-color,border-color] duration-200
                "
            >
                <div className="flex justify-between items-center gap-4">
                    <div className="min-w-0">
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                            {isDraft && (
                                <Badge className="border-status-warning-border/60 bg-status-warning-border/10 text-status-warning-ink">
                                    Draft
                                </Badge>
                            )}

                            {isReady && map.visibility === "public" && (
                                <Badge className="border-accent-primary/40 bg-accent-primary/10 text-accent-text">
                                    Public
                                </Badge>
                            )}

                            {isReady && map.visibility === "private" && (
                                <Badge className="border-border-default/50 bg-surface-paper/70 text-text-muted">
                                    Private
                                </Badge>
                            )}

                            <h3 className="text-xl font-bold text-accent-text">
                                {map.title}
                            </h3>
                        </div>

                        {tags.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                                {visible.map((t) => {
                                    const isActive = activeSet.has(t);

                                    return (
                                        <Badge
                                            key={t}
                                            role="button"
                                            tabIndex={0}
                                            className={
                                                isActive
                                                    ? "cursor-pointer select-none border-accent-primary bg-accent-primary/15"
                                                    : "cursor-pointer select-none"
                                            }
                                            onClick={handleTagActivate(t)}
                                            onKeyDown={handleTagKeyDown(t)}
                                            title={
                                                isActive
                                                    ? "Active filter (click to remove)"
                                                    : "Click to filter by this tag"
                                            }
                                        >
                                            <span className="tag-font">{t}</span>
                                        </Badge>
                                    );
                                })}

                                {hiddenInactiveCount > 0 && (
                                    <Badge className="select-none opacity-80">
                                        <span className="tag-font">+{hiddenInactiveCount}</span>
                                    </Badge>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex shrink-0 space-x-2">
                        {isReady ? (
                            <Button onClick={handleActionClick(onOpen)}>
                                View
                            </Button>
                        ) : null}

                        {canShare && (
                            <Button variant="secondary" onClick={handleOpenShare}>
                                Share
                            </Button>
                        )}

                        {onEdit && (
                            <Button
                                variant={isDraft ? "default" : "secondary"}
                                onClick={handleActionClick(onEdit)}
                            >
                                Edit
                            </Button>
                        )}

                        {onDelete && (
                            <Button
                                variant="destructive"
                                onClick={handleOpenDelete}
                            >
                                Delete
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            <ShareMapModal
                open={shareOpen}
                onClose={() => setShareOpen(false)}
                mapId={map.id}
                mapTitle={map.title}
            />

            <DeleteMapModal
                open={deleteOpen}
                onClose={() => setDeleteOpen(false)}
                onConfirm={handleConfirmDelete}
                mapTitle={map.title}
            />
        </>
    );
}