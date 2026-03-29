import { clearToken } from "@/api/auth";

export function handleInvalidAuth(navigate, toast) {
    clearToken();
    toast.error("Your authentication is no longer valid. Please sign in again.");
    navigate("/login", { replace: true });

}