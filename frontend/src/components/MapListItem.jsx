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

    const stopCardOpen = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleCardKeyDown = (e) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onOpen?.();
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
                onClick={() => onOpen?.()}
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
                        <h3 className="mb-1 text-xl font-bold text-accent-text">
                            {map.title}
                        </h3>

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
                        <Button onClick={handleActionClick(onOpen)}>
                            View
                        </Button>

                        {showShare && (
                            <Button variant="secondary" onClick={handleOpenShare}>
                                Share
                            </Button>
                        )}

                        {onEdit && (
                            <Button
                                variant="secondary"
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