export const MAX_TAG_LENGTH = 25;
export const MAX_TAGS = 10;

const DISALLOWED_CHARS = /[^\p{L}\p{N} -]+/gu;
const REPEATED_SPACES = /\s{2,}/g;
const REPEATED_DASHES = /-+/g;

/**
 * Normalizes text while the user is typing.
 * Keeps a trailing space so users can write multi-word tags.
 */
export function normalizeTagInput(raw, maxLength = MAX_TAG_LENGTH) {
    let value = (raw || "").toLowerCase();

    value = value.replace(DISALLOWED_CHARS, " ");
    value = value.replace(REPEATED_SPACES, " ");

    if (value.length > maxLength) {
        value = value.slice(0, maxLength);
    }

    return value;
}

/**
 * Normalizes a finished tag: trims, collapses whitespace and dashes.
 */
export function normalizeTag(raw, maxLength = MAX_TAG_LENGTH) {
    let value = normalizeTagInput(raw, maxLength).trim();

    value = value.replace(/\s+/g, " ");
    value = value.replace(REPEATED_DASHES, "-");
    value = value.replace(/- /g, "-").replace(/ -/g, "-");

    if (value.length > maxLength) {
        value = value.slice(0, maxLength).trim();
    }

    return value;
}

export function uniqueTags(tags) {
    return Array.from(new Set((tags || []).map((tag) => normalizeTag(tag)).filter(Boolean)));
}

export function sortTags(tags) {
    return [...(tags || [])].sort((a, b) =>
        a.localeCompare(b, undefined, { sensitivity: "base" })
    );
}
