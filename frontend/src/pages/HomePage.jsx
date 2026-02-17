import { useEffect, useState } from 'react';
import { getAllMaps, listTags } from '../api/maps';
import { useNavigate } from 'react-router-dom';
import MapList from '../components/MapList';
import CatalogFilters from "@/components/CatalogFilters";
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from "@/components/ui/badge";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

export default function HomePage() {
    const navigate = useNavigate();
    const [mapsData, setMapsData] = useState({ items: [], total: 0 });
    const [page, setPage] = useState(1);
    const [query, setQuery] = useState("");
    const size = 10;
    const [error, setError] = useState("");
    const [availableTags, setAvailableTags] = useState([]);
    const [selectedTags, setSelectedTags] = useState([]);
    const [tagsMode, setTagsMode] = useState("any");

    const debouncedQuery = useDebouncedValue(query, 300);

    const handleClear = () => {
      setQuery("");
      setSelectedTags([]);
      setPage(1);
    };

    const toggleTag = (slug) => {
      setSelectedTags((prev) =>
        prev.includes(slug) ? prev.filter((t) => t !== slug) : [...prev, slug]
      );
    };
    
    useEffect(() => {
      async function fetchTags() {
        try {
          const tags = await listTags("", 20);
          setAvailableTags(tags);
        } catch (err) {
          console.error("Failed to load tags", err);
        }
      }

      fetchTags();
    }, []);

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
                setError(err.message || "Failed to load maps");
                console.error(err);
            }
        }

        fetchMaps();
    }, [page, debouncedQuery, selectedTags, tagsMode]);

    useEffect(() => {
      setPage(1);
    }, [query, selectedTags, tagsMode]);

    const totalPages = Math.ceil(mapsData.total / size);

    const handleOpenMap = (mapId) => {
        navigate(`/maps/${mapId}`);
    };

    const handleCreateMap = () => {
        navigate('/maps/new');
    };

    if (error) {
        return <p className="text-red-500">{error}</p>;
    }

    return (
        <div className="space-y-8 px-8 py-6">
            {/* Hero Section */}
            <div className="bg-[rgba(252,247,233,0.95)] border border-amber-700/40 rounded-lg shadow-md p-8 text-center space-y-4">
                <h1 className="text-5xl font-bold text-amber-900">Fantasy Maps</h1>
                <p className="text-xl text-amber-800">
                    Explore a world of fantasy maps created by the community — or create your own!
                </p>
                <Button onClick={handleCreateMap} className="mt-4">
                    Create New Map
                </Button>
            </div>

            {/* Maps Catalog */}
            <Card>
                <CardHeader>
                    <CardTitle>Maps Catalog</CardTitle>
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
                        onClear={handleClear}
                    />
                    <div className="mt-4">
                        <MapList maps={mapsData.items} onOpen={handleOpenMap} />
                    </div>
                </CardContent>
            </Card>

            {/* Pagination */}
            <div className="flex justify-center items-center gap-4 mt-4">
                <Button
                    variant="outline"
                    onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                    disabled={page === 1}
                >
                    Previous
                </Button>
                <span className="text-lg">
                    Page {page} of {totalPages || 1}
                </span>
                <Button
                    variant="outline"
                    onClick={() => setPage((prev) => (prev < totalPages ? prev + 1 : prev))}
                    disabled={page >= totalPages}
                >
                    Next
                </Button>
            </div>
        </div>
    );
}
