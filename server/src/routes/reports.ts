import { Router } from "express";
import PDFDocument from "pdfkit";
import { z } from "zod";
import { prisma } from "../db/prisma.js";
import { authMiddleware, AuthRequest, adminOnly } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../middleware/error.js";
import { buildReport } from "../utils/pdf/buildReport.js";
import { KPI_CONFIG } from "../config/kpis.js";

export const reportsRouter = Router();

const pdfRequestSchema = z.object({
    reportType: z.enum(["summary", "invoice", "reservation", "single_invoice"]),
    reportData: z.record(z.string(), z.any()),
    filenameHint: z.string().optional()
});

const billingReportSchema = z.object({
    month: z.coerce.number().min(1).max(12),
    year: z.coerce.number().min(2020).max(2100)
});

const courtReportSchema = z.object({
    from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    courtId: z.string(), // "all" or valid UUID
    includeCancelled: z.boolean().optional().default(false)
});

reportsRouter.post(
    "/pdf",
    authMiddleware,
    asyncHandler(async (req: any, res) => {
        const validated = pdfRequestSchema.safeParse(req.body);
        if (!validated.success) {
            throw new ApiError(400, "VALIDATION_ERROR", (validated as any).error.errors);
        }

        const { reportType, reportData, filenameHint } = validated.data;

        const doc = new PDFDocument({ margin: 50, size: "A4", bufferPages: true });
        const filename = filenameHint || `reporte-${reportType}-${new Date().getTime()}.pdf`;

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
        res.setHeader("Cache-Control", "no-store");

        doc.pipe(res);

        await buildReport(doc, reportType, reportData);

        doc.end();
    })
);

reportsRouter.post(
    "/xlsx",
    authMiddleware,
    asyncHandler(async (req: any, res) => {
        const validated = pdfRequestSchema.safeParse(req.body);
        if (!validated.success) {
            throw new ApiError(400, "VALIDATION_ERROR", (validated as any).error.errors);
        }

        const { reportType, reportData, filenameHint } = validated.data;
        const filename = filenameHint || `reporte-${reportType}-${new Date().getTime()}.xlsx`;

        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
        res.setHeader("Cache-Control", "no-store");

        const { buildExcel } = await import("../utils/xlsx/buildExcel.js");
        await buildExcel(res, reportType, reportData);
    })
);

reportsRouter.get(
    "/billing",
    authMiddleware,
    adminOnly,
    asyncHandler(async (req: any, res) => {
        const clubId = (req as AuthRequest).user?.clubId;
        const parsed = billingReportSchema.parse(req.query);

        const startDate = new Date(parsed.year, parsed.month - 1, 1);
        const endDate = new Date(parsed.year, parsed.month, 0, 23, 59, 59);

        const invoices = await prisma.invoice.findMany({
            where: {
                club_id: clubId,
                created_at: {
                    gte: startDate,
                    lte: endDate
                }
            },
            include: {
                bookings: { select: { id: true, total_cents: true } }
            }
        });

        const totalRevenue = invoices.reduce((acc: number, inv: any) => acc + inv.total_cents, 0);
        const invoiceCount = invoices.length;
        const paidCount = invoices.filter((inv: any) => inv.status === "PAID").length;

        res.json({
            period: `${parsed.month}/${parsed.year}`,
            summary: {
                totalRevenue,
                invoiceCount,
                paidCount,
                averageTicket: invoiceCount > 0 ? Math.round(totalRevenue / invoiceCount) : 0
            },
            invoices: invoices.map((inv: any) => ({
                number: inv.number,
                date: inv.created_at,
                total: inv.total_cents,
                status: inv.status
            }))
        });
    })
);

reportsRouter.get(
    "/courts",
    authMiddleware,
    adminOnly,
    asyncHandler(async (req: any, res) => {
        const clubId = (req as AuthRequest).user?.clubId;
        const courts = await prisma.court.findMany({
            where: { club_id: clubId },
            select: { id: true, name: true },
            orderBy: { name: "asc" }
        });
        res.json({ courts });
    })
);

