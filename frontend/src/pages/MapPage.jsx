import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getMapById } from "@/api/maps";
import { getLocations } from "@/api/locations";
import { isApiError } from "@/api/errors";
import MapViewer from "../components/MapViewer";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function MapPage() {
    const { map_id } = useParams();
    const navigate = useNavigate();

    const [map, setMap] = useState(null);
    const [locations, setLocations] = useState([]);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;

        async function fetchData() {
            try {
                setError("");

                const mapData = await getMapById(map_id);
                if (cancelled) return;
                setMap(mapData);

                const locationsData = await getLocations(map_id);
                if (cancelled) return;
                setLocations(locationsData);
            } catch (err) {
                if (cancelled) return;

                if (isApiError(err)) {
                    if (err.code === "NOT_FOUND" || err.code === "VALIDATION_ERROR") {
                        setError("MAP_NOT_FOUND");
                        return;
                    }
                }

                setError(err.message || "Failed to load map");
                console.error(err);
            }
        }

        fetchData();

        return () => {
            cancelled = true;
        };
    }, [map_id]);

    if (error === "MAP_NOT_FOUND") {
        return (
            <div className="flex min-h-[70vh] items-center justify-center px-6 py-12">
                <div className="w-full max-w-3xl rounded-2xl border border-border-emphasis bg-surface-panel/85 p-10 text-center shadow-card backdrop-blur-sm">
                    <h1 className="text-4xl font-bold text-text-heading">
                        We couldn’t find this map
                    </h1>
        
                    <div className="mx-auto mt-5 max-w-3xl space-y-3">
                        <p className="text-lg leading-relaxed text-text-primary">
                            It seems this map does not exist, the link is invalid, or it is no longer available.
                        </p>
        
                        <p className="text-text-muted">
                            Sorry about that.
                        </p>
                    </div>
        
                    <div className="mt-8">
                        <Button onClick={() => navigate("/")}>
                            Return to Catalog
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8">
                <Card className="max-w-2xl border-status-error-border bg-status-error-border/10">
                    <CardHeader>
                        <CardTitle className="text-status-error-ink">
                            Unable to open map
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-status-error-ink">
                        {error}
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!map) {
        return <p className="p-4 text-text-primary">Loading map...</p>;
    }

    const tagNames = (map.tags || [])
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));

    return (
        <div className="space-y-8 p-8">
            <Card className="relative rounded-lg border border-border-emphasis bg-surface-panel/80 shadow-md">
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

                <div className="absolute bottom-2 right-4 text-sm italic text-text-muted/80">
                    Author: {map.owner_username || "Unknown"}
                </div>
            </Card>

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