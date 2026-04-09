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

export function subscribeToTileProgress(jobId, { onProgress, onDone, onError } = {}) {
    const eventSource = new EventSource(`${API_URL}/jobs/${jobId}/events`);

    const handleProgress = (event) => {
        try {
            const payload = JSON.parse(event.data);
            onProgress?.(payload);

            if (payload.status === "done") {
                onDone?.(payload);
                eventSource.close();
            }

            if (payload.status === "error") {
                onError?.(payload);
                eventSource.close();
            }
        } catch (err) {
            console.error("Failed to parse SSE progress payload:", err);
        }
    };

    eventSource.addEventListener("progress", handleProgress);

    eventSource.onerror = (err) => {
        console.error("SSE connection error:", err);
        onError?.({
            status: "error",
            stage: "failed",
            message: "Connection to progress stream lost",
        });
        eventSource.close();
    };

    return () => {
        eventSource.close();
    };
}