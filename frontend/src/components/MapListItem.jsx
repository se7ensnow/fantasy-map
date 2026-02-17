import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function MapListItem({ map, onDelete, onEdit, onOpen}) {
    const tagNames = (map.tags || []).map(t => t?.name).filter(Boolean);
    const shownTags = tagNames.slice(0, 3);
    const restCount = tagNames.length - shownTags.length;
    return (
        <div className="rounded-lg border-2 border-[#c9aa71] bg-[#fcf7e9] shadow-md p-4 hover:shadow-lg transition-shadow duration-300">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-xl font-bold text-[#5b7a5b] mb-1">{map.title}</h3>
                    <p className="text-sm text-[#3a2f1b]">{map.description}</p>
                    {tagNames.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {shownTags.map((name) => (
                          <Badge key={name}>
                            {name}
                          </Badge>
                        ))}
                    
                        {restCount > 0 && (
                          <Badge>
                            +{restCount}
                          </Badge>
                        )}
                      </div>
                    )}
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