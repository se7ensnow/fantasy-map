import React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function NotFoundPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();

    return (
        <div className="flex min-h-[70vh] items-center justify-center px-2 py-6 md:px-6 md:py-12">
            <div className="w-full max-w-3xl rounded-2xl border border-border-emphasis bg-surface-panel/85 p-5 text-center shadow-card backdrop-blur-sm md:max-w-6xl md:p-10">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-text-muted md:mb-3 md:text-sm md:tracking-[0.2em]">
                    404
                </p>

                <h1 className="text-3xl font-bold text-text-heading md:text-5xl">
                    {t("notFound.title")}
                </h1>

                <div className="mx-auto mt-4 max-w-2xl space-y-3 md:mt-5 md:max-w-4xl md:space-y-4">
                    <p className="text-sm leading-relaxed text-text-primary md:text-lg">
                        {t("notFound.descriptionLine1")}
                        <br />
                        {t("notFound.descriptionLine2")}
                    </p>

                    <p className="text-sm italic text-text-muted md:text-base">
                        {t("notFound.footerNote")}
                    </p>
                </div>

                <div className="mt-6 flex justify-center md:mt-8">
                    <Button onClick={() => navigate("/")} className="w-full sm:w-auto">
                        {t("notFound.returnToCatalog")}
                    </Button>
                </div>
            </div>
        </div>
    );
}