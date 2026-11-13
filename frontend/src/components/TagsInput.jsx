import { useMemo, useState } from "react";
import { Plus, X } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import TagCombobox from "@/components/TagCombobox";
import {
    MAX_TAGS,
    MAX_TAG_LENGTH,
    normalizeTag,
} from "@/lib/tags";

export default function TagsInput({ value = [], onChange, helperText }) {
    const { t } = useTranslation();
    const [text, setText] = useState("");

    const tags = useMemo(
        () =>
            Array.from(
                new Set(
                    (Array.isArray(value) ? value : [])
                        .map((tag) => normalizeTag(tag))
                        .filter(Boolean)
                )
            ),
        [value]
    );

    const canAddMore = tags.length < MAX_TAGS;
    const normalizedText = normalizeTag(text);
    const canSubmitTag =
        canAddMore && !!normalizedText && !tags.includes(normalizedText);
    const resolvedHelperText =
        helperText || t("tagsInput.helperText", { maxTags: MAX_TAGS, maxLen: MAX_TAG_LENGTH });

    function addTag(raw) {
        if (!canAddMore) return;

        const tag = normalizeTag(raw);
        if (!tag || tags.includes(tag)) return;

        onChange([...tags, tag]);
        setText("");
    }

    function removeTag(tag) {
        onChange(tags.filter((item) => item !== tag));
    }

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between gap-3 text-xs text-text-heading/70">
                <span aria-live="polite">
                    {t("tagsInput.tagsCount", {
                        used: tags.length,
                        maxTags: MAX_TAGS,
                    })}
                </span>
            </div>

            {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                        <Badge key={tag} className="flex items-center gap-2">
                            <span className="font-tag">{tag}</span>
                            <button
                                type="button"
                                className="rounded opacity-70 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/50"
                                onClick={() => removeTag(tag)}
                                aria-label={t("tagsInput.removeTagAria", { tag })}
                                title={t("tagsInput.remove")}
                            >
                                <X className="h-3 w-3" aria-hidden="true" />
                            </button>
                        </Badge>
                    ))}
                </div>
            )}

            <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
                <TagCombobox
                    value={text}
                    onValueChange={setText}
                    onAdd={addTag}
                    exclude={tags}
                    enabled={canAddMore}
                    disabled={!canAddMore}
                    placeholder={
                        canAddMore
                            ? t("tagsInput.placeholder")
                            : t("tagsInput.limitReachedPlaceholder")
                    }
                    inputAriaLabel={t("tagsInput.inputLabel")}
                    emptyHint={t("tagCombobox.pressEnterToAdd", { tag: normalizedText })}
                    limit={8}
                    className="sm:w-72"
                />

                <Button
                    type="button"
                    variant="outline"
                    onClick={() => addTag(text)}
                    disabled={!canSubmitTag}
                    className="w-full shrink-0 sm:w-auto"
                >
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    {t("tagsInput.add")}
                </Button>
            </div>

            <p className="text-xs text-text-heading/70">{resolvedHelperText}</p>

            {!canAddMore && (
                <p className="text-xs text-status-danger" role="status">
                    {t("tagsInput.limitReachedMessage", { maxTags: MAX_TAGS })}
                </p>
            )}
        </div>
    );
}
