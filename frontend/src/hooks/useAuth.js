import { useEffect, useSyncExternalStore } from "react";

import {
    getAuthSnapshot,
    refreshAuth,
    subscribeToAuth,
} from "@/lib/tokenStore";

export function useAuth() {
    const auth = useSyncExternalStore(
        subscribeToAuth,
        getAuthSnapshot,
        getAuthSnapshot
    );

    useEffect(() => {
        const handleStorage = (event) => {
            if (
                !event.key ||
                event.key === "access_token" ||
                event.key === "token_type"
            ) {
                refreshAuth();
            }
        };

        window.addEventListener("storage", handleStorage);
        return () => window.removeEventListener("storage", handleStorage);
    }, []);

    return {
        token: auth.accessToken,
        isAuthenticated: Boolean(auth.accessToken),
    };
}
