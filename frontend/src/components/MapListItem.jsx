import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ShareMapModal from "@/components/ShareMapModal";

export default function MapListItem({ map, onDelete, onEdit, onOpen, onTagClick, activeTags = [], showShare = false }) {
    const [shareOpen, setShareOpen] = useState(false);

    const tags = Array.isArray(map.tags) ? map.tags : [];
    const activeSet = new Set(activeTags);

    const activeOnCard = tags.filter((t) => activeSet.has(t));
    const inactiveOnCard = tags.filter((t) => !activeSet.has(t));

    const ordered = [...activeOnCard, ...inactiveOnCard];

    const MAX_VISIBLE = 5;

    const mustShowCount = activeOnCard.length;
    const visibleCount = Math.max(mustShowCount, MAX_VISIBLE);

    const visible = ordered.slice(0, visibleCount);

    const hiddenInactiveCount = Math.max(0, inactiveOnCard.length - Math.max(0, visibleCount - mustShowCount));

    const openShare = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setShareOpen(true);
    };

    return (
        <>
            <div className="rounded-lg border-2 border-[#c9aa71] bg-[#fcf7e9] shadow-md p-4 hover:shadow-lg transition-shadow duration-300">
                <div className="flex justify-between items-center gap-4">
                    <div className="min-w-0">
                        <h3 className="text-xl font-bold text-[#5b7a5b] mb-1">{map.title}</h3>

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
                                                    ? "cursor-pointer select-none border-[#5b7a5b] bg-[#5b7a5b]/15"
                                                    : "cursor-pointer select-none"
                                            }
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                onTagClick?.(t);
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter" || e.key === " ") {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    onTagClick?.(t);
                                                }
                                            }}
                                            title={isActive ? "Active filter (click to remove)" : "Click to filter by this tag"}
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

                    <div className="flex space-x-2 shrink-0">
                        <Button onClick={onOpen}>View</Button>

                        {showShare && (
                            <Button variant="secondary" onClick={openShare}>
                                Share
                            </Button>
                        )}

                        {onEdit && (
                            <Button variant="secondary" onClick={onEdit}>
                                Edit
                            </Button>
                        )}
                        {onDelete && (
                            <Button variant="destructive" onClick={onDelete}>
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
        </>
    );
}