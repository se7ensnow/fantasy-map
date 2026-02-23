import React from "react";
import MapListItem from "./MapListItem";

export default function MapList({ maps, onDelete, onEdit, onOpen, onTagClick, activeTags = [], showShare = false }) {
    if (!maps || maps.length === 0) {
        return <p className="text-center text-[#3a2f1b]">No maps found.</p>;
    }

    return (
        <div className="space-y-4">
            {maps.map((map) => (
                <MapListItem
                    key={map.id}
                    map={map}
                    onOpen={() => onOpen(map.id)}
                    onDelete={onDelete ? () => onDelete(map.id) : undefined}
                    onEdit={onEdit ? () => onEdit(map.id) : undefined}
                    showShare={showShare}
                    onTagClick={onTagClick}
                    activeTags={activeTags}
                />
            ))}
        </div>
    );
}