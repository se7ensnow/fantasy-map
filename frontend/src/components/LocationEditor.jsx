import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import MarkdownRenderer from "@/components/MarkdownRenderer";

export default function LocationEditor({ location, coords, onSave, onCancel }) {
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
        <div className="bg-surface-paper/85 border border-border-default backdrop-blur-sm rounded p-4 space-y-3 shadow text-text-primary">
            <h2 className="text-xl font-bold mb-2 text-text-heading">
                {location ? "Edit Location" : "Add Location"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                    <label className="block mb-1 font-medium text-text-heading">Name:</label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} required />
                </div>

                <div>
                    <label className="block mb-1 font-medium text-text-heading">Type:</label>
                    <Input value={type} onChange={(e) => setType(e.target.value)} required />
                </div>

                {/* Markdown editor */}
                <div>
                    <div className="flex items-center justify-between mb-1">
                        <label className="block font-medium text-text-heading">Article (Markdown):</label>
                        <div className="inline-flex rounded border border-border-default overflow-hidden">
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
                                Edit
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
                                Preview
                            </button>
                        </div>
                    </div>

                    {tab === "edit" ? (
                        <Textarea
                            value={descriptionMd}
                            onChange={(e) => setDescriptionMd(e.target.value)}
                            rows={12}
                            placeholder={`# Title\n\nWrite your location article...\n\n- lists\n- **bold**\n- [link](https://...)`}
                        />
                    ) : (
                        <div className="border border-border-default rounded p-3 bg-surface-panel/60">
                            <MarkdownRenderer content={descriptionMd} />
                        </div>
                    )}
                </div>

                <div className="flex space-x-2">
                    <div className="flex-1">
                        <label className="block mb-1 font-medium text-text-heading">X:</label>
                        <Input
                            type="number"
                            value={x}
                            onChange={(e) => setX(parseFloat(e.target.value))}
                        />
                    </div>
                    <div className="flex-1">
                        <label className="block mb-1 font-medium text-text-heading">Y:</label>
                        <Input
                            type="number"
                            value={y}
                            onChange={(e) => setY(parseFloat(e.target.value))}
                        />
                    </div>
                </div>

                <div className="flex justify-between mt-4">
                    <Button type="submit">
                        {location ? "Save Changes" : "Add Location"}
                    </Button>
                    <Button type="button" variant="outline" onClick={onCancel}>
                        Cancel
                    </Button>
                </div>
            </form>
        </div>
    );
}