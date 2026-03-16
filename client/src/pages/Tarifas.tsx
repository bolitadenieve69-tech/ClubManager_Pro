import { useEffect, useState } from "react";
import { apiFetch, ApiError } from "../lib/api";
import {
    Ticket,
    Settings,
    Clock,
    CheckCircle2,
    XCircle,
    Loader2,
    Play,
    Calendar,
    Search,
    Trophy,
    Plus,
    Trash2,
    Sparkles,
} from "lucide-react";
import Layout from "../components/Layout";

type Court = { id: string; name: string };
type PriceRule = {
    id: string;
    court_id: string | null;
    hourly_rate: number;
    valid_days: string;
    start_time: string;
    end_time: string;
    valid_from: string | null;
    valid_until: string | null;
    label: string | null;
};

type Club = {
    id: string;
    default_hourly_rate: number | null;
    segment_minutes: number;
};

function formatEuros(cents: number) {
    return (cents / 100).toFixed(2).replace(".", ",") + " €";
}

function calcPrice(hourlyCents: number, minutes: number) {
    return Math.round((hourlyCents / 60) * minutes);
}

const WEEKDAY_DAYS = "1,2,3,4,5";
const WEEKEND_DAYS = "0,6";
const ALL_DAYS = "0,1,2,3,4,5,6";

function isWeekdayRule(r: PriceRule) { return r.valid_days === WEEKDAY_DAYS && !r.valid_from && !r.valid_until; }
function isWeekendRule(r: PriceRule) { return r.valid_days === WEEKEND_DAYS && !r.valid_from && !r.valid_until; }
function isSeasonalRule(r: PriceRule) { return !!(r.valid_from || r.valid_until); }

