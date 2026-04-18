import axios from "axios";
import { getToken, getTokenType } from "./auth";
import { API_URL } from "../config";
import { toApiError } from "./errors";

export async function getMyMaps(page = 1, size = 10) {
    try {
        const response = await axios.get(`${API_URL}/maps/owned`, {
            params: { page, size },
            headers: {
                Authorization: `${getTokenType()} ${getToken()}`,
            },
        });

        return response.data;
    } catch (error) {
        throw toApiError(error, "Failed to load maps");
    }
}

export async function getAllMaps(page = 1, size = 10, { q, tags, tagsMode } = {}) {
    try {
        const params = { page, size };
        if (q && q.trim()) params.q = q.trim();
        if (tags && tags.trim()) params.tags = tags.trim();
        if (tagsMode) params.tags_mode = tagsMode;

        const response = await axios.get(`${API_URL}/maps/all`, { params });
        return response.data;
    } catch (error) {
        throw toApiError(error, "Failed to load maps");
    }
}

export async function getMapById(mapId) {
    try {
        const response = await axios.get(`${API_URL}/maps/${mapId}`, {
            headers: {
                Authorization: `${getTokenType()} ${getToken()}`,
            },
        });

        return response.data;
    } catch (error) {
        throw toApiError(error, "Failed to load map");
    }
}

export async function getMapByShareId(shareId) {
    try {
        const response = await axios.get(`${API_URL}/maps/share/${shareId}`);
        return response.data;
    } catch (error) {
        throw toApiError(error, "Failed to load shared map");
    }
}

export async function listTags(q = "", limit = 50) {
    try {
        const params = { limit };
        if (q && q.trim()) params.q = q.trim();

        const response = await axios.get(`${API_URL}/maps/tags`, { params });
        return response.data;
    } catch (error) {
        throw toApiError(error, "Failed to load tags");
    }
}

export async function createMap(title, description, tags = [], visibility = "private") {
    try {
        const response = await axios.post(
            `${API_URL}/maps/create`,
            {
                title,
                description,
                tags,
                visibility,
            },
            {
                headers: {
                    Authorization: `${getTokenType()} ${getToken()}`,
                },
            }
        );

        return response.data;
    } catch (error) {
        throw toApiError(error, "Failed to create map");
    }
}

export async function updateMap(mapId, title, description, tags, visibility) {
    try {
        const payload = { title, description };
        if (tags !== undefined) payload.tags = tags;
        if (visibility !== undefined) payload.visibility = visibility;

        const response = await axios.put(`${API_URL}/maps/${mapId}`, payload, {
            headers: {
                Authorization: `${getTokenType()} ${getToken()}`,
            },
        });

        return response.data;
    } catch (error) {
        throw toApiError(error, "Failed to update map");
    }
}

export async function deleteMap(mapId) {
    try {
        const response = await axios.delete(`${API_URL}/maps/${mapId}`, {
            headers: {
                Authorization: `${getTokenType()} ${getToken()}`,
            },
        });

        return response.status === 204;
    } catch (error) {
        throw toApiError(error, "Failed to delete map");
    }
}

export async function uploadImage(mapId, imageFile) {
    const formData = new FormData();
    formData.append("file", imageFile);

    try {
        const response = await axios.post(
            `${API_URL}/maps/${mapId}/upload-image`,
            formData,
            {
                headers: {
                    Authorization: `${getTokenType()} ${getToken()}`,
                    "Content-Type": "multipart/form-data",
                },
            }
        );

        return response.data;
    } catch (error) {
        throw toApiError(error, "Failed to upload image");
    }
}

export async function createShareId(mapId) {
    try {
        const response = await axios.post(`${API_URL}/maps/${mapId}/share`, null, {
            headers: {
                Authorization: `${getTokenType()} ${getToken()}`,
            },
        });

        return response.data;
    } catch (error) {
        throw toApiError(error, "Failed to create share link");
    }
}

export async function getShareId(mapId) {
    try {
        const response = await axios.get(`${API_URL}/maps/${mapId}/share`, {
            headers: {
                Authorization: `${getTokenType()} ${getToken()}`,
            },
        });

        return response.data;
    } catch (error) {
        throw toApiError(error, "Failed to load share link");
    }
}

export async function deleteShareId(mapId) {
    try {
        const response = await axios.delete(`${API_URL}/maps/${mapId}/share`, {
            headers: {
                Authorization: `${getTokenType()} ${getToken()}`,
            },
        });

        return response.status === 204;
    } catch (error) {
        throw toApiError(error, "Failed to disable share link");
    }
}

function normalizeTileProgressError(payload) {
    const rawMessage = String(payload?.message || "").toLowerCase();

    if (rawMessage.includes("not found") && rawMessage.includes("source")) {
        return {
            userMessage: "Source image was not found. Please upload the image again.",
            details: payload?.message || null,
        };
    }

    if (rawMessage.includes("timed out") || rawMessage.includes("timeout")) {
        return {
            userMessage: "Processing took too long and was stopped. Please try again.",
            details: payload?.message || null,
        };
    }

    if (rawMessage.includes("connection")) {
        return {
            userMessage: "Connection to processing updates was lost. Please try again.",
            details: payload?.message || null,
        };
    }

    return {
        userMessage: "Something went wrong. Please try again.",
        details: payload?.message || null,
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

    const emitNormalizedError = (payload = {}) => {
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
                emitNormalizedError(payload);
            }
        } catch (err) {
            console.error("Failed to parse SSE progress payload:", err);
            emitNormalizedError({
                message: "Invalid progress response received",
            });
        }
    };

    eventSource.addEventListener("progress", handleProgress);

    eventSource.onerror = () => {
        if (isClosed) return;
        emitNormalizedError({
            message: "Connection to progress stream lost",
        });
    };

    return () => {
        close();
    };
}