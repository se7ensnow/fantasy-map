import { MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";

import ScrollPanel from "@/components/ScrollPanel";
import LocationDetails from "@/components/LocationDetails";
import EmptyState from "@/components/EmptyState";

export default function LocationPanel({ location, title, className = "" }) {
    const { t } = useTranslation();

    return (
        <ScrollPanel
            title={title}
            resetKey={location?.id ?? "empty"}
            className={className}
        >
            {location ? (
                <LocationDetails location={location} />
            ) : (
                <EmptyState
                    icon={MapPin}
                    description={t("mapViewer.selectLocation")}
                />
            )}
        </ScrollPanel>
    );
}
