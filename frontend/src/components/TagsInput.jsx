import React, { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

function normalizeTag(s) {
  return s.trim().replace(/\s+/g, " ");
}

export default function TagsInput({
  value,
  onChange,
  suggestions = [],
  placeholder = "Add tag and press Enter…",
  maxTags = 20,
}) {
  const [text, setText] = useState("");

  const tags = React.useMemo(() => {
  return Array.isArray(value) ? value : [];
}, [value]);

  const filteredSuggestions = useMemo(() => {
    const q = normalizeTag(text).toLowerCase();

    if (!q) {
      return suggestions.filter((t) => !tags.includes(t)).slice(0, 8);
    }

    return suggestions
      .filter((t) => t.toLowerCase().includes(q))
      .filter((t) => !tags.includes(t))
      .slice(0, 8);
  }, [text, suggestions, tags]);

  const addTag = (raw) => {
    const t = normalizeTag(raw);
    if (!t) return;
    if (tags.includes(t)) return;
    if (tags.length >= maxTags) return;

    onChange([...tags, t]);
    setText("");
  };

  const removeTag = (t) => {
    onChange(tags.filter((x) => x !== t));
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(text);
      return;
    }

    if (e.key === "Backspace" && !text && tags.length) {
      e.preventDefault();
      removeTag(tags[tags.length - 1]);
    }
  };

  return (
    <div className="space-y-2">
      {/* Чипсы текущих тегов */}
      <div className="flex flex-wrap gap-2">
        {tags.map((t) => (
          <Badge key={t} className="gap-2">
            {t}
            <button
              type="button"
              className="text-[#5b7a5b] hover:opacity-80"
              onClick={() => removeTag(t)}
              aria-label={`Remove ${t}`}
            >
              ✕
            </button>
          </Badge>
        ))}
      </div>

      {/* Поле ввода */}
      <Input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
      />

      {/* Подсказки */}
      {filteredSuggestions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {filteredSuggestions.map((t) => (
            <Button
              key={t}
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => addTag(t)}
            >
              + {t}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}