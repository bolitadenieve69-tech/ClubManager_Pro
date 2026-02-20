import { apiFetch } from "./api";

export type ReservationStatus = "CONFIRMED" | "CANCELLED" | "COMPLETED" | "PENDING_PAYMENT";

export interface Reservation {
    id: string;
    court_id: string;
    user_id: string | null;
    guest_name: string | null;
    phone: string | null;
    payment_method: string | null;
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
    } | null;
}

export const reservationsApi = {
    list: () => apiFetch<{ reservations: Reservation[] }>("/reservations"),
    create: (data: { court_id: string; user_id?: string; guest_name?: string; phone?: string; payment_method?: string; start_time: string; end_time: string }) =>
        apiFetch<{ message: string; reservations: Reservation[] }>("/reservations", {
            method: "POST",
            body: JSON.stringify(data),
        }),
    cancel: (id: string) =>
        apiFetch<{ message: string }>("/reservations/" + id, {
            method: "DELETE",
        }),
};
