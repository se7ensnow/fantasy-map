import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { listTags } from "@/api/maps";
import TagsModeToggle from "@/components/TagsModeToggle";

const MAX_TAG_LEN = 25;

function normalizeForInput(raw) {
    let s = (raw || "").toLowerCase();
    s = s.replace(/[^\p{L}\p{N} -]+/gu, " ");
    s = s.replace(/\s{2,}/g, " ");
    if (s.length > MAX_TAG_LEN) s = s.slice(0, MAX_TAG_LEN);
    return s;
}

function normalizeForTag(raw) {
    let s = normalizeForInput(raw);
    s = s.trim().replace(/\s+/g, " ");
    s = s.replace(/-+/g, "-").replace(/- /g, "-").replace(/ -/g, "-");
    return s;
}

export default function CatalogFilters({
    query,
    onQueryChange,
    selectedTags,
    onToggleTag,
    tagsMode,
    onTagsModeChange,
    tagQuery,
    onTagQueryChange,
    onClear,
}) {
    const { t } = useTranslation();
    const boxRef = useRef(null);

    const [open, setOpen] = useState(false);
    const [suggestions, setSuggestions] = useState([]);
    const [loadingSug, setLoadingSug] = useState(false);

    const normalizedTagQuery = useMemo(() => normalizeForTag(tagQuery), [tagQuery]);

    useEffect(() => {
        function onDocClick(e) {
            if (!boxRef.current) return;
            if (!boxRef.current.contains(e.target)) setOpen(false);
        }
        document.addEventListener("mousedown", onDocClick);
        return () => document.removeEventListener("mousedown", onDocClick);
    }, []);

    useEffect(() => {
        const q = normalizedTagQuery;

        if (!q) {
            setSuggestions([]);
            setLoadingSug(false);
            setOpen(false);
            return;
        }

        let cancelled = false;
        setLoadingSug(true);

        const id = setTimeout(async () => {
            try {
                const res = await listTags(q, 10);
                if (cancelled) return;

                const items = (res || [])
                    .map((tag) => normalizeForTag(tag.name))
                    .filter(Boolean)
                    .filter((name) => !selectedTags.includes(name));

                setSuggestions(Array.from(new Set(items)).slice(0, 10));
            } catch (e) {
                if (!cancelled) {
                    console.error(t("catalogFilters.errors.tagSuggestionsFailed"), e);
                    setSuggestions([]);
                }
            } finally {
                if (!cancelled) setLoadingSug(false);
            }
        }, 250);

        return () => {
            cancelled = true;
            clearTimeout(id);
        };
    }, [normalizedTagQuery, selectedTags, t]);

    function addTag(raw) {
        const tag = normalizeForTag(raw);
        if (!tag) return;
        if (selectedTags.includes(tag)) return;

        onToggleTag(tag);
        onTagQueryChange("");
        setOpen(false);
    }

    return (
        <div className="space-y-3 rounded-lg border border-border-default/30 bg-md-code-bg/60 p-3 md:p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div className="w-full flex-1">
                    <label className="mb-1 block text-sm font-medium text-text-heading md:text-base">
                        {t("catalogFilters.searchLabel")}
                    </label>
                    <Input
                        value={query}
                        onChange={(e) => onQueryChange(e.target.value)}
                        placeholder={t("catalogFilters.searchPlaceholder")}
                        className="text-sm md:text-base"
                    />
                </div>

                <Button
                    type="button"
                    variant="outline"
                    onClick={onClear}
                    className="w-full text-sm md:w-auto md:text-base"
                >
                    {t("catalogFilters.clear")}
                </Button>
            </div>

            <div ref={boxRef} className="relative">
                <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                    <div className="w-full">
                        <label className="mb-1 block text-sm font-medium text-text-heading md:text-base">
                            {t("catalogFilters.tagPlaceholder")}
                        </label>

                        <div className="relative w-full md:w-72">
                            <Input
                                value={tagQuery}
                                onChange={(e) => {
                                    const next = normalizeForInput(e.target.value);
                                    onTagQueryChange(next);
                                    setOpen(true);
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault();
                                        addTag(tagQuery);
                                    }
                                    if (e.key === "Escape") setOpen(false);
                                }}
                                placeholder={t("catalogFilters.tagPlaceholder")}
                                className="pr-14 text-sm md:text-base"
                            />

                            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-text-heading/70 tabular-nums md:text-xs">
                                {tagQuery.length}/{MAX_TAG_LEN}
                            </span>
                        </div>
                    </div>

                    <div className="w-full md:w-auto">
                        <TagsModeToggle value={tagsMode} onChange={onTagsModeChange} />
                    </div>
                </div>

                {open && normalizedTagQuery && (loadingSug || suggestions.length > 0) && (
                    <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border border-border-default/30 bg-surface-input shadow-md md:w-72">
                        <div className="max-h-48 overflow-y-auto">
                            {loadingSug && (
                                <div className="px-3 py-2 text-sm text-text-heading/70">
                                    {t("catalogFilters.loading")}
                                </div>
                            )}

                            {!loadingSug && suggestions.length === 0 && (
                                <div className="px-3 py-2 text-sm text-text-heading/70">
                                    {t("catalogFilters.noSuggestions")}
                                </div>
                            )}

                            {!loadingSug &&
                                suggestions.map((suggestion) => (
                                    <button
                                        key={suggestion}
                                        type="button"
                                        className="w-full border-b border-border-default/20 px-3 py-2 text-left text-sm hover:bg-md-code-bg last:border-b-0"
                                        onClick={() => addTag(suggestion)}
                                    >
                                        <span className="tag-font">{suggestion}</span>
                                    </button>
                                ))}
                        </div>
                    </div>
                )}

                {open && normalizedTagQuery && !loadingSug && suggestions.length === 0 && (
                    <div className="mt-1 text-xs text-text-heading/60">
                        {t("catalogFilters.pressEnterToAdd", { tag: normalizedTagQuery })}
                    </div>
                )}
            </div>

            {selectedTags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {selectedTags.map((name) => (
                        <Badge
                            key={name}
                            className="cursor-pointer bg-accent-primary text-text-on-accent hover:bg-accent-primary-hover"
                            onClick={() => onToggleTag(name)}
                            title={t("catalogFilters.removeTagTitle")}
                        >
                            <span className="tag-font">{name}</span>
                            <span className="ml-1">✕</span>
                        </Badge>
                    ))}
                </div>
            )}
        </div>
    );
}