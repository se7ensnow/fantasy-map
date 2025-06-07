import axios from "axios";
import { getToken, getTokenType } from "./auth";
import { API_URL } from "../config";

export async function getMe() {
    try {
        const response = await axios.get(`${API_URL}/users/me`, {
            headers: {
                'Authorization': `${getTokenType()} ${getToken()}`
            }
        });

        return response.data;

    } catch (error) {
        if (error.response) {
            throw new Error(error.response.data?.detail || "Failed to load user profile");
        } else if (error.request) {
            throw new Error("No response received from server");
        } else {
            throw new Error("Error fetching user data: " + error.message);
        }
    }
}

export async function getUserById(userId) {
    try {
        const response = await axios.get(`${API_URL}/users/${userId}`, {
            headers: {
                'Authorization': `${getTokenType()} ${getToken()}`
            }
        });

        return response.data;

    } catch (error) {
        if (error.response) {
            throw new Error(error.response.data?.detail || "Failed to load user data");
        } else if (error.request) {
            throw new Error("No response received from server");
        } else {
            throw new Error("Error fetching user data: " + error.message);
        }
    }
}