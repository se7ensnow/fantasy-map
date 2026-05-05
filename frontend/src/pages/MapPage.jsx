import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { getMapById } from "@/api/maps";
import { getLocations } from "@/api/locations";
import { isApiError } from "@/api/errors";
import MapViewer from "../components/MapViewer";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function MapPage() {
    const { t } = useTranslation();
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

                if (mapData.status !== "ready") {
                    setError("MAP_NOT_FOUND");
                    return;
                }

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

                setError(err.message || t("mapPage.errors.failedToLoadMap"));
                console.error(err);
            }
        }

        fetchData();

        return () => {
            cancelled = true;
        };
    }, [map_id, t]);

    if (error === "MAP_NOT_FOUND") {
        return (
            <div className="flex min-h-[70vh] items-center justify-center px-2 py-5 md:px-6 md:py-12">
                <div className="w-full max-w-3xl rounded-2xl border border-border-emphasis bg-surface-panel/85 p-4 text-center shadow-card backdrop-blur-sm md:p-10">
                    <h1 className="text-3xl font-bold text-text-heading md:text-4xl">
                        {t("mapPage.notFound.title")}
                    </h1>

                    <div className="mx-auto mt-4 max-w-3xl space-y-3 md:mt-5">
                        <p className="text-base leading-relaxed text-text-primary md:text-lg">
                            {t("mapPage.notFound.description")}
                        </p>

                        <p className="text-text-muted italic">
                            {t("mapPage.notFound.note")}
                        </p>
                    </div>

                    <div className="mt-6 md:mt-8">
                        <Button onClick={() => navigate("/")}>
                            {t("mapPage.notFound.returnToCatalog")}
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

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