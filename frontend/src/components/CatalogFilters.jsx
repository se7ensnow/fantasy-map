import { useId } from "react";
import { Search, X } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import TagCombobox from "@/components/TagCombobox";
import TagsModeToggle from "@/components/TagsModeToggle";
import { normalizeTag } from "@/lib/tags";

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
    const searchId = useId();
    const tagInputId = useId();

    const hasFilters =
        Boolean(query) || Boolean(tagQuery) || selectedTags.length > 0;

    function addTag(raw) {
        const tag = normalizeTag(raw);
        if (!tag || selectedTags.includes(tag)) return;

        onToggleTag(tag);
        onTagQueryChange("");
    }

    return (
        <div className="space-y-3 rounded-lg border border-border-default/30 bg-md-code-bg/60 p-3 md:p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div className="w-full flex-1">
                    <label
                        htmlFor={searchId}
                        className="mb-1 block text-sm font-medium text-text-heading md:text-base"
                    >
                        {t("catalogFilters.searchLabel")}
                    </label>

                    <div className="relative">
                        <Search
                            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-heading/50"
                            aria-hidden="true"
                        />
                        <Input
                            id={searchId}
                            type="search"
                            value={query}
                            onChange={(event) => onQueryChange(event.target.value)}
                            placeholder={t("catalogFilters.searchPlaceholder")}
                            className="pl-9 text-sm md:text-base"
                        />
                    </div>
                </div>

                <Button
                    type="button"
                    variant="outline"
                    onClick={onClear}
                    disabled={!hasFilters}
                    className="w-full text-sm md:w-auto md:text-base"
                >
                    {t("catalogFilters.clear")}
                </Button>
            </div>

            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div className="w-full">
                    <label
                        htmlFor={tagInputId}
                        className="mb-1 block text-sm font-medium text-text-heading md:text-base"
                    >
                        {t("catalogFilters.tagPlaceholder")}
                    </label>

                    <TagCombobox
                        inputId={tagInputId}
                        value={tagQuery}
                        onValueChange={onTagQueryChange}
                        onAdd={addTag}
                        exclude={selectedTags}
                        limit={10}
                        placeholder={t("catalogFilters.tagPlaceholder")}
                        inputAriaLabel={t("catalogFilters.tagPlaceholder")}
                        className="md:w-72"
                    />
                </div>

                <div className="w-full md:w-auto">
                    <TagsModeToggle value={tagsMode} onChange={onTagsModeChange} />
                </div>
            </div>

            {selectedTags.length > 0 && (
                <div className="flex flex-wrap gap-2" aria-live="polite">
                    {selectedTags.map((name) => (
                        <Badge
                            key={name}
                            className="cursor-pointer bg-accent-primary text-text-on-accent hover:bg-accent-primary-hover"
                            onClick={() => onToggleTag(name)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(event) => {
                                if (event.key === "Enter" || event.key === " ") {
                                    event.preventDefault();
                                    onToggleTag(name);
                                }
                            }}
                            title={t("catalogFilters.removeTagTitle")}
                            aria-label={t("catalogFilters.removeTagAria", { tag: name })}
                        >
                            <span className="font-tag">{name}</span>
                            <X className="ml-1 h-3 w-3" aria-hidden="true" />
                        </Badge>
                    ))}
                </div>
            )}
        </div>
    );
}
