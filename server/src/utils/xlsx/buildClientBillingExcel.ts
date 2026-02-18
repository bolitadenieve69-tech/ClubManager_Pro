import ExcelJS from "exceljs";
import { Response } from "express";

export async function buildClientBillingExcel(res: Response, data: any) {
    const workbook = new ExcelJS.Workbook();

    // --- HOJA RESUMEN ---
    const summarySheet = workbook.addWorksheet("Resumen Clientes");
    summarySheet.columns = [
        { header: "Cliente", key: "clientName", width: 30 },
        { header: "Reservas", key: "reservations", width: 15 },
        { header: "Canceladas", key: "cancelledCount", width: 15 },
        { header: "Horas", key: "hours", width: 15 },
        { header: "Total (€)", key: "revenue", width: 15 }
    ];

    // Formato cabecera
    summarySheet.getRow(1).font = { bold: true };
    summarySheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD3D3D3" } };

    // Datos resumen
    data.summaryList.forEach((item: any) => {
        summarySheet.addRow(item);
    });

    // Fila Total
    const totalRow = summarySheet.addRow({
        clientName: "TOTAL",
        reservations: data.totals.reservations,
        cancelledCount: data.totals.cancelledCount,
        hours: data.totals.hours,
        revenue: data.totals.revenue
    });
    totalRow.font = { bold: true };
    summarySheet.lastRow!.getCell(5).numFmt = '#,##0.00"€"';

    // --- HOJA DETALLE ---
    const detailSheet = workbook.addWorksheet("Detalle");
    detailSheet.columns = [
        { header: "Fecha", key: "date", width: 15 },
        { header: "Cliente", key: "clientName", width: 25 },
        { header: "Pista", key: "courtName", width: 20 },
        { header: "Inicio", key: "start", width: 10 },
        { header: "Fin", key: "end", width: 10 },
        { header: "Estado", key: "status", width: 15 },
        { header: "Total (€)", key: "priceTotal", width: 15 }
    ];

    detailSheet.getRow(1).font = { bold: true };
    detailSheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD3D3D3" } };

    data.details.forEach((item: any) => {
        detailSheet.addRow(item);
    });

    // Fila Total Detalle
    const detailTotalRow = detailSheet.addRow({
        date: "TOTALES",
        priceTotal: data.totals.revenue
    });
    detailTotalRow.font = { bold: true };

    // Freeze panes y autofilter
    detailSheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 1 }];
    detailSheet.autoFilter = 'A1:G1';
    summarySheet.autoFilter = 'A1:E1';

    await workbook.xlsx.write(res);
}
