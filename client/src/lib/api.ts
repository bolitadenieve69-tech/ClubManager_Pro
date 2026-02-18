export type ApiErrorPayload = {
    error: {
        code: string;
        message: string;
        details?: unknown;
    };
};

export class ApiError extends Error {
    code: string;
    details?: unknown;

    constructor(code: string, message: string, details?: unknown) {
        super(message);
        this.code = code;
        this.details = details;
    }
}

function getToken() {
    return localStorage.getItem("token");
}

const BASE_URL = (import.meta as any).env.VITE_API_BASE_URL || "/api";

export async function apiFetch<T>(
    path: string,
    options: RequestInit = {}
): Promise<T> {
    const headers = new Headers(options.headers);

    if (options.body && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
    }

    const token = getToken();
    if (token && !headers.has("Authorization")) {
        headers.set("Authorization", `Bearer ${token}`);
    }

    const res = await fetch(`${BASE_URL}${path}`, {
        ...options,
        headers,
    });

    const contentType = res.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");

    const data = isJson ? await res.json().catch(() => null) : null;

    if (!res.ok) {
        const payload = data as ApiErrorPayload | null;

        if (payload?.error?.message && payload?.error?.code) {
            throw new ApiError(payload.error.code, payload.error.message, payload.error.details);
        }

        throw new ApiError(
            "HTTP_ERROR",
            "Ha ocurrido un error inesperado.",
            { status: res.status }
        );
    }

    return (data ?? ({} as T)) as T;
}
