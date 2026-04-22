import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

export default function AuthForm({
    onSubmit,
    showEmail = false,
    submitLabel = "Submit",
    errorMessage = "",
}) {
    const { t } = useTranslation();
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();

        const data = { username, password };
        if (showEmail) {
            data.email = email;
        }

        onSubmit(data);
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="
                mx-auto max-w-md space-y-4 rounded-lg border border-border-default/40
                bg-surface-panel/90 p-4 shadow md:p-6
            "
        >
            <div>
                <Label className="mb-1 block text-sm font-semibold md:text-base">
                    {t("authForm.username")}
                </Label>
                <Input
                    className="!text-text-heading text-sm md:text-base"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                />
            </div>

            {showEmail && (
                <div>
                    <Label className="mb-1 block text-sm font-semibold md:text-base">
                        {t("authForm.email")}
                    </Label>
                    <Input
                        className="!text-text-heading text-sm md:text-base"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
            )}

            <div>
                <Label className="mb-1 block text-sm font-semibold md:text-base">
                    {t("authForm.password")}
                </Label>
                <Input
                    className="!text-text-heading text-sm md:text-base"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
            </div>

            {errorMessage && (
                <div className="rounded-md border border-status-error-border bg-status-error-border/10 px-3 py-2.5 md:px-4 md:py-3">
                    <p className="text-sm font-medium text-status-error-ink">
                        {errorMessage}
                    </p>
                </div>
            )}

            <Button type="submit" className="w-full">
                {submitLabel}
            </Button>
        </form>
    );
}