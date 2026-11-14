import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { subscribeToTileProgress, uploadImage } from "@/api/maps";
import { useLatest } from "./useLatest";

/**
 * Encapsulates tile upload + SSE progress + error normalization.
 */
export function useTileProcessing({ mapId, onCompleted }) {
    const { t } = useTranslation();
    const onCompletedRef = useLatest(onCompleted);
    const unsubscribeRef = useRef(null);

    const [isProcessing, setIsProcessing] = useState(false);
    const [progressData, setProgressData] = useState(null);
    const [successMessage, setSuccessMessage] = useState("");
    const [error, setError] = useState(null);

    useEffect(
        () => () => {
            unsubscribeRef.current?.();
            unsubscribeRef.current = null;
        },
        []
    );

    const reset = useCallback(() => {
        setProgressData(null);
        setSuccessMessage("");
        setError(null);
    }, []);

    const upload = useCallback(
        async (file) => {
            if (!mapId) {
                toast.error(t("mapEdit.errors.createMapBeforeUpload"));
                return;
            }

            reset();
            setIsProcessing(true);

            try {
                const result = await uploadImage(mapId, file);

                if (!result?.job_id) {
                    setIsProcessing(false);
                    toast.error(t("mapEdit.errors.progressUnavailable"));
                    return;
                }

                unsubscribeRef.current?.();

                unsubscribeRef.current = subscribeToTileProgress(result.job_id, {
                    onProgress: (payload) => setProgressData(payload),

                    onDone: async (payload) => {
                        setProgressData(payload);
                        setError(null);
                        setIsProcessing(false);
                        setSuccessMessage(t("mapEdit.tiles.readyMessage"));
                        unsubscribeRef.current = null;

                        toast.success(t("mapEdit.toasts.imageProcessed"));

                        try {
                            await onCompletedRef.current?.();
                        } catch (refreshError) {
                            console.error("Failed to refresh map after processing:", refreshError);
                        }
                    },

                    onError: (payload) => {
                        setProgressData(payload);
                        setIsProcessing(false);
                        setSuccessMessage("");
                        setError({
                            message:
                                payload?.userMessage ||
                                t("mapEdit.errors.processingFailed"),
                            details: payload?.errorDetails || null,
                        });
                        unsubscribeRef.current = null;

                        toast.error(
                            payload?.userMessage ||
                                t("mapEdit.errors.processingFailed")
                        );
                    },
                });
            } catch (uploadError) {
                setIsProcessing(false);
                setError({
                    message:
                        uploadError.message ||
                        t("mapEdit.errors.failedToUploadImage"),
                    details: null,
                });
                toast.error(
                    uploadError.message || t("mapEdit.errors.failedToUploadImage")
                );
                console.error(uploadError);
            }
        },
        [mapId, reset, t, onCompletedRef]
    );

    return {
        isProcessing,
        progressData,
        successMessage,
        errorMessage: error?.message ?? "",
        errorDetails: error?.details ?? "",
        upload,
        reset,
    };
}
