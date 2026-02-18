import ExcelJS from "exceljs";
import { Response } from "express";

/**
 * Busca un array de datos dentro de reportData.
 */
function findDataArray(data: any): any[] | null {
    const possibleKeys = ["items", "rows", "records", "data", "reservations", "invoices", "movements"];
    for (const key of possibleKeys) {
        if (Array.isArray(data[key])) return data[key];
    }
    return null;
}

/**
 * Genera un archivo Excel y lo envía por streaming a la respuesta.
 */
export async function buildExcel(res: Response, reportType: string, reportData: any) {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Reporte");

    // Configuración de columnas según tipo
    let columns: any[] = [];
    const dataArray = findDataArray(reportData);

    if (reportType === "invoice") {
        columns = [
            { header: "Nº Factura", key: "number", width: 15 },
            { header: "Fecha", key: "created_at", width: 20 },
            { header: "Estado", key: "status", width: 15 },
            { header: "Total Cents", key: "total_cents", width: 15 },
            { header: "Total EUR", key: "total_eur", width: 15 },
        ];
    } else if (reportType === "reservation") {
        columns = [
            { header: "Fecha/Hora Inicio", key: "start_time", width: 25 },
            { header: "Pista", key: "courtName", width: 20 },
            { header: "Usuario", key: "userName", width: 25 },
            { header: "Precio", key: "total_price", width: 15 },
        ];
    } else if (reportType === "movement") {
        columns = [
            { header: "Fecha", key: "date", width: 20 },
            { header: "Concepto", key: "concept", width: 30 },
            { header: "Categoría", key: "category", width: 20 },
            { header: "Importe Cents", key: "amount_cents", width: 15 },
            { header: "Importe EUR", key: "amount_eur", width: 15 },
        ];
    } else {
        // Genérico
        if (dataArray && dataArray.length > 0) {
            columns = Object.keys(dataArray[0]).map(key => ({ header: key.toUpperCase(), key, width: 20 }));
        } else {
            // Si no hay array, poner las keys del objeto base
            columns = [
                { header: "PROPIEDAD", key: "prop", width: 30 },
                { header: "VALOR", key: "val", width: 50 }
            ];
        }
    }

    sheet.columns = columns;

    // Estilo de cabecera
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEEEEEE" } };

    // Añadir datos
    if (dataArray) {
        dataArray.forEach(item => {
            const row: any = {};
            if (reportType === "invoice") {
                row.number = item.number ? `#${String(item.number).padStart(4, "0")}` : "-";
                row.created_at = item.created_at || item.date || "";
                row.status = item.status || "";
                row.total_cents = item.total_cents || item.amount || item.total || 0;
                row.total_eur = (row.total_cents / 100).toLocaleString("es-ES", { style: "currency", currency: "EUR" });
            } else if (reportType === "reservation") {
                row.start_time = item.start_time || item.date || "";
                row.courtName = item.courtName || item.court?.name || item.pista || "";
                row.userName = item.userName || item.user?.email || item.jugador || "";
                row.total_price = (item.total_price || item.amount || 0) / 100;
            } else if (reportType === "movement") {
                row.date = item.date || "";
                row.concept = item.concept || "";
                row.category = item.category || "Varios";
                row.amount_cents = item.amount_cents || 0;
                row.amount_eur = (row.amount_cents / 100).toLocaleString("es-ES", { style: "currency", currency: "EUR" });
            } else {
                Object.assign(row, item);
            }
            sheet.addRow(row);
        });
    } else {
        Object.entries(reportData).forEach(([prop, val]) => {
            if (typeof val !== "object" || val === null) {
                sheet.addRow({ prop: prop.toUpperCase(), val: val });
            }
        });
    }

    // Escribir a la respuesta
    await workbook.xlsx.write(res);
}
