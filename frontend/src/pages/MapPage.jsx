import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";

import { getMapById } from "@/api/maps";
import { getLocations } from "@/api/locations";
import { isApiError } from "@/api/errors";
import { Button } from "@/components/ui/button";
import ErrorState from "@/components/ErrorState";
import LoadingState from "@/components/LoadingState";
import MapOverview from "@/components/MapOverview";
import { useAsyncData } from "@/hooks/useAsyncData";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

const NOT_FOUND_CODES = new Set(["NOT_FOUND", "VALIDATION_ERROR"]);

export default function MapPage() {
    const { t } = useTranslation();
    const { map_id } = useParams();
    const navigate = useNavigate();

    const { data, error, loading, reload } = useAsyncData(async () => {
        const map = await getMapById(map_id);

        if (map.status !== "ready") {
            return { map, locations: [], notReady: true };
        }

        const locations = await getLocations(map.id);
        return { map, locations, notReady: false };
    }, map_id);

    useDocumentTitle(data?.map?.title);

    if (loading) {
        return <LoadingState label={t("mapPage.loading")} />;
    }

    const notFound =
        Boolean(data?.notReady) ||
        (isApiError(error) && NOT_FOUND_CODES.has(error.code));

    if (notFound) {
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

                        <p className="italic text-text-muted">
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
                <ErrorState
                    title={t("mapPage.errors.unableToOpen")}
                    message={error.message}
                    onRetry={reload}
                    retryLabel={t("actions.retry")}
                />
            </div>
        );
    }

    if (!data?.map) return null;

    return <MapOverview map={data.map} locations={data.locations} />;
}
