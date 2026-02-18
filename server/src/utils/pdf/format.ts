/**
 * Formatea un número como moneda EUR.
 */
export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat("es-ES", {
        style: "currency",
        currency: "EUR",
    }).format(amount / 100);
}

/**
 * Formatea una fecha en formato legible.
 */
export function formatDate(date: string | Date): string {
    const d = typeof date === "string" ? new Date(date) : date;
    return new Intl.DateTimeFormat("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(d);
}
