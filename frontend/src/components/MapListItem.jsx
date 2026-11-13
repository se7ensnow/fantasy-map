import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
    ArrowUpRight,
    Eye,
    Pencil,
    Share2,
    Trash2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import DeleteMapModal from "@/components/DeleteMapModal";
import ShareMapModal from "@/components/ShareMapModal";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { sortTags } from "@/lib/tags";
import { cn } from "@/lib/utils";


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
    const [deleting, setDeleting] = useState(false);

    const isCompact = useMediaQuery("(max-width: 767px)");
    const activeSet = new Set(activeTags);

    const tags = sortTags((Array.isArray(map.tags) ? map.tags : []).filter(Boolean));
    const activeOnCard = tags.filter((tag) => activeSet.has(tag));
    const inactiveOnCard = tags.filter((tag) => !activeSet.has(tag));
    const ordered = [...activeOnCard, ...inactiveOnCard];

    const maxVisible = isCompact ? 4 : 5;
    const visibleCount = Math.max(activeOnCard.length, maxVisible);
    const visible = ordered.slice(0, visibleCount);
    const hiddenInactiveCount = Math.max(
        0,
        inactiveOnCard.length - Math.max(0, visibleCount - activeOnCard.length)
    );

    const isDraft = map.status === "draft";
    const isReady = map.status === "ready";

    const canShowStatus = isProfileView;
    const canShare = isProfileView && isReady;
    const canEdit = isProfileView && Boolean(onEdit);
    const canDelete = isProfileView && Boolean(onDelete);
    const canView = isProfileView && isReady && Boolean(onOpen);

    const cardClickable = !isProfileView && Boolean(onOpen);

    const openCard = () => {
        if (cardClickable) onOpen?.();
    };

    const handleActionClick = (action) => (event) => {
        event.stopPropagation();
        action?.();
    };

    const handleTagActivate = (tag) => (event) => {
        event.stopPropagation();
        onTagClick?.(tag);
    };

    const handleTagKeyDown = (tag) => (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;

        event.preventDefault();
        event.stopPropagation();
        onTagClick?.(tag);
    };

    const handleOpenShare = (event) => {
        event.stopPropagation();
        setShareOpen(true);
    };

    const handleOpenDelete = (event) => {
        event.stopPropagation();
        setDeleteOpen(true);
    };

    const handleConfirmDelete = async () => {
        setDeleting(true);

        try {
            await onDelete?.();
            setDeleteOpen(false);
        } catch {
            // Keep the modal open so the user can retry.
        } finally {
            setDeleting(false);
        }
    };

    return (
        <>
            <div
                role="listitem"
                onClick={cardClickable ? openCard : undefined}
                className={cn(
                    "rounded-lg border-2 border-border-emphasis bg-surface-panel p-3 shadow-card transition-[box-shadow,background-color,border-color,transform] duration-200 md:p-4",
                    cardClickable &&
                        "group cursor-pointer hover:-translate-y-0.5 hover:border-accent-primary/40 hover:shadow-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/50 dark:hover:bg-state-hover/50"
                )}
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
                                        {cardClickable ? (
                                            <Link
                                                to={`/maps/${map.id}`}
                                                onClick={(event) => event.stopPropagation()}
                                                className="rounded-sm underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/50"
                                            >
                                                {map.title}
                                            </Link>
                                        ) : (
                                            map.title
                                        )}
                                    </h3>

                                    {cardClickable && (
                                        <ArrowUpRight
                                            className="mt-1 h-5 w-5 shrink-0 text-text-muted transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent-primary"
                                            aria-hidden="true"
                                        />
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
                                                className={cn(
                                                    "cursor-pointer select-none rounded-md px-1.5 py-[1px] text-[9px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/50 md:rounded-full md:px-2 md:py-[2px] md:text-[11px]",
                                                    isActive &&
                                                        "border-accent-primary bg-accent-primary/15"
                                                )}
                                                onClick={handleTagActivate(tag)}
                                                onKeyDown={handleTagKeyDown(tag)}
                                                title={
                                                    isActive
                                                        ? t("mapCard.tagTitles.activeFilter")
                                                        : t("mapCard.tagTitles.filterByTag")
                                                }
                                            >
                                                <span className="font-tag">{tag}</span>
                                            </Badge>
                                        );
                                    })}

                                    {hiddenInactiveCount > 0 && (
                                        <Badge className="select-none rounded-md px-1.5 py-[1px] text-[9px] opacity-80 md:rounded-full md:px-2 md:py-[2px] md:text-[11px]">
                                            <span className="font-tag">
                                                +{hiddenInactiveCount}
                                            </span>
                                        </Badge>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {isProfileView && (
                        <div className="grid shrink-0 grid-cols-2 gap-2 md:flex md:flex-wrap md:justify-end">
                            {canView && (
                                <Button
                                    onClick={handleActionClick(onOpen)}
                                    className="h-10 w-full md:h-auto md:w-auto"
                                >
                                    <Eye className="h-4 w-4" aria-hidden="true" />
                                    {t("actions.view")}
                                </Button>
                            )}

                            {canShare && (
                                <Button
                                    variant="secondary"
                                    onClick={handleOpenShare}
                                    className="h-10 w-full md:h-auto md:w-auto"
                                >
                                    <Share2 className="h-4 w-4" aria-hidden="true" />
                                    {t("actions.share")}
                                </Button>
                            )}

                            {canEdit && (
                                <Button
                                    variant={isDraft ? "default" : "secondary"}
                                    onClick={handleActionClick(onEdit)}
                                    className="h-10 w-full md:h-auto md:w-auto"
                                >
                                    <Pencil className="h-4 w-4" aria-hidden="true" />
                                    {t("actions.edit")}
                                </Button>
                            )}

                            {canDelete && (
                                <Button
                                    variant="destructive"
                                    onClick={handleOpenDelete}
                                    className="h-10 w-full md:h-auto md:w-auto"
                                >
                                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                                    {t("actions.delete")}
                                </Button>
                            )}
                        </div>
                    )}
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
                loading={deleting}
            />
        </>
    );
}
