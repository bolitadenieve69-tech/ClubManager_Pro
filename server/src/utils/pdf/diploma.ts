import PDFDocument from "pdfkit";
import { COLORS } from "./layout.js";
import { formatDate } from "./format.js";

interface DiplomaData {
    clubName: string;
    tournamentName: string;
    winnerName: string;
    date: Date;
    points: number;
}

export async function buildDiploma(doc: typeof PDFDocument, data: DiplomaData) {
    // Background / Border
    doc.rect(20, 20, 555, 752).lineWidth(4).strokeColor(COLORS.primary).stroke();
    doc.rect(30, 30, 535, 732).lineWidth(1).strokeColor(COLORS.secondary).stroke();

    // Club Header
    doc.moveDown(4);
    doc.fontSize(14)
        .font("Helvetica-Bold")
        .fillColor(COLORS.secondary)
        .text(data.clubName.toUpperCase(), { align: "center", characterSpacing: 2 });

    doc.moveDown(2);

    // Main Title
    doc.fontSize(40)
        .font("Helvetica-Bold")
        .fillColor(COLORS.primary)
        .text("CERTIFICADO", { align: "center" });

    doc.fontSize(20)
        .text("DE CAMPEÓN", { align: "center" });

    doc.moveDown(3);

    // Body
    doc.fontSize(16)
        .font("Helvetica")
        .fillColor(COLORS.text)
        .text("Se otorga este diploma a:", { align: "center" });

    doc.moveDown(1.5);

    // Winner Name
    doc.fontSize(32)
        .font("Helvetica-Bold")
        .fillColor(COLORS.secondary)
        .text(data.winnerName, { align: "center", underline: true });

    doc.moveDown(2);

    doc.fontSize(16)
        .font("Helvetica")
        .fillColor(COLORS.text)
        .text(`Por su victoria en el torneo:`, { align: "center" });

    doc.moveDown(1);

    doc.fontSize(18)
        .font("Helvetica-Bold")
        .text(data.tournamentName, { align: "center" });

    doc.moveDown(2);

    doc.fontSize(14)
        .font("Helvetica")
        .text(`Celebrado el día ${formatDate(data.date).split(" ")[0]}`, { align: "center" });

    doc.text(`con una puntuación total de ${data.points} puntos.`, { align: "center" });

    doc.moveDown(6);

    // Footer signatures
    const startY = doc.y;
    doc.moveTo(100, startY).lineTo(250, startY).stroke();
    doc.text("Dirección del Club", 100, startY + 10, { width: 150, align: "center" });

    doc.moveTo(345, startY).lineTo(495, startY).stroke();
    doc.text("Organizador del Torneo", 345, startY + 10, { width: 150, align: "center" });

    // Little trophy icon simulation or watermark could go here
}
