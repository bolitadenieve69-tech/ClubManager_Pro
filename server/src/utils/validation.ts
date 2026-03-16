const SPAIN_TZ = 'Europe/Madrid';

/** Returns "HH:MM" for a UTC Date converted to Spain local time */
export function getSpainHHMM(d: Date): string {
    return d.toLocaleTimeString('es-ES', {
        timeZone: SPAIN_TZ,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    });
}

/** Returns the weekday index (0=Sun…6=Sat) for a UTC Date in Spain local time */
export function getSpainDay(d: Date): number {
    const dayStr = d.toLocaleDateString('en-US', { timeZone: SPAIN_TZ, weekday: 'long' });
    return ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'].indexOf(dayStr);
}

/**
 * Convert a Spain local datetime (dateStr "YYYY-MM-DD", timeStr "HH:MM")
 * to a UTC Date, correctly accounting for Spain DST.
 */
export function spainLocalToUtc(dateStr: string, timeStr: string): Date {
    // Naive: pretend the time is UTC
    const naive = new Date(`${dateStr}T${timeStr}:00Z`);
    // What does Spain actually show for that UTC timestamp?
    const spainHHMM = getSpainHHMM(naive);
    const [sh, sm] = spainHHMM.split(':').map(Number);
    const [th, tm] = timeStr.split(':').map(Number);
    const diffMinutes = (sh * 60 + sm) - (th * 60 + tm);
    return new Date(naive.getTime() - diffMinutes * 60000);
}

export interface DaySchedule {
    open: string;  // "HH:mm"
    close: string; // "HH:mm"
}

export interface OpenHours {
    [day: string]: DaySchedule; // "0" to "6"
}

/**
 * Checks if a time range is within the club's opening hours.
 * All comparisons are done in Spain local time (Europe/Madrid).
 */
export function isWithinOpenHours(start: Date, end: Date, openHours: string | object): boolean {
    let hours: OpenHours;
    try {
        hours = typeof openHours === 'string' ? JSON.parse(openHours) : openHours as OpenHours;
    } catch {
        return true;
    }

    if (!hours || Object.keys(hours).length === 0) return true;

    const day = getSpainDay(start).toString();
    const schedule = hours[day];

    if (!schedule) return false;

    const startStr = getSpainHHMM(start);
    const endStr = getSpainHHMM(end);

    const clubClose = schedule.close === '00:00' ? '24:00' : schedule.close;
    const resEnd = endStr === '00:00' ? '24:00' : endStr;

    return startStr >= schedule.open && resEnd <= clubClose;
}
