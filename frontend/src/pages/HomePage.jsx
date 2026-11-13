import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { getAllMaps } from "@/api/maps";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import CatalogFilters from "@/components/CatalogFilters";
import ErrorState from "@/components/ErrorState";
import LayoutContainer from "@/components/LayoutContainer";
import LoadingState from "@/components/LoadingState";
import MapList from "@/components/MapList";
import Pagination from "@/components/Pagination";
import { useAsyncData } from "@/hooks/useAsyncData";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 10;

export default function HomePage() {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [page, setPage] = useState(1);
    const [query, setQuery] = useState("");
    const [selectedTags, setSelectedTags] = useState([]);
    const [tagsMode, setTagsMode] = useState("any");
    const [tagQuery, setTagQuery] = useState("");

    const debouncedQuery = useDebouncedValue(query, 300);
    const tagsParam = selectedTags.join(",");

    const maps = useAsyncData(
        () =>
            getAllMaps(page, PAGE_SIZE, {
                q: debouncedQuery,
                tags: tagsParam,
                tagsMode,
            }),
        `${page}|${debouncedQuery}|${tagsMode}|${tagsParam}`
    );

    const toggleTag = (name) => {
        setSelectedTags((previous) =>
            previous.includes(name)
                ? previous.filter((item) => item !== name)
                : [...previous, name]
        );
        setPage(1);
    };

    const handleQueryChange = (value) => {
        setQuery(value);
        setPage(1);
    };

    const handleTagsModeChange = (value) => {
        setTagsMode(value);
        setPage(1);
    };

    const handleClear = () => {
        setQuery("");
        setTagQuery("");
        setSelectedTags([]);
        setPage(1);
    };

    const mapsData = maps.data ?? { items: [], total: 0 };
    const totalPages = Math.ceil(mapsData.total / PAGE_SIZE);
    const isFiltered = Boolean(query || tagQuery || selectedTags.length);

    return (
        <LayoutContainer>
            <div className="space-y-3 px-1 py-3 md:space-y-8 md:px-8 md:py-6">
                <section className="space-y-3 rounded-lg border border-border-default/40 bg-surface-panel/95 p-4 text-center shadow-md md:space-y-4 md:p-8">
                    <h1 className="text-3xl font-bold text-text-heading md:text-5xl">
                        {t("home.hero.title")}
                    </h1>
                    <p className="text-base text-text-heading/80 md:text-xl">
                        {t("home.hero.subtitle")}
                    </p>
                    <Button
                        onClick={() => navigate("/maps/new")}
                        className="w-full md:mt-4 md:w-auto"
                    >
                        {t("home.hero.createMap")}
                    </Button>
                </section>

                <Card className="overflow-hidden">
                    <CardHeader className="px-3 pb-2 pt-3 md:px-6 md:pb-6 md:pt-6">
                        <CardTitle>{t("home.catalog.title")}</CardTitle>
                    </CardHeader>

                    <CardContent className="p-2 md:p-6">
                        <CatalogFilters
                            query={query}
                            onQueryChange={handleQueryChange}
                            selectedTags={selectedTags}
                            onToggleTag={toggleTag}
                            tagsMode={tagsMode}
                            onTagsModeChange={handleTagsModeChange}
                            tagQuery={tagQuery}
                            onTagQueryChange={setTagQuery}
                            onClear={handleClear}
                        />

                        <div
                            className={cn(
                                "mt-3 transition-opacity md:mt-4",
                                maps.loading && maps.data && "opacity-60"
                            )}
                            aria-busy={maps.loading}
                        >
                            {maps.loading && !maps.data && (
                                <LoadingState
                                    compact
                                    label={t("home.loadingMaps")}
                                />
                            )}

                            {maps.error && (
                                <ErrorState
                                    className="max-w-none"
                                    title={t("home.errors.failedToLoadMaps")}
                                    message={maps.error.message}
                                    onRetry={maps.reload}
                                    retryLabel={t("actions.retry")}
                                />
                            )}

                            {!maps.error && maps.data && (
                                <MapList
                                    maps={mapsData.items}
                                    onOpen={(mapId) => navigate(`/maps/${mapId}`)}
                                    onTagClick={toggleTag}
                                    activeTags={selectedTags}
                                    isProfileView={false}
                                    onClearFilters={isFiltered ? handleClear : undefined}
                                />
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Pagination
                    page={page}
                    totalPages={totalPages}
                    onChange={setPage}
                />
            </div>
        </LayoutContainer>
    );
}
