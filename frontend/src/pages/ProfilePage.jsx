import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { getMe } from "../api/users";
import { getMyMaps, deleteMap } from "../api/maps";
import { Button } from "../components/ui/button";
import MapList from "../components/MapList";
import LayoutContainer from "@/components/LayoutContainer";
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
            <LayoutContainer>
                <div className="px-0 py-3 md:px-0 md:py-6">
                    <Card className="max-w-xl border-status-error-border bg-status-error-border/10">
                        <CardHeader className="px-4 pb-3 pt-4 md:px-6 md:pb-6 md:pt-6">
                            <CardTitle className="text-status-error-ink">
                                {t("profile.errors.failedToLoadProfile")}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-4 pb-4 text-status-error-ink md:px-6 md:pb-6">
                            {error}
                        </CardContent>
                    </Card>
                </div>
            </LayoutContainer>
        );
    }

    if (!user) {
        return <p className="p-3 text-text-primary md:p-4">{t("profile.loading")}</p>;
    }

    return (
        <LayoutContainer>
            <div className="space-y-4 py-3 md:space-y-8 md:py-6">
                <section className="space-y-3">
                    <h1 className="text-2xl font-bold text-text-heading md:text-3xl">
                        {t("profile.title")}
                    </h1>

                    <Card
                        variant="surface"
                        className="w-full max-w-2xl bg-surface-panel/80 text-left shadow-md"
                    >
                        <CardHeader className="px-3 pb-2 pt-3 md:px-6 md:pb-6 md:pt-6">
                            <CardTitle>{t("profile.userInformation")}</CardTitle>
                        </CardHeader>

                        <CardContent className="space-y-2 px-3 pb-3 text-sm text-text-heading md:px-6 md:pb-6 md:text-base">
                            <p className="break-words">
                                <strong>{t("profile.fields.username")}:</strong> {user.username}
                            </p>

                            <p className="break-words">
                                <strong>{t("profile.fields.email")}:</strong> {user.email}
                            </p>

                            <p className="break-words">
                                <strong>{t("profile.fields.createdAt")}:</strong>{" "}
                                {new Date(user.created_at).toLocaleString()}
                            </p>
                        </CardContent>
                    </Card>
                </section>

                <section className="space-y-3">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <h2 className="text-xl font-bold text-accent-primary md:text-2xl">
                            {t("profile.myMaps")}
                        </h2>

                        <Button onClick={handleCreateMap} className="w-full md:w-auto">
                            {t("profile.createNewMap")}
                        </Button>
                    </div>

                    <MapList
                        maps={mapsData.items}
                        onDelete={handleDeleteMap}
                        onEdit={handleEditMap}
                        onOpen={handleOpenMap}
                        isProfileView={true}
                    />
                </section>

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
                        onClick={() =>
                            setPage((prev) => (prev < totalPages ? prev + 1 : prev))
                        }
                        disabled={page >= totalPages}
                        className="min-w-[96px] md:min-w-[110px]"
                    >
                        {t("pagination.next")}
                    </Button>
                </div>
            </div>
        </LayoutContainer>
    );
}