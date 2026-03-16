import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Format a booking datetime ISO string using Spain browser local time.
 * The server stores UTC datetimes that represent Spain wall-clock time correctly,
 * so new Date() in a Spain-timezone browser gives the right display time.
 */
export function fmtSlot(isoStr: string): string {
    return format(new Date(isoStr), 'dd MMM, HH:mm', { locale: es });
}
