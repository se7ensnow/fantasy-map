import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TilesUploader({ onSubmit }) {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file || !onSubmit) return;

        try {
            setUploading(true);
            await onSubmit(file);
            setFile(null);
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

                        {/* файл-инпут оставляем нативным, но стилизуем через токены */}
                        <input
                            type="file"
                            accept=".png"
                            onChange={(e) => setFile(e.target.files[0])}
                            required
                            className="block w-full text-sm text-text-heading file:mr-4 file:py-2 file:px-4
                         file:rounded-md file:border file:border-border-default
                         file:bg-surface-paper file:text-text-heading
                         hover:file:bg-surface-panel/60 transition-colors"
                        />
                    </div>

                    <Button type="submit" disabled={!file || uploading}>
                        {uploading ? "Uploading..." : "Upload Image"}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}