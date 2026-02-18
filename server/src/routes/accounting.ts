import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db/prisma.js";
import { authMiddleware, AuthRequest, adminOnly } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear } from "date-fns";

export const accountingRouter = Router();

const accountingQuerySchema = z.object({
    period: z.enum(["weekly", "monthly", "quarterly", "yearly"]),
    year: z.coerce.number().optional(),
    value: z.coerce.number().optional(), // Mes (1-12) o Trimestre (1-4)
});

accountingRouter.get(
    "/summary",
    authMiddleware,
    adminOnly,
    asyncHandler(async (req: AuthRequest, res) => {
        const clubId = req.user?.clubId;
        const { period, year, value } = accountingQuerySchema.parse(req.query);
        const now = new Date();
        const targetYear = year || now.getFullYear();

        let startDate: Date;
        let endDate: Date;

        if (period === "weekly") {
            startDate = startOfWeek(now, { weekStartsOn: 1 });
            endDate = endOfWeek(now, { weekStartsOn: 1 });
        } else if (period === "monthly") {
            const month = value !== undefined ? value - 1 : now.getMonth();
            startDate = startOfMonth(new Date(targetYear, month));
            endDate = endOfMonth(new Date(targetYear, month));
        } else if (period === "quarterly") {
            const quarter = value !== undefined ? value : Math.floor(now.getMonth() / 3) + 1;
            startDate = startOfQuarter(new Date(targetYear, (quarter - 1) * 3));
            endDate = endOfQuarter(new Date(targetYear, (quarter - 1) * 3));
        } else {
            startDate = startOfYear(new Date(targetYear, 0));
            endDate = endOfYear(new Date(targetYear, 0));
        }

        // 1. Fetch Incomes (Invoices) - FISCAL
        const incomes = await prisma.invoice.findMany({
            where: {
                club_id: clubId,
                created_at: { gte: startDate, lte: endDate },
                status: "PAID"
            }
        });

        // 2. Fetch Expenses (SupplierInvoices) - FISCAL
        const expenses = await prisma.supplierInvoice.findMany({
            where: {
                club_id: clubId,
                date: { gte: startDate, lte: endDate },
                status: "PAID"
            }
        });

        // 3. Fetch Internal Movements (Caja - Sin Trascendencia Fiscal)
        // Excluimos GASTO_PROVEEDOR porque ya están en expenses y tienen IVA
        const internalMovements = await prisma.movement.findMany({
            where: {
                club_id: clubId,
                date: { gte: startDate, lte: endDate },
                category: { not: "GASTO_PROVEEDOR" }
            }
        });

        const incomeTotal = incomes.reduce((acc, inv) => acc + inv.total_cents, 0);
        const expenseTotal = expenses.reduce((acc, exp) => acc + exp.amount_cents, 0);

        const internalIncomeTotal = internalMovements
            .filter(m => m.amount_cents > 0)
            .reduce((acc, m) => acc + m.amount_cents, 0);
        const internalExpenseTotal = internalMovements
            .filter(m => m.amount_cents < 0)
            .reduce((acc, m) => acc + m.amount_cents, 0);

        // Calculate VAT (assuming 21% default for now)
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

        const fiscalIncome = calculateVAT(incomeTotal);
        const fiscalExpense = calculateVAT(expenseTotal);

        res.json({
            period,
            range: { start: startDate, end: endDate },
            income: {
                ...fiscalIncome,
                count: incomes.length
            },
            expense: {
                ...fiscalExpense,
                count: expenses.length
            },
            internal: {
                income: Number((internalIncomeTotal / 100).toFixed(2)),
                expense: Number((Math.abs(internalExpenseTotal) / 100).toFixed(2)),
                balance: Number(((internalIncomeTotal + internalExpenseTotal) / 100).toFixed(2)),
                count: internalMovements.length
            },
            balance: Number(((incomeTotal - expenseTotal + internalIncomeTotal + internalExpenseTotal) / 100).toFixed(2)),
            vat_result: Number((fiscalIncome.vat - fiscalExpense.vat).toFixed(2))
        });
    })
);

accountingRouter.get(
    "/export",
    authMiddleware,
    adminOnly,
    asyncHandler(async (req: AuthRequest, res) => {
        const clubId = req.user?.clubId;
        const { period, year, value } = accountingQuerySchema.parse(req.query);
        const targetYear = year || new Date().getFullYear();
        let startDate: Date;
        let endDate: Date;

        if (period === "weekly") {
            startDate = startOfWeek(new Date(), { weekStartsOn: 1 });
            endDate = endOfWeek(new Date(), { weekStartsOn: 1 });
        } else if (period === "monthly") {
            const month = value !== undefined ? value - 1 : new Date().getMonth();
            startDate = startOfMonth(new Date(targetYear, month));
            endDate = endOfMonth(new Date(targetYear, month));
        } else if (period === "quarterly") {
            const quarter = value !== undefined ? value : Math.floor(new Date().getMonth() / 3) + 1;
            startDate = startOfQuarter(new Date(targetYear, (quarter - 1) * 3));
            endDate = endOfQuarter(new Date(targetYear, (quarter - 1) * 3));
        } else {
            startDate = startOfYear(new Date(targetYear, 0));
            endDate = endOfYear(new Date(targetYear, 0));
        }

        const incomes = await prisma.invoice.findMany({
            where: { club_id: clubId, created_at: { gte: startDate, lte: endDate } },
            orderBy: { created_at: "asc" }
        });

        const expenses = await prisma.supplierInvoice.findMany({
            where: { club_id: clubId, date: { gte: startDate, lte: endDate } },
            orderBy: { date: "asc" }
        });

        const internalMovements = await prisma.movement.findMany({
            where: {
                club_id: clubId,
                date: { gte: startDate, lte: endDate },
                category: { not: "GASTO_PROVEEDOR" }
            },
            orderBy: { date: "asc" }
        });

        const filename = `contabilidad_${period}_${targetYear}.xlsx`;
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

        const { buildAccountingExcel } = await import("../utils/xlsx/buildAccountingExcel.js");
        await buildAccountingExcel(res, { incomes, expenses, internalMovements, period, range: { start: startDate, end: endDate } });
    })
);
