import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function NotFoundPage() {
    const navigate = useNavigate();

    return (
        <div className="flex min-h-[70vh] items-center justify-center px-6 py-12">
            <div className="w-full max-w-6xl rounded-2xl border border-border-emphasis bg-surface-panel/85 p-10 text-center shadow-card backdrop-blur-sm">
                <p className="mb-3 text-sm font-semibold tracking-[0.2em] text-text-muted uppercase">
                    404
                </p>

                <h1 className="text-5xl font-bold text-text-heading">
                    Here be missing pages!
                </h1>

                <div className="mx-auto mt-5 max-w-4xl space-y-4">
                    <p className="text-lg leading-relaxed text-text-primary">
                        It seems this path leads nowhere.<br />
                        The page may have been moved, removed, or perhaps it was never on the map to begin with.
                    </p>

                    <p className="text-text-muted italic">
                        Even the finest cartographers lose a trail from time to time.
                    </p>
                </div>

                <div className="mt-8 flex justify-center">
                    <Button onClick={() => navigate("/")}>
                        Return to Catalog
                    </Button>
                </div>
            </div>
        </div>
    );
}