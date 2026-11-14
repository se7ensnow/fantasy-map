import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";

import { getMapByShareId } from "@/api/maps";
import { getLocations } from "@/api/locations";
import ErrorState from "@/components/ErrorState";
import LoadingState from "@/components/LoadingState";
import MapOverview from "@/components/MapOverview";
import { useAsyncData } from "@/hooks/useAsyncData";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export default function SharedMapPage() {
    const { t } = useTranslation();
    const { share_id } = useParams();

    const { data, error, loading, reload } = useAsyncData(async () => {
        const map = await getMapByShareId(share_id);
        const locations = await getLocations(map.id);
        return { map, locations };
    }, share_id);

    useDocumentTitle(data?.map?.title);

    if (loading) {
        return <LoadingState label={t("mapPage.loading")} />;
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
