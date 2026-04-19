import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { getMe } from "../api/users";
import { getMyMaps, deleteMap } from "../api/maps";
import { Button } from "../components/ui/button";
import MapList from "../components/MapList";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { isInvalidAuthError } from "@/api/errors";
import { handleInvalidAuth } from "@/lib/auth_session";

export default function ProfilePage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [mapsData, setMapsData] = useState({ items: [], total: 0 });
    const [page, setPage] = useState(1);
    const size = 10;
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;

        async function fetchProfilePage() {
            try {
                setError("");

                const [userData, maps] = await Promise.all([
                    getMe(),
                    getMyMaps(page, size),
                ]);

                if (cancelled) return;

                setUser(userData);
                setMapsData(maps);
            } catch (err) {
                if (cancelled) return;

                if (isInvalidAuthError(err)) {
                    handleInvalidAuth(navigate, toast);
                    return;
                }

                setError(err.message || t("profile.errors.failedToLoadProfile"));
                console.error(err);
            }
        }

        fetchProfilePage();

        return () => {
            cancelled = true;
        };
    }, [page, navigate, t]);

    const totalPages = Math.ceil(mapsData.total / size);

    async function handleDeleteMap(mapId) {
        try {
            await deleteMap(mapId);
            setMapsData((prev) => ({
                items: prev.items.filter((map) => map.id !== mapId),
                total: prev.total,
            }));
            toast.success(t("profile.toasts.mapDeleted"));
        } catch (err) {
            if (isInvalidAuthError(err)) {
                handleInvalidAuth(navigate, toast);
                return;
            }

            toast.error(err.message || t("profile.errors.failedToDeleteMap"));
            console.error(err);
        }
    }

    const handleEditMap = (mapId) => {
        navigate(`/maps/${mapId}/edit`);
    };

    const handleOpenMap = (mapId) => {
        navigate(`/maps/${mapId}`);
    };

    const handleCreateMap = () => {
        navigate("/maps/new");
    };

    if (error) {
        return (
            <div className="px-8 py-6">
                <Card className="max-w-xl border-status-error-border bg-status-error-border/10">
                    <CardHeader>
                        <CardTitle className="text-status-error-ink">
                            {t("profile.errors.failedToLoadProfile")}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-status-error-ink">
                        {error}
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!user) {
        return <p className="p-4 text-text-primary">{t("profile.loading")}</p>;
    }

    return (
        <div className="space-y-8 px-8 py-6">
            <h1 className="text-3xl font-bold mb-4 text-text-heading">
                {t("profile.title")}
            </h1>

            <Card
                variant="surface"
                className="max-w-md text-left mr-auto shadow-md bg-surface-panel/80"
            >
                <CardHeader>
                    <CardTitle>{t("profile.userInformation")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-text-heading">
                    <p>
                        <strong>{t("profile.fields.username")}:</strong> {user.username}
                    </p>
                    <p>
                        <strong>{t("profile.fields.email")}:</strong> {user.email}
                    </p>
                    <p>
                        <strong>{t("profile.fields.createdAt")}:</strong>{" "}
                        {new Date(user.created_at).toLocaleString()}
                    </p>
                </CardContent>
            </Card>

            <h2 className="text-2xl font-bold mb-4 text-accent-primary">
                {t("profile.myMaps")}
            </h2>

            <Button onClick={handleCreateMap} className="mb-4">
                {t("profile.createNewMap")}
            </Button>

            <MapList
                maps={mapsData.items}
                onDelete={handleDeleteMap}
                onEdit={handleEditMap}
                onOpen={handleOpenMap}
                isProfileView={true}
            />

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
                    onClick={() =>
                        setPage((prev) => (prev < totalPages ? prev + 1 : prev))
                    }
                    disabled={page >= totalPages}
                >
                    {t("pagination.next")}
                </Button>
            </div>
        </div>
    );
}