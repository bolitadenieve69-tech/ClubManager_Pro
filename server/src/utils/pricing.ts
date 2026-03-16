export interface PriceConfig {
    id?: string;
    hourly_rate: number;
    valid_days: string; // "1,2,3,4,5"
    start_time: string; // "08:00"
    end_time: string;   // "22:00"
    valid_from?: Date | null;
    valid_until?: Date | null;
}

export interface PricingOptions {
    granularityMinutes: number;
    defaultHourlyRate?: number;
}

/**
 * Divide un rango de tiempo en tramos de minutos específicos.
 */
export function splitIntoSegments(start: Date, end: Date, granularityMinutes: number = 30): { start: Date; end: Date }[] {
    const segments: { start: Date; end: Date }[] = [];
    let current = new Date(start);
    const endMs = end.getTime();

    while (current.getTime() < endMs) {
        const next = new Date(current.getTime() + granularityMinutes * 60 * 1000);
        const segmentEnd = next.getTime() > endMs ? new Date(endMs) : next;

        segments.push({
            start: new Date(current),
            end: segmentEnd
        });

        current = next;
    }

    return segments;
}

/**
 * Formatea una fecha a HH:mm para comparar con las franjas de precios.
 */
export function formatTimeHHMM(date: Date): string {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
}

function stripTime(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/**
 * Returns true if the given date falls within the price rule's seasonal range (if any).
 * Rules without valid_from/valid_until are always applicable.
 */
function isSeasonalMatch(price: PriceConfig, date: Date): boolean {
    if (!price.valid_from && !price.valid_until) return true;
    const day = stripTime(date);
    if (price.valid_from && day < stripTime(new Date(price.valid_from))) return false;
    if (price.valid_until && day > stripTime(new Date(price.valid_until))) return false;
    return true;
}

/**
 * Calcula el precio total de una reserva basándose en tramos horarios.
 * Prioridad: regla con rango de fechas > regla sin rango de fechas.
 */
export function calculateReservationPrice(
    start: Date,
    end: Date,
    prices: PriceConfig[],
    options: PricingOptions = { granularityMinutes: 30 }
): { totalCents: number; breakdown: any[] } {
    const granularity = options.granularityMinutes || 30;
    const segments = splitIntoSegments(start, end, granularity);
    let totalCents = 0;
    const breakdown: any[] = [];

    for (const segment of segments) {
        const segmentStartStr = formatTimeHHMM(segment.start);
        const dayOfWeek = segment.start.getDay().toString();

        // Filter rules that match day of week and time slot
        const candidates = prices.filter(p =>
            p.valid_days.includes(dayOfWeek) &&
            segmentStartStr >= p.start_time &&
            segmentStartStr < p.end_time &&
            isSeasonalMatch(p, segment.start)
        );

        // Prefer seasonal rules (with valid_from or valid_until) over permanent ones
        const seasonal = candidates.filter(p => p.valid_from || p.valid_until);
        const matchingPrice = seasonal.length > 0 ? seasonal[0] : candidates[0];

        const hourlyRate = matchingPrice?.hourly_rate ?? options.defaultHourlyRate;

        if (hourlyRate === undefined) {
            throw new Error(
                `No se encontró tarifa para el tramo ${segmentStartStr} (${getDayName(dayOfWeek)}). `
            );
        }

        const durationHours = (segment.end.getTime() - segment.start.getTime()) / (1000 * 60 * 60);
        const segmentCost = Math.round(durationHours * hourlyRate);

        totalCents += segmentCost;
        breakdown.push({
            start: segmentStartStr,
            duration: durationHours,
            rate: hourlyRate,
            rateCents: hourlyRate,
            cost: segmentCost
        });
    }

    return { totalCents, breakdown };
}

function getDayName(day: string): string {
    const names: Record<string, string> = {
        '0': 'Domingo', '1': 'Lunes', '2': 'Martes', '3': 'Miércoles', '4': 'Jueves', '5': 'Viernes', '6': 'Sábado'
    };
    return names[day] || day;
}
