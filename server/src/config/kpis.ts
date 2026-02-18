export const KPI_CONFIG = {
    timezone: "Europe/Madrid",
    segmentMinutes: 30,
    openingHours: {
        "1": { start: "08:00", end: "22:00" }, // Lunes
        "2": { start: "08:00", end: "22:00" },
        "3": { start: "08:00", end: "22:00" },
        "4": { start: "08:00", end: "22:00" },
        "5": { start: "08:00", end: "22:00" },
        "6": { start: "09:00", end: "21:00" },
        "0": { start: "09:00", end: "21:00" }  // Domingo
    },
    thresholds: {
        lowOccupancy: 0.15,
        overcrowded: 0.85,
        cancellationSpike: 0.15,
        imbalanceDelta: 0.20
    }
} as const;

export type KPIConfig = typeof KPI_CONFIG;
