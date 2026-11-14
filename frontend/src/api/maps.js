import { API_URL } from "@/config";
import client from "./client";

export async function getMyMaps(page = 1, size = 10) {
    return client.get("/maps/owned", {
        params: { page, size },
        errorMessage: "Failed to load maps",
    });
}

export async function getAllMaps(page = 1, size = 10, { q, tags, tagsMode } = {}) {
    const params = { page, size };

    if (q?.trim()) params.q = q.trim();
    if (tags?.trim()) params.tags = tags.trim();
    if (tagsMode) params.tags_mode = tagsMode;

    return client.get("/maps/all", {
        params,
        errorMessage: "Failed to load maps",
    });
}

export async function getMapById(mapId) {
    return client.get(`/maps/${mapId}`, {
        errorMessage: "Failed to load map",
    });
}

export async function getMapByShareId(shareId) {
    return client.get(`/maps/share/${shareId}`, {
        errorMessage: "Failed to load shared map",
    });
}

export async function listTags(q = "", limit = 50) {
    const params = { limit };

    if (q?.trim()) params.q = q.trim();

    return client.get("/maps/tags", {
        params,
        errorMessage: "Failed to load tags",
    });
}

export async function createMap(title, description, tags = [], visibility = "private") {
    return client.post(
        "/maps/create",
        { title, description, tags, visibility },
        { errorMessage: "Failed to create map" }
    );
}

export async function updateMap(mapId, title, description, tags, visibility) {
    const payload = { title, description };

    if (tags !== undefined) payload.tags = tags;
    if (visibility !== undefined) payload.visibility = visibility;

    return client.put(`/maps/${mapId}`, payload, {
        errorMessage: "Failed to update map",
    });
}

export async function deleteMap(mapId) {
    await client.delete(`/maps/${mapId}`, {
        errorMessage: "Failed to delete map",
    });

    return true;
}

export async function uploadImage(mapId, imageFile) {
    const formData = new FormData();
    formData.append("file", imageFile);

    return client.post(`/maps/${mapId}/upload-image`, formData, {
        errorMessage: "Failed to upload image",
    });
}

export async function createShareId(mapId) {
    return client.post(`/maps/${mapId}/share`, null, {
        errorMessage: "Failed to create share link",
    });
}

export async function getShareId(mapId) {
    return client.get(`/maps/${mapId}/share`, {
        errorMessage: "Failed to load share link",
    });
}

export async function deleteShareId(mapId) {
    await client.delete(`/maps/${mapId}/share`, {
        errorMessage: "Failed to disable share link",
    });

    return true;
}

const TILE_PROGRESS_ERROR_MESSAGES = [
    {
        matches: (message) => message.includes("not found") && message.includes("source"),
        userMessage: "Source image was not found. Please upload the image again.",
    },
    {
        matches: (message) => message.includes("timed out") || message.includes("timeout"),
        userMessage: "Processing took too long and was stopped. Please try again.",
    },
    {
        matches: (message) => message.includes("connection"),
        userMessage: "Connection to processing updates was lost. Please try again.",
    },
];

function normalizeTileProgressError(payload) {
    const rawMessage = String(payload?.message || "").toLowerCase();
    const details = payload?.message || null;

    const match = TILE_PROGRESS_ERROR_MESSAGES.find(({ matches }) => matches(rawMessage));

    return {
        userMessage: match?.userMessage ?? "Something went wrong. Please try again.",
        details,
    };
}

export function subscribeToTileProgress(jobId, { onProgress, onDone, onError } = {}) {
    const eventSource = new EventSource(`${API_URL}/jobs/${jobId}/events`);
    let isClosed = false;

    const close = () => {
        if (isClosed) return;
        isClosed = true;
        eventSource.close();
    };

    const emitError = (payload = {}) => {
        const normalized = normalizeTileProgressError(payload);

        onError?.({
            ...payload,
            status: "error",
            stage: "failed",
            userMessage: normalized.userMessage,
            errorDetails: normalized.details,
        });
        close();
    };

    const handleProgress = (event) => {
        try {
            const payload = JSON.parse(event.data);
            onProgress?.(payload);

            if (payload.status === "done") {
                onDone?.(payload);
                close();
                return;
            }

            if (payload.status === "error") {
                emitError(payload);
            }
        } catch (error) {
            console.error("Failed to parse SSE progress payload:", error);
            emitError({ message: "Invalid progress response received" });
        }
    };

    eventSource.addEventListener("progress", handleProgress);

    eventSource.onerror = () => {
        if (isClosed) return;
        emitError({ message: "Connection to progress stream lost" });
    };

    return close;
}
