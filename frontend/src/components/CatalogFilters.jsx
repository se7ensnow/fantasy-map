import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function CatalogFilters({
    query,
    onQueryChange,
    availableTags,
    selectedTags,
    tagsMode,
    onTagsModeChange,
    onToggleTag,
    onClear,
}) {
    return (
        <div className="rounded-lg border border-amber-700/30 bg-amber-50/60 p-4 space-y-3">
            <div className="flex gap-3 items-end">
                <div className="flex-1">
                    <label className="block mb-1 font-medium text-amber-900">
                        Search
                    </label>
                    <Input
                        value={query}
                        onChange={(e) => onQueryChange(e.target.value)}
                        placeholder="Search by title…"
                    />
                </div>
                <Button variant="outline" type="button" onClick={onClear}>
                    Clear
                </Button>
            </div>
            {selectedTags.length > 1 && (
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-amber-900">Match:</span>

                    <Button
                        type="button"
                        variant={tagsMode === "any" ? "default" : "outline"}
                        onClick={() => onTagsModeChange("any")}
                    >
                        Any
                    </Button>

                    <Button
                        type="button"
                        variant={tagsMode === "all" ? "default" : "outline"}
                        onClick={() => onTagsModeChange("all")}
                    >
                        All
                    </Button>

                    <span className="text-xs text-amber-800/70">
                        {tagsMode === "any"
                            ? "Maps with at least one selected tag"
                            : "Maps with all selected tags"}
                    </span>
                </div>
            )}

            {selectedTags.length > 0 && (
                <div>
                    <p className="text-sm font-medium text-amber-900 mb-2">Selected tags:</p>
                    <div className="flex flex-wrap gap-2">
                        {selectedTags.map((slug) => (
                            <Badge
                                key={slug}
                                className="cursor-pointer bg-[#5b7a5b] text-white"
                                onClick={() => onToggleTag(slug)}
                            >
                                {slug} <span className="ml-1">✕</span>
                            </Badge>
                        ))}
                    </div>
                </div>
            )}
            {availableTags?.length > 0 && (
                <div>
                    <p className="text-sm font-medium text-amber-900 mb-2">Popular tags:</p>
                    <div className="flex flex-wrap gap-2">
                        {availableTags.map((t) => {
                            const active = selectedTags.includes(t.slug);
                            return (
                                <Badge
                                    key={t.slug}
                                    className={`cursor-pointer ${active ? "bg-[#5b7a5b] text-white" : ""}`}
                                    onClick={() => onToggleTag(t.slug)}
                                >
                                    {t.name}
                                </Badge>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}