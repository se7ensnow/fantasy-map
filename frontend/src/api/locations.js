import axios from "axios";
import { getToken, getTokenType } from "./auth";
import { API_URL } from "../config";
import { toApiError } from "./errors";

export async function getLocations(mapId) {
    try {
        const response = await axios.get(`${API_URL}/locations/`, {
            params: { map_id: mapId },
        });

        return response.data;
    } catch (error) {
        throw toApiError(error, "Failed to load locations");
    }
}

export async function getLocationById(locationId) {
    try {
        const response = await axios.get(`${API_URL}/locations/${locationId}`);
        return response.data;
    } catch (error) {
        throw toApiError(error, "Failed to load location");
    }
}

export async function createLocation(locationData) {
    try {
        const response = await axios.post(
            `${API_URL}/locations/create`,
            locationData,
            {
                headers: {
                    Authorization: `${getTokenType()} ${getToken()}`,
                },
            }
        );

        return response.data;
    } catch (error) {
        throw toApiError(error, "Failed to create location");
    }
}

export async function updateLocation(locationId, locationData) {
    try {
        const response = await axios.put(
            `${API_URL}/locations/${locationId}`,
            locationData,
            {
                headers: {
                    Authorization: `${getTokenType()} ${getToken()}`,
                },
            }
        );

        return response.data;
    } catch (error) {
        throw toApiError(error, "Failed to update location");
    }
}

export async function deleteLocation(locationId) {
    try {
        const response = await axios.delete(`${API_URL}/locations/${locationId}`, {
            headers: {
                Authorization: `${getTokenType()} ${getToken()}`,
            },
        });

        return response.data;
    } catch (error) {
        throw toApiError(error, "Failed to delete location");
    }
}