import { apiFetch } from './api';

export type ReportType = "summary" | "invoice" | "reservation";

export const reportsApi = {
    generate: async (type: ReportType, data: any, format: "pdf" | "xlsx") => {
        const response = await fetch(`/api/reports/${format}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem("token")}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                reportType: type,
                reportData: data
            })
        });

        if (!response.ok) throw new Error(`Error al generar reporte ${format.toUpperCase()}`);
        return await response.blob();
    },
    downloadBlob: (blob: Blob, filename: string) => {
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
