import { useCallback, useEffect, useState } from "react";

import { useLatest } from "./useLatest";

/**
 * Minimal async data loader with cancellation and manual reload support.
 *
 * `key` identifies the request: changing it re-runs the loader.
 * `loader` is kept in a ref, so inline functions are safe to pass.
 */
export function useAsyncData(loader, key, { enabled = true } = {}) {
    const loaderRef = useLatest(loader);
    const [revision, setRevision] = useState(0);
    const [state, setState] = useState(() => ({
        data: null,
        error: null,
        loading: enabled,
    }));

    useEffect(() => {
        if (!enabled) {
            setState((prev) => (prev.loading ? { ...prev, loading: false } : prev));
            return undefined;
        }

        let cancelled = false;

        setState((prev) => ({ ...prev, loading: true, error: null }));

        loaderRef
            .current()
            .then((data) => {
                if (cancelled) return;
                setState({ data, error: null, loading: false });
            })
            .catch((error) => {
                if (cancelled) return;
                setState({ data: null, error, loading: false });
            });

        return () => {
            cancelled = true;
        };
    }, [key, enabled, revision, loaderRef]);

    const reload = useCallback(() => {
        setRevision((value) => value + 1);
    }, []);

    const mutate = useCallback((updater) => {
        setState((prev) => ({
            ...prev,
            data: typeof updater === "function" ? updater(prev.data) : updater,
        }));
    }, []);

    return { ...state, reload, mutate };
}
