import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function getStageLabel(t, stage) {
    switch (stage) {
        case "queued":
            return t("tilesUploader.stages.queued");
        case "downloading_source":
            return t("tilesUploader.stages.downloadingSource");
        case "generating_tiles":
            return t("tilesUploader.stages.generatingTiles");
        case "uploading_tiles":
            return t("tilesUploader.stages.uploadingTiles");
        case "finalizing":
            return t("tilesUploader.stages.finalizing");
        case "completed":
            return t("tilesUploader.stages.completed");
        case "failed":
            return t("tilesUploader.stages.failed");
        default:
            return t("tilesUploader.stages.processing");
    }
}

function getErrorMessage(t, errorCode) {
    switch (errorCode) {
        case "SOURCE_NOT_FOUND":
            return t("tilesUploader.errors.sourceNotFound");
        case "SOURCE_DOWNLOAD_FAILED":
            return t("tilesUploader.errors.sourceDownloadFailed");
        case "IMAGE_DECODE_FAILED":
            return t("tilesUploader.errors.imageDecodeFailed");
        case "TILE_GENERATION_FAILED":
            return t("tilesUploader.errors.tileGenerationFailed");
        case "TILE_UPLOAD_FAILED":
            return t("tilesUploader.errors.tileUploadFailed");
        case "CALLBACK_FAILED":
            return t("tilesUploader.errors.callbackFailed");
        case "PROCESSING_TIMEOUT":
            return t("tilesUploader.errors.processingTimeout");
        default:
            return t("tilesUploader.errors.processingFailed");
    }
}

function getProgressDetails(t, payload) {
    if (!payload) return "";

    if (payload.stage === "generating_tiles" && payload.total_tiles) {
        return t("tilesUploader.progress.generatedCount", {
            generated: payload.generated_tiles ?? 0,
            total: payload.total_tiles,
        });
    }

    if (payload.stage === "uploading_tiles" && payload.total_tiles) {
        return t("tilesUploader.progress.uploadedCount", {
            uploaded: payload.uploaded_tiles ?? 0,
            total: payload.total_tiles,
        });
    }

    switch (payload.stage) {
        case "queued":
            return t("tilesUploader.progress.queued");
        case "downloading_source":
            return t("tilesUploader.progress.downloadingSource");
        case "generating_tiles":
            return t("tilesUploader.progress.generatingTiles");
        case "uploading_tiles":
            return t("tilesUploader.progress.uploadingTiles");
        case "finalizing":
            return t("tilesUploader.progress.finalizing");
        case "completed":
            return t("tilesUploader.progress.completed");
        default:
            return t("tilesUploader.progress.pleaseWait");
    }
}

export default function TilesUploader({
    onSubmit,
    isProcessing = false,
    successMessage = "",
    progressData = null,
    errorMessage = "",
    errorDetails = "",
}) {
    const { t } = useTranslation();
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);

    const progressValue = progressData?.progress ?? 0;

    const stageLabel = useMemo(
        () => getStageLabel(t, progressData?.stage),
        [progressData?.stage, t]
    );

    const detailsText = useMemo(
        () => getProgressDetails(t, progressData),
        [progressData, t]
    );

    const resolvedErrorMessage = useMemo(() => {
        const hasExplicitError = Boolean(errorMessage);
        const hasProgressError = progressData?.status === "error";

        if (!hasExplicitError && !hasProgressError) {
            return "";
        }

        if (hasExplicitError) {
            return errorMessage;
        }

        const errorCode =
            progressData?.error_code ??
            progressData?.errorCode ??
            null;

        return getErrorMessage(t, errorCode);
    }, [errorMessage, progressData, t]);

    const resolvedErrorDetails = useMemo(() => {
        const hasExplicitError = Boolean(errorMessage);
        const hasProgressError = progressData?.status === "error";

        if (!hasExplicitError && !hasProgressError) {
            return "";
        }

        return (
            errorDetails ||
            progressData?.error_details ||
            progressData?.errorDetails ||
            ""
        );
    }, [errorMessage, errorDetails, progressData]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file || !onSubmit) return;

        try {
            setUploading(true);
            await onSubmit(file);
            setFile(null);
            e.target.reset();
        } catch (err) {
            console.error(t("tilesUploader.errors.uploadFailedConsole"), err);
        } finally {
            setUploading(false);
        }
    };

    return (
        <Card className="bg-surface-panel border-border-default">
            <CardHeader className="px-3 pb-2 pt-3 md:px-6 md:pb-6 md:pt-6">
                <CardTitle className="text-lg text-text-heading md:text-xl">
                    {t("tilesUploader.title")}
                </CardTitle>
            </CardHeader>

            <CardContent className="px-3 pb-3 md:px-6 md:pb-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="mb-1 block font-medium text-text-heading">
                            {t("tilesUploader.fileLabel")}
                        </label>

                        <input
                            type="file"
                            accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
                            onChange={(e) => setFile(e.target.files[0] || null)}
                            required
                            className="block w-full text-sm text-text-heading file:mr-3 file:rounded-md file:border file:border-border-default file:bg-surface-paper file:px-3 file:py-2 file:text-text-heading hover:file:bg-surface-panel/60 transition-colors"
                        />
                    </div>

                    <Button
                        type="submit"
                        disabled={!file || uploading || isProcessing}
                        className="w-full sm:w-auto"
                    >
                        {uploading
                            ? t("tilesUploader.actions.uploading")
                            : t("tilesUploader.actions.upload")}
                    </Button>

                    {isProcessing && (
                        <div className="mt-4 space-y-3">
                            <div className="flex items-center justify-between text-sm font-medium text-text-heading">
                                <span>{stageLabel}</span>
                                <span>{progressValue}%</span>
                            </div>

                            <div className="h-3 w-full overflow-hidden rounded-full border border-border-default bg-surface-paper">
                                <div
                                    className="h-full bg-accent-primary transition-all duration-300"
                                    style={{ width: `${progressValue}%` }}
                                />
                            </div>

                            <div className="text-sm text-text-muted">
                                {detailsText || t("tilesUploader.progress.pleaseWait")}
                            </div>
                        </div>
                    )}

                    {!isProcessing && successMessage && (
                        <div className="mt-2 font-semibold text-status-success-ink">
                            {successMessage}
                        </div>
                    )}

                    {!isProcessing && resolvedErrorMessage && (
                        <div className="mt-4 max-w-2xl rounded-xl border border-status-error-border/40 bg-surface-paper/70 p-4">
                            <div className="flex items-start gap-3">
                                <div className="mt-0.5 h-10 w-1 shrink-0 rounded-full bg-status-error-border" />
                                <div className="min-w-0">
                                    <div className="text-sm font-semibold text-status-error-ink">
                                        {t("tilesUploader.errorBlock.title")}
                                    </div>
                                    <div className="mt-1 text-sm leading-6 text-status-error-ink">
                                        {resolvedErrorMessage}
                                    </div>

                                    {resolvedErrorDetails && (
                                        <div className="mt-2 break-words text-xs leading-5 text-text-muted">
                                            {t("tilesUploader.errorBlock.details")}: {resolvedErrorDetails}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </form>
            </CardContent>
        </Card>
    );
}