import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function LocationEditor({ location, coords, onSave, onCancel }) {
    const [type, setType] = useState("");
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [x, setX] = useState(0);
    const [y, setY] = useState(0);
    const [metadataJson, setMetadataJson] = useState("{}");

    useEffect(() => {
        if (location) {
            setType(location.type || "");
            setName(location.name || "");
            setDescription(location.description || "");
            setX(location.x || 0);
            setY(location.y || 0);
            setMetadataJson(
                location.metadata_json ? JSON.stringify(location.metadata_json, null, 2) : "{}"
            );
        } else if (coords) {
            setType("");
            setName("");
            setDescription("");
            setX(coords.x || 0);
            setY(coords.y || 0);
            setMetadataJson("{}");
        }
    }, [location, coords]);

    const handleSubmit = (e) => {
        e.preventDefault();

        let metadata = {};
        try {
            metadata = JSON.parse(metadataJson);
        } catch {
            toast.error("Invalid JSON in metadata");
            return;
        }

        const locationData = {
            type,
            name,
            description,
            x,
            y,
            metadata_json: metadata,
        };

        onSave(locationData);
    };

    return (
        <div className="bg-white border border-gray-300 rounded p-4 space-y-3 shadow">
            <h2 className="text-xl font-bold mb-2">{location ? "Edit Location" : "Add Location"}</h2>

            <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                    <label className="block mb-1 font-medium">Name:</label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} required />
                </div>

                <div>
                    <label className="block mb-1 font-medium">Type:</label>
                    <Input value={type} onChange={(e) => setType(e.target.value)} required />
                </div>

                <div>
                    <label className="block mb-1 font-medium">Description:</label>
                    <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
                </div>

                <div className="flex space-x-2">
                    <div className="flex-1">
                        <label className="block mb-1 font-medium">X:</label>
                        <Input type="number" value={x} onChange={(e) => setX(parseFloat(e.target.value))} />
                    </div>
                    <div className="flex-1">
                        <label className="block mb-1 font-medium">Y:</label>
                        <Input type="number" value={y} onChange={(e) => setY(parseFloat(e.target.value))} />
                    </div>
                </div>

                <div>
                    <label className="block mb-1 font-medium">Metadata (JSON):</label>
                    <Textarea
                        value={metadataJson}
                        onChange={(e) => setMetadataJson(e.target.value)}
                        rows={4}
                    />
                </div>

                <div className="flex justify-between mt-4">
                    <Button type="submit">{location ? "Save Changes" : "Add Location"}</Button>
                    <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
                </div>
            </form>
        </div>
    )
}