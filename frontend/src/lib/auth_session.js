import { clearTokens } from "@/lib/tokenStore";
import i18n from "@/i18n";

/**
 * Centralized reaction to an expired/invalid session.
 * Clears tokens, notifies the user and sends them to the login page.
 */
export function handleInvalidAuth(navigate, toast) {
    clearTokens();
    toast.error(i18n.t("auth.sessionExpired"));
    navigate("/login", { replace: true });
}
