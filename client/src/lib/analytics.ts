import { apiFetch } from './api';

export interface KpiData {
    meta: { from: string; to: string; courtId: string };
    totals: {
        reservations: number;
        minutesBooked: number;
        hoursBooked: number;
        revenue: number;
        cancelledCount: number;
        cancellationRate: number;
    };
    byCourt: Array<{
        courtId: string;
        courtName: string;
        minutesBooked: number;
        minutesAvailable: number;
        occupancyPct: number;
        revenue: number;
        cancelledCount: number;
        reservations: number;
    }>;
    heatmap: {
        bucketMinutes: number;
        days: string[];
        timeSlots: string[];
        matrix: number[][];
        unit: string;
    };
    peakOffpeak: {
        topByOccupancy: Array<{ day: string; time: string; minutesBooked: number }>;
        bottomByOccupancy: Array<{ day: string; time: string; minutesBooked: number }>;
    };
}

export interface InsightData {
    period: { from: string; to: string };
    currentStatsSummary: {
        occupancyPct: number;
        revenue: number;
        cancellationRate: number;
    };
    comparisons?: {
        previousPeriod: {
            delta: {
                occupancyPct: number;
                revenue: number;
                cancellationRate: number;
            };
        };
    };
    alerts: Array<{
        id: string;
        title: string;
        threshold: string;
        value: number;
    }>;
    insights: Array<{
        id: string;
        type: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
        title: string;
        summary: string;
        severity: 'normal' | 'critical';
        impact: 'HIGH' | 'MEDIUM' | 'LOW';
        recommendations: Array<{
            label: string;
            expectedImpact: {
                direction: string;
                range: string;
            };
        }>;
    }>;
    recommendations: string[];
}

export const analyticsApi = {
    getKpis: (filters: { from: string; to: string; courtId: string; segmentMinutes: number; includeCancelled: boolean }) =>
        apiFetch<KpiData>('/kpis/operational', {
            method: 'POST',
            body: JSON.stringify(filters)
        }),
    getInsights: (filters: { from: string; to: string }) =>
        apiFetch<InsightData>('/insights/operational', {
            method: 'POST',
            body: JSON.stringify(filters)
        })
};
