import { useEffect, useId, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import SegmentedControl from "@/components/SegmentedControl";
import TagsInput from "@/components/TagsInput";
import { useLatest } from "@/hooks/useLatest";

export default function MapForm({
    initialTitle = "",
    initialDescription = "",
    initialTags = [],
    initialVisibility = "private",
    onSubmit,
    loading = false,
}) {
    const { t } = useTranslation();
    const fieldId = useId();

    const [title, setTitle] = useState(initialTitle ?? "");
    const [description, setDescription] = useState(initialDescription ?? "");
    const [tags, setTags] = useState(() => initialTags || []);
    const [visibility, setVisibility] = useState(initialVisibility ?? "private");
    const [error, setError] = useState("");

    const initialTagsRef = useLatest(initialTags);
    const initialTagsKey = (initialTags || []).join("\u0000");

    useEffect(() => {
        setTitle(initialTitle ?? "");
        setDescription(initialDescription ?? "");
        setVisibility(initialVisibility ?? "private");
    }, [initialTitle, initialDescription, initialVisibility]);

    // Reset tags only when the source tags actually change (not on every render).
    useEffect(() => {
        setTags(initialTagsRef.current ?? []);
    }, [initialTagsKey, initialTagsRef]);

    const handleSubmit = (event) => {
        event.preventDefault();

        if (!title.trim()) {
            setError(t("mapForm.errors.titleRequired"));
            return;
        }

        setError("");
        onSubmit(title.trim(), description, tags, visibility);
    };

    const isEditing = Boolean(initialTitle);

    return (
        <Card className="border-border-default bg-surface-panel">
            <CardHeader className="px-3 pb-2 pt-3 md:px-6 md:pb-6 md:pt-6">
                <CardTitle className="text-lg text-text-heading md:text-xl">
                    {isEditing ? t("mapForm.title.edit") : t("mapForm.title.create")}
                </CardTitle>
            </CardHeader>

            <CardContent className="px-3 pb-3 md:px-6 md:pb-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor={`${fieldId}-title`} className="mb-1 block">
                            {t("mapForm.fields.title")}
                        </Label>
                        <Input
                            id={`${fieldId}-title`}
                            value={title}
                            onChange={(event) => setTitle(event.target.value)}
                            required
                            maxLength={200}
                        />
                    </div>

                    <div>
                        <Label htmlFor={`${fieldId}-description`} className="mb-1 block">
                            {t("mapForm.fields.description")}
                        </Label>
                        <Textarea
                            id={`${fieldId}-description`}
                            value={description}
                            onChange={(event) => setDescription(event.target.value)}
                            rows={5}
                        />
                    </div>

                    <div>
                        <Label className="mb-1 block">
                            {t("mapForm.fields.visibility")}
                        </Label>

                        <div className="flex flex-wrap items-center gap-2">
                            <SegmentedControl
                                label={t("mapForm.fields.visibility")}
                                value={visibility}
                                onChange={setVisibility}
                                options={[
                                    {
                                        value: "private",
                                        label: t("mapForm.visibility.private"),
                                    },
                                    {
                                        value: "public",
                                        label: t("mapForm.visibility.public"),
                                    },
                                ]}
                            />

                            <span className="w-full text-xs text-text-heading/60 sm:ml-2 sm:w-auto">
                                {visibility === "private"
                                    ? t("mapForm.visibility.privateHint")
                                    : t("mapForm.visibility.publicHint")}
                            </span>
                        </div>
                    </div>

                    <div>
                        <Label className="mb-1 block">
                            {t("mapForm.fields.tags")}
                        </Label>

                        <TagsInput value={tags} onChange={setTags} />
                    </div>

                    {error && (
                        <p className="text-sm font-medium text-status-error-ink" role="alert">
                            {error}
                        </p>
                    )}

                    <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                        {loading
                            ? t("mapForm.actions.saving")
                            : t("mapForm.actions.save")}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
