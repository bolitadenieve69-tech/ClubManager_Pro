import PDFDocument from "pdfkit";
import { COLORS, addHeader } from "./layout.js";

interface Column {
    label: string;
    property: string;
    width: number;
    align?: "left" | "right" | "center";
}

interface TableOptions {
    columns: Column[];
    reportType: string;
}

/**
 * Renderiza una tabla profesional con soporte para múltiples páginas.
 */
export function drawTable(
    doc: typeof PDFDocument,
    data: any[],
    options: TableOptions
) {
    const { columns, reportType } = options;
    const startX = 50;
    let currentY = doc.y;
    const rowHeight = 25;
    const headerHeight = 30;

    // Función interna para dibujar cabecera
    const drawHeader = (y: number) => {
        doc.rect(startX, y, 495, headerHeight).fill(COLORS.tableHeader);
        doc.fillColor(COLORS.secondary).font("Helvetica-Bold").fontSize(10);

        let xOffset = startX;
        columns.forEach((col) => {
            doc.text(col.label, xOffset + 5, y + 10, { width: col.width - 10, align: col.align || "left" });
            xOffset += col.width;
        });

        doc.moveTo(startX, y + headerHeight).lineTo(startX + 495, y + headerHeight).strokeColor(COLORS.border).stroke();
        return y + headerHeight;
    };

    // Dibujar cabecera inicial
    currentY = drawHeader(currentY + 10);

    // Dibujar filas
    data.forEach((row, index) => {
        // Verificar si necesitamos nueva página
        if (currentY + rowHeight > doc.page.height - 70) {
            doc.addPage();
            addHeader(doc, reportType);
            currentY = drawHeader(doc.y + 10);
        }

        // Fondo zebra
        if (index % 2 !== 0) {
            doc.rect(startX, currentY, 495, rowHeight).fill(COLORS.zebra);
        }

        doc.fillColor(COLORS.text).font("Helvetica").fontSize(9);

        let xOffset = startX;
        columns.forEach((col) => {
            const val = row[col.property]?.toString() || "";
            doc.text(val, xOffset + 5, currentY + 8, { width: col.width - 10, align: col.align || "left", ellipsis: true });
            xOffset += col.width;
        });

        doc.moveTo(startX, currentY + rowHeight).lineTo(startX + 495, currentY + rowHeight).strokeColor(COLORS.border).stroke();
        currentY += rowHeight;
    });

    return currentY;
}
