import React, { useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  helperText = `Up to ${MAX_TAGS} tags, ${MAX_LEN} chars each. lowercase, no special symbols.`,
}) {
  const [text, setText] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [loadingSug, setLoadingSug] = useState(false);

  const boxRef = useRef(null);

  const tags = useMemo(() => (Array.isArray(value) ? value.filter(Boolean) : []), [value]);

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
            .map((t) => normalizeForTag(t.name))
            .filter(Boolean)
            .filter((name) => !tags.includes(name));

          setSuggestions(items);
        }
      } catch (e) {
        if (!cancelled) {
          console.error("tag suggestions failed", e);
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
  }, [text, tags]);

  const canAddMore = tags.length < MAX_TAGS;

  function addTag(raw) {
    if (!canAddMore) return;

    const t = normalizeForTag(raw);
    if (!t) return;
    if (tags.includes(t)) return;

    onChange([...tags, t]);
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
        <div className="text-xs text-amber-900/70">
          <span>{tags.length}/{MAX_TAGS}</span>
        </div>
      </div>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((t) => (
            <Badge key={t} className="flex items-center gap-2">
              <span className="tag-font">{t}</span>
              <button
                type="button"
                className="opacity-70 hover:opacity-100"
                onClick={() => removeTag(t)}
                aria-label={`Remove tag ${t}`}
                title="Remove"
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
              placeholder={canAddMore ? "add tag…" : "limit reached"}
              disabled={!canAddMore}
            />
          </div>

          <span className="text-xs text-amber-900/70 tabular-nums">
            {text.length}/{MAX_LEN}
          </span>
        </div>

        {showSuggestions && (
          <div className="absolute z-20 mt-1 w-72 max-w-full rounded-md border bg-white shadow-md overflow-hidden">
            <div className="max-h-48 overflow-y-auto">
              {loadingSug && (
                <div className="px-3 py-2 text-sm text-amber-900/70">Loading…</div>
              )}
        
              {!loadingSug && suggestions.length === 0 && (
                <div className="px-3 py-2 text-sm text-amber-900/70">
                  No suggestions
                </div>
              )}
        
              {!loadingSug &&
                suggestions.map((s) => (
                  <button
                    type="button"
                    key={s}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-amber-50 border-b last:border-b-0"
                    onClick={() => addTag(s)}
                  >
                    <span className="tag-font">{s}</span>
                  </button>
                ))}
            </div>
          </div>
        )}
      </div>

      <div className="text-xs text-amber-900/70">
        {helperText}
      </div>

      {!canAddMore && (
        <div className="text-xs text-red-600">
          Tag limit reached ({MAX_TAGS}). Remove a tag to add another.
        </div>
      )}
    </div>
  );
}