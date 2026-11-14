import { useId, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { useClickOutside } from "@/hooks/useClickOutside";
import { useTagSuggestions } from "@/hooks/useTagSuggestions";
import {
    MAX_TAG_LENGTH,
    normalizeTag,
    normalizeTagInput,
} from "@/lib/tags";

/**
 * Accessible tag autocomplete input.
 * `onAdd` receives a normalized tag; the parent owns the tag list.
 */
export default function TagCombobox({
    value,
    onValueChange,
    onAdd,
    exclude = [],
    limit = 8,
    enabled = true,
    placeholder,
    maxLength = MAX_TAG_LENGTH,
    inputId,
    inputAriaLabel,
    disabled = false,
    className,
    inputClassName,
    emptyHint,
}) {
    const { t } = useTranslation();
    const rootRef = useRef(null);
    const generatedId = useId();
    const resolvedId = inputId || generatedId;
    const listboxId = `${resolvedId}-suggestions`;

    const [open, setOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);

    const { suggestions, loading } = useTagSuggestions({
        text: value,
        exclude,
        limit,
        enabled: enabled && !disabled,
    });

    useClickOutside(rootRef, () => setOpen(false), open);

    const normalizedValue = normalizeTag(value);
    const showDropdown =
        open && enabled && !disabled && !!normalizedValue && (loading || suggestions.length > 0);
    const showEmptyHint =
        open && enabled && !disabled && !!normalizedValue && !loading && suggestions.length === 0;

    const close = () => {
        setOpen(false);
        setActiveIndex(-1);
    };

    const selectTag = (tag) => {
        onAdd?.(tag);
        setActiveIndex(-1);
        close();
    };

    const handleChange = (event) => {
        onValueChange(normalizeTagInput(event.target.value, maxLength));
        setOpen(true);
        setActiveIndex(-1);
    };

    const handleKeyDown = (event) => {
        if (event.key === "Escape") {
            close();
            return;
        }

        if (event.key === "ArrowDown") {
            event.preventDefault();
            setOpen(true);
            setActiveIndex((index) => {
                if (suggestions.length === 0) return -1;
                return (index + 1) % suggestions.length;
            });
            return;
        }

        if (event.key === "ArrowUp") {
            event.preventDefault();
            setOpen(true);
            setActiveIndex((index) => {
                if (suggestions.length === 0) return -1;
                return index <= 0 ? suggestions.length - 1 : index - 1;
            });
            return;
        }

        if (event.key === "Enter") {
            event.preventDefault();

            if (activeIndex >= 0 && suggestions[activeIndex]) {
                selectTag(suggestions[activeIndex]);
                return;
            }

            if (normalizedValue) {
                selectTag(normalizedValue);
            }
        }
    };

    return (
        <div ref={rootRef} className={cn("relative w-full", className)}>
            <div className="relative">
                <Input
                    id={resolvedId}
                    type="text"
                    role="combobox"
                    aria-label={inputAriaLabel}
                    aria-autocomplete="list"
                    aria-expanded={showDropdown}
                    aria-controls={showDropdown ? listboxId : undefined}
                    aria-activedescendant={
                        activeIndex >= 0 ? `${listboxId}-${activeIndex}` : undefined
                    }
                    value={value}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    onFocus={() => normalizedValue && setOpen(true)}
                    placeholder={placeholder}
                    disabled={disabled}
                    autoComplete="off"
                    className={cn("pr-14", inputClassName)}
                />

                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] tabular-nums text-text-heading/70 md:text-xs">
                    {value.length}/{maxLength}
                </span>
            </div>

            {showDropdown && (
                <div
                    id={listboxId}
                    role="listbox"
                    className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border border-border-default/40 bg-surface-input shadow-md"
                >
                    <div className="max-h-48 overflow-y-auto">
                        {loading && (
                            <div className="px-3 py-2 text-sm text-text-heading/70" role="status">
                                {t("tagCombobox.loading")}
                            </div>
                        )}

                        {!loading &&
                            suggestions.map((suggestion, index) => (
                                <button
                                    key={suggestion}
                                    id={`${listboxId}-${index}`}
                                    type="button"
                                    role="option"
                                    aria-selected={index === activeIndex}
                                    onMouseDown={(event) => event.preventDefault()}
                                    onClick={() => selectTag(suggestion)}
                                    onMouseEnter={() => setActiveIndex(index)}
                                    className={cn(
                                        "block w-full border-b border-border-default/20 px-3 py-2 text-left text-sm transition-colors last:border-b-0",
                                        index === activeIndex
                                            ? "bg-state-selected text-text-heading"
                                            : "hover:bg-state-hover"
                                    )}
                                >
                                    <span className="font-tag">{suggestion}</span>
                                </button>
                            ))}
                    </div>
                </div>
            )}

            {showEmptyHint && (
                <p className="mt-1 text-xs text-text-heading/60">
                    {emptyHint ||
                        t("tagCombobox.pressEnterToAdd", { tag: normalizedValue })}
                </p>
            )}
        </div>
    );
}
