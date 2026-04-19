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
        return <p className="text-destructive">{error}</p>;
    }

    return (
        <div className="space-y-8 px-8 py-6">
            <div className="bg-surface-panel/95 border border-border-default/40 rounded-lg shadow-md p-8 text-center space-y-4">
                <h1 className="text-5xl font-bold text-text-heading">
                    {t("home.hero.title")}
                </h1>
                <p className="text-xl text-text-heading/80">
                    {t("home.hero.subtitle")}
                </p>
                <Button onClick={handleCreateMap} className="mt-4">
                    {t("home.hero.createMap")}
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>{t("home.catalog.title")}</CardTitle>
                </CardHeader>
                <CardContent>
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
                    <div className="mt-4">
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

            <div className="flex justify-center items-center gap-4 mt-4">
                <Button
                    variant="outline"
                    onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                    disabled={page === 1}
                >
                    {t("pagination.previous")}
                </Button>
                <span className="text-lg text-text-primary">
                    {t("pagination.pageOf", { page, total: totalPages || 1 })}
                </span>
                <Button
                    variant="outline"
                    onClick={() => setPage((prev) => (prev < totalPages ? prev + 1 : prev))}
                    disabled={page >= totalPages}
                >
                    {t("pagination.next")}
                </Button>
            </div>
        </div>
    );
}