export default function Tarifas() {
    const [club, setClub] = useState<Club | null>(null);
    const [courts, setCourts] = useState<Court[]>([]);
    const [priceRules, setPriceRules] = useState<PriceRule[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [ok, setOk] = useState("");

    // Global rate input
    const [defaultRateInput, setDefaultRateInput] = useState("");

    // Per-court inputs: { courtId: { weekday: string, weekend: string } }
    const [courtInputs, setCourtInputs] = useState<
        Record<string, { weekday: string; weekend: string }>
    >({});

    // New seasonal rule form
    const [showSeasonForm, setShowSeasonForm] = useState(false);
    const [seasonForm, setSeasonForm] = useState({
        label: "",
        valid_from: "",
        valid_until: "",
        court_id: "",
        valid_days: ALL_DAYS,
        hourly_rate: "",
    });
    const [savingSeason, setSavingSeason] = useState(false);

    // Simulator state
    const [simDate, setSimDate] = useState(new Date().toISOString().split("T")[0]);
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
                apiFetch<{ prices: PriceRule[] }>("/prices"),
            ]);
            setClub(clubData);
            setDefaultRateInput(
                clubData.default_hourly_rate ? String(clubData.default_hourly_rate / 100) : ""
            );
            setCourts(courtsData.courts);
            setPriceRules(pricesData.prices);
            if (courtsData.courts.length > 0) setSimCourt(courtsData.courts[0].id);

            const inputs: Record<string, { weekday: string; weekend: string }> = {};
            for (const court of courtsData.courts) {
                const rules = pricesData.prices.filter((p) => p.court_id === court.id);
                const wdRule = rules.find(isWeekdayRule) ?? rules.find((r) => r.valid_days === ALL_DAYS && !r.valid_from && !r.valid_until);
                const weRule = rules.find(isWeekendRule);
                inputs[court.id] = {
                    weekday: wdRule ? String(wdRule.hourly_rate / 100) : "",
                    weekend: weRule ? String(weRule.hourly_rate / 100) : "",
                };
            }
            setCourtInputs(inputs);
        } catch (e: any) {
            setError(e instanceof ApiError ? e.message : "Error al cargar datos.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const flash = (msg: string) => { setOk(msg); setTimeout(() => setOk(""), 3000); };

    const handleSaveDefaultRate = async (rawValue: string) => {
        const val = rawValue === "" ? null : Math.round(Number(rawValue) * 100);
        try {
            const updated = await apiFetch<Club>("/club", {
                method: "PATCH",
                body: JSON.stringify({ default_hourly_rate: val }),
            });
            setClub(updated);
            flash("Tarifa base guardada.");
        } catch (e: any) { setError(e.message); }
    };

    const saveCourtRule = async (court: Court, rawValue: string, validDays: string, label: string) => {
        const val = rawValue === "" ? null : Math.round(Number(rawValue) * 100);
        const isWE = validDays === WEEKEND_DAYS;
        const existing = priceRules.find(p =>
            p.court_id === court.id && !p.valid_from && !p.valid_until &&
            (isWE ? isWeekendRule(p) : (isWeekdayRule(p) || (p.valid_days === ALL_DAYS)))
        );
        try {
            if (existing) {
                if (val === null) {
                    await apiFetch(`/prices/${existing.id}`, { method: "DELETE" });
                    setPriceRules(prev => prev.filter(p => p.id !== existing.id));
                } else {
                    const { price: updated } = await apiFetch<{ price: PriceRule }>(`/prices/${existing.id}`, {
                        method: "PUT",
                        body: JSON.stringify({ hourly_rate: val, valid_days: validDays }),
                    });
                    setPriceRules(prev => prev.map(p => p.id === existing.id ? updated : p));
                }
            } else if (val !== null) {
                const { price: created } = await apiFetch<{ price: PriceRule }>("/prices", {
                    method: "POST",
                    body: JSON.stringify({
                        court_id: court.id,
                        hourly_rate: val,
                        valid_days: validDays,
                        start_time: "00:00",
                        end_time: "23:59",
                    }),
                });
                setPriceRules(prev => [...prev, created]);
            }
            flash(`${label} de ${court.name} guardada.`);
        } catch (e: any) { setError(e.message); }
    };

    const handleSaveSeason = async () => {
        if (!seasonForm.label || !seasonForm.valid_from || !seasonForm.valid_until || !seasonForm.hourly_rate) {
            setError("Completa nombre, fechas y precio.");
            return;
        }
        setSavingSeason(true);
        try {
            const { price: created } = await apiFetch<{ price: PriceRule }>("/prices", {
                method: "POST",
                body: JSON.stringify({
                    court_id: seasonForm.court_id || null,
                    hourly_rate: Math.round(Number(seasonForm.hourly_rate) * 100),
                    valid_days: seasonForm.valid_days,
                    start_time: "00:00",
                    end_time: "23:59",
                    valid_from: new Date(seasonForm.valid_from).toISOString(),
                    valid_until: new Date(seasonForm.valid_until + "T23:59:59").toISOString(),
                    label: seasonForm.label,
                }),
            });
            setPriceRules(prev => [...prev, created]);
            setSeasonForm({ label: "", valid_from: "", valid_until: "", court_id: "", valid_days: ALL_DAYS, hourly_rate: "" });
            setShowSeasonForm(false);
            flash("Período especial creado.");
        } catch (e: any) { setError(e.message); }
        finally { setSavingSeason(false); }
    };

    const handleDeleteSeason = async (id: string) => {
        if (!confirm("¿Eliminar este período especial?")) return;
        try {
            await apiFetch(`/prices/${id}`, { method: "DELETE" });
            setPriceRules(prev => prev.filter(p => p.id !== id));
            flash("Período eliminado.");
        } catch (e: any) { setError(e.message); }
    };

    const handleSimulate = async () => {
        setSimResult(null);
        setSimLoading(true);
        setError("");
        try {
            const result = await apiFetch<any>("/reservations/calculate", {
                method: "POST",
                body: JSON.stringify({
                    court_id: simCourt,
                    user_id: "00000000-0000-0000-0000-000000000000",
                    start_time: `${simDate}T${simStart}:00.000Z`,
                    end_time: `${simDate}T${simEnd}:00.000Z`,
                }),
            });
            setSimResult(result);
        } catch (e: any) { setError(e.message); }
        finally { setSimLoading(false); }
    };

    const seasonalRules = priceRules.filter(isSeasonalRule);

    if (loading) {
        return (
            <div className="p-20 text-center flex flex-col items-center gap-4">
                <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
                <p className="text-slate-500 font-medium">Cargando tarifas...</p>
            </div>
        );
    }

    const dayOptions = [
        { label: "Todos los días", value: ALL_DAYS },
        { label: "Lunes – Viernes", value: WEEKDAY_DAYS },
        { label: "Sábado – Domingo", value: WEEKEND_DAYS },
    ];

    return (
        <Layout>
            <div className="space-y-8 animate-in fade-in duration-500">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
                        <Ticket className="w-8 h-8 text-indigo-600" />
                        Tarifas
                    </h1>
                    <p className="text-slate-500 mt-1">
                        Precio por hora por pista. El coste se calcula proporcionalmente al tiempo reservado.
                    </p>
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

                        {/* Global Config */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3 text-slate-900 font-bold">
                                <Settings className="w-5 h-5 text-slate-500" />
                                Configuración General
                            </div>
                            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                        <Clock className="w-3 h-3" /> Duración mínima de reserva
                                    </label>
                                    <select
                                        title="Intervalo de reserva"
                                        value={club?.segment_minutes}
                                        onChange={async (e) => {
                                            const updated = await apiFetch<Club>("/club", {
                                                method: "PATCH",
                                                body: JSON.stringify({ segment_minutes: Number(e.target.value) }),
                                            }).catch(() => null);
                                            if (updated) { setClub(updated); flash("Intervalo guardado."); }
                                        }}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none appearance-none"
                                    >
                                        <option value={15}>15 minutos</option>
                                        <option value={30}>30 minutos</option>
                                        <option value={60}>60 minutos</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        Tarifa base (sin pista específica)
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">€</span>
                                        <input
                                            type="number" min="0" step="0.50"
                                            value={defaultRateInput} placeholder="0,00"
                                            onChange={(e) => setDefaultRateInput(e.target.value)}
                                            onBlur={(e) => handleSaveDefaultRate(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-10 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">/h</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400">Se aplica si una pista no tiene tarifa propia.</p>
                                </div>
                            </div>
                        </div>

                        {/* Per-court prices */}
                        <div className="space-y-3">
                            <h2 className="text-lg font-bold text-slate-900 px-1">Tarifas por Pista</h2>
                            {courts.length === 0 && (
                                <div className="p-10 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
                                    <p className="text-slate-400 italic">No hay pistas configuradas.</p>
                                </div>
                            )}
                            {courts.map((court) => {
                                const wdInput = courtInputs[court.id]?.weekday ?? "";
                                const weInput = courtInputs[court.id]?.weekend ?? "";
                                const wdCents = wdInput ? Math.round(Number(wdInput) * 100) : null;
                                const weCents = weInput ? Math.round(Number(weInput) * 100) : null;

                                return (
                                    <div key={court.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
                                        <p className="font-bold text-slate-900 mb-4">{court.name}</p>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Lunes – Viernes</label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">€</span>
                                                    <input
                                                        type="number" min="0" step="0.50"
                                                        value={wdInput} placeholder="0,00"
                                                        onChange={(e) => setCourtInputs(prev => ({ ...prev, [court.id]: { ...prev[court.id], weekday: e.target.value } }))}
                                                        onBlur={(e) => saveCourtRule(court, e.target.value, WEEKDAY_DAYS, "Tarifa entre semana")}
                                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-10 py-2.5 text-sm font-bold text-indigo-600 focus:ring-2 focus:ring-indigo-500 outline-none"
                                                    />
                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">/h</span>
                                                </div>
                                                {wdCents ? (
                                                    <p className="text-[11px] text-slate-400">
                                                        60 min = <b className="text-emerald-600">{formatEuros(calcPrice(wdCents, 60))}</b>
                                                        &nbsp;·&nbsp;90 min = <b className="text-emerald-600">{formatEuros(calcPrice(wdCents, 90))}</b>
                                                    </p>
                                                ) : null}
                                            </div>

                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-amber-600 uppercase tracking-wider">Sábado – Domingo / Festivos</label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-400 font-bold text-sm">€</span>
                                                    <input
                                                        type="number" min="0" step="0.50"
                                                        value={weInput} placeholder="opcional"
                                                        onChange={(e) => setCourtInputs(prev => ({ ...prev, [court.id]: { ...prev[court.id], weekend: e.target.value } }))}
                                                        onBlur={(e) => saveCourtRule(court, e.target.value, WEEKEND_DAYS, "Tarifa fin de semana")}
                                                        className="w-full bg-amber-50 border border-amber-200 rounded-xl pl-8 pr-10 py-2.5 text-sm font-bold text-amber-700 focus:ring-2 focus:ring-amber-400 outline-none"
                                                    />
                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-400 text-xs">/h</span>
                                                </div>
                                                {weCents ? (
                                                    <p className="text-[11px] text-slate-400">
                                                        60 min = <b className="text-amber-600">{formatEuros(calcPrice(weCents, 60))}</b>
                                                        &nbsp;·&nbsp;90 min = <b className="text-amber-600">{formatEuros(calcPrice(weCents, 90))}</b>
                                                    </p>
                                                ) : (
                                                    <p className="text-[10px] text-slate-400 italic">Usa la tarifa entre semana si no se especifica.</p>
                                                )}
                                            </div>
                                        </div>

                                        {(wdCents || weCents) && (
                                            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-3 bg-violet-50 rounded-xl px-4 py-3">
                                                <Trophy className="w-4 h-4 text-violet-600 flex-shrink-0" />
                                                <div className="flex-1">
                                                    <p className="text-xs font-bold text-violet-700">Torneo Americano (8 jugadores · 3h)</p>
                                                    <p className="text-[11px] text-slate-400 mt-0.5">
                                                        Entre semana:&nbsp;<b className="text-violet-700">{wdCents ? formatEuros(calcPrice(wdCents, 180)) : "—"}</b>
                                                        {weCents && <>&nbsp;·&nbsp;Fin de semana:&nbsp;<b className="text-amber-600">{formatEuros(calcPrice(weCents, 180))}</b></>}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] text-slate-400">por jugador</p>
                                                    <p className="text-sm font-black text-violet-700">
                                                        {wdCents ? formatEuros(Math.round(calcPrice(wdCents, 180) / 8)) : "—"}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Seasonal / Special periods */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between px-1">
                                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-violet-500" />
                                    Períodos Especiales
                                </h2>
                                <button
                                    onClick={() => setShowSeasonForm(v => !v)}
                                    className="flex items-center gap-1.5 text-sm font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors"
                                >
                                    <Plus className="w-4 h-4" />
                                    Añadir período
                                </button>
                            </div>
                            <p className="text-xs text-slate-400 px-1">
                                Navidad, Semana Santa, Verano, torneos especiales... Tienen prioridad sobre las tarifas habituales.
                            </p>

                            {/* New season form */}
                            {showSeasonForm && (
                                <div className="bg-violet-50 border border-violet-200 rounded-2xl p-5 space-y-4">
                                    <p className="text-sm font-bold text-violet-900">Nuevo período especial</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="sm:col-span-2 space-y-1">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nombre</label>
                                            <input
                                                type="text"
                                                placeholder="Ej: Navidad 2025, Semana Santa, Verano..."
                                                value={seasonForm.label}
                                                onChange={e => setSeasonForm(p => ({ ...p, label: e.target.value }))}
                                                className="w-full bg-white border border-violet-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-violet-400 outline-none"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Desde</label>
                                            <input
                                                type="date"
                                                value={seasonForm.valid_from}
                                                onChange={e => setSeasonForm(p => ({ ...p, valid_from: e.target.value }))}
                                                className="w-full bg-white border border-violet-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-violet-400 outline-none"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Hasta</label>
                                            <input
                                                type="date"
                                                value={seasonForm.valid_until}
                                                onChange={e => setSeasonForm(p => ({ ...p, valid_until: e.target.value }))}
                                                className="w-full bg-white border border-violet-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-violet-400 outline-none"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Días aplicables</label>
                                            <select
                                                value={seasonForm.valid_days}
                                                onChange={e => setSeasonForm(p => ({ ...p, valid_days: e.target.value }))}
                                                className="w-full bg-white border border-violet-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-violet-400 outline-none"
                                            >
                                                {dayOptions.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pista (opcional)</label>
                                            <select
                                                value={seasonForm.court_id}
                                                onChange={e => setSeasonForm(p => ({ ...p, court_id: e.target.value }))}
                                                className="w-full bg-white border border-violet-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-violet-400 outline-none"
                                            >
                                                <option value="">Todas las pistas</option>
                                                {courts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Precio (€/h)</label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">€</span>
                                                <input
                                                    type="text"
                                                    inputMode="decimal"
                                                    value={seasonForm.hourly_rate} 
                                                    placeholder="0,00"
                                                    onChange={e => {
                                                        const val = e.target.value.replace(',', '.');
                                                        if (val === '' || /^\d*\.?\d*$/.test(val)) {
                                                            setSeasonForm(p => ({ ...p, hourly_rate: val }));
                                                        }
                                                    }}
                                                    className="w-full bg-white border border-violet-200 rounded-lg pl-8 pr-10 py-2 text-sm focus:ring-2 focus:ring-violet-400 outline-none"
                                                />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">/h</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={handleSaveSeason}
                                            disabled={savingSeason}
                                            className="px-5 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition-colors"
                                        >
                                            {savingSeason ? "Guardando..." : "Guardar período"}
                                        </button>
                                        <button
                                            onClick={() => setShowSeasonForm(false)}
                                            className="px-5 py-2 text-slate-500 hover:text-slate-700 font-bold rounded-xl text-sm transition-colors"
                                        >
                                            Cancelar
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Season rules list */}
                            {seasonalRules.length === 0 && !showSeasonForm && (
                                <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
                                    <p className="text-slate-400 text-sm italic">No hay períodos especiales configurados.</p>
                                </div>
                            )}
                            {seasonalRules.map(rule => {
                                const courtName = rule.court_id
                                    ? courts.find(c => c.id === rule.court_id)?.name ?? "Pista"
                                    : "Todas las pistas";
                                const rateCents = rule.hourly_rate;
                                const dayLabel = rule.valid_days === ALL_DAYS ? "Todos los días"
                                    : rule.valid_days === WEEKDAY_DAYS ? "L–V"
                                    : rule.valid_days === WEEKEND_DAYS ? "S–D"
                                    : rule.valid_days;
                                const from = rule.valid_from ? new Date(rule.valid_from).toLocaleDateString("es-ES") : "—";
                                const until = rule.valid_until ? new Date(rule.valid_until).toLocaleDateString("es-ES") : "—";

                                return (
                                    <div key={rule.id} className="bg-white border border-violet-100 rounded-2xl p-5 flex items-center gap-4 group">
                                        <div className="w-2 h-12 bg-violet-400 rounded-full flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-slate-900 truncate">{rule.label || "Período especial"}</p>
                                            <p className="text-xs text-slate-400 mt-0.5">
                                                {from} → {until}&nbsp;·&nbsp;{dayLabel}&nbsp;·&nbsp;{courtName}
                                            </p>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <p className="font-black text-violet-700 text-lg">{formatEuros(rateCents)}<span className="text-xs font-normal text-slate-400">/h</span></p>
                                            <p className="text-[10px] text-slate-400">
                                                90 min = {formatEuros(calcPrice(rateCents, 90))}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteSeason(rule.id)}
                                            className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                            title="Eliminar"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Simulator sidebar */}
                    <div className="xl:sticky xl:top-24">
                        <div className="bg-slate-900 rounded-3xl shadow-xl p-6 text-white overflow-hidden relative group">
                            <div className="absolute top-0 right-0 -m-8 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl group-hover:bg-indigo-500/40 transition-colors duration-700" />

                            <div className="flex items-center gap-3 mb-6 relative">
                                <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                                    <Play className="w-5 h-5 fill-white" />
                                </div>
                                <h3 className="text-xl font-bold">Simulador de Precio</h3>
                            </div>

                            <div className="space-y-4 relative">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest flex items-center gap-1.5">
                                        <Calendar className="w-3 h-3" /> Fecha
                                    </label>
                                    <input
                                        type="date" title="Fecha" value={simDate}
                                        onChange={e => setSimDate(e.target.value)}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-white"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest">Entrada</label>
                                        <input
                                            type="time" title="Entrada" value={simStart}
                                            onChange={e => setSimStart(e.target.value)}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-white"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest">Salida</label>
                                        <input
                                            type="time" title="Salida" value={simEnd}
                                            onChange={e => setSimEnd(e.target.value)}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-white"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest">Pista</label>
                                    <select
                                        title="Pista" value={simCourt}
                                        onChange={e => setSimCourt(e.target.value)}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-white appearance-none"
                                    >
                                        {courts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <button
                                    onClick={handleSimulate}
                                    disabled={simLoading || !simCourt}
                                    className="w-full py-4 mt-2 bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 text-white font-bold rounded-2xl transition-all shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-3"
                                >
                                    {simLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Search className="w-5 h-5" /> Calcular Precio</>}
                                </button>
                            </div>

                            {simResult && (
                                <div className="mt-8 pt-8 border-t border-slate-800 animate-in slide-in-from-top-4 duration-500">
                                    <div className="flex justify-between items-baseline mb-4">
                                        <span className="text-slate-400 text-sm font-medium">Importe estimado:</span>
                                        <span className="text-3xl font-black">
                                            {(simResult.totalCents / 100).toFixed(2).replace(".", ",")}
                                            <span className="text-indigo-400 ml-1 text-xl">€</span>
                                        </span>
                                    </div>
                                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                        {simResult.breakdown.map((b: any, i: number) => (
                                            <div key={i} className="flex items-center justify-between text-xs py-2 px-3 bg-slate-800/50 rounded-lg">
                                                <span className="text-slate-300 font-medium">{b.start.split('T')[1]?.substring(0, 5) || b.start} – {b.end?.split('T')[1]?.substring(0, 5) || b.end || ""}</span>
                                                <span className="font-bold">{((b.rateCents || 0) / 100).toFixed(2).replace(".", ",")} €</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
