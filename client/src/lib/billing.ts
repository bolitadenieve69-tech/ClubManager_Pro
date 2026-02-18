import { apiFetch } from './api';

export interface BillingSummary {
    meta: { from: string; to: string; includeCancelled: boolean };
    byClient: Array<{
        clientId: string;
        clientName: string;
        reservations: number;
        hours: number;
        revenue: number;
        cancelledCount: number;
    }>;
    totals: {
        reservations: number;
        hours: number;
        revenue: number;
        cancelledCount: number;
    };
}

export const billingApi = {
    getSummary: (data: { from: string; to: string; includeCancelled: boolean }) =>
        apiFetch<BillingSummary>('/billing/clients/summary', {
            method: 'POST',
            body: JSON.stringify(data)
        }),
    exportXlsx: async (data: { from: string; to: string; includeCancelled: boolean }, filename: string) => {
        const response = await fetch('/api/billing/clients/xlsx', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem("token")}`
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) throw new Error("Error al generar Excel");

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
