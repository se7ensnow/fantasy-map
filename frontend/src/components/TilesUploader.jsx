import React, { useState } from "react";
import { Input } from "@/components/ui/input";
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
        <Card className="bg-[rgba(252,247,233,0.9)] border-amber-700 mb-6">
            <CardHeader>
                <CardTitle className="text-xl">Upload Map Image</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block mb-1 font-medium">
                            Upload Image (.png):
                        </label>
                        <input
                            type="file"
                            accept=".png"
                            onChange={(e) => setFile(e.target.files[0])}
                            required
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