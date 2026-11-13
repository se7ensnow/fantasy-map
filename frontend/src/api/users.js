import client from "./client";

export async function getMe() {
    return client.get("/users/me", {
        errorMessage: "Failed to load user profile",
    });
}

export async function getUserById(userId) {
    return client.get(`/users/${userId}`, {
        errorMessage: "Failed to load user data",
    });
}
