import { Response } from "express";
import ExcelJS from "exceljs";

export async function buildAccountingExcel(res: Response, data: {
    incomes: any[],
    expenses: any[],
    internalMovements: any[],
    period: string,
    range: { start: Date, end: Date }
}) {
    const workbook = new ExcelJS.Workbook();

    // 1. Resumen Worksheet
    const summarySheet = workbook.addWorksheet("Resumen IVA y Caja");
    summarySheet.columns = [
        { header: "Concepto", key: "concept", width: 35 },
        { header: "Base Imponible", key: "base", width: 20 },
        { header: "IVA (21%)", key: "vat", width: 15 },
        { header: "Total", key: "total", width: 20 },
    ];

    const calculateVAT = (totalCents: number) => {
        const total = totalCents / 100;
        const base = total / 1.21;
        const vat = total - base;
        return {
            base: Number(base.toFixed(2)),
            vat: Number(vat.toFixed(2)),
            total: Number(total.toFixed(2))
        };
    };

    const incTotalCents = data.incomes.reduce((acc, i) => acc + i.total_cents, 0);
    const expTotalCents = data.expenses.reduce((acc, e) => acc + e.amount_cents, 0);
    const intIncTotalCents = data.internalMovements.filter(m => m.amount_cents > 0).reduce((acc, m) => acc + m.amount_cents, 0);
    const intExpTotalCents = data.internalMovements.filter(m => m.amount_cents < 0).reduce((acc, m) => acc + m.amount_cents, 0);

    const inc = calculateVAT(incTotalCents);
    const exp = calculateVAT(expTotalCents);

    summarySheet.addRows([
        { concept: "INGRESOS FISCALES (IVA Repercutido)", base: inc.base, vat: inc.vat, total: inc.total },
        { concept: "GASTOS FISCALES (IVA Soportado)", base: exp.base, vat: exp.vat, total: exp.total },
        { concept: "RESULTADO IVA (A liquidar)", base: "", vat: (inc.vat - exp.vat).toFixed(2), total: "" },
        { concept: "", base: "", vat: "", total: "" },
        { concept: "MOVIMIENTOS INTERNOS (Caja)", base: "", vat: "", total: "" },
        { concept: "   (+) Ingresos Internos", base: (intIncTotalCents / 100).toFixed(2), vat: "0.00", total: (intIncTotalCents / 100).toFixed(2) },
        { concept: "   (-) Gastos Internos", base: (Math.abs(intExpTotalCents) / 100).toFixed(2), vat: "0.00", total: (Math.abs(intExpTotalCents) / 100).toFixed(2) },
        { concept: "BALANCE NETO CAJA", base: "", vat: "", total: ((incTotalCents - expTotalCents + intIncTotalCents + intExpTotalCents) / 100).toFixed(2) },
    ]);

    // Apply styles to summary
    summarySheet.getRow(1).font = { bold: true };
    summarySheet.getRow(4).font = { bold: true, color: { argb: "FFFF0000" } }; // VAT Result
    summarySheet.getRow(9).font = { bold: true, size: 14 }; // Balance

    // 2. Ingresos Detallados
    const incSheet = workbook.addWorksheet("Ingresos Detallados");
    incSheet.columns = [
        { header: "Fecha", key: "date", width: 15 },
        { header: "Factura #", key: "number", width: 15 },
        { header: "Base Imponible", key: "base", width: 15 },
        { header: "IVA (21%)", key: "vat", width: 15 },
        { header: "Total", key: "total", width: 15 },
    ];
    data.incomes.forEach(i => {
        const v = calculateVAT(i.total_cents);
        incSheet.addRow({
            date: i.created_at.toLocaleDateString(),
            number: i.number,
            base: v.base,
            vat: v.vat,
            total: v.total
        });
    });

    // 3. Gastos Detallados
    const expSheet = workbook.addWorksheet("Gastos Detallados");
    expSheet.columns = [
        { header: "Fecha", key: "date", width: 15 },
        { header: "Proveedor", key: "provider", width: 25 },
        { header: "Categoría", key: "category", width: 20 },
        { header: "Factura #", key: "ref", width: 15 },
        { header: "Base Imponible", key: "base", width: 15 },
        { header: "IVA (21%)", key: "vat", width: 15 },
        { header: "Total", key: "total", width: 15 },
    ];
    data.expenses.forEach(e => {
        const v = calculateVAT(e.amount_cents);
        expSheet.addRow({
            date: e.date.toLocaleDateString(),
            provider: e.provider_name,
            category: e.category,
            ref: e.invoice_number,
            base: v.base,
            vat: v.vat,
            total: v.total
        });
    });

    // 4. Movimientos Internos Detallados
    const intSheet = workbook.addWorksheet("Movimientos Internos");
    intSheet.columns = [
        { header: "Fecha", key: "date", width: 15 },
        { header: "Concepto", key: "concept", width: 35 },
        { header: "Categoría", key: "category", width: 20 },
        { header: "Importe", key: "amount", width: 15 },
    ];
    data.internalMovements.forEach(m => {
        intSheet.addRow({
            date: m.date.toLocaleDateString(),
            concept: m.concept,
            category: m.category || "General",
            amount: (m.amount_cents / 100).toFixed(2)
        });
    });

    await workbook.xlsx.write(res);
}
