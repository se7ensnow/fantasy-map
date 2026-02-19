import React, { useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { listTags } from "@/api/maps";
import TagsModeToggle from "@/components/TagsModeToggle";

const MAX_TAG_LEN = 25;

// Разрешаем: любые буквы (включая кириллицу) + цифры + пробел + дефис
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
          .map((t) => normalizeForTag(t.name))
          .filter(Boolean)
          .filter((name) => !selectedTags.includes(name));

        setSuggestions(Array.from(new Set(items)).slice(0, 10));
      } catch (e) {
        if (!cancelled) {
          console.error("tag suggestions failed", e);
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
  }, [normalizedTagQuery, selectedTags]);

  function addTag(raw) {
    const t = normalizeForTag(raw);
    if (!t) return;
    if (selectedTags.includes(t)) return;

    onToggleTag(t);
    onTagQueryChange("");
    setOpen(false);
  }

  return (
    <div className="rounded-lg border border-amber-700/30 bg-amber-50/60 p-4 space-y-3">
      {/* Row 1: title search + clear */}
      <div className="flex items-end justify-between gap-3">
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

        <Button type="button" variant="outline" onClick={onClear}>
          Clear
        </Button>
      </div>

      {/* Row 2: tag search + toggle right (single line, no separate title) */}
        <div ref={boxRef} className="relative">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-72 max-w-full">
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
                  placeholder="Filter by tag…"
                />
              </div>
              
              <span className="text-xs text-amber-900/70 tabular-nums">
                {tagQuery.length}/{MAX_TAG_LEN}
              </span>
            </div>
              
            <TagsModeToggle value={tagsMode} onChange={onTagsModeChange} />
          </div>
              
          {/* dropdown stays the same */}
          {open && normalizedTagQuery && (loadingSug || suggestions.length > 0) && (
            <div className="absolute z-20 mt-1 w-72 max-w-full rounded-md border bg-white shadow-md overflow-hidden">
              <div className="max-h-48 overflow-y-auto">
                {loadingSug && (
                  <div className="px-3 py-2 text-sm text-amber-900/70">
                    Loading…
                  </div>
                )}

                {!loadingSug && suggestions.length === 0 && (
                  <div className="px-3 py-2 text-sm text-amber-900/70">
                    No suggestions
                  </div>
                )}

                {!loadingSug &&
                  suggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      className="w-full text-left px-3 py-2 text-sm hover:bg-amber-50 border-b last:border-b-0"
                      onClick={() => addTag(s)}
                    >
                      <span className="tag-font">{s}</span>
                    </button>
                  ))}
              </div>
            </div>
          )}

          {open && normalizedTagQuery && !loadingSug && suggestions.length === 0 && (
            <div className="mt-1 text-xs text-amber-900/60">
              Press Enter to add “{normalizedTagQuery}”
            </div>
          )}
        </div>

      {/* Selected tags */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedTags.map((name) => (
            <Badge
              key={name}
              className="cursor-pointer bg-[#5b7a5b] text-white"
              onClick={() => onToggleTag(name)}
              title="Click to remove"
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