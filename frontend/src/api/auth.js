import axios from "axios";
import { API_URL } from "../config";

export async function register(username, email, password) {
    try {
        const response = await axios.post(`${API_URL}/auth/register`, {
            username,
            email,
            password,
        });

        return response.data;
    } catch (error) {
        if (error.response) {
            throw new Error(error.response.data?.detail || "Registration failed");
        } else if (error.request) {
            throw new Error("No response received from server");
        } else {
            throw new Error("Registration error: " + error.message);
        }
    }
}

export async function login(username, password) {
    const params = new URLSearchParams();
    params.append("username", username);
    params.append("password", password);

    try {
        const response = await axios.post(`${API_URL}/auth/login`, params, {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
        });

        const { access_token, token_type } = response.data;
        localStorage.setItem("access_token", access_token);
        localStorage.setItem("token_type", token_type);

        return { access_token, token_type };
    } catch (error) {
        if (error.response) {
            throw new Error(error.response.data?.detail || "Login failed");
        } else if (error.request) {
            throw new Error("No response received from server");
        } else {
            throw new Error("Login error: " + error.message);
        }
    }
}

export function clearToken() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("token_type");
}

export function getToken() {
    return localStorage.getItem("access_token");
}

export function getTokenType() {
    return localStorage.getItem("token_type") || "Bearer";
}