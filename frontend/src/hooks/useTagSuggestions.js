import { useEffect, useMemo, useRef, useState } from "react";

import { listTags } from "@/api/maps";
import { normalizeTag } from "@/lib/tags";
import { useLatest } from "./useLatest";

const DEBOUNCE_MS = 250;

/**
 * Debounced tag autocomplete shared by the catalog filter and the map form.
 */
export function useTagSuggestions({
    text,
    exclude = [],
    limit = 8,
    enabled = true,
}) {
    const query = useMemo(() => normalizeTag(text), [text]);
    const excludeRef = useLatest(exclude);
    const excludeKey = exclude.join("\u0000");

    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const requestIdRef = useRef(0);

    useEffect(() => {
        const requestId = requestIdRef.current + 1;
        requestIdRef.current = requestId;

        if (!enabled || !query) {
            setSuggestions([]);
            setLoading(false);
            return undefined;
        }

        setLoading(true);

        const timeoutId = window.setTimeout(async () => {
            try {
                const result = await listTags(query, limit);

                if (requestIdRef.current !== requestId) return;

                const excluded = new Set(excludeRef.current);
                const names = (result || [])
                    .map((tag) => normalizeTag(tag.name))
                    .filter((name) => name && !excluded.has(name));

                setSuggestions(Array.from(new Set(names)).slice(0, limit));
            } catch (error) {
                if (requestIdRef.current === requestId) {
                    console.error("Tag suggestions failed:", error);
                    setSuggestions([]);
                }
            } finally {
                if (requestIdRef.current === requestId) {
                    setLoading(false);
                }
            }
        }, DEBOUNCE_MS);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [query, excludeKey, limit, enabled, excludeRef]);

    return { suggestions, loading, query };
}
