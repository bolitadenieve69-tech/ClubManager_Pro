export type RecurringRule = {
    frequency: 'weekly';
    interval: number; // e.g., 1 for every week, 2 for bi-weekly
    weekdays: number[]; // 0 for Sunday, 1 for Monday...
    endCondition: 'date' | 'count';
    endDate?: Date;
    maxOccurrences?: number;
};

export type Occurrence = {
    start: Date;
    end: Date;
    isValid?: boolean;
    reason?: string;
};

/**
 * Generates a list of occurrences based on a recurring rule.
 */
export function generateOccurrences(
    baseStart: Date,
    baseEnd: Date,
    rule: RecurringRule
): Occurrence[] {
    const occurrences: Occurrence[] = [];
    let tempDate = new Date(baseStart);

    // Duration in ms
    const duration = baseEnd.getTime() - baseStart.getTime();

    let count = 0;
    const maxLoops = 500; // Safety brake

    while (true) {
        if (rule.endCondition === 'count' && count >= (rule.maxOccurrences || 1)) break;
        if (rule.endCondition === 'date' && rule.endDate && tempDate > rule.endDate) break;
        if (count >= maxLoops) break;

        const day = tempDate.getDay();

        if (rule.weekdays.includes(day)) {
            const occurrenceStart = new Date(tempDate);
            occurrenceStart.setHours(baseStart.getHours(), baseStart.getMinutes(), baseStart.getSeconds(), baseStart.getMilliseconds());

            const occurrenceEnd = new Date(occurrenceStart.getTime() + duration);

            // Validate midnight
            const isSameDay = occurrenceStart.getFullYear() === occurrenceEnd.getFullYear() &&
                occurrenceStart.getMonth() === occurrenceEnd.getMonth() &&
                occurrenceStart.getDate() === occurrenceEnd.getDate();

            const isMidnightEnd = occurrenceEnd.getHours() === 0 && occurrenceEnd.getMinutes() === 0 && occurrenceEnd.getSeconds() === 0;
            const prevDayOfEnd = new Date(occurrenceEnd.getTime() - 1000);
            const isSameDayIfMidnight = occurrenceStart.getFullYear() === prevDayOfEnd.getFullYear() &&
                occurrenceStart.getMonth() === prevDayOfEnd.getMonth() &&
                occurrenceStart.getDate() === prevDayOfEnd.getDate();

            const isValid = isSameDay || (isMidnightEnd && isSameDayIfMidnight);

            occurrences.push({
                start: occurrenceStart,
                end: occurrenceEnd,
                isValid,
                reason: isValid ? undefined : "Cruza medianoche"
            });
            count++;
        }

        if (day === 0 && rule.interval > 1) {
            tempDate.setDate(tempDate.getDate() + 1 + (7 * (rule.interval - 1)));
        } else {
            tempDate.setDate(tempDate.getDate() + 1);
        }
    }

    return occurrences;
}
