import { apiFetch } from "./api";

export type ReservationStatus = "CONFIRMED" | "CANCELLED" | "COMPLETED";

export interface Reservation {
    id: string;
    court_id: string;
    user_id: string;
    start_at: string;
    end_at: string;
    status: ReservationStatus;
    total_cents: number;
    court?: {
        name: string;
    };
    user?: {
        email: string;
        full_name: string | null;
    };
}

export const reservationsApi = {
    list: () => apiFetch<{ reservations: Reservation[] }>("/reservations"),
    create: (data: { court_id: string; user_id: string; start_at: string; end_at: string }) =>
        apiFetch<{ message: string; reservation: Reservation }>("/reservations", {
            method: "POST",
            body: JSON.stringify(data),
        }),
    cancel: (id: string) =>
        apiFetch<{ message: string }>("/reservations/" + id, {
            method: "DELETE",
        }),
};
