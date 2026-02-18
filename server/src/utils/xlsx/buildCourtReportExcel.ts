import ExcelJS from "exceljs";
import { Response } from "express";

export async function buildCourtReportExcel(res: Response, data: any) {
    const workbook = new ExcelJS.Workbook();

    // --- HOJA RESUMEN ---
    const summarySheet = workbook.addWorksheet("Resumen");
    summarySheet.columns = [
        { header: "Pista", key: "courtName", width: 25 },
        { header: "Reservas", key: "reservations", width: 15 },
        { header: "Canceladas", key: "cancelledCount", width: 15 },
        { header: "Horas", key: "hours", width: 15 },
        { header: "Ingresos (€)", key: "revenue", width: 15 }
    ];

    // Formato cabecera
    summarySheet.getRow(1).font = { bold: true };
    summarySheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD3D3D3" } };

    // Datos resumen
    data.summaryByCourt.forEach((item: any) => {
        summarySheet.addRow(item);
    });

    // Fila Total
    const totalRow = summarySheet.addRow({
        courtName: "TOTAL",
        reservations: data.totals.reservations,
        cancelledCount: data.totals.cancelledCount,
        hours: data.totals.hours,
        revenue: data.totals.revenue
    });
    totalRow.font = { bold: true };
    summarySheet.lastRow!.getCell(4).numFmt = '#,##0.00"€"';

    // --- HOJA DETALLE ---
    const detailSheet = workbook.addWorksheet("Detalle");
    detailSheet.columns = [
        { header: "Fecha", key: "date", width: 15 },
        { header: "Pista", key: "courtName", width: 20 },
        { header: "Inicio", key: "start", width: 10 },
        { header: "Fin", key: "end", width: 10 },
        { header: "Minutos", key: "durationMinutes", width: 12 },
        { header: "Cliente", key: "clientName", width: 25 },
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
        durationMinutes: data.details.reduce((acc: number, curr: any) => acc + curr.durationMinutes, 0),
        priceTotal: data.totals.revenue
    });
    detailTotalRow.font = { bold: true };

    // Freeze panes y autofilter
    detailSheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 1 }];
    detailSheet.autoFilter = 'A1:H1';
    summarySheet.autoFilter = 'A1:D1';

    await workbook.xlsx.write(res);
}
