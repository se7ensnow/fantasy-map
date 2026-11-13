import { useEffect, useId, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import SegmentedControl from "@/components/SegmentedControl";

/**
 * Initializes once per location. The parent passes a `key` so switching the
 * edited location resets the form, while dragging the marker does not.
 */
export default function LocationEditor({ location, coords, onSave, onCancel }) {
    const { t } = useTranslation();
    const fieldId = useId();

    const [type, setType] = useState(location?.type ?? "");
    const [name, setName] = useState(location?.name ?? "");
    const [descriptionMd, setDescriptionMd] = useState(location?.description_md ?? "");
    const [xInput, setXInput] = useState(String(location?.x ?? coords?.x ?? 0));
    const [yInput, setYInput] = useState(String(location?.y ?? coords?.y ?? 0));
    const [tab, setTab] = useState("edit");
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);

    // Dragging the marker updates the parent-owned location without remounting
    // this form, so keep the coordinate inputs in sync while preserving other
    // unsaved edits.
    useEffect(() => {
        if (!location) return;
        setXInput(String(location.x));
        setYInput(String(location.y));
    }, [location]);

    const handleSubmit = async (event) => {
        event.preventDefault();

        const x = Number.parseFloat(xInput);
        const y = Number.parseFloat(yInput);

        if (!Number.isFinite(x) || !Number.isFinite(y)) {
            setError(t("locationEditor.errors.coordinatesInvalid"));
            return;
        }

        setError("");
        setSaving(true);

        try {
            await onSave({
                type,
                name,
                description_md: descriptionMd,
                x,
                y,
            });
        } catch {
            // The page-level handler reports the error via toast.
        } finally {
            setSaving(false);
        }
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
                    <Label htmlFor={`${fieldId}-name`} className="mb-1 block">
                        {t("locationEditor.fields.name")}
                    </Label>
                    <Input
                        id={`${fieldId}-name`}
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        required
                    />
                </div>

                <div>
                    <Label htmlFor={`${fieldId}-type`} className="mb-1 block">
                        {t("locationEditor.fields.type")}
                    </Label>
                    <Input
                        id={`${fieldId}-type`}
                        value={type}
                        onChange={(event) => setType(event.target.value)}
                        required
                    />
                </div>

                <div>
                    <div className="mb-1 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <Label htmlFor={`${fieldId}-article`}>
                            {t("locationEditor.fields.article")}
                        </Label>

                        <SegmentedControl
                            size="sm"
                            label={t("locationEditor.tabs.label")}
                            value={tab}
                            onChange={setTab}
                            className="self-start"
                            options={[
                                { value: "edit", label: t("locationEditor.tabs.edit") },
                                {
                                    value: "preview",
                                    label: t("locationEditor.tabs.preview"),
                                },
                            ]}
                        />
                    </div>

                    {tab === "edit" ? (
                        <Textarea
                            id={`${fieldId}-article`}
                            value={descriptionMd}
                            onChange={(event) => setDescriptionMd(event.target.value)}
                            rows={10}
                            placeholder={t("locationEditor.placeholders.article")}
                        />
                    ) : (
                        <div className="min-h-[10rem] rounded border border-border-default bg-surface-panel/60 p-3">
                            <MarkdownRenderer content={descriptionMd} />
                        </div>
                    )}
                </div>

                <fieldset className="space-y-2">
                    <legend className="mb-1 block font-medium text-text-heading">
                        {t("locationEditor.fields.coordinates")}
                    </legend>

                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <div>
                            <Label htmlFor={`${fieldId}-x`} className="mb-1 block" variant="muted">
                                {t("locationEditor.fields.x")}
                            </Label>
                            <Input
                                id={`${fieldId}-x`}
                                type="number"
                                inputMode="decimal"
                                step="any"
                                value={xInput}
                                onChange={(event) => setXInput(event.target.value)}
                            />
                        </div>

                        <div>
                            <Label htmlFor={`${fieldId}-y`} className="mb-1 block" variant="muted">
                                {t("locationEditor.fields.y")}
                            </Label>
                            <Input
                                id={`${fieldId}-y`}
                                type="number"
                                inputMode="decimal"
                                step="any"
                                value={yInput}
                                onChange={(event) => setYInput(event.target.value)}
                            />
                        </div>
                    </div>

                    <p className="text-xs text-text-muted">
                        {t("locationEditor.hints.coordinates")}
                    </p>
                </fieldset>

                {error && (
                    <p className="text-sm font-medium text-status-error-ink" role="alert">
                        {error}
                    </p>
                )}

                <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:justify-between">
                    <Button type="submit" disabled={saving} className="w-full sm:w-auto">
                        {saving
                            ? t("locationEditor.actions.saving")
                            : location
                              ? t("locationEditor.actions.saveChanges")
                              : t("locationEditor.actions.addLocation")}
                    </Button>

                    <Button
                        type="button"
                        variant="outline"
                        onClick={onCancel}
                        disabled={saving}
                        className="w-full sm:w-auto"
                    >
                        {t("actions.cancel")}
                    </Button>
                </div>
            </form>
        </div>
    );
}
