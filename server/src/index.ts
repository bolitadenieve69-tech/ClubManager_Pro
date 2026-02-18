import express from 'express';
import cors from 'cors';
import { env } from './utils/env.js';
import { startExpirationJob } from './utils/jobs.js';

const app = express();
const PORT = parseInt(env.PORT);

// Standard Middlewares
app.use(cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
}));
app.use(express.json());

// Health Check
app.get('/health', (req, res) => {
    res.json({
        ok: true,
        timestamp: new Date().toISOString(),
        version: env.APP_VERSION,
        status: 'Running'
    });
});

// Root route
app.get('/', (req, res) => {
    res.send('ClubManager Pro API is running');
});

// Routes
import authRoutes from './routes/auth.js';
import clubRoutes from './routes/club.js';
import { courtsRouter } from './routes/courts.js';
import { reservationsRouter } from './routes/reservations.js';
import { ratesRouter } from "./routes/rates.js";
import { pricesRouter } from "./routes/prices.js";
import { invoicesRouter } from "./routes/invoices.js";
import { billingRouter } from "./routes/billing.js";
import { kpisRouter } from "./routes/kpis.js";
import { insightsRouter } from "./routes/insights.js";
import { reportsRouter } from "./routes/reports.js";
import { closeoutsRouter } from "./routes/closeouts.js";
import { movementsRouter } from "./routes/movements.js";
import { tournamentsRouter } from "./routes/tournaments.js";
import { membersRouter } from "./routes/members.js";
import { occupancyRouter } from "./routes/occupancy.js";
import { bookingsRouter } from "./routes/bookings.js";
import supplierInvoicesRouter from "./routes/supplierInvoices.js";
import { accountingRouter } from "./routes/accounting.js";

app.use("/auth", authRoutes);
app.use("/club", clubRoutes);
app.use("/courts", courtsRouter);
app.use("/reservations", reservationsRouter);
app.use("/rates", ratesRouter);
app.use("/prices", pricesRouter);
app.use("/invoices", invoicesRouter);
app.use("/billing", billingRouter);
app.use("/kpis", kpisRouter);
app.use("/insights", insightsRouter);
app.use("/reports", reportsRouter);
app.use("/closeouts", closeoutsRouter);
app.use("/movements", movementsRouter);
app.use("/tournaments", tournamentsRouter);
app.use("/members", membersRouter);
app.use("/occupancy", occupancyRouter);
app.use("/bookings", bookingsRouter);
app.use("/supplier-invoices", supplierInvoicesRouter);
app.use("/accounting", accountingRouter);
// app.use("/club", clubRoutes);

// Error Handling
app.use((req, res) => {
    res.status(404).json({ error: 'Not Found' });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
    console.log(`📊 Health check: http://0.0.0.0:${PORT}/health`);
    console.log(`🌍 Environment: ${env.NODE_ENV}`);
    startExpirationJob();
});

export default app;
