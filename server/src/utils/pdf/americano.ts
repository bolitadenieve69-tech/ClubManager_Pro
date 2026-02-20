import PDFDocument from "pdfkit";

const COLORS = {
    primary: "#000000",
    secondary: "#333333",
    border: "#000000",
    header: "#f0f0f0",
};

interface AmericanoTemplateData {
    clubName: string;
    logoUrl?: string;
}

export async function buildAmericanoTemplate(doc: any, data: AmericanoTemplateData) {
    const { clubName } = data;

    // --- Page 1: 8 Rondas Completo ---
    drawHeader(doc, clubName, "TORNEO AMERICANO – 8 JUGADORES – 8 RONDAS");
    drawSchedules(doc, 8);
    drawSponsorSection(doc);

    // --- Page 2: 4 Rondas Exprés ---
    doc.addPage();
    drawHeader(doc, clubName, "TORNEO AMERICANO – FORMATO 90 MINUTOS – 4 RONDAS");
    drawSchedules(doc, 4);
    drawSponsorSection(doc);

    // --- Page 3: Hoja de Resultados (8 Rondas) ---
    doc.addPage();
    drawHeader(doc, clubName, "HOJA DE RESULTADOS – FORMATO COMPLETO");
    drawResultsSheet(doc, 8);
    drawSponsorSection(doc);


    // --- Page 4: Hoja de Resultados (4 Rondas) ---
    doc.addPage();
    drawHeader(doc, clubName, "HOJA DE RESULTADOS – FORMATO 90 MINUTOS");
    drawResultsSheet(doc, 4);
    drawSponsorSection(doc);
}

function drawHeader(doc: any, clubName: string, title: string) {
    // Top Margin: 50
    // Logo placeholder / Club Name
    doc.fillColor(COLORS.primary)
        .fontSize(22)
        .font("Helvetica-Bold")
        .text(clubName.toUpperCase(), { align: "center", y: 50 });

    doc.moveDown(0.2);
    doc.fontSize(12)
        .font("Helvetica")
        .text(title, { align: "center" });

    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor(COLORS.border).lineWidth(1).stroke();
    doc.moveDown(1.5);
}

function drawSchedules(doc: any, maxRounds: number) {
    const rounds = [
        { r: 1, matches: [{ p: "Pista 1", p1: "1 - 8", p2: "2 - 7" }, { p: "Pista 2", p1: "3 - 6", p2: "4 - 5" }] },
        { r: 2, matches: [{ p: "Pista 1", p1: "1 - 7", p2: "8 - 6" }, { p: "Pista 2", p1: "2 - 5", p2: "3 - 4" }] },
        { r: 3, matches: [{ p: "Pista 1", p1: "1 - 6", p2: "7 - 5" }, { p: "Pista 2", p1: "8 - 4", p2: "2 - 3" }] },
        { r: 4, matches: [{ p: "Pista 1", p1: "1 - 5", p2: "6 - 4" }, { p: "Pista 2", p1: "7 - 3", p2: "8 - 2" }] },
        { r: 5, matches: [{ p: "Pista 1", p1: "1 - 4", p2: "5 - 3" }, { p: "Pista 2", p1: "6 - 2", p2: "7 - 8" }] },
        { r: 6, matches: [{ p: "Pista 1", p1: "1 - 3", p2: "4 - 2" }, { p: "Pista 2", p1: "5 - 8", p2: "6 - 7" }] },
        { r: 7, matches: [{ p: "Pista 1", p1: "1 - 2", p2: "3 - 8" }, { p: "Pista 2", p1: "4 - 7", p2: "5 - 6" }] },
        { r: 8, matches: [{ p: "Pista 1", p1: "1 - 8", p2: "2 - 7" }, { p: "Pista 2", p1: "3 - 6", p2: "4 - 5" }] },
    ];

    const tableX = 50;
    const tableWidth = 495;
    const rowHeight = 25;
    const colWidths = [60, 100, 160, 160]; // Ronda, Pista, Pareja 1, Pareja 2

    // Header
    const drawRow = (y: number, items: string[], isHeader = false) => {
        let currentX = tableX;
        if (isHeader) {
            doc.rect(tableX, y, tableWidth, rowHeight).fill("#000000");
            doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(10);
        } else {
            doc.rect(tableX, y, tableWidth, rowHeight).stroke();
            doc.fillColor("#000000").font("Helvetica").fontSize(10);
        }

        items.forEach((item, i) => {
            doc.text(item, currentX + 5, y + 7, { width: colWidths[i] - 10, align: "center" });
            currentX += colWidths[i];
            if (!isHeader) {
                doc.moveTo(currentX, y).lineTo(currentX, y + rowHeight).stroke();
            }
        });
    };

    let y = doc.y;
    drawRow(y, ["Ronda", "Pista", "Pareja 1", "Pareja 2"], true);
    y += rowHeight;

    rounds.slice(0, maxRounds).forEach(round => {
        round.matches.forEach((match, idx) => {
            drawRow(y, [idx === 0 ? `R${round.r}` : "", match.p, match.p1, match.p2]);
            y += rowHeight;
        });
    });
}

function drawResultsSheet(doc: any, roundsCount: number) {
    const tableX = 50;
    const players = ["Jugador 1", "Jugador 2", "Jugador 3", "Jugador 4", "Jugador 5", "Jugador 6", "Jugador 7", "Jugador 8"];

    // Calculate columns
    const playerColWidth = 100;
    const totalCols = roundsCount + 2; // R1..Rn + Juegos + Puntos
    const remainingWidth = 495 - playerColWidth;
    const colWidth = remainingWidth / totalCols;

    const rowHeight = 35; // Taller rows for handwriting
    let y = doc.y;

    // Header
    doc.rect(tableX, y, 495, rowHeight).fill("#000000");
    doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(9);

    doc.text("Jugador", tableX + 5, y + 12, { width: playerColWidth - 10, align: "left" });
    let currentX = tableX + playerColWidth;

    for (let i = 1; i <= roundsCount; i++) {
        doc.text(`R${i}`, currentX, y + 12, { width: colWidth, align: "center" });
        currentX += colWidth;
    }
    doc.text("Juegos", currentX, y + 12, { width: colWidth, align: "center" });
    currentX += colWidth;
    doc.text("Puntos", currentX, y + 12, { width: colWidth, align: "center" });

    y += rowHeight;

    // Rows
    players.forEach(p => {
        doc.rect(tableX, y, 495, rowHeight).stroke();
        doc.fillColor("#000000").font("Helvetica").fontSize(10);
        doc.text(p, tableX + 5, y + 12);

        let cx = tableX + playerColWidth;
        for (let i = 0; i < totalCols; i++) {
            doc.moveTo(cx, y).lineTo(cx, y + rowHeight).stroke();
            cx += colWidth;
        }
        y += rowHeight;
    });
}

function drawSponsorSection(doc: any) {
    const bottomY = 750;
    const boxWidth = 150;
    const boxHeight = 60;
    const spacing = 15;
    const startX = 50 + (495 - (boxWidth * 3 + spacing * 2)) / 2;

    doc.lineWidth(0.5).strokeColor("#cccccc");

    for (let i = 0; i < 3; i++) {
        const x = startX + i * (boxWidth + spacing);
        doc.rect(x, bottomY, boxWidth, boxHeight).stroke();
        doc.fontSize(8).fillColor("#999999").text(`PATROCINADOR ${i + 1}`, x, bottomY + boxHeight / 2 - 4, { width: boxWidth, align: "center" });
    }
}
