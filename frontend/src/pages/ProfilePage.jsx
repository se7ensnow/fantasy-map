import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { getMyMaps, deleteMap } from "@/api/maps";
import { getMe } from "@/api/users";
import { isInvalidAuthError } from "@/api/errors";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ErrorState from "@/components/ErrorState";
import LayoutContainer from "@/components/LayoutContainer";
import LoadingState from "@/components/LoadingState";
import MapList from "@/components/MapList";
import Pagination from "@/components/Pagination";
import { useAsyncData } from "@/hooks/useAsyncData";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { handleInvalidAuth } from "@/lib/auth_session";

const PAGE_SIZE = 10;

export default function ProfilePage() {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();

    const [page, setPage] = useState(1);

    const user = useAsyncData(() => getMe(), "me");
    const maps = useAsyncData(
        () => getMyMaps(page, PAGE_SIZE),
        `owned-${page}`
    );

    useDocumentTitle(t("profile.title"));

    useEffect(() => {
        if (isInvalidAuthError(user.error) || isInvalidAuthError(maps.error)) {
            handleInvalidAuth(navigate, toast);
        }
    }, [user.error, maps.error, navigate]);

    const mapsData = maps.data ?? { items: [], total: 0 };
    const totalPages = Math.ceil(mapsData.total / PAGE_SIZE);

    async function handleDeleteMap(mapId) {
        try {
            await deleteMap(mapId);

            const remainingOnPage = mapsData.items.length;

            maps.mutate((previous) => {
                if (!previous) return previous;

                return {
                    ...previous,
                    items: previous.items.filter((map) => map.id !== mapId),
                    total: Math.max(0, previous.total - 1),
                };
            });

            if (remainingOnPage === 1 && page > 1) {
                setPage((current) => Math.max(1, current - 1));
            }

            toast.success(t("profile.toasts.mapDeleted"));
        } catch (error) {
            if (isInvalidAuthError(error)) {
                handleInvalidAuth(navigate, toast);
                return;
            }

            toast.error(error.message || t("profile.errors.failedToDeleteMap"));
            console.error(error);
            throw error;
        }
    }

    if (user.loading && !user.data) {
        return (
            <LayoutContainer>
                <LoadingState label={t("profile.loading")} />
            </LayoutContainer>
        );
    }

    if (user.error) {
        return (
            <LayoutContainer>
                <div className="px-0 py-3 md:px-0 md:py-6">
                    <ErrorState
                        title={t("profile.errors.failedToLoadProfile")}
                        message={user.error.message}
                        onRetry={user.reload}
                        retryLabel={t("actions.retry")}
                    />
                </div>
            </LayoutContainer>
        );
    }

    if (!user.data) return null;

    const createdAt = new Date(user.data.created_at);
    const createdAtLabel = Number.isNaN(createdAt.getTime())
        ? t("mapPage.unknown")
        : createdAt.toLocaleString(i18n.language);

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
                                <strong>{t("profile.fields.username")}:</strong>{" "}
                                {user.data.username}
                            </p>

                            <p className="break-words">
                                <strong>{t("profile.fields.email")}:</strong>{" "}
                                {user.data.email}
                            </p>

                            <p className="break-words">
                                <strong>{t("profile.fields.createdAt")}:</strong>{" "}
                                {createdAtLabel}
                            </p>
                        </CardContent>
                    </Card>
                </section>

                <section className="space-y-3">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <h2 className="text-xl font-bold text-accent-primary md:text-2xl">
                            {t("profile.myMaps")}
                        </h2>

                        <Button
                            onClick={() => navigate("/maps/new")}
                            className="w-full md:w-auto"
                        >
                            {t("profile.createNewMap")}
                        </Button>
                    </div>

                    {maps.loading && !maps.data && (
                        <LoadingState compact label={t("home.loadingMaps")} />
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
                            onDelete={handleDeleteMap}
                            onEdit={(mapId) => navigate(`/maps/${mapId}/edit`)}
                            onOpen={(mapId) => navigate(`/maps/${mapId}`)}
                            isProfileView
                        />
                    )}
                </section>

                <Pagination
                    page={page}
                    totalPages={totalPages}
                    onChange={setPage}
                />
            </div>
        </LayoutContainer>
    );
}
