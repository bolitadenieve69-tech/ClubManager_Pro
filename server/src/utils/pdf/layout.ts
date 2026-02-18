import PDFDocument from "pdfkit";

export const COLORS = {
    primary: "#2c3e50",
    secondary: "#34495e",
    accent: "#3498db",
    text: "#333333",
    muted: "#7f8c8d",
    border: "#eeeef0",
    tableHeader: "#f8f9fa",
    zebra: "#fafbfc",
};

/**
 * Agrega el encabezado profesional a cada página.
 */
export function addHeader(doc: typeof PDFDocument, reportType: string) {
    const titles: Record<string, string> = {
        summary: "Resumen de Actividad",
        invoice: "Reporte de Facturación",
        reservation: "Reporte de Reservas",
        single_invoice: "Factura",
    };

    // Logo simulado / Nombre del Club
    doc.fillColor(COLORS.primary).fontSize(20).font("Helvetica-Bold").text("ClubManager", 50, 40, { continued: true });
    doc.fillColor(COLORS.accent).text(" Padel");

    doc.fillColor(COLORS.muted).fontSize(10).font("Helvetica").text("Gestión Profesional de Clubs", 50, 65);

    // Tipo de reporte y fecha a la derecha
    doc.fillColor(COLORS.secondary).fontSize(14).font("Helvetica-Bold").text(titles[reportType] || "Reporte General", 350, 45, { align: "right" });
    doc.fillColor(COLORS.muted).fontSize(9).font("Helvetica").text(`Generado: ${new Intl.DateTimeFormat("es-ES").format(new Date())}`, 350, 65, { align: "right" });

    doc.moveTo(50, 85).lineTo(545, 85).strokeColor(COLORS.border).stroke();
    doc.moveDown(2);
}

/**
 * Agrega el pie de página con paginación.
 */
export function addFooter(doc: typeof PDFDocument) {
    const range = (doc as any).bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);
        const bottom = doc.page.height - 50;

        doc.moveTo(50, bottom - 10).lineTo(545, bottom - 10).strokeColor(COLORS.border).stroke();

        doc.fontSize(8).fillColor(COLORS.muted).text("Antigravity · ClubManager - Confidencial para uso interno", 50, bottom, { align: "left" });
        doc.text(`Página ${i + 1} de ${range.count}`, 50, bottom, { align: "right" });
    }
}
