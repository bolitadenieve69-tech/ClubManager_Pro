import { apiFetch } from "./api";

export interface Court {
    id: string;
    club_id: string;
    name: string;
    type: string;
    is_active: boolean;
}

export const courtsApi = {
    list: () => apiFetch<{ courts: Court[] }>("/courts"),
    get: (id: string) => apiFetch<{ court: Court }>("/courts/" + id),
    update: (id: string, data: Partial<Court>) =>
        apiFetch<{ message: string; court: Court }>("/courts/" + id, {
            method: "PUT",
            body: JSON.stringify(data),
        }),
};
