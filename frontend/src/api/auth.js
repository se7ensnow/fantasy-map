import { saveTokens } from "@/lib/tokenStore";
import client from "./client";

export async function register(username, email, password) {
    return client.post(
        "/auth/register",
        { username, email, password },
        { errorMessage: "Registration failed. Please try again." }
    );
}

export async function login(username, password) {
    const params = new URLSearchParams({ username, password });

    const data = await client.post("/auth/login", params, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        errorMessage: "Login failed. Please try again.",
    });

    const { access_token: accessToken, token_type: tokenType } = data ?? {};

    if (!accessToken) {
        throw new Error("Login response did not contain an access token.");
    }

    saveTokens({ access_token: accessToken, token_type: tokenType });

    return { access_token: accessToken, token_type: tokenType };
}
