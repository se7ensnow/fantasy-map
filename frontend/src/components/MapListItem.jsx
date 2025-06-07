import React from "react";
import { Button } from "@/components/ui/button";

export default function MapListItem({ map, onDelete, onEdit, onOpen}) {
    return (
        <div className="rounded-lg border-2 border-[#c9aa71] bg-[#fcf7e9] shadow-md p-4 hover:shadow-lg transition-shadow duration-300">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-xl font-bold text-[#5b7a5b] mb-1">{map.title}</h3>
                    <p className="text-sm text-[#3a2f1b]">{map.description}</p>
                </div>
                <div className="flex space-x-2">
                    <Button onClick={onOpen}>View</Button>
                    {onEdit && <Button variant="secondary" onClick={onEdit}>Edit</Button>}
                    {onDelete && <Button variant="destructive" onClick={onDelete}>Delete</Button>}
                </div>
            </div>
        </div>
    );
}