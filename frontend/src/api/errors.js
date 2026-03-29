export class ApiError extends Error {
    constructor({
        message,
        status = null,
        code = "UNKNOWN_ERROR",
        detail = null,
    }) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.code = code;
        this.detail = detail;
    }
}

export function isApiError(error) {
    return error instanceof ApiError;
}

export function isInvalidAuthError(error) {
    return isApiError(error) && error.code === "AUTH_INVALID";
}

function getValidationMessage(detail) {
    if (!Array.isArray(detail) || detail.length === 0) {
        return "Invalid input.";
    }

    const first = detail[0];
    const loc = Array.isArray(first?.loc) ? first.loc : [];
    const msg = typeof first?.msg === "string" ? first.msg : "";

    if (loc.includes("email")) {
        return "Please enter a valid email address.";
    }

    if (loc.includes("map_id")) {
        return "The map link is invalid.";
    }

    if (loc.includes("share_id")) {
        return "The shared map link is invalid.";
    }

    if (loc.includes("username")) {
        return "Please check the username field.";
    }

    if (loc.includes("password")) {
        return "Please check the password field.";
    }

    return msg || "Invalid input.";
}

export function toApiError(error, fallbackMessage = "Request failed") {
    if (error?.response) {
        const status = error.response.status;
        const detail = error.response.data?.detail ?? null;

        if (status === 401) {
            return new ApiError({
                message: "Your authentication is no longer valid. Please sign in again.",
                status,
                code: "AUTH_INVALID",
                detail,
            });
        }

        if (status === 422) {
            return new ApiError({
                message: getValidationMessage(detail),
                status,
                code: "VALIDATION_ERROR",
                detail,
            });
        }

        if (status === 404) {
            return new ApiError({
                message:
                    typeof detail === "string" && detail.trim()
                        ? detail
                        : "Requested resource was not found.",
                status,
                code: "NOT_FOUND",
                detail,
            });
        }

        if (status === 400 && detail === "Incorrect username or password") {
            return new ApiError({
                message: "Incorrect username or password.",
                status,
                code: "INVALID_CREDENTIALS",
                detail,
            });
        }

        if (status === 400 && detail === "Username is already taken") {
            return new ApiError({
                message: "This username is already taken.",
                status,
                code: "USERNAME_TAKEN",
                detail,
            });
        }

        if (status === 400 && detail === "Email is already taken") {
            return new ApiError({
                message: "This email is already registered.",
                status,
                code: "EMAIL_TAKEN",
                detail,
            });
        }

        return new ApiError({
            message:
                typeof detail === "string" && detail.trim()
                    ? detail
                    : fallbackMessage,
            status,
            code: "HTTP_ERROR",
            detail,
        });
    }

    if (error?.request) {
        return new ApiError({
            message: "No response received from server. Please try again.",
            code: "NETWORK_ERROR",
        });
    }

    return new ApiError({
        message: error?.message || fallbackMessage,
        code: "CLIENT_ERROR",
    });
}