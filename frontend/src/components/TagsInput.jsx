import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { listTags } from "@/api/maps";

const MAX_TAGS = 10;
const MAX_LEN = 25;

function normalizeForInput(raw) {
    let s = (raw || "").toLowerCase();

    s = s.replace(/[^\p{L}\p{N} -]+/gu, " ");
    s = s.replace(/\s{2,}/g, " ");

    if (s.length > MAX_LEN) s = s.slice(0, MAX_LEN);

    return s;
}

function normalizeForTag(raw) {
    let s = normalizeForInput(raw);

    s = s.trim();
    s = s.replace(/\s+/g, " ");
    s = s.replace(/-+/g, "-");
    s = s.replace(/- /g, "-").replace(/ -/g, "-");

    if (!s) return "";

    if (s.length > MAX_LEN) s = s.slice(0, MAX_LEN).trim();

    return s;
}

export default function TagsInput({
    value = [],
    onChange,
    helperText,
}) {
    const { t } = useTranslation();
    const [text, setText] = useState("");
    const [suggestions, setSuggestions] = useState([]);
    const [open, setOpen] = useState(false);
    const [loadingSug, setLoadingSug] = useState(false);

    const boxRef = useRef(null);

    const tags = useMemo(() => (Array.isArray(value) ? value.filter(Boolean) : []), [value]);

    const resolvedHelperText =
        helperText || t("tagsInput.helperText", { maxTags: MAX_TAGS, maxLen: MAX_LEN });

    useEffect(() => {
        function onDocClick(e) {
            if (!boxRef.current) return;
            if (!boxRef.current.contains(e.target)) setOpen(false);
        }
        document.addEventListener("mousedown", onDocClick);
        return () => document.removeEventListener("mousedown", onDocClick);
    }, []);

    useEffect(() => {
        const q = normalizeForTag(text);

        if (!q || tags.length >= MAX_TAGS) {
            setSuggestions([]);
            setLoadingSug(false);
            setOpen(false);
            return;
        }

        let cancelled = false;
        setLoadingSug(true);

        const id = setTimeout(async () => {
            try {
                const res = await listTags(q, 8);

                if (!cancelled) {
                    const items = (res || [])
                        .map((tag) => normalizeForTag(tag.name))
                        .filter(Boolean)
                        .filter((name) => !tags.includes(name));

                    setSuggestions(items);
                }
            } catch (e) {
                if (!cancelled) {
                    console.error(t("tagsInput.errors.tagSuggestionsFailed"), e);
                    setSuggestions([]);
                }
            } finally {
                if (!cancelled) {
                    setLoadingSug(false);
                }
            }
        }, 250);

        return () => {
            cancelled = true;
            clearTimeout(id);
        };
    }, [text, tags, t]);

    const canAddMore = tags.length < MAX_TAGS;
    const normalizedText = normalizeForTag(text);
    const canSubmitTag = canAddMore && !!normalizedText && !tags.includes(normalizedText);

    function addTag(raw) {
        if (!canAddMore) return;

        const tag = normalizeForTag(raw);
        if (!tag) return;
        if (tags.includes(tag)) return;

        onChange([...tags, tag]);
        setText("");
        setOpen(false);
    }

    function removeTag(tag) {
        onChange(tags.filter((t) => t !== tag));
    }

    function handleInputChange(e) {
        const next = normalizeForInput(e.target.value);
        setText(next);
        setOpen(true);
    }

    function handleKeyDown(e) {
        if (e.key === "Enter") {
            e.preventDefault();
            addTag(text);
            return;
        }

        if (e.key === "Escape") {
            setOpen(false);
        }
    }

    const showSuggestions = open && (suggestions.length > 0 || loadingSug) && canAddMore;

    return (
        <div ref={boxRef} className="space-y-2">
            <div className="flex items-center justify-between gap-3">
                <div className="text-xs text-text-heading/70">
                    <span>
                        {tags.length}/{MAX_TAGS}
                    </span>
                </div>
            </div>

            {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                        <Badge key={tag} className="flex items-center gap-2">
                            <span className="tag-font">{tag}</span>
                            <button
                                type="button"
                                className="opacity-70 hover:opacity-100"
                                onClick={() => removeTag(tag)}
                                aria-label={t("tagsInput.removeTagAria", { tag })}
                                title={t("tagsInput.remove")}
                            >
                                ✕
                            </button>
                        </Badge>
                    ))}
                </div>
            )}

            <div className="relative">
                <div className="flex items-center gap-2">
                    <div className="w-72 max-w-full">
                        <Input
                            value={text}
                            onChange={handleInputChange}
                            onKeyDown={handleKeyDown}
                            placeholder={
                                canAddMore
                                    ? t("tagsInput.placeholder")
                                    : t("tagsInput.limitReachedPlaceholder")
                            }
                            disabled={!canAddMore}
                        />
                    </div>

                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => addTag(text)}
                        disabled={!canSubmitTag}
                    >
                        {t("tagsInput.add")}
                    </Button>

                    <span className="text-xs text-text-heading/70 tabular-nums">
                        {text.length}/{MAX_LEN}
                    </span>
                </div>

                {showSuggestions && (
                    <div className="absolute z-20 mt-1 w-72 max-w-full rounded-md border border-border-default bg-surface-paper shadow-md overflow-hidden">
                        <div className="max-h-48 overflow-y-auto">
                            {loadingSug && (
                                <div className="px-3 py-2 text-sm text-text-heading/70">
                                    {t("tagsInput.loading")}
                                </div>
                            )}

                            {!loadingSug && suggestions.length === 0 && (
                                <div className="px-3 py-2 text-sm text-text-heading/70">
                                    {t("tagsInput.noSuggestions")}
                                </div>
                            )}

                            {!loadingSug &&
                                suggestions.map((suggestion) => (
                                    <button
                                        type="button"
                                        key={suggestion}
                                        className="w-full text-left px-3 py-2 text-sm hover:bg-surface-panel border-b border-border-default/30 last:border-b-0"
                                        onClick={() => addTag(suggestion)}
                                    >
                                        <span className="tag-font">{suggestion}</span>
                                    </button>
                                ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="text-xs text-text-heading/70">{resolvedHelperText}</div>

            {!canAddMore && (
                <div className="text-xs text-status-danger">
                    {t("tagsInput.limitReachedMessage", { maxTags: MAX_TAGS })}
                </div>
            )}
        </div>
    );
}