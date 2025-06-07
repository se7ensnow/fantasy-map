import axios from "axios";
import { getToken, getTokenType } from "./auth";
import { API_URL } from "../config";

export async function getLocations(mapId) {
    try {
        const response = await axios.get(`${API_URL}/locations/`, {
            params: { map_id: mapId },
        });

        return response.data;

    } catch (error) {
        if (error.response) {
            throw new Error(error.response.data?.detail || "Failed to load locations");
        } else if (error.request) {
            throw new Error("No response received from server");
        } else {
            throw new Error("Error fetching locations: " + error.message);
        }
    }
}

export async function getLocationById(locationId) {
    try {
        const response = await axios.get(`${API_URL}/locations/${locationId}`);

        return response.data;

    } catch (error) {
        if (error.response) {
            throw new Error(error.response.data?.detail || "Failed to load location");
        } else if (error.request) {
            throw new Error("No response received from server");
        } else {
            throw new Error("Error fetching location: " + error.message);
        }
    }
}

export async function createLocation(locationData) {
    try {
        const response = await axios.post(`${API_URL}/locations/create`, locationData, {
            headers: {
                'Authorization': `${getTokenType()} ${getToken()}`,
            }
        });

        return response.data;

    } catch (error) {
        if (error.response) {
            throw new Error(error.response.data?.detail || "Failed to create location");
        } else if (error.request) {
            throw new Error("No response received from server");
        } else {
            throw new Error("Error creating location: " + error.message);
        }
    }
}

export async function updateLocation(locationId, locationData) {
    try {
        const response = await axios.put(`${API_URL}/locations/${locationId}`, locationData, {
            headers: {
                'Authorization': `${getTokenType()} ${getToken()}`,
            }
        });

        return response.data;

    } catch (error) {
        if (error.response) {
            throw new Error(error.response.data?.detail || "Failed to update location");
        } else if (error.request) {
            throw new Error("No response received from server");
        } else {
            throw new Error("Error updating location: " + error.message);
        }
    }
}

export async function deleteLocation(locationId) {
    try {
        const response = await axios.delete(`${API_URL}/locations/${locationId}`, {
            headers: {
                'Authorization': `${getTokenType()} ${getToken()}`,
            }
        });

        return response.data;

    } catch (error) {
        if (error.response) {
            throw new Error(error.response.data?.detail || "Failed to delete location");
        } else if (error.request) {
            throw new Error("No response received from server");
        } else {
            throw new Error("Error deleting location: " + error.message);
        }
    }
}
