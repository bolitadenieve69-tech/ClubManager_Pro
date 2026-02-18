import { apiFetch } from './api';

export interface Closeout {
    id: string;
    from: string;
    to: string;
    total_revenue: number;
    total_hours: number;
    reservation_count: number;
    notes: string | null;
    created_at: string;
    created_by: string;
}

export const closeoutsApi = {
    list: () => apiFetch<{ closeouts: Closeout[] }>('/closeouts'),
    create: (data: { from: string; to: string; notes?: string }) =>
        apiFetch<{ message: string; closeout: Closeout }>('/closeouts', {
            method: 'POST',
            body: JSON.stringify(data)
        }),
    health: () => apiFetch<{ status: string }>('/closeouts/health'),
    exportXlsx: async (id: string, filename: string) => {
        const response = await fetch(`/api/closeouts/${id}/xlsx`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem("token")}`
            }
        });

        if (!response.ok) throw new Error("Error al generar Excel del cierre.");

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
    }
};
