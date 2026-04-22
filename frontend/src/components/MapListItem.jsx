import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowUpRight } from "lucide-react";
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
    isProfileView = false,
}) {
    const { t } = useTranslation();
    const [shareOpen, setShareOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);

    const tags = Array.isArray(map.tags) ? map.tags : [];
    const activeSet = new Set(activeTags);

    const sortTags = (a, b) =>
        a.localeCompare(b, undefined, { sensitivity: "base" });

    const activeOnCard = tags.filter((tag) => activeSet.has(tag)).sort(sortTags);
    const inactiveOnCard = tags.filter((tag) => !activeSet.has(tag)).sort(sortTags);
    const ordered = [...activeOnCard, ...inactiveOnCard];

    const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
    const MAX_VISIBLE = isMobile ? 4 : 5;

    const mustShowCount = activeOnCard.length;
    const visibleCount = Math.max(mustShowCount, MAX_VISIBLE);
    const visible = ordered.slice(0, visibleCount);

    const hiddenInactiveCount = Math.max(
        0,
        inactiveOnCard.length - Math.max(0, visibleCount - mustShowCount)
    );

    const isDraft = map.status === "draft";
    const isReady = map.status === "ready";

    const canShowStatus = isProfileView;
    const canShare = isProfileView && isReady;
    const canEdit = isProfileView && !!onEdit;
    const canDelete = isProfileView && !!onDelete;
    const canView = isProfileView && isReady && !!onOpen;

    const cardAction = !isProfileView ? onOpen : null;
    const cardClickable = !isProfileView && !!cardAction;

    const stopCardOpen = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleCardKeyDown = (e) => {
        if (!cardClickable) return;

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
                role={cardClickable ? "button" : undefined}
                tabIndex={cardClickable ? 0 : undefined}
                onClick={cardClickable ? () => cardAction?.() : undefined}
                onKeyDown={handleCardKeyDown}
                className={[
                    "rounded-lg border-2 border-border-emphasis bg-surface-panel p-3 md:p-4",
                    "shadow-card transition-[box-shadow,background-color,border-color,transform] duration-200",
                    cardClickable
                        ? "group cursor-pointer hover:-translate-y-0.5 hover:border-accent-primary/40 hover:shadow-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/50 dark:hover:bg-state-hover/50"
                        : "",
                ].join(" ")}
            >
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between md:gap-4">
                    <div className="min-w-0 flex-1">
                        <div className="flex min-w-0 flex-col gap-2">
                            <div className="flex flex-wrap items-start gap-2">
                                {canShowStatus && isDraft && (
                                    <Badge className="border-status-warning-border/60 bg-status-warning-border/10 text-status-warning-ink">
                                        {t("mapCard.status.draft")}
                                    </Badge>
                                )}

                                {canShowStatus && isReady && map.visibility === "public" && (
                                    <Badge className="border-accent-primary/40 bg-accent-primary/10 text-accent-text">
                                        {t("mapCard.status.public")}
                                    </Badge>
                                )}

                                {canShowStatus && isReady && map.visibility === "private" && (
                                    <Badge className="border-border-default/50 bg-surface-paper/70 text-text-muted">
                                        {t("mapCard.status.private")}
                                    </Badge>
                                )}

                                <div className="flex min-w-0 flex-1 items-start justify-between gap-3">
                                    <h3 className="min-w-0 break-words text-2xl font-bold text-accent-text md:text-3xl">
                                        {map.title}
                                    </h3>
                            
                                    {cardClickable && (
                                        <ArrowUpRight className="mt-1 h-5 w-5 shrink-0 text-text-muted transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-accent-primary" />
                                    )}
                                </div>
                            </div>
                                
                            {!isProfileView && tags.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1 md:mt-3 md:gap-2">
                                    {visible.map((tag) => {
                                        const isActive = activeSet.has(tag);
                                    
                                        return (
                                            <Badge
                                                key={tag}
                                                role="button"
                                                tabIndex={0}
                                                className={[
                                                    "cursor-pointer select-none",
                                                    "rounded-md px-1.5 py-[1px] text-[9px] md:rounded-full md:px-2 md:py-[2px] md:text-[11px]",
                                                    isActive
                                                        ? "border-accent-primary bg-accent-primary/15"
                                                        : "",
                                                ].join(" ")}
                                                onClick={handleTagActivate(tag)}
                                                onKeyDown={handleTagKeyDown(tag)}
                                                title={
                                                    isActive
                                                        ? t("mapCard.tagTitles.activeFilter")
                                                        : t("mapCard.tagTitles.filterByTag")
                                                }
                                            >
                                                <span className="tag-font">{tag}</span>
                                            </Badge>
                                        );
                                    })}

                                    {hiddenInactiveCount > 0 && (
                                        <Badge className="select-none rounded-md px-1.5 py-[1px] text-[9px] opacity-80 md:rounded-full md:px-2 md:py-[2px] md:text-[11px]">
                                            <span className="tag-font">+{hiddenInactiveCount}</span>
                                        </Badge>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <div
                        className={
                            isProfileView
                                ? "grid shrink-0 grid-cols-2 gap-2 md:flex md:flex-wrap md:justify-end"
                                : "flex shrink-0 flex-wrap gap-2 md:justify-end"
                        }
                    >
                        {canView && (
                            <Button
                                onClick={handleActionClick(onOpen)}
                                className={isProfileView ? "h-10 w-full md:h-auto md:w-auto" : "w-full sm:w-auto"}
                            >
                                {t("actions.view")}
                            </Button>
                        )}
                    
                        {canShare && (
                            <Button
                                variant="secondary"
                                onClick={handleOpenShare}
                                className={isProfileView ? "h-10 w-full md:h-auto md:w-auto" : "w-full sm:w-auto"}
                            >
                                {t("actions.share")}
                            </Button>
                        )}
                    
                        {canEdit && (
                            <Button
                                variant={isDraft ? "default" : "secondary"}
                                onClick={handleActionClick(onEdit)}
                                className={isProfileView ? "h-10 w-full md:h-auto md:w-auto" : "w-full sm:w-auto"}
                            >
                                {t("actions.edit")}
                            </Button>
                        )}
                    
                        {canDelete && (
                            <Button
                                variant="destructive"
                                onClick={handleOpenDelete}
                                className={isProfileView ? "h-10 w-full md:h-auto md:w-auto" : "w-full sm:w-auto"}
                            >
                                {t("actions.delete")}
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