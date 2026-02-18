import PDFDocument from "pdfkit";
import { addHeader, addFooter, COLORS } from "./layout.js";
import { formatCurrency, formatDate } from "./format.js";
import { drawTable } from "./table.js";

/**
 * Busca un array de datos dentro de reportData (items, rows, records, etc.)
 */
function findDataArray(data: any): any[] | null {
    const possibleKeys = ["items", "rows", "records", "data", "reservations", "invoices", "movements"];
    for (const key of possibleKeys) {
        if (Array.isArray(data[key])) return data[key];
    }
    return null;
}

/**
 * Intenta calcular un total sumando campos numéricos comunes.
 */
function calculateAutoTotal(items: any[]): number {
    const commonKeys = ["total_cents", "total_price", "amount_cents", "amount", "price", "total"];
    return items.reduce((acc, item) => {
        for (const key of commonKeys) {
            if (typeof item[key] === "number") return acc + item[key];
            if (typeof item[key] === "string" && !isNaN(Number(item[key]))) return acc + Number(item[key]);
        }
        return acc;
    }, 0);
}

/**
 * Construye el reporte PDF completo según el tipo.
 */
export async function buildReport(doc: typeof PDFDocument, reportType: string, reportData: any) {
    addHeader(doc, reportType);

    // Bloque de metadatos (solo primera página)
    doc.rect(50, doc.y, 495, 60).fill("#fcfcfd").strokeColor(COLORS.border).stroke();
    doc.fillColor(COLORS.secondary).fontSize(10).font("Helvetica-Bold").text("Detalles del Reporte:", 65, doc.y - 50);
    doc.font("Helvetica").fillColor(COLORS.text);
    doc.text(`Tipo: ${reportType.toUpperCase()}`, 65, doc.y + 5);
    doc.text(`Identificador: ${reportData.id || "N/A"}`, 65, doc.y + 2);

    if (reportData.admin) doc.text(`Emitido por: ${reportData.admin}`, 300, doc.y - 12);

    doc.moveDown(4);

    const dataArray = findDataArray(reportData);
    const isSpecialType = ["invoice", "reservation", "movement"].includes(reportType);

    if (dataArray && isSpecialType) {
        let columns: any[] = [];
        let tableData: any[] = [];

        if (reportType === "invoice") {
            columns = [
                { label: "Nº", property: "num", width: 60 },
                { label: "Fecha", property: "date", width: 90 },
                { label: "Cliente", property: "client", width: 140 },
                { label: "Estado", property: "status", width: 100 },
                { label: "Total", property: "total", width: 105, align: "right" },
            ];

            tableData = dataArray.map((item: any) => ({
                num: item.number ? `#${String(item.number).padStart(4, "0")}` : "-",
                date: formatDate(item.created_at || item.date || new Date()),
                client: item.clientName || item.userEmail || item.client || "Varios",
                status: item.status || "EMITIDA",
                total: formatCurrency(item.total_cents || item.amount || item.total || 0),
            }));
        } else if (reportType === "movement") {
            columns = [
                { label: "Fecha", property: "date", width: 90 },
                { label: "Concepto", property: "concept", width: 200 },
                { label: "Categoría", property: "category", width: 100 },
                { label: "Importe", property: "amount", width: 105, align: "right" },
            ];

            tableData = dataArray.map((item: any) => ({
                date: formatDate(item.date || new Date()),
                concept: item.concept || "-",
                category: item.category || "Varios",
                amount: formatCurrency(item.amount_cents || 0),
            }));
        } else {
            // Reservation
            columns = [
                { label: "Fecha", property: "date", width: 80 },
                { label: "Hora", property: "time", width: 80 },
                { label: "Pista", property: "court", width: 120 },
                { label: "Usuario", property: "user", width: 130 },
                { label: "Precio", property: "price", width: 85, align: "right" },
            ];

            tableData = dataArray.map((item: any) => ({
                date: formatDate(item.start_time || item.date || new Date()).split(" ")[0],
                time: formatDate(item.start_time || item.date || new Date()).split(" ")[1],
                court: item.courtName || item.court?.name || item.pista || "Pista",
                user: item.userName || item.user?.email || item.jugador || "Jugador",
                price: formatCurrency(item.total_price || item.price || item.amount || 0),
            }));
        }

        drawTable(doc, tableData, { columns, reportType });

        // Cálculo y render de totales automáticos
        const calculatedTotal = calculateAutoTotal(dataArray);
        if (calculatedTotal > 0) {
            doc.moveDown(2);
            doc.fontSize(14).font("Helvetica-Bold").fillColor(COLORS.primary).text(`TOTAL: ${formatCurrency(calculatedTotal)}`, { align: "right" });
            doc.fontSize(10).font("Helvetica").fillColor(COLORS.muted).text(`${dataArray.length} registros incluidos.`, { align: "right" });
        } else {
            doc.moveDown(2);
            doc.fontSize(10).font("Helvetica").fillColor(COLORS.muted).text(`Total: ${dataArray.length} registros.`, { align: "right" });
        }
    } else if (reportType === "single_invoice") {
        // Layout específico para UNA factura
        const invoice = reportData;

        // Info del Emisor (Club)
        doc.fontSize(10).font("Helvetica-Bold").fillColor(COLORS.secondary).text("EMISOR:", 50, doc.y);
        doc.font("Helvetica").fillColor(COLORS.text);
        doc.text(invoice.club?.legal_name || "Nombre del Club");
        doc.text(`CIF: ${invoice.club?.tax_id || "N/A"}`);
        doc.text(invoice.club?.fiscal_address || "Dirección del Club");

        doc.moveUp(4);

        // Info del Receptor (Cliente / Usuario de la primera reserva)
        const firstRes = invoice.reservations?.[0];
        doc.fontSize(10).font("Helvetica-Bold").fillColor(COLORS.secondary).text("RECEPTOR:", 350, doc.y);
        doc.font("Helvetica").fillColor(COLORS.text);
        doc.text(firstRes?.user?.email || "Cliente Final");

        doc.moveDown(3);

        // Tabla de ítems
        const columns = [
            { label: "Descripción", property: "desc", width: 280 },
            { label: "Cantidad", property: "qty", width: 70, align: "center" as const },
            { label: "Precio U.", property: "unit", width: 70, align: "right" as const },
            { label: "Total", property: "total", width: 75, align: "right" as const },
        ];

        const tableData = (invoice.items || []).map((item: any) => ({
            desc: item.description,
            qty: item.quantity,
            unit: formatCurrency(item.unit_price),
            total: formatCurrency(item.total_price),
        }));

        drawTable(doc, tableData, { columns, reportType });

        doc.moveDown(2);
        doc.fontSize(16).font("Helvetica-Bold").fillColor(COLORS.primary).text(`TOTAL FACTURA: ${formatCurrency(invoice.total_cents)}`, { align: "right" });
        doc.fontSize(10).font("Helvetica").fillColor(COLORS.muted).text("Impuestos incluidos según régimen vigente.", { align: "right" });
    } else {
        // Summary / Fallback genérico (Key/Value)
        doc.fontSize(14).font("Helvetica-Bold").text("Detalles de Información", { underline: true });
        doc.moveDown();

        Object.entries(reportData).forEach(([key, value]) => {
            if (typeof value === "object") return;
            const displayKey = key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, " ");
            doc.font("Helvetica-Bold").fontSize(10).text(`${displayKey}: `, { continued: true }).font("Helvetica").text(`${value}`);
            doc.moveDown(0.5);
        });

        if (dataArray) {
            doc.moveDown();
            doc.fontSize(12).font("Helvetica-Bold").text(`Desglose de datos (${dataArray.length} registros):`);
            doc.moveDown(0.5);
            // Tabla genérica para datos desconocidos (limitada a 5 columnas)
            const firstRow = dataArray[0] || {};
            const keys = Object.keys(firstRow).filter(k => typeof firstRow[k] !== "object").slice(0, 5);
            const columns = keys.map(k => ({ label: k.toUpperCase(), property: k, width: 495 / keys.length }));
            drawTable(doc, dataArray, { columns, reportType });
        }
    }

    addFooter(doc);
}
