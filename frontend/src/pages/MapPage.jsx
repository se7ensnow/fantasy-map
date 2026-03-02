import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getMapById } from "@/api/maps";
import { getLocations } from "@/api/locations";
import MapViewer from "../components/MapViewer";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function MapPage() {
    const { map_id } = useParams();

    const [map, setMap] = useState(null);
    const [locations, setLocations] = useState([]);
    const [error, setError] = useState("");

    useEffect(() => {
        async function fetchData() {
            try {
                const mapData = await getMapById(map_id);
                setMap(mapData);

                const locationsData = await getLocations(map_id);
                setLocations(locationsData);
            } catch (err) {
                setError(err.message || "Failed to load map");
                console.error(err);
            }
        }

        fetchData();
    }, [map_id]);

    if (error) {
        return <p className="text-status-danger p-4">{error}</p>;
    }

    if (!map) {
        return <p className="p-4">Loading map...</p>;
    }

    const tagNames = (map.tags || []).filter(Boolean);

    return (
        <div className="space-y-8 p-8">
            {/* Map info */}
            <Card className="relative bg-surface-panel/80 border border-border-emphasis rounded-lg shadow-md">
                <CardHeader>
                    <CardTitle className="text-4xl font-bold text-text-heading">
                        {map.title}
                    </CardTitle>
                </CardHeader>

                <CardContent className="prose text-text-heading">
                    {map.description || "No description provided."}

                    {tagNames.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                            {tagNames.map((name) => (
                                <Badge key={name}>{name}</Badge>
                            ))}
                        </div>
                    )}
                </CardContent>

                <div className="absolute bottom-2 right-4 text-sm text-text-muted/80 italic">
                    Author: {map.owner_username || "Unknown"}
                </div>
            </Card>

            {/* Map viewer */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-text-heading">Map</CardTitle>
                </CardHeader>
                <CardContent>
                    <MapViewer map={map} locations={locations} />
                </CardContent>
            </Card>
        </div>
    );
}