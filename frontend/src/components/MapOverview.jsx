import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import MapViewer from "@/components/MapViewer";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import { sortTags } from "@/lib/tags";

/** Header + viewer card shared by public map and shared-link pages. */
export default function MapOverview({ map, locations }) {
    const { t } = useTranslation();
    const tags = sortTags((map.tags || []).filter(Boolean));

    return (
        <div className="space-y-3 p-2 md:space-y-8 md:p-8">
            <Card className="relative rounded-lg border border-border-emphasis bg-surface-panel/80 shadow-md">
                <CardHeader className="px-3 pb-2 pt-3 md:px-6 md:pb-6 md:pt-6">
                    <CardTitle className="text-2xl font-bold text-text-heading md:text-4xl">
                        {map.title}
                    </CardTitle>
                </CardHeader>

                <CardContent className="prose max-w-none px-3 pb-3 text-sm text-text-heading md:px-6 md:pb-6 md:text-base">
                    {map.description ? (
                        <MarkdownRenderer content={map.description} />
                    ) : (
                        t("mapPage.noDescription")
                    )}

                    {tags.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                            {tags.map((name) => (
                                <Badge key={name}>{name}</Badge>
                            ))}
                        </div>
                    )}
                </CardContent>

                <div className="px-3 pb-3 pt-1 text-xs italic text-text-muted/80 md:absolute md:bottom-2 md:right-4 md:px-0 md:pb-0 md:text-sm">
                    {t("mapPage.author")}: {map.owner_username || t("mapPage.unknown")}
                </div>
            </Card>

            <Card className="overflow-hidden">
                <CardHeader className="px-2 pb-2 pt-2 md:px-6 md:pb-6 md:pt-6">
                    <CardTitle className="text-text-heading">
                        {t("mapPage.mapSectionTitle")}
                    </CardTitle>
                </CardHeader>

                <CardContent className="p-1 md:p-6">
                    <MapViewer map={map} locations={locations} />
                </CardContent>
            </Card>
        </div>
    );
}
