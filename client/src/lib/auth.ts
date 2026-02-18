import { apiFetch, ApiError } from "./api";

export type MeResponse = {
    user: { id: string; email: string; role: string };
    club: { id: string };
};

export async function fetchMe(): Promise<MeResponse> {
    return apiFetch<MeResponse>("/auth/me");
}

export function clearSession() {
    localStorage.removeItem("token");
    localStorage.removeItem("user_email");
}

export function isUnauthorizedError(e: unknown) {
    return e instanceof ApiError && (e.code === "UNAUTHORIZED" || e.code === "HTTP_ERROR");
}
