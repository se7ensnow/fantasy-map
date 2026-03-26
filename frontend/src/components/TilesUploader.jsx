import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TilesUploader({ onSubmit, isProcessing = false, successMessage = "" }) {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);

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
                            Upload Image (.png):
                        </label>

                        <input
                            type="file"
                            accept=".png"
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
                        <div className="mt-2 flex items-center gap-2 text-status-warning-ink font-semibold">
                            <svg
                                className="animate-spin h-5 w-5"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                            >
                                <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                />
                                <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8v8H4z"
                                />
                            </svg>
                            <span>Processing tiles... Please wait.</span>
                        </div>
                    )}

                    {!isProcessing && successMessage && (
                        <div className="mt-2 text-status-success-ink font-semibold">
                            {successMessage}
                        </div>
                    )}
                </form>
            </CardContent>
        </Card>
    );
}