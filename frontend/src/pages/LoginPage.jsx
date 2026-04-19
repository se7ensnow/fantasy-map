import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { login } from "../api/auth";
import AuthForm from "@/components/AuthForm";

export default function LoginPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [errorMessage, setErrorMessage] = useState("");

    const handleSubmit = async ({ username, password }) => {
        try {
            setErrorMessage("");
            await login(username, password);
            toast.success(t("login.toasts.success"));
            navigate("/");
        } catch (err) {
            setErrorMessage(err.message || t("login.errors.failed"));
            console.error(err);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center pb-6 text-text-primary">
            <div className="w-full max-w-md rounded-lg border border-border-default/40 bg-surface-panel/80 p-8 shadow-xl backdrop-blur-sm">
                <h1 className="mb-6 text-center text-4xl font-bold text-text-heading">
                    {t("login.title")}
                </h1>

                <AuthForm
                    onSubmit={handleSubmit}
                    submitLabel={t("login.submit")}
                    errorMessage={errorMessage}
                />

                <div className="mt-6 text-center">
                    <p className="text-sm text-text-muted">
                        {t("login.noAccount")}
                    </p>
                    <button
                        type="button"
                        onClick={() => navigate("/register")}
                        className="mt-2 text-sm font-semibold text-text-link transition-colors duration-200 hover:text-text-link-hover hover:underline"
                    >
                        {t("login.createOne")}
                    </button>
                </div>
            </div>
        </div>
    );
}