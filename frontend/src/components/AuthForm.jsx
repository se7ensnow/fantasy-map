import { useId, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AuthForm({
    onSubmit,
    showEmail = false,
    submitLabel = "Submit",
    errorMessage = "",
}) {
    const { t } = useTranslation();
    const fieldId = useId();

    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();

        const data = { username, password };
        if (showEmail) data.email = email;

        try {
            setSubmitting(true);
            await onSubmit(data);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="mx-auto max-w-md space-y-4 rounded-lg border border-border-default/40 bg-surface-panel/90 p-4 shadow md:p-6"
        >
            <div>
                <Label
                    htmlFor={`${fieldId}-username`}
                    className="mb-1 block text-sm font-semibold md:text-base"
                >
                    {t("authForm.username")}
                </Label>
                <Input
                    id={`${fieldId}-username`}
                    className="text-sm text-text-heading md:text-base"
                    type="text"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    autoComplete="username"
                    autoFocus
                    required
                />
            </div>

            {showEmail && (
                <div>
                    <Label
                        htmlFor={`${fieldId}-email`}
                        className="mb-1 block text-sm font-semibold md:text-base"
                    >
                        {t("authForm.email")}
                    </Label>
                    <Input
                        id={`${fieldId}-email`}
                        className="text-sm text-text-heading md:text-base"
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        autoComplete="email"
                        required
                    />
                </div>
            )}

            <div>
                <Label
                    htmlFor={`${fieldId}-password`}
                    className="mb-1 block text-sm font-semibold md:text-base"
                >
                    {t("authForm.password")}
                </Label>

                <div className="relative">
                    <Input
                        id={`${fieldId}-password`}
                        className="pr-11 text-sm text-text-heading md:text-base"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        autoComplete={showEmail ? "new-password" : "current-password"}
                        required
                    />

                    <button
                        type="button"
                        onClick={() => setShowPassword((value) => !value)}
                        className="absolute right-1 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-state-hover hover:text-text-heading focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/50"
                        aria-label={
                            showPassword
                                ? t("authForm.hidePassword")
                                : t("authForm.showPassword")
                        }
                        title={
                            showPassword
                                ? t("authForm.hidePassword")
                                : t("authForm.showPassword")
                        }
                        aria-pressed={showPassword}
                    >
                        {showPassword ? (
                            <EyeOff className="h-4 w-4" aria-hidden="true" />
                        ) : (
                            <Eye className="h-4 w-4" aria-hidden="true" />
                        )}
                    </button>
                </div>
            </div>

            {errorMessage && (
                <div
                    className="rounded-md border border-status-error-border bg-status-error-border/10 px-3 py-2.5 md:px-4 md:py-3"
                    role="alert"
                >
                    <p className="text-sm font-medium text-status-error-ink">
                        {errorMessage}
                    </p>
                </div>
            )}

            <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? t("authForm.submitting") : submitLabel}
            </Button>
        </form>
    );
}
