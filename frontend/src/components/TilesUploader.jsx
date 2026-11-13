import { useId, useMemo, useRef, useState } from "react";
import {
    AlertTriangle,
    CheckCircle2,
    RefreshCw,
    UploadCloud,
    X,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const ACCEPTED_TYPES = [
    "image/png",
    "image/jpeg",
    "image/webp",
];

function getStageLabel(t, stage) {
    const keys = {
        queued: "tilesUploader.stages.queued",
        downloading_source: "tilesUploader.stages.downloadingSource",
        generating_tiles: "tilesUploader.stages.generatingTiles",
        uploading_tiles: "tilesUploader.stages.uploadingTiles",
        finalizing: "tilesUploader.stages.finalizing",
        completed: "tilesUploader.stages.completed",
        failed: "tilesUploader.stages.failed",
    };

    return t(keys[stage] ?? "tilesUploader.stages.processing");
}

function getErrorMessage(t, errorCode) {
    const keys = {
        SOURCE_NOT_FOUND: "tilesUploader.errors.sourceNotFound",
        SOURCE_DOWNLOAD_FAILED: "tilesUploader.errors.sourceDownloadFailed",
        IMAGE_DECODE_FAILED: "tilesUploader.errors.imageDecodeFailed",
        TILE_GENERATION_FAILED: "tilesUploader.errors.tileGenerationFailed",
        TILE_UPLOAD_FAILED: "tilesUploader.errors.tileUploadFailed",
        CALLBACK_FAILED: "tilesUploader.errors.callbackFailed",
        PROCESSING_TIMEOUT: "tilesUploader.errors.processingTimeout",
    };

    return t(keys[errorCode] ?? "tilesUploader.errors.processingFailed");
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

    const keys = {
        queued: "tilesUploader.progress.queued",
        downloading_source: "tilesUploader.progress.downloadingSource",
        generating_tiles: "tilesUploader.progress.generatingTiles",
        uploading_tiles: "tilesUploader.progress.uploadingTiles",
        finalizing: "tilesUploader.progress.finalizing",
        completed: "tilesUploader.progress.completed",
    };

    return t(keys[payload.stage] ?? "tilesUploader.progress.pleaseWait");
}

function formatFileSize(bytes) {
    if (!Number.isFinite(bytes) || bytes <= 0) return "";

    const megabytes = bytes / (1024 * 1024);
    return megabytes >= 1
        ? `${megabytes.toFixed(1)} MB`
        : `${Math.max(1, Math.round(bytes / 1024))} KB`;
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
    const inputId = useId();
    const inputRef = useRef(null);

    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);

    const progressValue = Math.max(0, Math.min(100, progressData?.progress ?? 0));

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

        if (!hasExplicitError && !hasProgressError) return "";
        if (hasExplicitError) return errorMessage;

        const errorCode =
            progressData?.error_code ?? progressData?.errorCode ?? null;

        return getErrorMessage(t, errorCode);
    }, [errorMessage, progressData, t]);

    const resolvedErrorDetails = useMemo(() => {
        const hasExplicitError = Boolean(errorMessage);
        const hasProgressError = progressData?.status === "error";

        if (!hasExplicitError && !hasProgressError) return "";

        return (
            errorDetails ||
            progressData?.error_details ||
            progressData?.errorDetails ||
            ""
        );
    }, [errorMessage, errorDetails, progressData]);

    const selectFile = (nextFile) => {
        if (!nextFile) return;
        if (!ACCEPTED_TYPES.includes(nextFile.type)) return;

        setFile(nextFile);
    };

    const clearFile = () => {
        setFile(null);
        if (inputRef.current) inputRef.current.value = "";
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!file || !onSubmit) return;

        try {
            setUploading(true);
            await onSubmit(file);
            clearFile();
        } catch (uploadError) {
            console.error(t("tilesUploader.errors.uploadFailedConsole"), uploadError);
        } finally {
            setUploading(false);
        }
    };

    const isBusy = uploading || isProcessing;

    return (
        <Card className="border-border-default bg-surface-panel">
            <CardHeader className="px-3 pb-2 pt-3 md:px-6 md:pb-6 md:pt-6">
                <CardTitle className="text-lg text-text-heading md:text-xl">
                    {t("tilesUploader.title")}
                </CardTitle>
            </CardHeader>

            <CardContent className="px-3 pb-3 md:px-6 md:pb-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <span className="mb-1 block font-medium text-text-heading">
                            {t("tilesUploader.fileLabel")}
                        </span>

                        <label
                            htmlFor={inputId}
                            onDragOver={(event) => {
                                event.preventDefault();
                                if (!isBusy) setIsDragOver(true);
                            }}
                            onDragLeave={() => setIsDragOver(false)}
                            onDrop={(event) => {
                                event.preventDefault();
                                setIsDragOver(false);
                                if (isBusy) return;
                                selectFile(event.dataTransfer.files?.[0]);
                            }}
                            className={cn(
                                "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border-default/50 bg-surface-paper/40 px-4 py-8 text-center transition-colors",
                                isDragOver && "border-accent-primary bg-accent-primary/5",
                                isBusy && "pointer-events-none opacity-60"
                            )}
                        >
                            <UploadCloud
                                className="h-8 w-8 text-accent-primary"
                                aria-hidden="true"
                            />

                            {file ? (
                                <span className="flex max-w-full items-center gap-2 text-sm font-medium text-text-heading">
                                    <span className="truncate">{file.name}</span>
                                    <span className="shrink-0 text-text-muted">
                                        {formatFileSize(file.size)}
                                    </span>
                                </span>
                            ) : (
                                <>
                                    <span className="text-sm font-medium text-text-heading">
                                        {t("tilesUploader.dropHint")}
                                    </span>
                                    <span className="text-xs text-text-muted">
                                        {t("tilesUploader.fileTypes")}
                                    </span>
                                </>
                            )}

                            <input
                                ref={inputRef}
                                id={inputId}
                                type="file"
                                accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
                                onChange={(event) =>
                                    selectFile(event.target.files?.[0] || null)
                                }
                                className="sr-only"
                                disabled={isBusy}
                            />
                        </label>

                        {file && !isBusy && (
                            <button
                                type="button"
                                onClick={clearFile}
                                className="mt-2 inline-flex items-center gap-1 text-xs text-text-muted transition-colors hover:text-text-heading focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/50"
                            >
                                <X className="h-3 w-3" aria-hidden="true" />
                                {t("tilesUploader.clearSelection")}
                            </button>
                        )}
                    </div>

                    <Button
                        type="submit"
                        disabled={!file || isBusy}
                        className="w-full sm:w-auto"
                    >
                        {isBusy && <RefreshCw className="h-4 w-4 animate-spin" aria-hidden="true" />}
                        {uploading
                            ? t("tilesUploader.actions.uploading")
                            : t("tilesUploader.actions.upload")}
                    </Button>

                    {isProcessing && (
                        <div className="mt-4 space-y-3" role="status" aria-live="polite">
                            <div className="flex items-center justify-between text-sm font-medium text-text-heading">
                                <span>{stageLabel}</span>
                                <span>{progressValue}%</span>
                            </div>

                            <div
                                className="h-3 w-full overflow-hidden rounded-full border border-border-default bg-surface-paper"
                                role="progressbar"
                                aria-valuemin={0}
                                aria-valuemax={100}
                                aria-valuenow={progressValue}
                                aria-label={t("tilesUploader.title")}
                            >
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
                        <div className="mt-2 flex items-center gap-2 font-semibold text-status-success-ink">
                            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                            {successMessage}
                        </div>
                    )}

                    {!isProcessing && resolvedErrorMessage && (
                        <div
                            className="mt-4 max-w-2xl rounded-xl border border-status-error-border/40 bg-surface-paper/70 p-4"
                            role="alert"
                        >
                            <div className="flex items-start gap-3">
                                <AlertTriangle
                                    className="mt-0.5 h-5 w-5 shrink-0 text-status-error-ink"
                                    aria-hidden="true"
                                />

                                <div className="min-w-0">
                                    <div className="text-sm font-semibold text-status-error-ink">
                                        {t("tilesUploader.errorBlock.title")}
                                    </div>
                                    <div className="mt-1 text-sm leading-6 text-status-error-ink">
                                        {resolvedErrorMessage}
                                    </div>

                                    {resolvedErrorDetails && (
                                        <div className="mt-2 break-words text-xs leading-5 text-text-muted">
                                            {t("tilesUploader.errorBlock.details")}:{" "}
                                            {resolvedErrorDetails}
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
