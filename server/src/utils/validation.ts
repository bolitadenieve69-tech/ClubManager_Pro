export interface DaySchedule {
    open: string;  // "HH:mm"
    close: string; // "HH:mm"
}

export interface OpenHours {
    [day: string]: DaySchedule; // "0" to "6"
}

/**
 * Checks if a time range is within the club's opening hours.
 */
export function isWithinOpenHours(start: Date, end: Date, openHours: string | object): boolean {
    let hours: OpenHours;
    try {
        hours = typeof openHours === 'string' ? JSON.parse(openHours) : openHours as OpenHours;
    } catch {
        return true; // If invalid JSON, assume open (prevent lockout)
    }

    if (!hours || Object.keys(hours).length === 0) return true;

    const day = start.getDay().toString();
    const schedule = hours[day];

    if (!schedule) return false; // Day not in schedule = closed

    const startStr = formatTimeHHMM(start);
    const endStr = formatTimeHHMM(end);

    // Note: This logic assumes reservations don't cross midnight
    // (which is already validated in the reservation router)
    
    // Handle special case where close is "00:00" (meaning end of day)
    const clubClose = schedule.close === "00:00" ? "24:00" : schedule.close;
    const resEnd = endStr === "00:00" ? "24:00" : endStr;

    return startStr >= schedule.open && resEnd <= clubClose;
}

function formatTimeHHMM(date: Date): string {
    return date.getHours().toString().padStart(2, '0') + ':' + 
           date.getMinutes().toString().padStart(2, '0');
}
