import React, { useState, useEffect } from "react";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import TagsInput from "@/components/TagsInput";

export default function MapForm({
    initialTitle = "",
    initialDescription = "",
    initialTags = [],
    initialVisibility = "private",
    onSubmit,
    loading,
}) {
    const [title, setTitle] = useState(initialTitle);
    const [description, setDescription] = useState(initialDescription);
    const [tags, setTags] = useState(() => initialTags || []);
    const [visibility, setVisibility] = useState(initialVisibility);
    const [error, setError] = useState("");

    useEffect(() => {
        setTitle(initialTitle ?? "");
        setDescription(initialDescription ?? "");
        setVisibility(initialVisibility ?? "private");
    }, [initialTitle, initialDescription, initialVisibility]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!title.trim()) {
            setError("Title is required");
            return;
        }
        setError("");
        onSubmit(title, description, tags, visibility);
    };

    return (
        <Card className="bg-surface-panel border-border-default mb-6">
            <CardHeader>
                <CardTitle className="text-xl text-text-heading">
                    {initialTitle ? "Edit Map Info" : "Create New Map"}
                </CardTitle>
            </CardHeader>

            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block mb-1 font-medium text-text-heading">
                            Title:
                        </label>
                        <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
                    </div>

                    <div>
                        <label className="block mb-1 font-medium text-text-heading">
                            Description:
                        </label>
                        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
                    </div>

                    <div>
                        <label className="block mb-1 font-medium text-text-heading">
                            Visibility:
                        </label>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setVisibility("private")}
                                className={[
                                    "px-3 h-9 rounded-md border text-sm transition-colors",
                                    visibility === "private"
                                        ? "bg-state-selected border-border-default/40 text-text-heading"
                                        : "bg-surface-paper/60 border-border-default/20 text-text-heading/60 hover:bg-state-hover",
                                ].join(" ")}
                                aria-pressed={visibility === "private"}
                            >
                                Private
                            </button>

                            <button
                                type="button"
                                onClick={() => setVisibility("public")}
                                className={[
                                    "px-3 h-9 rounded-md border text-sm transition-colors",
                                    visibility === "public"
                                        ? "bg-accent-primary/15 border-accent-primary/40 text-accent-primary"
                                        : "bg-surface-paper/60 border-border-default/20 text-text-heading/60 hover:bg-state-hover",
                                ].join(" ")}
                                aria-pressed={visibility === "public"}
                            >
                                Public
                            </button>

                            <span className="text-xs text-text-heading/60 ml-2">
                                {visibility === "private" ? "Visible only to you." : "Visible in the catalog."}
                            </span>
                        </div>
                    </div>

                    <div>
                        <label className="block mb-1 font-medium text-text-heading">
                            Tags:
                        </label>

                        <TagsInput
                            value={tags}
                            onChange={setTags}
                            placeholder="Add tags (Enter / comma)…"
                        />

                        <p className="text-xs text-text-heading/60 mt-1">
                            Press Enter or comma to add a tag.
                        </p>
                    </div>

                    {error && <p className="text-status-danger">{error}</p>}

                    <Button type="submit" disabled={loading}>
                        {loading ? "Saving..." : "Save Map"}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}