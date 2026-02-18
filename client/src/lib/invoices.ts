import { apiFetch } from './api';

export type InvoiceStatus = 'ISSUED' | 'PAID' | 'CANCELLED';

export interface Invoice {
    id: string;
    club_id: string;
    number: number;
    total_cents: number;
    status: InvoiceStatus;
    created_at: string;
}

export const invoicesApi = {
    list: () => apiFetch<{ invoices: Invoice[] }>('/invoices'),
    generate: () => apiFetch<{ message: string }>('/invoices/generate', { method: 'POST' }),
    downloadPdf: async (id: string, filename: string) => {
        // First get the full invoice detail
        const invoice = await apiFetch<any>(`/invoices/${id}`);

        // Then call the reporting engine
        const response = await fetch('/api/reports/pdf', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem("token")}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                reportType: 'single_invoice',
                reportData: invoice,
                filenameHint: filename
            })
        });

        if (!response.ok) throw new Error("Error al generar el PDF de la factura.");

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        window.URL.revokeObjectURL(url);
    }
};
