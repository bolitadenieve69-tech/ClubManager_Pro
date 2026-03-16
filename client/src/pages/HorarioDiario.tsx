import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { apiFetch, ApiError } from "../lib/api";
import { format, addMinutes, startOfDay, endOfDay, startOfWeek, addDays } from "date-fns";
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

type ViewMode = "dia" | "semana";

export default function HorarioDiario() {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [courts, setCourts] = useState<Court[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [viewMode, setViewMode] = useState<ViewMode>("dia");
    const [selectedCourtId, setSelectedCourtId] = useState<string>("");
    // weekReservations: map from dateStr (yyyy-MM-dd) -> Reservation[]
    const [weekReservations, setWeekReservations] = useState<Record<string, Reservation[]>>({});
    const [weekLoading, setWeekLoading] = useState(false);
    const [weekError, setWeekError] = useState("");

    const timeSlots: string[] = [];
    let current = startOfDay(new Date(date));
    current = addMinutes(current, 8 * 60); // Start at 08:00
    const end = addMinutes(startOfDay(new Date(date)), 23 * 60); // End at 23:00

    while (current <= end) {
        timeSlots.push(format(current, 'HH:mm'));
        current = addMinutes(current, 30);
    }

    // Compute the 7 days of the week containing `date` (Mon-Sun)
    const weekStart = startOfWeek(new Date(date), { weekStartsOn: 1 });
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

    async function loadData() {
        setLoading(true);
        setError("");
        try {
            const [resData, courtData] = await Promise.all([
                apiFetch<{ reservations: Reservation[] }>(`/reservations?date=${date}`),
                apiFetch<{ courts: Court[] }>("/courts")
            ]);

            const dayStart = startOfDay(new Date(date)).getTime();
            const dayEnd = endOfDay(new Date(date)).getTime();

            const filtered = resData.reservations.filter(r => {
                const start = new Date(r.start_at).getTime();
                return start >= dayStart && start <= dayEnd && r.status === 'CONFIRMED';
            });

            setReservations(filtered);
            const activeCourts = courtData.courts.filter(c => c.is_active !== false);
            setCourts(activeCourts);
            if (activeCourts.length > 0 && !selectedCourtId) {
                setSelectedCourtId(activeCourts[0].id);
            }
        } catch (e: any) {
            setError(e instanceof ApiError ? e.message : "Error al cargar datos.");
        } finally {
            setLoading(false);
        }
    }

    async function loadWeekData() {
        setWeekLoading(true);
        setWeekError("");
        try {
            const dateStrings = weekDays.map(d => format(d, 'yyyy-MM-dd'));
            const results = await Promise.all(
                dateStrings.map(dateStr =>
                    apiFetch<{ reservations: Reservation[] }>(`/reservations?date=${dateStr}`)
                )
            );

            const map: Record<string, Reservation[]> = {};
            dateStrings.forEach((dateStr, i) => {
                const dayStart = startOfDay(new Date(dateStr)).getTime();
                const dayEnd = endOfDay(new Date(dateStr)).getTime();
                map[dateStr] = results[i].reservations.filter(r => {
                    const start = new Date(r.start_at).getTime();
                    return start >= dayStart && start <= dayEnd && r.status === 'CONFIRMED';
                });
            });

            setWeekReservations(map);
        } catch (e: any) {
            setWeekError(e instanceof ApiError ? e.message : "Error al cargar datos de la semana.");
        } finally {
            setWeekLoading(false);
        }
    }

    useEffect(() => {
        loadData();
    }, [date]);

    useEffect(() => {
        if (viewMode === "semana") {
            loadWeekData();
        }
    }, [date, viewMode]);

    // Set default court when courts load
    useEffect(() => {
        if (courts.length > 0 && !selectedCourtId) {
            setSelectedCourtId(courts[0].id);
        }
    }, [courts]);

    const handlePrint = () => {
        window.print();
    };

    const navigateDay = (direction: -1 | 1) => {
        setDate(prev => format(addDays(new Date(prev), direction), 'yyyy-MM-dd'));
    };

    const navigateWeek = (direction: -1 | 1) => {
        setDate(prev => format(addDays(new Date(prev), direction * 7), 'yyyy-MM-dd'));
    };

    const todayStr = new Date().toISOString().split('T')[0];
    const selectedCourt = courts.find(c => c.id === selectedCourtId);

    return (
        <Layout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
                    <div className="flex flex-col gap-1">
                        <h1 className="text-3xl font-black tracking-tighter text-slate-900 uppercase italic">Horario Diario</h1>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Printer className="w-4 h-4 text-indigo-500" /> Vista de Control Presencial
                        </p>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                        {/* View Mode Toggle */}
                        <div className="flex items-center bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                            <button
                                type="button"
                                onClick={() => setViewMode("dia")}
                                className={cn(
                                    "px-5 py-3 text-xs font-black uppercase tracking-widest transition-colors",
                                    viewMode === "dia"
                                        ? "bg-slate-900 text-white"
                                        : "text-slate-400 hover:bg-slate-50"
                                )}
                            >
                                Día
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewMode("semana")}
                                className={cn(
                                    "px-5 py-3 text-xs font-black uppercase tracking-widest transition-colors",
                                    viewMode === "semana"
                                        ? "bg-slate-900 text-white"
                                        : "text-slate-400 hover:bg-slate-50"
                                )}
                            >
                                Semana
                            </button>
                        </div>

                        {/* Date / Week navigation */}
                        <div className="flex items-center bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                            <button
                                type="button"
                                onClick={() => viewMode === "dia" ? navigateDay(-1) : navigateWeek(-1)}
                                className="p-3 hover:bg-slate-50 transition-colors text-slate-400"
                                title={viewMode === "dia" ? "Día anterior" : "Semana anterior"}
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <label className="px-6 py-2 flex items-center gap-3 border-x border-slate-100 min-w-[220px] justify-center cursor-pointer relative">
                                <CalendarIcon className="w-4 h-4 text-indigo-500" />
                                {viewMode === "dia" ? (
                                    <span className="text-sm font-black text-slate-700 uppercase">
                                        {format(new Date(date), "EEEE, d 'de' MMMM", { locale: es })}
                                    </span>
                                ) : (
                                    <span className="text-sm font-black text-slate-700 uppercase">
                                        {format(weekDays[0], "d MMM", { locale: es })} — {format(weekDays[6], "d MMM yyyy", { locale: es })}
                                    </span>
                                )}
                                <input
                                    type="date"
                                    value={date}
                                    onChange={e => setDate(e.target.value)}
                                    className="absolute inset-0 opacity-0 cursor-pointer w-full"
                                />
                            </label>
                            <button
                                type="button"
                                onClick={() => viewMode === "dia" ? navigateDay(1) : navigateWeek(1)}
                                className="p-3 hover:bg-slate-50 transition-colors text-slate-400"
                                title={viewMode === "dia" ? "Día siguiente" : "Semana siguiente"}
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Print button — only in day view */}
                        {viewMode === "dia" && (
                            <button
                                type="button"
                                onClick={handlePrint}
                                className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-sm tracking-widest uppercase hover:bg-black transition-all flex items-center gap-3 shadow-xl shadow-slate-900/20"
                            >
                                <Printer className="w-4 h-4" /> Imprimir
                            </button>
                        )}
                    </div>
                </div>

                {/* Week view: court selector */}
                {viewMode === "semana" && courts.length > 0 && (
                    <div className="flex items-center gap-3 print:hidden">
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Table2 className="w-4 h-4 text-indigo-400" /> Pista:
                        </span>
                        <div className="flex items-center gap-2 flex-wrap">
                            {courts.map(court => (
                                <button
                                    type="button"
                                    key={court.id}
                                    onClick={() => setSelectedCourtId(court.id)}
                                    className={cn(
                                        "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-colors border",
                                        selectedCourtId === court.id
                                            ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-200"
                                            : "bg-white text-slate-500 border-slate-200 hover:border-indigo-300 hover:text-indigo-600"
                                    )}
                                >
                                    {court.name}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Print Header (only visible when printing, only for day view) */}
                {viewMode === "dia" && (
                    <div className="hidden print:block mb-8 text-center border-b-4 border-slate-900 pb-6">
                        <h1 className="text-4xl font-black uppercase italic tracking-tighter">Planilla de Reservas</h1>
                        <p className="text-xl font-bold mt-2">
                            {format(new Date(date), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
                        </p>
                    </div>
                )}

                {/* Day View */}
                {viewMode === "dia" && (
                    loading ? (
                        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-premium p-20 flex flex-col items-center justify-center gap-4">
                            <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
                            <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Generando cuadrícula...</p>
                        </div>
                    ) : error ? (
                        <div className="bg-red-50 text-red-600 p-8 rounded-[2.5rem] border border-red-100 flex flex-col items-center gap-3">
                            <p className="font-bold">{error}</p>
                            <button type="button" onClick={loadData} className="text-sm underline font-black">Reintentar</button>
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
                    )
                )}

                {/* Week View */}
                {viewMode === "semana" && (
                    weekLoading ? (
                        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-premium p-20 flex flex-col items-center justify-center gap-4">
                            <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
                            <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Generando vista semanal...</p>
                        </div>
                    ) : weekError ? (
                        <div className="bg-red-50 text-red-600 p-8 rounded-[2.5rem] border border-red-100 flex flex-col items-center gap-3">
                            <p className="font-bold">{weekError}</p>
                            <button type="button" onClick={loadWeekData} className="text-sm underline font-black">Reintentar</button>
                        </div>
                    ) : (
                        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-premium overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr>
                                            <th className="w-20 p-4 bg-slate-50 border-r border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center sticky left-0 z-10">Hora</th>
                                            {weekDays.map(day => {
                                                const dayStr = format(day, 'yyyy-MM-dd');
                                                const isToday = dayStr === todayStr;
                                                return (
                                                    <th
                                                        key={dayStr}
                                                        className={cn(
                                                            "p-4 border-r border-b border-slate-100 text-xs font-black uppercase tracking-widest text-center min-w-[120px]",
                                                            isToday
                                                                ? "bg-indigo-600 text-white"
                                                                : "bg-slate-50 text-slate-700"
                                                        )}
                                                    >
                                                        <div className="flex flex-col items-center gap-0.5">
                                                            <span className={cn("text-[10px] font-bold", isToday ? "text-indigo-200" : "text-slate-400")}>
                                                                {format(day, 'EEE', { locale: es }).slice(0, 3).toUpperCase()}
                                                            </span>
                                                            <span className="text-base font-black leading-none">
                                                                {format(day, 'd')}
                                                            </span>
                                                        </div>
                                                    </th>
                                                );
                                            })}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {timeSlots.map(time => (
                                            <tr key={time} className="group">
                                                <td className="p-3 border-r border-b border-slate-50 bg-slate-50/30 text-xs font-black text-slate-500 text-center sticky left-0 z-10">
                                                    {time}
                                                </td>
                                                {weekDays.map(day => {
                                                    const dayStr = format(day, 'yyyy-MM-dd');
                                                    const isToday = dayStr === todayStr;
                                                    const dayReservations = weekReservations[dayStr] ?? [];
                                                    const booking = dayReservations.find(r => {
                                                        const start = format(new Date(r.start_at), 'HH:mm');
                                                        const end = format(new Date(r.end_at), 'HH:mm');
                                                        return r.court_id === selectedCourtId && time >= start && time < end;
                                                    });

                                                    return (
                                                        <td
                                                            key={dayStr}
                                                            className={cn(
                                                                "p-1.5 border-r border-b border-slate-50 transition-colors h-14 min-w-[120px]",
                                                                booking
                                                                    ? "bg-indigo-50/40"
                                                                    : isToday
                                                                        ? "bg-indigo-50/20 group-hover:bg-indigo-50/40"
                                                                        : "group-hover:bg-slate-50/50"
                                                            )}
                                                        >
                                                            {booking ? (
                                                                <div className="flex flex-col gap-0.5 p-1.5 rounded-lg bg-indigo-600 shadow-sm h-full justify-center">
                                                                    <span className="text-[10px] font-black text-white leading-tight uppercase tracking-tight truncate">
                                                                        {booking.user.full_name || booking.user.email.split('@')[0]}
                                                                    </span>
                                                                    <div className="flex items-center gap-1 opacity-70">
                                                                        <Users className="w-2.5 h-2.5 text-indigo-200" />
                                                                        <span className="text-[8px] font-bold text-indigo-200 uppercase">#{booking.id.slice(0, 4)}</span>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center">
                                                                    <div className={cn(
                                                                        "w-full h-full rounded-lg flex items-center justify-center",
                                                                        "bg-emerald-50 border border-emerald-100/60"
                                                                    )}>
                                                                        <span className="text-[9px] font-black text-emerald-300 uppercase tracking-wide opacity-0 group-hover:opacity-100 transition-opacity">Libre</span>
                                                                    </div>
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
                    )
                )}

                <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em] text-center mt-8 print:block hidden">
                    PadelClub &copy; {new Date().getFullYear()} — Generado el {format(new Date(), 'dd/MM/yyyy HH:mm')}
                </p>
            </div>
        </Layout>
    );
}
