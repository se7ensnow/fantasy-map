import React, { useState, useEffect } from 'react';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import TagsInput from "@/components/TagsInput";

export default function MapForm({
  initialTitle = "",
  initialDescription = "",
  initialTags = [],
  initialVisibility = "private",
  onSubmit,
  loading
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
        <Card className="bg-[rgba(252,247,233,0.9)] border-amber-700 mb-6">
            <CardHeader>
                <CardTitle className="text-xl">
                    {initialTitle ? "Edit Map Info" : "Create New Map"}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block mb-1 font-medium text-amber-900">Title:</label>
                        <Input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label className="block mb-1 font-medium text-amber-900">Description:</label>
                        <Textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block mb-1 font-medium text-amber-900">Visibility:</label>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setVisibility("private")}
                                className={[
                                    "px-3 h-9 rounded-md border text-sm transition-colors",
                                    visibility === "private"
                                        ? "bg-amber-100 border-amber-700/40 text-amber-900"
                                        : "bg-white/60 border-amber-700/20 text-amber-900/70 hover:bg-amber-50"
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
                                        ? "bg-[#5b7a5b]/15 border-[#5b7a5b]/40 text-[#2f4a2f]"
                                        : "bg-white/60 border-amber-700/20 text-amber-900/70 hover:bg-amber-50"
                                ].join(" ")}
                                aria-pressed={visibility === "public"}
                            >
                                Public
                            </button>
                            
                            <span className="text-xs text-amber-900/60 ml-2">
                                {visibility === "private"
                                    ? "Visible only to you."
                                    : "Visible in the catalog."}
                            </span>
                        </div>
                    </div>
                    <div>
                        <label className="block mb-1 font-medium text-amber-900">
                            Tags:
                        </label>
                        <TagsInput
                            value={tags}
                            onChange={setTags}
                            placeholder="Add tags (Enter / comma)…"
                        />
                        <p className="text-xs text-amber-800/70 mt-1">
                            Press Enter or comma to add a tag.
                        </p>
                    </div>
                    {error && <p className="text-red-500">{error}</p>}
                    <Button type="submit" disabled={loading}>
                        {loading ? "Saving..." : "Save Map"}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}