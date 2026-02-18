export interface OpeningHours {
    start: string;
    end: string;
}

export function calculateMinutesAvailable(
    startDate: Date,
    endDate: Date,
    openingHours: Record<string, OpeningHours>
): number {
    let minutesAvailable = 0;
    const current = new Date(startDate);

    while (current <= endDate) {
        const dayOfWeek = current.getDay().toString();
        const hours = openingHours[dayOfWeek];
        if (hours) {
            const [sh, sm] = hours.start.split(":").map(Number);
            const [eh, em] = hours.end.split(":").map(Number);
            minutesAvailable += (eh * 60 + em) - (sh * 60 + sm);
        }
        current.setDate(current.getDate() + 1);
    }
    return minutesAvailable;
}

export function generateHeatmap(
    reservations: any[],
    timeSlots: string[],
    segmentMinutes: number,
    dayToIndex: Record<number, number>
): number[][] {
    const matrix = Array.from({ length: 7 }, () => Array(timeSlots.length).fill(0));

    for (const resv of reservations) {
        const dayOfWeek = resv.start_time.getDay();
        const row = dayToIndex[dayOfWeek as keyof typeof dayToIndex];
        if (row === undefined) continue;

        const startTotalMin = resv.start_time.getUTCHours() * 60 + resv.start_time.getUTCMinutes();
        const endTotalMin = resv.end_time.getUTCHours() * 60 + resv.end_time.getUTCMinutes();

        timeSlots.forEach((slot, col) => {
            const [sh, sm] = slot.split(":").map(Number);
            const slotStart = sh * 60 + sm;
            const slotEnd = slotStart + segmentMinutes;

            const overlapStart = Math.max(startTotalMin, slotStart);
            const overlapEnd = Math.min(endTotalMin, slotEnd);

            if (overlapStart < overlapEnd) {
                matrix[row][col] += (overlapEnd - overlapStart);
            }
        });
    }
    return matrix;
}
