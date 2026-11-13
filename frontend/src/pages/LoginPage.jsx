import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { login } from "@/api/auth";
import AuthForm from "@/components/AuthForm";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

function getRedirectTarget(state) {
    const from = state?.from;
    return typeof from === "string" && from.startsWith("/") ? from : "/";
}

export default function LoginPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const [errorMessage, setErrorMessage] = useState("");

    useDocumentTitle(t("login.title"));

    const handleSubmit = async ({ username, password }) => {
        try {
            setErrorMessage("");
            await login(username, password);
            toast.success(t("login.toasts.success"));
            navigate(getRedirectTarget(location.state), { replace: true });
        } catch (error) {
            setErrorMessage(error.message || t("login.errors.failed"));
            console.error(error);
        }
    };

    return (
        <div className="flex min-h-[70vh] items-center justify-center px-2 py-4 text-text-primary md:px-6 md:py-8">
            <div className="w-full max-w-md rounded-lg border border-border-default/40 bg-surface-panel/80 p-4 shadow-xl backdrop-blur-sm md:p-8">
                <h1 className="mb-5 text-center text-3xl font-bold text-text-heading md:mb-6 md:text-4xl">
                    {t("login.title")}
                </h1>

                <AuthForm
                    onSubmit={handleSubmit}
                    submitLabel={t("login.submit")}
                    errorMessage={errorMessage}
                />

                <div className="mt-5 text-center md:mt-6">
                    <p className="text-sm text-text-muted">{t("login.noAccount")}</p>
                    <button
                        type="button"
                        onClick={() =>
                            navigate("/register", {
                                state: location.state,
                            })
                        }
                        className="mt-2 text-sm font-semibold text-text-link transition-colors duration-200 hover:text-text-link-hover hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/50"
                    >
                        {t("login.createOne")}
                    </button>
                </div>
            </div>
        </div>
    );
}
