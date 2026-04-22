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
                if (cancelled) return;

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
        return (
            <div className="p-2 md:p-8">
                <Card className="max-w-2xl border-status-error-border bg-status-error-border/10">
                    <CardHeader>
                        <CardTitle className="text-status-error-ink">
                            {t("mapPage.errors.unableToOpen")}
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
        return <p className="p-2 text-text-primary md:p-4">{t("mapPage.loading")}</p>;
    }

    const tagNames = (map.tags || [])
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));

    return (
        <div className="space-y-3 p-2 md:space-y-8 md:p-8">
            <Card className="relative rounded-lg border border-border-emphasis bg-surface-panel/80 shadow-md">
                <CardHeader className="px-3 pb-2 pt-3 md:px-6 md:pb-6 md:pt-6">
                    <CardTitle className="text-2xl font-bold text-text-heading md:text-4xl">
                        {map.title}
                    </CardTitle>
                </CardHeader>

                <CardContent className="px-3 pb-3 prose max-w-none text-sm text-text-heading md:px-6 md:pb-6 md:text-base">
                    {map.description || t("mapPage.noDescription")}

                    {tagNames.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                            {tagNames.map((name) => (
                                <Badge key={name}>{name}</Badge>
                            ))}
                        </div>
                    )}
                </CardContent>

                <div className="px-3 pb-3 pt-1 text-xs italic text-text-muted/80 md:absolute md:bottom-2 md:right-4 md:px-0 md:pb-0 md:text-sm">
                    {t("mapPage.author")}: {map.owner_username || t("mapPage.unknown")}
                </div>
            </Card>

            <Card className="overflow-hidden">
                <CardHeader className="px-2 pb-2 pt-2 md:px-6 md:pb-6 md:pt-6">
                    <CardTitle className="text-text-heading">
                        {t("mapPage.mapSectionTitle")}
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-1 md:p-6">
                    <MapViewer map={map} locations={locations} />
                </CardContent>
            </Card>
        </div>
    );
}