reportsRouter.post(
    "/courts/summary",
    authMiddleware,
    adminOnly,
    asyncHandler(async (req: any, res) => {
        const clubId = (req as AuthRequest).user?.clubId;
        const parsed = courtReportSchema.parse(req.body);

        const startDate = new Date(`${parsed.from}T00:00:00Z`);
        const endDate = new Date(`${parsed.to}T23:59:59Z`);

        const whereClause: any = {
            club_id: clubId,
            start_at: { gte: startDate },
            end_at: { lte: endDate }
        };

        if (parsed.courtId !== "all") {
            whereClause.court_id = parsed.courtId;
        }

        if (!parsed.includeCancelled) {
            whereClause.status = { not: "CANCELLED" };
        }

        const reservations = await prisma.booking.findMany({
            where: whereClause,
            include: { court: true, user: true },
            orderBy: [{ start_at: "asc" }, { court: { name: "asc" } }]
        });

        const summaryByCourt: Record<string, any> = {};
        const details = [];

        for (const resv of reservations) {
            const courtId = resv.court_id!;
            const courtName = resv.court?.name || "Desconocida";
            const durationMinutes = (resv.end_at.getTime() - resv.start_at.getTime()) / 60000;
            const price = resv.status === "CANCELLED" ? 0 : (resv.total_cents / 100);

            if (!summaryByCourt[courtId]) {
                summaryByCourt[courtId] = {
                    courtId,
                    courtName,
                    reservations: 0,
                    hours: 0,
                    revenue: 0,
                    cancelledCount: 0
                };
            }

            if (resv.status === "CANCELLED") {
                summaryByCourt[courtId].cancelledCount += 1;
            } else {
                summaryByCourt[courtId].reservations += 1;
                summaryByCourt[courtId].hours += durationMinutes / 60;
                summaryByCourt[courtId].revenue += price;
            }

            if (resv.status !== "CANCELLED" || parsed.includeCancelled) {
                details.push({
                    id: resv.id,
                    date: resv.start_at.toISOString().split('T')[0],
                    courtId,
                    courtName,
                    start: resv.start_at.toISOString().substring(11, 16),
                    end: resv.end_at.toISOString().substring(11, 16),
                    durationMinutes,
                    clientName: resv.user?.email || "Invitado",
                    status: resv.status,
                    priceTotal: price
                });
            }
        }

        const summaryList = Object.values(summaryByCourt);
        const totals = {
            reservations: summaryList.reduce((acc, c) => acc + c.reservations, 0),
            hours: Number(summaryList.reduce((acc, c) => acc + c.hours, 0).toFixed(2)),
            revenue: Number(summaryList.reduce((acc, c) => acc + c.revenue, 0).toFixed(2)),
            cancelledCount: summaryList.reduce((acc, c) => acc + c.cancelledCount, 0)
        };

        res.json({
            meta: { ...parsed, timezone: KPI_CONFIG.timezone },
            summaryByCourt: summaryList.map(s => ({ ...s, hours: Number(s.hours.toFixed(2)), revenue: Number(s.revenue.toFixed(2)) })),
            details,
            totals
        });
    })
);

reportsRouter.post(
    "/courts/xlsx",
    authMiddleware,
    adminOnly,
    asyncHandler(async (req: any, res) => {
        const clubId = (req as AuthRequest).user?.clubId;
        const parsed = courtReportSchema.parse(req.body);

        const startDate = new Date(`${parsed.from}T00:00:00Z`);
        const endDate = new Date(`${parsed.to}T23:59:59Z`);

        const whereClause: any = {
            club_id: clubId,
            start_at: { gte: startDate },
            end_at: { lte: endDate }
        };

        let courtNameSuffix = "";
        if (parsed.courtId !== "all") {
            whereClause.court_id = parsed.courtId;
            const targetCourt = await prisma.court.findUnique({ where: { id: parsed.courtId } });
            if (targetCourt) courtNameSuffix = `_${targetCourt.name.replace(/\s+/g, '_')}`;
        }

        const reservations = await prisma.booking.findMany({
            where: whereClause,
            include: { court: true, user: true },
            orderBy: [{ start_at: "asc" }, { court: { name: "asc" } }]
        });

        const summaryByCourt: Record<string, any> = {};
        const details = [];

        for (const resv of reservations) {
            const courtId = resv.court_id!;
            const durationMinutes = (resv.end_at.getTime() - resv.start_at.getTime()) / 60000;
            const price = resv.status === "CANCELLED" ? 0 : (resv.total_cents / 100);

            if (!summaryByCourt[courtId]) {
                summaryByCourt[courtId] = {
                    courtName: resv.court?.name || "Pista",
                    reservations: 0,
                    hours: 0,
                    revenue: 0,
                    cancelledCount: 0
                };
            }

            if (resv.status === "CANCELLED") {
                summaryByCourt[courtId].cancelledCount += 1;
            } else {
                summaryByCourt[courtId].reservations += 1;
                summaryByCourt[courtId].hours += durationMinutes / 60;
                summaryByCourt[courtId].revenue += price;
            }

            if (resv.status !== "CANCELLED" || parsed.includeCancelled) {
                details.push({
                    date: resv.start_at.toISOString().split('T')[0],
                    courtName: resv.court?.name || "Pista",
                    start: resv.start_at.toISOString().substring(11, 16),
                    end: resv.end_at.toISOString().substring(11, 16),
                    durationMinutes,
                    clientName: resv.user?.email || "Invitado",
                    status: resv.status,
                    priceTotal: price
                });
            }
        }

        const summaryList = Object.values(summaryByCourt);
        const totals = {
            reservations: summaryList.reduce((acc, c) => acc + c.reservations, 0),
            hours: Number(summaryList.reduce((acc, c) => acc + c.hours, 0).toFixed(2)),
            revenue: Number(summaryList.reduce((acc, c) => acc + c.revenue, 0).toFixed(2)),
            cancelledCount: summaryList.reduce((acc, c) => acc + c.cancelledCount, 0)
        };

        const filename = `reporte_pistas${courtNameSuffix}_${parsed.from}_al_${parsed.to}.xlsx`;
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

        const { buildCourtReportExcel } = await import("../utils/xlsx/buildCourtReportExcel.js");
        await buildCourtReportExcel(res, { summaryByCourt: summaryList, details, totals });
    })
);
