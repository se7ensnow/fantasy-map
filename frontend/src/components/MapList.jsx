import { useTranslation } from "react-i18next";
import { Compass, SearchX } from "lucide-react";

import EmptyState from "@/components/EmptyState";
import MapListItem from "@/components/MapListItem";

export default function MapList({
    maps,
    onDelete,
    onEdit,
    onOpen,
    onTagClick,
    activeTags = [],
    isProfileView = false,
    onClearFilters,
}) {
    const { t } = useTranslation();
    const isEmpty = !maps || maps.length === 0;

    if (isEmpty) {
        const isFiltered = Boolean(onClearFilters);

        return (
            <EmptyState
                icon={isFiltered ? SearchX : Compass}
                title={
                    isFiltered
                        ? t("mapList.noMatchesTitle")
                        : isProfileView
                          ? t("mapList.emptyProfileTitle")
                          : t("mapList.emptyTitle")
                }
                description={
                    isFiltered
                        ? t("mapList.noMatchesDescription")
                        : isProfileView
                          ? t("mapList.emptyProfileDescription")
                          : t("mapList.emptyDescription")
                }
                action={
                    isFiltered ? (
                        <button
                            type="button"
                            onClick={onClearFilters}
                            className="text-sm font-semibold text-accent-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/50"
                        >
                            {t("catalogFilters.clear")}
                        </button>
                    ) : null
                }
            />
        );
    }

    return (
        <div className="space-y-3 md:space-y-4" role="list">
            {maps.map((map) => (
                <MapListItem
                    key={map.id}
                    map={map}
                    onOpen={onOpen ? () => onOpen(map.id) : undefined}
                    onDelete={onDelete ? () => onDelete(map.id) : undefined}
                    onEdit={onEdit ? () => onEdit(map.id) : undefined}
                    onTagClick={onTagClick}
                    activeTags={activeTags}
                    isProfileView={isProfileView}
                />
            ))}
        </div>
    );
}
