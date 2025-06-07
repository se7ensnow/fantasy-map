import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getMapById } from "@/api/maps";
import { getLocations } from "@/api/locations";
import MapViewer from "../components/MapViewer";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/ui/card";

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
        return <p className="text-red-600 p-4">{error}</p>;
    }

    if (!map) {
        return <p className="p-4">Loading map...</p>;
    }

    return (
        <div className="space-y-8 p-8">
            <Card className="relative bg-amber-50/80 border border-amber-700/40 rounded-lg shadow-md">
                <CardHeader>
                    <CardTitle className="text-4xl font-bold text-amber-900">{map.title}</CardTitle>
                </CardHeader>
                <CardContent className="prose text-amber-800">
                    {map.description || "No description provided."}
                </CardContent>
                <div className="absolute bottom-2 right-4 text-sm text-amber-700/80 italic">
                    Author: {map.owner_username || "Unknown"}
                </div>
            </Card>
            
            <Card>
                <CardHeader>
                    <CardTitle>Map</CardTitle>
                </CardHeader>
                <CardContent>
                    <MapViewer map={map} locations={locations} />
                </CardContent>
            </Card>
        </div>
    );
}