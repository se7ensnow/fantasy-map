const ACCESS_TOKEN_KEY = "access_token";
const TOKEN_TYPE_KEY = "token_type";
const DEFAULT_TOKEN_TYPE = "Bearer";

const listeners = new Set();

function readSnapshot() {
    try {
        return {
            accessToken: localStorage.getItem(ACCESS_TOKEN_KEY),
            tokenType: localStorage.getItem(TOKEN_TYPE_KEY) || DEFAULT_TOKEN_TYPE,
        };
    } catch {
        return { accessToken: null, tokenType: DEFAULT_TOKEN_TYPE };
    }
}

let snapshot = readSnapshot();

function commit() {
    snapshot = readSnapshot();
    listeners.forEach((listener) => listener());
}

export function getToken() {
    return snapshot.accessToken;
}

export function getTokenType() {
    return snapshot.tokenType;
}

export function getAuthSnapshot() {
    return snapshot;
}

export function subscribeToAuth(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

export function saveTokens({ access_token: accessToken, token_type: tokenType }) {
    if (!accessToken) return;

    try {
        localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
        localStorage.setItem(TOKEN_TYPE_KEY, tokenType || DEFAULT_TOKEN_TYPE);
    } catch {
        // Storage can be unavailable (private mode, blocked cookies).
    }

    commit();
}

export function clearTokens() {
    try {
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(TOKEN_TYPE_KEY);
    } catch {
        // Ignore storage errors: the UI must still be able to sign the user out.
    }

    commit();
}

/** Re-reads tokens after a change made by another tab. */
export function refreshAuth() {
    commit();
}
