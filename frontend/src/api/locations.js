import client from "./client";

export async function getLocations(mapId) {
    return client.get("/locations/", {
        params: { map_id: mapId },
        errorMessage: "Failed to load locations",
    });
}

export async function getLocationById(locationId) {
    return client.get(`/locations/${locationId}`, {
        errorMessage: "Failed to load location",
    });
}

export async function createLocation(locationData) {
    return client.post("/locations/create", locationData, {
        errorMessage: "Failed to create location",
    });
}

export async function updateLocation(locationId, locationData) {
    return client.put(`/locations/${locationId}`, locationData, {
        errorMessage: "Failed to update location",
    });
}

export async function deleteLocation(locationId) {
    return client.delete(`/locations/${locationId}`, {
        errorMessage: "Failed to delete location",
    });
}
