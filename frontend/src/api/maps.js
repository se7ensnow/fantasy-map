import axios from 'axios';
import { getToken, getTokenType } from './auth';
import { API_URL } from "../config";

export async function getMyMaps(page = 1, size = 10) {
    try {
        const response = await axios.get(`${API_URL}/maps/owned`, {
            params: { page, size },
            headers: {
                'Authorization': `${getTokenType()} ${getToken()}`
            }
        });

        return response.data;
    
    } catch (error) {
        if (error.response) {
            throw new Error(error.response.data?.detail || "Failed to load maps");
        } else if (error.request) {
            throw new Error("No response received from server");
        } else {
            throw new Error("Error fetching maps: " + error.message);
        }
    }
}

export async function getAllMaps(page = 1, size = 10) {
    try {
        const response = await axios.get(`${API_URL}/maps/all`, {
            params: { page, size }
        });

        return response.data;
    
    } catch (error) {
        if (error.response) {
            throw new Error(error.response.data?.detail || "Failed to load maps");
        } else if (error.request) {
            throw new Error("No response received from server");
        } else {
            throw new Error("Error fetching maps: " + error.message);
        }
    }
}

export async function getMapById(mapId) {
    try {
        const response = await axios.get(`${API_URL}/maps/${mapId}`);

        return response.data;
    
    } catch (error) {
        if (error.response) {
            throw new Error(error.response.data?.detail || "Failed to load map");
        } else if (error.request) {
            throw new Error("No response received from server");
        } else {
            throw new Error("Error fetching map: " + error.message);
        }
    }
}

export async function createMap(title, description) {
    try {
        const response = await axios.post(`${API_URL}/maps/create`, {
            title,
            description
        }, {
            headers: {
                'Authorization': `${getTokenType()} ${getToken()}`
            }
        });

        return response.data;
    } catch (error) {
        if (error.response) {
            throw new Error(error.response.data?.detail || "Failed to create map");
        } else if (error.request) {
            throw new Error("No response received from server");
        } else {
            throw new Error("Error creating map: " + error.message);
        }
    }
}

export async function updateMap(mapId, title, description) {
    try {
        const response = await axios.put(`${API_URL}/maps/${mapId}`, {
            title,
            description
        }, {
            headers: {
                'Authorization': `${getTokenType()} ${getToken()}`
            }
        });

        return response.data;
    } catch (error) {
        if (error.response) {
            throw new Error(error.response.data?.detail || "Failed to update map");
        } else if (error.request) {
            throw new Error("No response received from server");
        } else {
            throw new Error("Error updating map: " + error.message);
        }
    }
}

export async function deleteMap(mapId) {
    try {
        const response = await axios.delete(`${API_URL}/maps/${mapId}`, {
            headers: {
                'Authorization': `${getTokenType()} ${getToken()}`
            }
        });

        return response.status === 204;
    
    } catch (error) {
        if (error.response) {
            throw new Error(error.response.data?.detail || "Failed to delete map");
        } else if (error.request) {
            throw new Error("No response received from server");
        } else {
            throw new Error("Error deleting map: " + error.message);
        }
    }
}

export async function uploadImage(mapId, imageFile) {
    const formData = new FormData();
    formData.append('file', imageFile);

    try {
        const response = await axios.post(`${API_URL}/maps/${mapId}/upload-image`, formData, {
            headers: {
                'Authorization': `${getTokenType()} ${getToken()}`,
                'Content-Type': 'multipart/form-data'
            }
        });

        return response.data;
    
    } catch (error) {
        if (error.response) {
            throw new Error(error.response.data?.detail || "Failed to upload image");
        } else if (error.request) {
            throw new Error("No response received from server");
        } else {
            throw new Error("Error uploading image: " + error.message);
        }
    }
}