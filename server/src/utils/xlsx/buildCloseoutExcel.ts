import ExcelJS from "exceljs";
import { Response } from "express";

export async function buildCloseoutExcel(res: Response, closeout: any) {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Cierre Contable");

    sheet.columns = [
        { header: "Campo", key: "field", width: 30 },
        { header: "Valor", key: "value", width: 50 }
    ];

    sheet.addRows([
        { field: "ID Cierre", value: closeout.id },
        { field: "Desde", value: closeout.from.toISOString().split('T')[0] },
        { field: "Hasta", value: closeout.to.toISOString().split('T')[0] },
        { field: "Fecha Creación", value: closeout.created_at.toISOString() },
        { field: "Creado por", value: closeout.created_by },
        { field: "", value: "" },
        { field: "MÉTRICAS CONGELADAS", value: "" },
        { field: "Total Reservas", value: closeout.reservation_count },
        { field: "Total Horas", value: closeout.total_hours },
        { field: "Ingreso Total (€)", value: closeout.total_revenue },
        { field: "Notas", value: closeout.notes || "-" }
    ]);

    // Estilos
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(7).font = { bold: true, color: { argb: "FF3B82F6" } };
    sheet.lastRow!.getCell(2).alignment = { wrapText: true };

    await workbook.xlsx.write(res);
}
