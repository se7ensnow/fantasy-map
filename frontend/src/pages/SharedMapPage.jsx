import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { toast } from "sonner";

import { getMapByShareId } from "@/api/maps";
import { getLocations } from "@/api/locations";
import MapViewer from "@/components/MapViewer";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function SharedMapPage() {
    const { t } = useTranslation();
    const { share_id } = useParams();

    const [map, setMap] = useState(null);
    const [locations, setLocations] = useState([]);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;

        async function fetchData() {
            try {
                setError("");
                const mapData = await getMapByShareId(share_id);
                if (cancelled) return;
                setMap(mapData);

                const locationsData = await getLocations(mapData.id);
                if (cancelled) return;
                setLocations(locationsData);
            } catch (e) {
                const msg = e.message || t("mapPage.errors.failedToLoadMap");
                setError(msg);
                toast.error(msg);
            }
        }

        if (share_id) fetchData();

        return () => {
            cancelled = true;
        };
    }, [share_id, t]);

    if (error) {
        return <p className="text-status-danger p-4">{error}</p>;
    }

    if (!map) {
        return <p className="p-4">{t("mapPage.loading")}</p>;
    }

    const tagNames = (map.tags || []).filter(Boolean);

    return (
        <div className="space-y-8 p-8">
            <Card className="relative bg-surface-panel/80 border border-border-emphasis rounded-lg shadow-md">
                <CardHeader>
                    <CardTitle className="text-4xl font-bold text-text-heading">
                        {map.title}
                    </CardTitle>
                </CardHeader>

                <CardContent className="prose text-text-heading">
                    {map.description || t("mapPage.noDescription")}

                    {tagNames.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                            {tagNames.map((name) => (
                                <Badge key={name}>{name}</Badge>
                            ))}
                        </div>
                    )}
                </CardContent>

                <div className="absolute bottom-2 right-4 text-sm text-text-link/80 italic">
                    {t("mapPage.author")}: {map.owner_username || t("mapPage.unknown")}
                </div>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-text-heading">
                        {t("mapPage.mapSectionTitle")}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <MapViewer map={map} locations={locations} />
                </CardContent>
            </Card>
        </div>
    );
}