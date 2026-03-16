import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Format a booking datetime ISO string for display.
 * The server stores times in UTC that directly represent the club's wall-clock time
 * (e.g. a "10:00" slot is stored as "T10:00:00Z"). We extract the time directly
 * from the ISO string to avoid browser timezone conversion adding an extra hour.
 */
export function fmtSlot(isoStr: string): string {
    // "2026-03-16T10:00:00.000Z" → "16 Mar, 10:00"
    const datePart = isoStr.substring(0, 10); // "2026-03-16"
    const timePart = isoStr.substring(11, 16); // "10:00"
    const [year, month, day] = datePart.split('-').map(Number);
    const d = new Date(year, month - 1, day); // local midnight, no TZ shift
    return `${format(d, 'dd MMM', { locale: es })}, ${timePart}`;
}
