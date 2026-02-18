import { useEffect, useState } from "react";
import { apiFetch, ApiError } from "../lib/api";
import { format, addMinutes, startOfDay, endOfDay } from "date-fns";
import { es } from "date-fns/locale";
import {
    Printer,
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    Loader2,
    Table2,
    Users
} from "lucide-react";
import { cn } from "../lib/utils";

type Reservation = {
    id: string;
    court: { name: string };
    user: { email: string, full_name: string | null };
    start_at: string;
    end_at: string;
    status: string;
    court_id: string;
};

type Court = {
    id: string;
    name: string;
    is_active?: boolean;
};

export default function HorarioDiario() {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [courts, setCourts] = useState<Court[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const timeSlots = [];
    let current = startOfDay(new Date(date));
    current = addMinutes(current, 8 * 60); // Start at 08:00
    const end = addMinutes(startOfDay(new Date(date)), 23 * 60); // End at 23:00

    while (current <= end) {
        timeSlots.push(format(current, 'HH:mm'));
        current = addMinutes(current, 30);
    }

    async function loadData() {
        setLoading(true);
        setError("");
        try {
            const [resData, courtData] = await Promise.all([
                apiFetch<{ reservations: Reservation[] }>(`/reservations?date=${date}`),
                apiFetch<{ courts: Court[] }>("/courts")
            ]);

            // Filter reservations for the selected day manually if backend doesn't support date param yet
            // (Assuming backend returns all for simplicity or we handle it here)
            const dayStart = startOfDay(new Date(date)).getTime();
            const dayEnd = endOfDay(new Date(date)).getTime();

            const filtered = resData.reservations.filter(r => {
                const start = new Date(r.start_at).getTime();
                return start >= dayStart && start <= dayEnd && r.status === 'CONFIRMED';
            });

            setReservations(filtered);
            setCourts(courtData.courts.filter(c => c.is_active !== false));
        } catch (e: any) {
            setError(e instanceof ApiError ? e.message : "Error al cargar datos.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadData();
    }, [date]);

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="space-y-6">
            {/* Header - Not visible in print if we use utility classes */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
                <div className="flex flex-col gap-1">
                    <h1 className="text-3xl font-black tracking-tighter text-slate-900 uppercase italic">Horario Diario</h1>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Printer className="w-4 h-4 text-indigo-500" /> Vista de Control Presencial
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                        <button
                            onClick={() => setDate(prev => format(addMinutes(new Date(prev), -24 * 60), 'yyyy-MM-dd'))}
                            className="p-3 hover:bg-slate-50 transition-colors text-slate-400"
                            title="Día anterior"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <div className="px-6 py-2 flex items-center gap-3 border-x border-slate-100 min-w-[200px] justify-center">
                            <CalendarIcon className="w-4 h-4 text-indigo-500" />
                            <span className="text-sm font-black text-slate-700 uppercase">
                                {format(new Date(date), "EEEE, d 'de' MMMM", { locale: es })}
                            </span>
                        </div>
                        <button
                            onClick={() => setDate(prev => format(addMinutes(new Date(prev), 24 * 60), 'yyyy-MM-dd'))}
                            className="p-3 hover:bg-slate-50 transition-colors text-slate-400"
                            title="Día siguiente"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>

                    <button
                        onClick={handlePrint}
                        className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-sm tracking-widest uppercase hover:bg-black transition-all flex items-center gap-3 shadow-xl shadow-slate-900/20"
                    >
                        <Printer className="w-4 h-4" /> Imprimir
                    </button>
                </div>
            </div>

            {/* Print Header (Only visible when printing) */}
            <div className="hidden print:block mb-8 text-center border-b-4 border-slate-900 pb-6">
                <h1 className="text-4xl font-black uppercase italic tracking-tighter">Planilla de Reservas</h1>
                <p className="text-xl font-bold mt-2">
                    {format(new Date(date), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
                </p>
            </div>

            {loading ? (
                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-premium p-20 flex flex-col items-center justify-center gap-4">
                    <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
                    <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Generando cuadrícula...</p>
                </div>
            ) : error ? (
                <div className="bg-red-50 text-red-600 p-8 rounded-[2.5rem] border border-red-100 flex flex-col items-center gap-3">
                    <p className="font-bold">{error}</p>
                    <button onClick={loadData} className="text-sm underline font-black">Reintentar</button>
                </div>
            ) : (
                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-premium overflow-hidden print:border-none print:shadow-none">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr>
                                    <th className="w-24 p-6 bg-slate-50 border-r border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Hora</th>
                                    {courts.map(court => (
                                        <th key={court.id} className="p-6 bg-slate-50 border-r border-b border-slate-100 text-xs font-black text-slate-900 uppercase tracking-widest text-center">
                                            <div className="flex flex-col items-center gap-1">
                                                <Table2 className="w-4 h-4 text-indigo-400" />
                                                {court.name}
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {timeSlots.map(time => (
                                    <tr key={time} className="group">
                                        <td className="p-4 border-r border-b border-slate-50 bg-slate-50/30 text-xs font-black text-slate-600 text-center">
                                            {time}
                                        </td>
                                        {courts.map(court => {
                                            const booking = reservations.find(r => {
                                                const start = format(new Date(r.start_at), 'HH:mm');
                                                const end = format(new Date(r.end_at), 'HH:mm');
                                                return r.court_id === court.id && time >= start && time < end;
                                            });

                                            return (
                                                <td key={court.id} className={cn(
                                                    "p-2 border-r border-b border-slate-50 group-hover:bg-slate-50/50 transition-colors h-16 min-w-[150px]",
                                                    booking ? "bg-indigo-50/30 font-medium" : ""
                                                )}>
                                                    {booking ? (
                                                        <div className="flex flex-col gap-1 p-2 rounded-xl bg-white border border-indigo-100 shadow-sm print:shadow-none print:border-slate-300">
                                                            <span className="text-xs font-black text-slate-900 leading-tight uppercase tracking-tight truncate">
                                                                {booking.user.full_name || booking.user.email.split('@')[0]}
                                                            </span>
                                                            <div className="flex items-center gap-1 opacity-60">
                                                                <Users className="w-3 h-3" />
                                                                <span className="text-[9px] font-bold text-slate-500 uppercase">Reserva #{booking.id.slice(0, 4)}</span>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <span className="text-[10px] font-black text-slate-200">DISPONIBLE</span>
                                                        </div>
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em] text-center mt-8 print:block hidden">
                ClubManager Pro &copy; {new Date().getFullYear()} — Generado el {format(new Date(), 'dd/MM/yyyy HH:mm')}
            </p>
        </div>
    );
}
