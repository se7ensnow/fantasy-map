import axios from "axios";

import { API_URL } from "@/config";
import { getToken, getTokenType } from "@/lib/tokenStore";
import { toApiError } from "./errors";

const client = axios.create({ baseURL: API_URL });

client.interceptors.request.use((config) => {
    const token = getToken();

    if (token) {
        config.headers = config.headers ?? {};
        config.headers.Authorization = `${getTokenType()} ${token}`;
    }

    return config;
});

client.interceptors.response.use(
    (response) => (response.status === 204 ? null : response.data),
    (error) => Promise.reject(toApiError(error, error.config?.errorMessage))
);

/**
 * Thin wrapper that keeps per-request fallback messages declarative.
 * The response interceptor already returns `response.data`.
 */
export default client;
