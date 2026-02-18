import { apiFetch } from "./api";

export interface AccountingSummary {
    period: string;
    range: {
        start: string;
        end: string;
    };
    income: {
        base: number;
        vat: number;
        total: number;
        count: number;
    };
    expense: {
        base: number;
        vat: number;
        total: number;
        count: number;
    };
    internal: {
        income: number;
        expense: number;
        balance: number;
        count: number;
    };
    balance: number; // Global balance
    vat_result: number;
}

export const accountingApi = {
    getSummary: async (params: { period: string; year?: number; value?: number }) => {
        const queryParams = new URLSearchParams();
        queryParams.append("period", params.period);
        if (params.year) queryParams.append("year", params.year.toString());
        if (params.value) queryParams.append("value", params.value.toString());

        return apiFetch<AccountingSummary>(`/accounting/summary?${queryParams.toString()}`);
    },

    exportXlsx: async (params: { period: string; year?: number; value?: number }, filename: string) => {
        const queryParams = new URLSearchParams();
        queryParams.append("period", params.period);
        if (params.year) queryParams.append("year", params.year.toString());
        if (params.value) queryParams.append("value", params.value.toString());

        const data = await apiFetch<Blob>(`/accounting/export?${queryParams.toString()}`);

        // Create download link
        const url = window.URL.createObjectURL(new Blob([data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();

        // Cleanup
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    },
};
