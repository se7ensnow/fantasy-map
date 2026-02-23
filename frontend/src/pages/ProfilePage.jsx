import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from "sonner"
import { getMe } from '../api/users';
import { getMyMaps, deleteMap } from '../api/maps';
import { Button } from '../components/ui/button';
import MapList from '../components/MapList';
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";

export default function ProfilePage() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [mapsData, setMapsData] = useState({ items: [], total: 0 });
    const [page, setPage] = useState(1);
    const size = 10;
    const [error, setError] = useState("");

    useEffect(() => {
        async function fetchProfile() {
            try {
                const userData = await getMe();
                setUser(userData);
            } catch (err) {
                setError(err.message || "Failed to load profile");
                console.error(err);
            }
        };

        async function fetchMyMaps() {
            try {
                const data = await getMyMaps(page, size);
                setMapsData(data);
            } catch (err) {
                setError(err.message || "Failed to load owned maps");
                console.error(err);
            }
        };

        fetchProfile();
        fetchMyMaps();
    }, [page]);

    const totalPages = Math.ceil(mapsData.total / size);

    async function handleDeleteMap(mapId) {
        if (window.confirm("Are you sure you want to delete this map?")) {
            try {
                await deleteMap(mapId);
                setMapsData({ items: mapsData.items.filter(map => map.id !== mapId), total: mapsData.total});
                toast.success("Map deleted successfully");
            } catch (err) {
                toast.error(err.message || "Failed to delete map");
                console.error(err);
            }
        }
    };

    const handleEditMap = (mapId) => {
        navigate(`/maps/${mapId}/edit`);
    };

    const handleOpenMap = (mapId) => {
        navigate(`/maps/${mapId}`);
    };

    const handleCreateMap = () => {
        navigate('/maps/new');
    };

    if (error) {
        return <p style={{ color: "red" }}>{error}</p>;
    }

    if (!user) {
        return <p>Loading profile...</p>;
    }

    if (!mapsData) {
        return <p>Loading maps...</p>;
    }

    return (
        <div className="space-y-8 px-8 py-6">
            <h1 className="text-3xl font-bold mb-4">Profile</h1>

            {error && <p className="text-red-500">{error}</p>}
            
            {user && (
                <Card className="bg-amber-50/80 border-amber-700/40 shadow-md max-w-md text-left mr-auto">
                    <CardHeader>
                        <CardTitle>User Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-amber-900">
                        <p><strong>Username:</strong> {user.username}</p>
                        <p><strong>Email:</strong> {user.email}</p>
                        <p><strong>Created at:</strong> {new Date(user.created_at).toLocaleString()}</p>
                    </CardContent>
                </Card>
            )}

            <h2 className="text-2xl font-bold mb-4 text-[#5b7a5b]">My Maps</h2>

            <Button onClick={handleCreateMap} className="mb-4">Create New Map</Button>

            <MapList
                maps={mapsData.items}
                onDelete={handleDeleteMap}
                onEdit={handleEditMap}
                onOpen={handleOpenMap}
                showShare={true}
            />

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