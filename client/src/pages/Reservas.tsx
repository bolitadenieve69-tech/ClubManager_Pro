import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { apiFetch, ApiError } from "../lib/api";
import { reservationsApi, Reservation } from "../lib/reservations";
import {
    Plus,
    Calendar,
    Clock,
    RotateCw,
    Trash2,
    CheckCircle2,
    AlertTriangle,
    XCircle,
    ChevronLeft,
    ChevronRight,
    Loader2,
    Table2,
    User,
    Phone,
    Banknote,
    CreditCard
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

type Court = { id: string; name: string };

const DAYS_SHORT = [
    { v: 1, l: "L" }, { v: 2, l: "M" }, { v: 3, l: "X" }, { v: 4, l: "J" }, { v: 5, l: "V" }, { v: 6, l: "S" }, { v: 0, l: "D" }
];

export default function Reservas() {
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [courts, setCourts] = useState<Court[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [ok, setOk] = useState("");
    const [busyId, setBusyId] = useState<string | null>(null);

    // Form State
    const [courtId, setCourtId] = useState("");
    const [userId, setUserId] = useState("");
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [startTime, setStartTime] = useState("09:00");
    const [duration, setDuration] = useState(60);
    const [guestName, setGuestName] = useState("");
    const [phone, setPhone] = useState("");
    const [paymentMethod, setPaymentMethod] = useState<"CASH" | "CARD">("CASH");

    // Recurring State
    const [isRecurring, setIsRecurring] = useState(false);
    const [recurringInterval, setRecurringInterval] = useState(1);
    const [recurringWeekdays, setRecurringWeekdays] = useState<number[]>([new Date().getDay()]);
    const [endCondition, setEndCondition] = useState<'date' | 'count'>('date');
    const [endDate, setEndDate] = useState("");
    const [maxOccurrences, setMaxOccurrences] = useState(5);
    const [previewOccurrences, setPreviewOccurrences] = useState<any[]>([]);
    const [skipConflicts, setSkipConflicts] = useState(false);
    const [loadingPreview, setLoadingPreview] = useState(false);

    async function loadData() {
        setLoading(true);
        setError("");
        try {
            const [resData, courtsData, meData] = await Promise.all([
                reservationsApi.list(),
                apiFetch<{ courts: Court[] }>("/courts"),
                apiFetch<{ user: { id: string } }>("/auth/me")
            ]);
            setReservations(resData.reservations);
            setCourts(courtsData.courts);
            if (courtsData.courts.length > 0 && !courtId) setCourtId(courtsData.courts[0].id);
            if (meData.user) setUserId(meData.user.id);
        } catch (e: any) {
            setError(e instanceof ApiError ? e.message : "Error al cargar datos.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadData();
    }, []);

    // Effect for Preview
    useEffect(() => {
        if (!isRecurring) {
            setPreviewOccurrences([]);
            return;
        }

        const fetchPreview = async () => {
            setLoadingPreview(true);
            try {
                const start = new Date(`${date}T${startTime}:00Z`);
                const end = new Date(start.getTime() + duration * 60000);

                const response = await apiFetch<any>("/reservations/recurring/preview", {
                    method: "POST",
                    body: JSON.stringify({
                        court_id: courtId,
                        user_id: userId,
                        start_at: start.toISOString(),
                        end_at: end.toISOString(),
                        recurring: {
                            frequency: 'weekly',
                            interval: recurringInterval,
                            weekdays: recurringWeekdays,
                            endCondition,
                            endDate: endCondition === 'date' ? (endDate || undefined) : undefined,
                            maxOccurrences: endCondition === 'count' ? maxOccurrences : undefined
                        }
                    })
                });
                setPreviewOccurrences(response.occurrences);
            } catch (e) {
                console.error("Error previewing recurring:", e);
            } finally {
                setLoadingPreview(false);
            }
        };

        const timer = setTimeout(fetchPreview, 500);
        return () => clearTimeout(timer);
    }, [isRecurring, courtId, date, startTime, duration, recurringInterval, recurringWeekdays, endCondition, endDate, maxOccurrences, userId]);

    async function handleCreate() {
        setBusyId("create-action");
        setError("");
        setOk("");
        try {
            const start = new Date(`${date}T${startTime}:00Z`);
            const end = new Date(start.getTime() + duration * 60000);

            let response;
            if (isRecurring) {
                response = await apiFetch<any>("/reservations/recurring", {
                    method: "POST",
                    body: JSON.stringify({
                        court_id: courtId,
                        user_id: userId || undefined,
                        guest_name: guestName || undefined,
                        phone: phone || undefined,
                        payment_method: paymentMethod,
                        start_time: start.toISOString(),
                        end_time: end.toISOString(),
                        skipConflicts,
                        recurring: {
                            frequency: 'weekly',
                            interval: recurringInterval,
                            weekdays: recurringWeekdays,
                            endCondition,
                            endDate: endCondition === 'date' ? (endDate || undefined) : undefined,
                            maxOccurrences: endCondition === 'count' ? maxOccurrences : undefined
                        }
                    })
                });
            } else {
                response = await reservationsApi.create({
                    court_id: courtId,
                    user_id: userId || undefined,
                    guest_name: guestName || undefined,
                    phone: phone || undefined,
                    payment_method: paymentMethod,
                    start_time: start.toISOString(),
                    end_time: end.toISOString(),
                });
            }

            setOk(response.message);
            setTimeout(() => setOk(""), 5000);
            await loadData();
            if (isRecurring) setIsRecurring(false);
        } catch (e: any) {
            setError(e instanceof ApiError ? e.message : "Error al crear la reserva.");
        } finally {
            setBusyId(null);
        }
    }

    async function handleCancel(id: string) {
        if (!confirm("¿Seguro que quieres cancelar esta reserva?")) return;
        setBusyId(id);
        try {
            const response = await reservationsApi.cancel(id);
            setOk(response.message);
            setTimeout(() => setOk(""), 5000);
            await loadData();
        } catch (e: any) {
            setError(e instanceof ApiError ? e.message : "Error al cancelar.");
        } finally {
            setBusyId(null);
        }
    }

    return (
        <Layout>
            <div className="space-y-8 animate-in fade-in duration-500">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Cuadrante de Reservas</h1>
                    <p className="text-slate-500">Gestiona el calendario ocupacional de tus pistas.</p>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl flex items-center gap-3 animate-in shake-in">
                        <XCircle className="w-5 h-5 flex-shrink-0" />
                        <p className="text-sm font-medium">{error}</p>
                    </div>
                )}

                {ok && (
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-600 px-4 py-3 rounded-xl flex items-center gap-3 animate-in fade-in">
                        <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                        <p className="text-sm font-medium">{ok}</p>
                    </div>
                )}

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
                    {/* Form & Options Card */}
                    <div className="xl:col-span-1 space-y-6">
                        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                    <Plus className="w-5 h-5 text-indigo-600" />
                                    Nueva Reserva
                                </h2>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setIsRecurring(!isRecurring)}
                                        className={cn(
                                            "flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all",
                                            isRecurring ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                                        )}
                                    >
                                        <RotateCw className={cn("w-3 h-3", isRecurring && "animate-spin-slow")} />
                                        {isRecurring ? "Recurrente" : "Única"}
                                    </button>
                                </div>
                            </div>

                            <div className="p-6 space-y-5">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                        <Table2 className="w-3 h-3" /> Pista
                                    </label>
                                    <select
                                        value={courtId}
                                        onChange={e => setCourtId(e.target.value)}
                                        title="Seleccionar Pista"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none"
                                    >
                                        {courts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                            <User className="w-3 h-3" /> Nombre
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Nombre del jugador..."
                                            value={guestName}
                                            onChange={e => setGuestName(e.target.value)}
                                            title="Nombre del jugador"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                            <Phone className="w-3 h-3" /> WhatsApp
                                        </label>
                                        <input
                                            type="tel"
                                            placeholder="+34 600 000 000"
                                            value={phone}
                                            onChange={e => setPhone(e.target.value)}
                                            title="Número de WhatsApp"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                            <Calendar className="w-3 h-3" /> Fecha
                                        </label>
                                        <input
                                            type="date"
                                            value={date}
                                            onChange={e => setDate(e.target.value)}
                                            title="Fecha de reserva"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                            <Clock className="w-3 h-3" /> Inicio
                                        </label>
                                        <input
                                            type="time"
                                            value={startTime}
                                            onChange={e => setStartTime(e.target.value)}
                                            title="Hora de inicio"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                        <Clock className="w-3 h-3" /> Duración
                                    </label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {[60, 90, 120].map(m => (
                                            <button
                                                key={m}
                                                onClick={() => setDuration(m)}
                                                className={cn(
                                                    "py-2 rounded-xl text-xs font-bold border transition-all",
                                                    duration === m ? "bg-indigo-50 border-indigo-200 text-indigo-600 shadow-sm" : "border-slate-100 text-slate-500 hover:bg-slate-50"
                                                )}
                                            >
                                                {m}m
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Payment Method Selector */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                        💶 Método de Pago
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={() => setPaymentMethod("CASH")}
                                            className={cn(
                                                "py-2.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2",
                                                paymentMethod === "CASH"
                                                    ? "bg-amber-50 border-amber-200 text-amber-700 shadow-sm"
                                                    : "border-slate-100 text-slate-500 hover:bg-slate-50"
                                            )}
                                        >
                                            <Banknote className="w-4 h-4" />
                                            Metálico
                                        </button>
                                        <button
                                            onClick={() => setPaymentMethod("CARD")}
                                            className={cn(
                                                "py-2.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2",
                                                paymentMethod === "CARD"
                                                    ? "bg-blue-50 border-blue-200 text-blue-700 shadow-sm"
                                                    : "border-slate-100 text-slate-500 hover:bg-slate-50"
                                            )}
                                        >
                                            <CreditCard className="w-4 h-4" />
                                            Tarjeta / Bizum
                                        </button>
                                    </div>
                                </div>

                                {isRecurring && (
                                    <div className="pt-4 border-t border-slate-100 space-y-5 animate-in slide-in-from-top-2 duration-300">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Patrón Semanal</label>
                                            <div className="flex justify-between">
                                                {DAYS_SHORT.map(day => {
                                                    const active = recurringWeekdays.includes(day.v);
                                                    return (
                                                        <button
                                                            key={day.v}
                                                            onClick={() => {
                                                                if (active) setRecurringWeekdays(recurringWeekdays.filter(d => d !== day.v));
                                                                else setRecurringWeekdays([...recurringWeekdays, day.v]);
                                                            }}
                                                            className={cn(
                                                                "w-8 h-8 rounded-full text-[10px] font-bold transition-all",
                                                                active ? "bg-indigo-600 text-white shadow-md shadow-indigo-100" : "bg-slate-50 text-slate-400 hover:bg-slate-100"
                                                            )}
                                                        >
                                                            {day.l}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Finalizar por</label>
                                                <select
                                                    value={endCondition}
                                                    onChange={e => setEndCondition(e.target.value as any)}
                                                    title="Condición de finalización"
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 outline-none appearance-none font-medium"
                                                >
                                                    <option value="date">Fecha</option>
                                                    <option value="count">Ocurrencias</option>
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                                    {endCondition === 'date' ? 'Hasta' : 'Total'}
                                                </label>
                                                {endCondition === 'date' ? (
                                                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} title="Fecha fin de recurrencia" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500 outline-none font-medium" />
                                                ) : (
                                                    <input type="number" value={maxOccurrences} onChange={e => setMaxOccurrences(Number(e.target.value))} title="Número de ocurrencias" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500 outline-none font-bold" />
                                                )}
                                            </div>
                                        </div>

                                        {previewOccurrences.length > 0 && (
                                            <div className="space-y-3">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Vista Previa ({previewOccurrences.length})</p>
                                                <div className="max-h-40 overflow-y-auto rounded-xl border border-slate-100 p-1 space-y-1 bg-slate-50 custom-scrollbar">
                                                    {previewOccurrences.map((occ, i) => (
                                                        <div key={i} className="bg-white px-3 py-2 rounded-lg text-xs flex items-center justify-between border border-transparent hover:border-slate-200 transition-colors">
                                                            <span className="text-slate-600 font-medium">
                                                                {new Date(occ.start).toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit', month: 'short' })}
                                                            </span>
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-bold text-indigo-600">{(occ.priceCents / 100).toFixed(2)}€</span>
                                                                {!occ.isValid ? (
                                                                    <XCircle className="w-4 h-4 text-red-500" />
                                                                ) : occ.conflict ? (
                                                                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                                                                ) : (
                                                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                                {previewOccurrences.some(o => o.conflict) && (
                                                    <div className="bg-amber-50 border border-amber-100 p-3 rounded-xl flex items-center gap-3">
                                                        <input
                                                            type="checkbox"
                                                            checked={skipConflicts}
                                                            onChange={e => setSkipConflicts(e.target.checked)}
                                                            id="skip-conf"
                                                            className="w-4 h-4 rounded border-amber-300 text-indigo-600"
                                                        />
                                                        <label htmlFor="skip-conf" className="text-[10px] font-bold text-amber-900 leading-tight">
                                                            Saltar automáticamente fechas con conflicto
                                                        </label>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}

                                <button
                                    onClick={handleCreate}
                                    disabled={busyId === "create-action"}
                                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-2xl transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 group"
                                >
                                    {busyId === "create-action" ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <>
                                            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                                            {isRecurring ? 'Confirmar Serie' : 'Reservar Pista'}
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* List View Card */}
                    <div className="xl:col-span-2 space-y-6">
                        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden min-h-[600px]">
                            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <h2 className="text-lg font-bold text-slate-900">Reservas Activas</h2>
                                    <span className="bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider">
                                        {reservations.filter(r => r.status === 'CONFIRMED').length} CONFIRMADAS
                                    </span>
                                </div>
                                <button
                                    onClick={loadData}
                                    title="Recargar reservas"
                                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                >
                                    <RotateCw className={cn("w-4 h-4", loading && "animate-spin")} />
                                </button>
                            </div>

                            <div className="overflow-x-auto">
                                {loading && reservations.length === 0 ? (
                                    <div className="p-20 text-center flex flex-col items-center gap-4">
                                        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
                                        <p className="text-slate-400 italic">Sincronizando cuadrante...</p>
                                    </div>
                                ) : (
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pista / Usuario</th>
                                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Horario</th>
                                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Importe</th>
                                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Estado</th>
                                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50 text-sm">
                                            {reservations.length === 0 ? (
                                                <tr>
                                                    <td colSpan={5} className="px-6 py-20 text-center text-slate-400 italic">
                                                        No se han encontrado reservas en el sistema.
                                                    </td>
                                                </tr>
                                            ) : (
                                                reservations.map(r => (
                                                    <tr key={r.id} className={cn("hover:bg-slate-50/30 transition-colors group", r.status === 'CANCELLED' && "opacity-40 grayscale")}>
                                                        <td className="px-6 py-4">
                                                            <div className="flex flex-col gap-0.5">
                                                                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                                                                    <Table2 className="w-3.5 h-3.5 text-indigo-400" />
                                                                    {r.court?.name}
                                                                </span>
                                                                <span className="text-xs text-slate-500 flex items-center gap-1.5">
                                                                    <User className="w-3.5 h-3.5 text-slate-300" />
                                                                    {r.guest_name || r.user?.full_name || r.user?.email || "—"}
                                                                </span>
                                                                {r.phone && (
                                                                    <a href={`https://wa.me/${r.phone.replace(/\s+/g, '').replace('+', '')}`} target="_blank" rel="noopener noreferrer" className="text-[10px] text-emerald-500 flex items-center gap-1 hover:underline">
                                                                        <Phone className="w-3 h-3" />
                                                                        {r.phone}
                                                                    </a>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex flex-col gap-0.5">
                                                                <span className="font-semibold text-slate-700">
                                                                    {new Date(r.start_at).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                                                </span>
                                                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                                                    Fin: {new Date(r.end_at).toLocaleString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex flex-col gap-1">
                                                                <span className="text-sm font-black text-slate-900 border-b-2 border-slate-200">
                                                                    {(r.total_cents / 100).toFixed(2)}€
                                                                </span>
                                                                {r.payment_method && (
                                                                    <span className={cn(
                                                                        "text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full w-fit",
                                                                        r.payment_method === "CASH"
                                                                            ? "bg-amber-50 text-amber-600"
                                                                            : "bg-blue-50 text-blue-600"
                                                                    )}>
                                                                        {r.payment_method === "CASH" ? "💵 Metálico" : "💳 Tarjeta"}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            <span className={cn(
                                                                "px-2.5 py-1 rounded-full text-[10px] font-black tracking-widest uppercase",
                                                                r.status === 'CONFIRMED' ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
                                                                    r.status === 'CANCELLED' ? "bg-red-50 text-red-600 border border-red-100" :
                                                                        "bg-slate-100 text-slate-500 border border-slate-200"
                                                            )}>
                                                                {r.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            {r.status === 'CONFIRMED' && (
                                                                <button
                                                                    onClick={() => handleCancel(r.id)}
                                                                    disabled={busyId === r.id}
                                                                    className="opacity-0 group-hover:opacity-100 transition-all p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl"
                                                                    title="Cancelar reserva"
                                                                >
                                                                    {busyId === r.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                                                </button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
