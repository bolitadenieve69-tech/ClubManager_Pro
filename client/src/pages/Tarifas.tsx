import { useEffect, useState, useMemo } from "react";
import { apiFetch, ApiError } from "../lib/api";
import {
    Plus,
    Trash2,
    Save,
    Ticket,
    Settings,
    Clock,
    Play,
    Calendar,
    AlertCircle,
    CheckCircle2,
    XCircle,
    Loader2,
    ChevronRight,
    Search
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

type Court = { id: string; name: string };
type Price = {
    id: string;
    court_id: string | null;
    hourly_rate: number;
    valid_days: string;
    start_time: string;
    end_time: string;
    court?: Court;
};

type Club = {
    id: string;
    default_hourly_rate: number | null;
    segment_minutes: number;
};

const DAYS = [
    { label: "D", value: "0" },
    { label: "L", value: "1" },
    { label: "M", value: "2" },
    { label: "X", value: "3" },
    { label: "J", value: "4" },
    { label: "V", value: "5" },
    { label: "S", value: "6" },
];

export default function Tarifas() {
    const [club, setClub] = useState<Club | null>(null);
    const [courts, setCourts] = useState<Court[]>([]);
    const [prices, setPrices] = useState<Price[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [ok, setOk] = useState("");
    const [busyId, setBusyId] = useState<string | null>(null);

    // Simulator State
    const [simDate, setSimDate] = useState(new Date().toISOString().split('T')[0]);
    const [simStart, setSimStart] = useState("09:00");
    const [simEnd, setSimEnd] = useState("11:00");
    const [simCourt, setSimCourt] = useState("");
    const [simResult, setSimResult] = useState<any>(null);
    const [simLoading, setSimLoading] = useState(false);

    const load = async () => {
        setLoading(true);
        setError("");
        try {
            const [clubData, courtsData, pricesData] = await Promise.all([
                apiFetch<Club>("/club"),
                apiFetch<{ courts: Court[] }>("/courts"),
                apiFetch<{ prices: Price[] }>("/prices")
            ]);
            setClub(clubData);
            setCourts(courtsData.courts);
            setPrices(pricesData.prices);
            if (courtsData.courts.length > 0 && !simCourt) {
                setSimCourt(courtsData.courts[0].id);
            }
        } catch (e: any) {
            setError(e instanceof ApiError ? e.message : "Error al cargar datos.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const handleUpdateClub = async (updates: Partial<Club>) => {
        setBusyId("club-config");
        try {
            const updated = await apiFetch<Club>("/club", {
                method: "PATCH",
                body: JSON.stringify(updates)
            });
            setClub(updated);
            setOk("Configuración global actualizada.");
            setTimeout(() => setOk(""), 3000);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setBusyId(null);
        }
    };

    const handleCreatePrice = async () => {
        setBusyId("create-price");
        try {
            const newPrice = await apiFetch<{ price: Price }>("/prices", {
                method: "POST",
                body: JSON.stringify({
                    court_id: null,
                    hourly_rate: 1000,
                    valid_days: "1,2,3,4,5",
                    start_time: "09:00",
                    end_time: "14:00"
                })
            });
            setPrices([newPrice.price, ...prices]);
            setOk("Nueva franja creada.");
            setTimeout(() => setOk(""), 3000);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setBusyId(null);
        }
    };

    const handleDeletePrice = async (id: string) => {
        if (!confirm("¿Eliminar esta tarifa?")) return;
        setBusyId(id);
        try {
            await apiFetch(`/prices/${id}`, { method: "DELETE" });
            setPrices(prices.filter(p => p.id !== id));
            setOk("Tarifa eliminada.");
            setTimeout(() => setOk(""), 3000);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setBusyId(null);
        }
    };

    const handleUpdatePrice = async (id: string, updates: Partial<Price>) => {
        if (updates.start_time || updates.end_time) {
            const price = prices.find(p => p.id === id);
            const start = updates.start_time || price?.start_time || "00:00";
            const end = updates.end_time || price?.end_time || "00:00";
            if (end <= start) {
                setError("Las reglas no pueden cruzar la medianoche.");
                setTimeout(() => setError(""), 5000);
                return;
            }
        }
        setBusyId(id);
        try {
            const { price: updated } = await apiFetch<{ price: Price }>(`/prices/${id}`, {
                method: "PUT",
                body: JSON.stringify(updates)
            });
            setPrices(prices.map(p => p.id === id ? updated : p));
        } catch (e: any) {
            setError(e.message);
        } finally {
            setBusyId(null);
        }
    };

    const handleSimulate = async () => {
        setSimResult(null);
        setSimLoading(true);
        setError("");
        try {
            const startStr = `${simDate}T${simStart}:00.000Z`;
            const endStr = `${simDate}T${simEnd}:00.000Z`;
            const result = await apiFetch<any>("/reservations/calculate", {
                method: "POST",
                body: JSON.stringify({
                    court_id: simCourt,
                    user_id: "00000000-0000-0000-0000-000000000000",
                    start_time: startStr,
                    end_time: endStr
                })
            });
            setSimResult(result);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setSimLoading(false);
        }
    };

    const overlaps = useMemo(() => {
        const result: Record<string, string[]> = {};
        prices.forEach(p1 => {
            prices.forEach(p2 => {
                if (p1.id === p2.id) return;
                if (p1.court_id === p2.court_id) {
                    const days1 = p1.valid_days.split(",");
                    const days2 = p2.valid_days.split(",");
                    const commonDays = days1.filter(d => days2.includes(d));

                    if (commonDays.length > 0) {
                        if (p1.start_time < p2.end_time && p2.start_time < p1.end_time) {
                            if (!result[p1.id]) result[p1.id] = [];
                            result[p1.id].push(`Solapa con franja ${p2.start_time}-${p2.end_time}`);
                        }
                    }
                }
            });
        });
        return result;
    }, [prices]);

    if (loading) {
        return (
            <div className="p-20 text-center flex flex-col items-center gap-4">
                <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
                <p className="text-slate-500 font-medium">Cargando motor de tarifas...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Motor de Tarifas</h1>
                    <p className="text-slate-500">Configura precios dinámicos por franjas, días y pistas.</p>
                </div>
                <button
                    onClick={handleCreatePrice}
                    disabled={busyId === "create-price"}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg shadow-indigo-200 flex items-center gap-2 group whitespace-nowrap"
                >
                    <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                    Nueva Franja Horaria
                </button>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl flex items-center gap-3">
                    <XCircle className="w-5 h-5 flex-shrink-0" />
                    <p className="text-sm font-medium">{error}</p>
                </div>
            )}

            {ok && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-600 px-4 py-3 rounded-xl flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                    <p className="text-sm font-medium">{ok}</p>
                </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
                <div className="xl:col-span-2 space-y-6">
                    {/* Club Config Card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3 text-slate-900 font-bold">
                            <Settings className="w-5 h-5 text-indigo-600" />
                            Configuración Global
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Intervalos de Reserva</label>
                                <div className="relative">
                                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <select
                                        value={club?.segment_minutes}
                                        onChange={(e) => handleUpdateClub({ segment_minutes: Number(e.target.value) })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none"
                                    >
                                        <option value={15}>15 minutos</option>
                                        <option value={30}>30 minutos</option>
                                        <option value={60}>60 minutos</option>
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tarifa Base Fallback (€/h)</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">€</span>
                                    <input
                                        type="number"
                                        value={club?.default_hourly_rate ? club.default_hourly_rate / 100 : ""}
                                        placeholder="0.00"
                                        onChange={(e) => {
                                            const val = e.target.value === "" ? null : Math.round(Number(e.target.value) * 100);
                                            handleUpdateClub({ default_hourly_rate: val });
                                        }}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Price Rules List */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 px-2">
                            Reglas de Precios Dinámicos
                            <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full uppercase tracking-widest whitespace-nowrap">
                                {prices.length} reglas
                            </span>
                        </h3>
                        <div className="grid grid-cols-1 gap-4">
                            {prices.length === 0 && (
                                <div className="p-12 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
                                    <p className="text-slate-400 italic">No hay reglas de precio configuradas.</p>
                                </div>
                            )}
                            {prices.slice().sort((a, b) => {
                                if (a.court_id && !b.court_id) return -1;
                                if (!a.court_id && b.court_id) return 1;
                                return 0;
                            }).map(price => (
                                <div
                                    key={price.id}
                                    className={cn(
                                        "bg-white rounded-2xl shadow-sm border transition-all p-5 flex flex-col gap-4 group",
                                        overlaps[price.id] ? "border-red-200 bg-red-50/10" : "border-slate-200 hover:border-indigo-300"
                                    )}
                                >
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="flex flex-wrap items-center gap-3">
                                            <span className={cn(
                                                "px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider",
                                                price.court_id ? "bg-indigo-50 text-indigo-600 border border-indigo-100" : "bg-amber-50 text-amber-600 border border-amber-100"
                                            )}>
                                                {price.court_id ? `Pista: ${courts.find(c => c.id === price.court_id)?.name || '?'}` : 'Todas las Pistas'}
                                            </span>
                                            <div className="flex gap-1">
                                                {DAYS.map(day => {
                                                    const isActive = price.valid_days.split(",").includes(day.value);
                                                    return (
                                                        <button
                                                            key={day.value}
                                                            onClick={() => {
                                                                const current = price.valid_days.split(",").filter(d => d !== "");
                                                                const next = current.includes(day.value) ? current.filter(d => d !== day.value) : [...current, day.value];
                                                                handleUpdatePrice(price.id, { valid_days: next.sort().join(",") });
                                                            }}
                                                            className={cn(
                                                                "w-6 h-6 rounded-full text-[10px] font-bold transition-all",
                                                                isActive ? "bg-slate-900 text-white shadow-sm" : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                                                            )}
                                                        >
                                                            {day.label}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                            {overlaps[price.id] && (
                                                <div className="flex items-center gap-1.5 text-red-500 text-[10px] font-bold animate-pulse uppercase tracking-wider">
                                                    <AlertCircle className="w-3 h-3" />
                                                    Conflicto horario
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleUpdatePrice(price.id, price)}
                                                className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                                title="Guardar"
                                            >
                                                <Save className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDeletePrice(price.id)}
                                                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                title="Eliminar"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Inicio</label>
                                            <input
                                                type="time"
                                                value={price.start_time}
                                                onChange={(e) => handleUpdatePrice(price.id, { start_time: e.target.value })}
                                                className="w-full bg-slate-50 border border-slate-100 rounded-lg px-3 py-1.5 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Fin</label>
                                            <input
                                                type="time"
                                                value={price.end_time}
                                                onChange={(e) => handleUpdatePrice(price.id, { end_time: e.target.value })}
                                                className="w-full bg-slate-50 border border-slate-100 rounded-lg px-3 py-1.5 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Precio (€/h)</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={price.hourly_rate / 100}
                                                onChange={(e) => handleUpdatePrice(price.id, { hourly_rate: Math.round(Number(e.target.value) * 100) })}
                                                className="w-full bg-slate-50 border border-slate-100 rounded-lg px-3 py-1.5 text-sm font-bold text-indigo-600 focus:ring-2 focus:ring-indigo-500 outline-none"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Asignar a</label>
                                            <select
                                                value={price.court_id || ""}
                                                onChange={(e) => handleUpdatePrice(price.id, { court_id: e.target.value || null })}
                                                className="w-full bg-slate-50 border border-slate-100 rounded-lg px-3 py-1.5 text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                                            >
                                                <option value="">Global</option>
                                                {courts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Simulator Sidebar */}
                <div className="space-y-6 xl:sticky xl:top-24">
                    <div className="bg-slate-900 rounded-3xl shadow-xl p-6 text-white overflow-hidden relative group">
                        <div className="absolute top-0 right-0 -m-8 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl group-hover:bg-indigo-500/40 transition-colors duration-700"></div>

                        <div className="flex items-center gap-3 mb-6 relative">
                            <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                                <Play className="w-5 h-5 fill-white" />
                            </div>
                            <h3 className="text-xl font-bold">Simulador</h3>
                        </div>

                        <div className="space-y-4 relative">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest pl-1 flex items-center gap-1.5">
                                    <Calendar className="w-3 h-3" /> Fecha de Prueba
                                </label>
                                <input
                                    type="date"
                                    value={simDate}
                                    onChange={e => setSimDate(e.target.value)}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-white"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest pl-1">Entrada</label>
                                    <input
                                        type="time"
                                        value={simStart}
                                        onChange={e => setSimStart(e.target.value)}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-white"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest pl-1">Salida</label>
                                    <input
                                        type="time"
                                        value={simEnd}
                                        onChange={e => setSimEnd(e.target.value)}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-white"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest pl-1">Pista</label>
                                <select
                                    value={simCourt}
                                    onChange={e => setSimCourt(e.target.value)}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-white appearance-none"
                                >
                                    {courts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>

                            <button
                                onClick={handleSimulate}
                                disabled={simLoading}
                                className="w-full py-4 mt-2 bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 text-white font-bold rounded-2xl transition-all shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-3"
                            >
                                {simLoading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        <Search className="w-5 h-5" />
                                        Calcular Precio
                                    </>
                                )}
                            </button>
                        </div>

                        {simResult && (
                            <div className="mt-8 pt-8 border-t border-slate-800 relative animate-in slide-in-from-top-4 duration-500">
                                <div className="flex justify-between items-baseline mb-4">
                                    <span className="text-slate-400 text-sm font-medium">Importe Estimado:</span>
                                    <span className="text-3xl font-black text-white">
                                        {(simResult.totalCents / 100).toFixed(2)}
                                        <span className="text-indigo-400 ml-1 text-xl">€</span>
                                    </span>
                                </div>
                                <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                    {simResult.breakdown.map((b: any, i: number) => (
                                        <div key={i} className="flex items-center justify-between text-xs py-2 px-3 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors">
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                                                <span className="text-slate-300 font-medium">{b.start} - {b.end}</span>
                                            </div>
                                            <span className="font-bold">{(b.rateCents / 100).toFixed(2)}€</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="bg-indigo-50 rounded-3xl p-6 border border-indigo-100 flex items-start gap-4">
                        <AlertCircle className="w-5 h-5 text-indigo-600 mt-0.5" />
                        <div className="space-y-1">
                            <h4 className="text-sm font-bold text-indigo-900">Ayuda sobre Precios</h4>
                            <p className="text-xs text-indigo-600 leading-relaxed">
                                Las reglas se aplican de lo más específico (Pista) a lo más general (Global). En caso de solapamiento, el sistema sumará las franjas proporcionales.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
