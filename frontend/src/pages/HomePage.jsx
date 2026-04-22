import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getAllMaps, listTags } from "../api/maps";
import { useNavigate } from "react-router-dom";
import MapList from "../components/MapList";
import CatalogFilters from "@/components/CatalogFilters";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

export default function HomePage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [mapsData, setMapsData] = useState({ items: [], total: 0 });
    const [page, setPage] = useState(1);
    const [query, setQuery] = useState("");
    const size = 10;
    const [error, setError] = useState("");
    const [availableTags, setAvailableTags] = useState([]);
    const [selectedTags, setSelectedTags] = useState([]);
    const [tagsMode, setTagsMode] = useState("any");
    const [tagQuery, setTagQuery] = useState("");

    const debouncedQuery = useDebouncedValue(query, 300);

    const handleClear = () => {
        setQuery("");
        setTagQuery("");
        setSelectedTags([]);
        setPage(1);
    };

    const toggleTag = (name) => {
        setSelectedTags((prev) =>
            prev.includes(name) ? prev.filter((t) => t !== name) : [...prev, name]
        );
    };

    const handleTagClick = (tag) => {
        toggleTag(tag);
        setPage(1);
    };

    useEffect(() => {
        async function fetchTags() {
            try {
                const tags = await listTags("", 20);
                setAvailableTags(tags);
            } catch (err) {
                console.error(t("home.errors.failedToLoadTags"), err);
            }
        }

        fetchTags();
    }, [t]);

    useEffect(() => {
        async function fetchMaps() {
            try {
                const mapsData = await getAllMaps(page, size, {
                    q: debouncedQuery,
                    tags: selectedTags.join(","),
                    tagsMode: tagsMode,
                });
                setMapsData(mapsData);
            } catch (err) {
                setError(err.message || t("home.errors.failedToLoadMaps"));
                console.error(err);
            }
        }

        fetchMaps();
    }, [page, debouncedQuery, selectedTags, tagsMode, t]);

    useEffect(() => {
        setPage(1);
    }, [query, selectedTags, tagsMode]);

    const totalPages = Math.ceil(mapsData.total / size);

    const handleOpenMap = (mapId) => {
        navigate(`/maps/${mapId}`);
    };

    const handleCreateMap = () => {
        navigate("/maps/new");
    };

    if (error) {
        return <p className="p-2 text-destructive md:p-4">{error}</p>;
    }

    return (
        <div className="space-y-3 px-1 py-3 md:space-y-8 md:px-8 md:py-6">
            <div className="space-y-3 rounded-lg border border-border-default/40 bg-surface-panel/95 p-4 text-center shadow-md md:space-y-4 md:p-8">
                <h1 className="text-3xl font-bold text-text-heading md:text-5xl">
                    {t("home.hero.title")}
                </h1>
                <p className="text-base text-text-heading/80 md:text-xl">
                    {t("home.hero.subtitle")}
                </p>
                <Button onClick={handleCreateMap} className="w-full md:mt-4 md:w-auto">
                    {t("home.hero.createMap")}
                </Button>
            </div>

            <Card className="overflow-hidden">
                <CardHeader className="px-3 pb-2 pt-3 md:px-6 md:pb-6 md:pt-6">
                    <CardTitle>{t("home.catalog.title")}</CardTitle>
                </CardHeader>
                <CardContent className="p-2 md:p-6">
                    <CatalogFilters
                        query={query}
                        onQueryChange={setQuery}
                        availableTags={availableTags}
                        selectedTags={selectedTags}
                        onToggleTag={toggleTag}
                        tagsMode={tagsMode}
                        onTagsModeChange={setTagsMode}
                        tagQuery={tagQuery}
                        onTagQueryChange={setTagQuery}
                        onClear={handleClear}
                    />

                    <div className="mt-3 md:mt-4">
                        <MapList
                            maps={mapsData.items}
                            onOpen={handleOpenMap}
                            onTagClick={handleTagClick}
                            activeTags={selectedTags}
                            isProfileView={false}
                        />
                    </div>
                </CardContent>
            </Card>

            <div className="mt-3 flex items-center justify-between gap-2 md:mt-4 md:justify-center md:gap-4">
                <Button
                    variant="outline"
                    onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                    disabled={page === 1}
                    className="min-w-[96px] md:min-w-[110px]"
                >
                    {t("pagination.previous")}
                </Button>
                
                <span className="flex-1 text-center text-sm text-text-primary md:flex-none md:text-lg">
                    {t("pagination.pageOf", { page, total: totalPages || 1 })}
                </span>
                
                <Button
                    variant="outline"
                    onClick={() => setPage((prev) => (prev < totalPages ? prev + 1 : prev))}
                    disabled={page >= totalPages}
                    className="min-w-[96px] md:min-w-[110px]"
                >
                    {t("pagination.next")}
                </Button>
            </div>
        </div>
    );
}