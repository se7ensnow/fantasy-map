import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function stageToLabel(stage) {
    switch (stage) {
        case "queued":
            return "Task queued";
        case "downloading_source":
            return "Downloading source image";
        case "generating_tiles":
            return "Generating tiles";
        case "uploading_tiles":
            return "Uploading tiles";
        case "finalizing":
            return "Finalizing map";
        case "completed":
            return "Completed";
        case "failed":
            return "Failed";
        default:
            return "Processing tiles";
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
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);

    const progressValue = progressData?.progress ?? 0;
    const stageLabel = useMemo(
        () => stageToLabel(progressData?.stage),
        [progressData?.stage]
    );

    const detailsText = useMemo(() => {
        if (!progressData) return "";
        
        if (
            progressData.stage === "generating_tiles" &&
            progressData.total_tiles
        ) {
            return `${progressData.generated_tiles ?? 0} / ${progressData.total_tiles} tiles generated`;
        }
    
        if (
            progressData.stage === "uploading_tiles" &&
            progressData.total_tiles
        ) {
            return `${progressData.uploaded_tiles ?? 0} / ${progressData.total_tiles} tiles uploaded`;
        }
    
        return progressData.message || "";
    }, [progressData]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file || !onSubmit) return;

        try {
            setUploading(true);
            await onSubmit(file);
            setFile(null);
            e.target.reset();
        } catch (err) {
            console.error("Upload failed:", err);
        } finally {
            setUploading(false);
        }
    };

    return (
        <Card className="bg-surface-panel border-border-default mb-6">
            <CardHeader>
                <CardTitle className="text-xl text-text-heading">
                    Upload Map Image
                </CardTitle>
            </CardHeader>

            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block mb-1 font-medium text-text-heading">
                            Upload Image (.png, .jpg, .jpeg, .webp):
                        </label>

                        <input
                            type="file"
                            accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
                            onChange={(e) => setFile(e.target.files[0] || null)}
                            required
                            className="block w-full text-sm text-text-heading file:mr-4 file:py-2 file:px-4
                         file:rounded-md file:border file:border-border-default
                         file:bg-surface-paper file:text-text-heading
                         hover:file:bg-surface-panel/60 transition-colors"
                        />
                    </div>

                    <Button type="submit" disabled={!file || uploading || isProcessing}>
                        {uploading ? "Uploading..." : "Upload Image"}
                    </Button>

                    {isProcessing && (
                        <div className="mt-4 space-y-3">
                            <div className="flex items-center justify-between text-sm font-medium text-text-heading">
                                <span>{stageLabel}</span>
                                <span>{progressValue}%</span>
                            </div>

                            <div className="h-3 w-full overflow-hidden rounded-full bg-surface-paper border border-border-default">
                                <div
                                    className="h-full bg-accent-primary transition-all duration-300"
                                    style={{ width: `${progressValue}%` }}
                                />
                            </div>

                            <div className="text-sm text-text-muted">
                                {detailsText || "Processing tiles... Please wait."}
                            </div>
                        </div>
                    )}

                    {!isProcessing && successMessage && (
                        <div className="mt-2 text-status-success-ink font-semibold">
                            {successMessage}
                        </div>
                    )}

                    {!isProcessing && errorMessage && (
                        <div className="mt-4 max-w-2xl rounded-xl border border-status-error-border/40 bg-surface-paper/70 p-4">
                            <div className="flex items-start gap-3">
                                <div className="mt-0.5 h-10 w-1 shrink-0 rounded-full bg-status-error-border" />
                                <div className="min-w-0">
                                    <div className="text-sm font-semibold text-status-error-ink">
                                        Processing failed
                                    </div>
                                    <div className="mt-1 text-sm leading-6 text-status-error-ink">
                                        {errorMessage}
                                    </div>
                                    {errorDetails && (
                                        <div className="mt-2 text-xs leading-5 break-words text-text-muted">
                                            Details: {errorDetails}
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