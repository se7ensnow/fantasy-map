import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
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
    const { t } = useTranslation();
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
            setError(t("mapForm.errors.titleRequired"));
            return;
        }
        setError("");
        onSubmit(title, description, tags, visibility);
    };

    return (
        <Card className="bg-surface-panel border-border-default mb-6">
            <CardHeader>
                <CardTitle className="text-xl text-text-heading">
                    {initialTitle ? t("mapForm.title.edit") : t("mapForm.title.create")}
                </CardTitle>
            </CardHeader>

            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block mb-1 font-medium text-text-heading">
                            {t("mapForm.fields.title")}
                        </label>
                        <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
                    </div>

                    <div>
                        <label className="block mb-1 font-medium text-text-heading">
                            {t("mapForm.fields.description")}
                        </label>
                        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
                    </div>

                    <div>
                        <label className="block mb-1 font-medium text-text-heading">
                            {t("mapForm.fields.visibility")}
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
                                {t("mapForm.visibility.private")}
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
                                {t("mapForm.visibility.public")}
                            </button>

                            <span className="text-xs text-text-heading/60 ml-2">
                                {visibility === "private"
                                    ? t("mapForm.visibility.privateHint")
                                    : t("mapForm.visibility.publicHint")}
                            </span>
                        </div>
                    </div>

                    <div>
                        <label className="block mb-1 font-medium text-text-heading">
                            {t("mapForm.fields.tags")}
                        </label>

                        <TagsInput
                            value={tags}
                            onChange={setTags}
                            placeholder={t("mapForm.tags.placeholder")}
                        />

                        <p className="text-xs text-text-heading/60 mt-1">
                            {t("mapForm.tags.hint")}
                        </p>
                    </div>

                    {error && <p className="text-status-danger">{error}</p>}

                    <Button type="submit" disabled={loading}>
                        {loading ? t("mapForm.actions.saving") : t("mapForm.actions.save")}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}