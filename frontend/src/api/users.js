import axios from "axios";
import { getToken, getTokenType } from "./auth";
import { API_URL } from "../config";
import { toApiError } from "./errors";

export async function getMe() {
    try {
        const response = await axios.get(`${API_URL}/users/me`, {
            headers: {
                Authorization: `${getTokenType()} ${getToken()}`,
            },
        });

        return response.data;
    } catch (error) {
        throw toApiError(error, "Failed to load user profile");
    }
}

export async function getUserById(userId) {
    try {
        const response = await axios.get(`${API_URL}/users/${userId}`, {
            headers: {
                Authorization: `${getTokenType()} ${getToken()}`,
            },
        });

        return response.data;
    } catch (error) {
        throw toApiError(error, "Failed to load user data");
    }
}