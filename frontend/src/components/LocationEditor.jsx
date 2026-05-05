import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import MarkdownRenderer from "@/components/MarkdownRenderer";

export default function LocationEditor({ location, coords, onSave, onCancel }) {
    const { t } = useTranslation();

    const [type, setType] = useState("");
    const [name, setName] = useState("");
    const [descriptionMd, setDescriptionMd] = useState("");
    const [x, setX] = useState(0);
    const [y, setY] = useState(0);

    const [tab, setTab] = useState("edit");

    useEffect(() => {
        if (location) {
            setType(location.type || "");
            setName(location.name || "");
            setDescriptionMd(location.description_md || "");
            setX(location.x || 0);
            setY(location.y || 0);
        } else if (coords) {
            setType("");
            setName("");
            setDescriptionMd("");
            setX(coords.x || 0);
            setY(coords.y || 0);
        }
    }, [location, coords]);

    const handleSubmit = (e) => {
        e.preventDefault();

        const locationData = {
            type,
            name,
            description_md: descriptionMd,
            x,
            y,
        };

        onSave(locationData);
    };

    return (
        <div className="space-y-3 rounded border border-border-default bg-surface-paper/85 p-3 text-text-primary shadow backdrop-blur-sm md:p-4">
            <h2 className="mb-2 text-lg font-bold text-text-heading md:text-xl">
                {location
                    ? t("locationEditor.title.edit")
                    : t("locationEditor.title.add")}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                    <label className="mb-1 block font-medium text-text-heading">
                        {t("locationEditor.fields.name")}
                    </label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} required />
                </div>

                <div>
                    <label className="mb-1 block font-medium text-text-heading">
                        {t("locationEditor.fields.type")}
                    </label>
                    <Input value={type} onChange={(e) => setType(e.target.value)} required />
                </div>

                <div>
                    <div className="mb-1 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <label className="block font-medium text-text-heading">
                            {t("locationEditor.fields.article")}
                        </label>
                        <div className="inline-flex overflow-hidden rounded border border-border-default self-start">
                            <button
                                type="button"
                                onClick={() => setTab("edit")}
                                className={[
                                    "px-3 py-1 text-sm transition-colors",
                                    tab === "edit"
                                        ? "bg-state-selected font-semibold"
                                        : "bg-surface-paper/60 hover:bg-state-hover",
                                ].join(" ")}
                            >
                                {t("locationEditor.tabs.edit")}
                            </button>

                            <button
                                type="button"
                                onClick={() => setTab("preview")}
                                className={[
                                    "px-3 py-1 text-sm transition-colors",
                                    tab === "preview"
                                        ? "bg-state-selected font-semibold"
                                        : "bg-surface-paper/60 hover:bg-state-hover",
                                ].join(" ")}
                            >
                                {t("locationEditor.tabs.preview")}
                            </button>
                        </div>
                    </div>

                    {tab === "edit" ? (
                        <Textarea
                            value={descriptionMd}
                            onChange={(e) => setDescriptionMd(e.target.value)}
                            rows={10}
                            placeholder={t("locationEditor.placeholders.article")}
                        />
                    ) : (
                        <div className="rounded border border-border-default bg-surface-panel/60 p-3">
                            <MarkdownRenderer content={descriptionMd} />
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <div>
                        <label className="mb-1 block font-medium text-text-heading">
                            {t("locationEditor.fields.x")}
                        </label>
                        <Input
                            type="number"
                            value={x}
                            onChange={(e) => setX(parseFloat(e.target.value))}
                        />
                    </div>
                    <div>
                        <label className="mb-1 block font-medium text-text-heading">
                            {t("locationEditor.fields.y")}
                        </label>
                        <Input
                            type="number"
                            value={y}
                            onChange={(e) => setY(parseFloat(e.target.value))}
                        />
                    </div>
                </div>

                <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:justify-between">
                    <Button type="submit" className="w-full sm:w-auto">
                        {location
                            ? t("locationEditor.actions.saveChanges")
                            : t("locationEditor.actions.addLocation")}
                    </Button>
                    <Button type="button" variant="outline" onClick={onCancel} className="w-full sm:w-auto">
                        {t("actions.cancel")}
                    </Button>
                </div>
            </form>
        </div>
    );
}