import React, { useState, useEffect } from "react";
import { analyticsApi, KpiData } from "../lib/analytics";
import { courtsApi } from "../lib/courts";
import {
    BarChart3,
    Calendar,
    Settings2,
    RefreshCw,
    FileCheck2,
    Info,
    Flame,
    Clock,
    TrendingUp,
    Filter,
    ArrowUpRight,
    ArrowDownRight,
    Loader2,
    CalendarDays,
    LayoutGrid,
    ChevronDown,
    SearchX
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const KpisOperativos: React.FC = () => {
    const today = new Date().toISOString().split("T")[0];
    const [filters, setFilters] = useState({
        from: today,
        to: today,
        courtId: "all",
        segmentMinutes: 60,
        includeCancelled: false
    });

    const [courts, setCourts] = useState<any[]>([]);
    const [data, setData] = useState<KpiData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadInitialData = async () => {
        try {
            const res = await courtsApi.list();
            setCourts(res.courts || []);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchKpis = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await analyticsApi.getKpis(filters);
            setData(res);
        } catch (err: any) {
            setError(err.message || "Error al cargar KPIs");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadInitialData();
        fetchKpis();
    }, []);

    const getHeatmapColor = (minutes: number) => {
        if (minutes === 0) return "rgba(0, 0, 0, 0.03)";
        const intensity = Math.min(minutes / 60, 1);
        return `rgba(79, 70, 229, ${0.1 + intensity * 0.85})`;
    };

    const avgOccupancy = data ? (data.byCourt.reduce((acc, c) => acc + c.occupancyPct, 0) / (data.byCourt.length || 1)) : 0;

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-12">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black tracking-tight text-slate-900 flex items-center gap-3">
                        <BarChart3 className="w-8 h-8 text-indigo-600" />
                        KPIs Operativos
                    </h1>
                    <p className="text-slate-500 font-medium">Análisis de rendimiento, saturación y patrones de uso.</p>
                </div>
                <button
                    onClick={fetchKpis}
                    disabled={loading}
                    className="bg-white border-2 border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/30 text-slate-600 font-bold py-3 px-6 rounded-2xl transition-all shadow-sm flex items-center gap-2 group"
                >
                    <RefreshCw className={cn("w-5 h-5 group-hover:rotate-180 transition-transform duration-500", loading && "animate-spin")} />
                    {loading ? "Sincronizando..." : "Actualizar Datos"}
                </button>
            </header>

            {/* Premium Filters Section */}
            <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 p-8 flex flex-wrap gap-8 items-end relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full -mr-32 -mt-32 -z-10"></div>

                <div className="flex-1 min-w-[200px] space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 ml-1">
                        <CalendarDays className="w-3 h-3 text-indigo-500" /> Rango Inicial
                    </label>
                    <input
                        type="date"
                        value={filters.from}
                        onChange={(e) => setFilters({ ...filters, from: e.target.value })}
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-700 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100 outline-none transition-all cursor-pointer"
                    />
                </div>
                <div className="flex-1 min-w-[200px] space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 ml-1">
                        <CalendarDays className="w-3 h-3 text-emerald-500" /> Rango Final
                    </label>
                    <input
                        type="date"
                        value={filters.to}
                        onChange={(e) => setFilters({ ...filters, to: e.target.value })}
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-700 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100 outline-none transition-all cursor-pointer"
                    />
                </div>
                <div className="flex-1 min-w-[200px] space-y-3 px-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl hover:border-indigo-100 transition-all cursor-pointer group">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pista Seleccionada</p>
                            <select
                                value={filters.courtId}
                                onChange={(e) => setFilters({ ...filters, courtId: e.target.value })}
                                className="bg-transparent border-none text-sm font-black text-slate-700 p-0 focus:ring-0 cursor-pointer w-full"
                            >
                                <option value="all">Filtro Global</option>
                                {courts.map((c) => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                        <Filter className="w-4 h-4 text-slate-300 group-hover:text-indigo-400 transition-colors" />
                    </div>
                </div>
                <div className="flex-1 min-w-[140px] space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Segmentos</label>
                    <select
                        value={filters.segmentMinutes}
                        onChange={(e) => setFilters({ ...filters, segmentMinutes: Number(e.target.value) })}
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-700 focus:border-indigo-500 transition-all cursor-pointer"
                    >
                        <option value={15}>15m</option>
                        <option value={30}>30m</option>
                        <option value={60}>1h</option>
                    </select>
                </div>
                <div className="flex items-center gap-3 mb-3 px-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl cursor-pointer hover:bg-white transition-all group">
                    <input
                        id="cancelledKpi"
                        type="checkbox"
                        checked={filters.includeCancelled}
                        onChange={(e) => setFilters({ ...filters, includeCancelled: e.target.checked })}
                        className="w-5 h-5 text-indigo-600 rounded-lg border-slate-300 focus:ring-indigo-500 cursor-pointer"
                    />
                    <label htmlFor="cancelledKpi" className="text-xs font-black text-slate-500 uppercase tracking-widest cursor-pointer group-hover:text-slate-800 transition-colors">
                        Siniestralidad
                    </label>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-2xl flex items-center gap-4 animate-in shake-in">
                    <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center text-red-600">
                        <Info className="w-6 h-6" />
                    </div>
                    <p className="text-red-700 font-bold tracking-tight">{error}</p>
                </div>
            )}

            {data && (
                <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
                    {/* Top Stats - Modern Metric Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative">
                            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-indigo-50/50 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
                            <div className="relative flex items-center justify-between mb-6">
                                <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
                                    <LayoutGrid className="w-6 h-6" />
                                </div>
                                <span className="flex items-center text-[10px] font-black text-emerald-500 bg-emerald-50 px-2 py-1 rounded-full">
                                    TOP <ArrowUpRight className="w-3 h-3 ml-0.5" />
                                </span>
                            </div>
                            <div className="relative space-y-1">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Ocupación Global</p>
                                <div className="text-4xl font-black text-slate-900 tracking-tighter italic">
                                    {avgOccupancy.toFixed(1)}%
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative">
                            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-emerald-50/50 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
                            <div className="relative flex items-center justify-between mb-6">
                                <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
                                    <FileCheck2 className="w-6 h-6" />
                                </div>
                            </div>
                            <div className="relative space-y-1">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Reservas Totales</p>
                                <div className="text-4xl font-black text-slate-900 tracking-tighter">
                                    {data.totals.reservations}
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative">
                            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-indigo-50/50 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
                            <div className="relative flex items-center justify-between mb-6">
                                <div className="p-3 bg-slate-900 rounded-2xl text-white">
                                    <TrendingUp className="w-6 h-6" />
                                </div>
                            </div>
                            <div className="relative space-y-1">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Ingresos Brutos</p>
                                <div className="text-4xl font-black text-slate-900 tracking-tighter">
                                    <span className="text-2xl font-bold mr-1 text-slate-400">€</span>
                                    {data.totals.revenue.toLocaleString('es-ES', { minimumFractionDigits: 0 })}
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative">
                            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-rose-50/50 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
                            <div className="relative flex items-center justify-between mb-6">
                                <div className="p-3 bg-rose-50 rounded-2xl text-rose-500">
                                    <SearchX className="w-6 h-6" />
                                </div>
                                <span className="flex items-center text-[10px] font-black text-rose-500 bg-rose-50 px-2 py-1 rounded-full">
                                    BAJO <ArrowDownRight className="w-3 h-3 ml-0.5" />
                                </span>
                            </div>
                            <div className="relative space-y-1">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Churn Rate (Can.)</p>
                                <div className="text-4xl font-black text-slate-900 tracking-tighter italic">
                                    {data.totals.cancellationRate}%
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative lg:col-span-1">
                            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-slate-50 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
                            <div className="relative flex items-center justify-between mb-6">
                                <div className="p-3 bg-slate-100 rounded-2xl text-slate-600">
                                    <Clock className="w-6 h-6" />
                                </div>
                            </div>
                            <div className="relative space-y-1">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Carga de Trabajo</p>
                                <div className="text-4xl font-black text-slate-900 tracking-tighter">
                                    {data.totals.hoursBooked}<span className="text-xl font-bold text-slate-300 ml-1">h</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Heatmap Grid - Large Visualization */}
                        <div className="lg:col-span-2 bg-white rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/40 p-10 overflow-hidden relative group">
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-10">
                                    <div className="space-y-1">
                                        <h3 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                                            <Flame className="w-6 h-6 text-orange-500" />
                                            Densidad de Ocupación
                                        </h3>
                                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest px-1">Distribución horaria por día de la semana</p>
                                    </div>
                                    <div className="flex bg-slate-50 p-1.5 rounded-2xl">
                                        <button className="px-4 py-2 bg-white rounded-xl shadow-sm text-xs font-black text-indigo-600">Minutos</button>
                                        <button className="px-4 py-2 text-xs font-black text-slate-400 hover:text-slate-600 transition-colors">Interés</button>
                                    </div>
                                </div>

                                <div className="overflow-x-auto pb-4 custom-scrollbar">
                                    <table className="w-full border-separate border-spacing-1.5">
                                        <thead>
                                            <tr>
                                                <th className="w-20"></th>
                                                {data.heatmap.timeSlots.map((slot, i) => (
                                                    <th key={slot} className="text-[9px] text-slate-300 font-black rotate-[-45deg] pb-6 h-12 align-bottom uppercase tracking-tighter">
                                                        {i % 2 === 0 ? slot : ""}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.heatmap.days.map((day, rIdx) => (
                                                <tr key={day}>
                                                    <td className="text-[10px] font-black text-slate-500 pr-4 py-1.5 uppercase tracking-widest border-r border-slate-50">{day.substring(0, 3)}</td>
                                                    {data.heatmap.matrix[rIdx].map((minutes, cIdx) => {
                                                        const occupancy = (minutes / data.heatmap.bucketMinutes) * 100;
                                                        return (
                                                            <td
                                                                key={`${rIdx}-${cIdx}`}
                                                                style={{ backgroundColor: getHeatmapColor(minutes) }}
                                                                className="w-6 h-10 rounded-lg transition-all hover:scale-125 hover:z-20 cursor-crosshair relative group shadow-sm border border-black/5"
                                                            >
                                                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 bg-slate-900 text-white p-4 rounded-2xl shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-all scale-90 group-hover:scale-100 origin-bottom border border-slate-800">
                                                                    <div className="flex items-center gap-3 mb-2">
                                                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getHeatmapColor(minutes) }}></div>
                                                                        <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">{day} - {data.heatmap.timeSlots[cIdx]}</p>
                                                                    </div>
                                                                    <p className="text-xl font-black text-white">{occupancy.toFixed(0)}% <span className="text-[10px] text-slate-500 font-bold tracking-normal ml-1">({minutes} min)</span></p>
                                                                </div>
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="mt-10 flex items-center justify-between border-t border-slate-50 pt-6">
                                    <div className="flex items-center gap-6">
                                        <div className="flex bg-slate-50/50 p-3 rounded-2xl items-center gap-4">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nivel de Carga</span>
                                            <div className="flex gap-1.5">
                                                {[0.05, 0.2, 0.4, 0.6, 0.85].map(i => (
                                                    <div key={i} className="w-6 h-3 rounded-full shadow-inner" style={{ backgroundColor: `rgba(79, 70, 229, ${i})` }}></div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex p-3 bg-indigo-50 rounded-2xl items-center gap-2">
                                        <Info className="w-4 h-4 text-indigo-500" />
                                        <span className="text-[10px] font-black text-indigo-900 uppercase">Datos en tiempo real</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Peak/Offpeak Multi-Column List */}
                        <div className="space-y-8">
                            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 p-8">
                                <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3">
                                    <TrendingUp className="w-6 h-6 text-indigo-600" />
                                    Franjas Críticas
                                </h3>

                                <div className="space-y-8">
                                    <div>
                                        <div className="flex items-center justify-between mb-5 px-1">
                                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Picos de saturación</h4>
                                            <span className="w-6 h-6 bg-indigo-50 rounded-full flex items-center justify-center">
                                                <Flame className="w-3 h-3 text-indigo-600" />
                                            </span>
                                        </div>
                                        <div className="space-y-3">
                                            {data.peakOffpeak.topByOccupancy.map((s, i) => (
                                                <div key={i} className="flex items-center justify-between p-4 bg-slate-50 hover:bg-indigo-50/50 rounded-2xl transition-all border-2 border-transparent hover:border-indigo-100 group">
                                                    <div className="flex items-center gap-4">
                                                        <span className="w-8 h-8 flex items-center justify-center bg-white text-indigo-600 rounded-xl text-[10px] font-black shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                                            #{i + 1}
                                                        </span>
                                                        <div className="space-y-0.5">
                                                            <p className="text-xs font-black text-slate-700">{s.day}</p>
                                                            <p className="text-[10px] font-bold text-slate-400 tracking-widest">{s.time}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm font-black text-indigo-600 italic">{s.minutesBooked}m</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex items-center justify-between mb-5 px-1">
                                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Oportunidades (Valle)</h4>
                                            <span className="w-6 h-6 bg-slate-50 rounded-full flex items-center justify-center">
                                                <Clock className="w-3 h-3 text-slate-400" />
                                            </span>
                                        </div>
                                        <div className="space-y-3">
                                            {data.peakOffpeak.bottomByOccupancy.map((s, i) => (
                                                <div key={i} className="flex items-center justify-between p-4 bg-white rounded-2xl border-2 border-slate-50 hover:border-slate-100 transition-all group">
                                                    <div className="space-y-0.5">
                                                        <p className="text-xs font-black text-slate-600">{s.day}</p>
                                                        <p className="text-[10px] font-bold text-slate-400 tracking-widest">{s.time}</p>
                                                    </div>
                                                    <p className="text-xs font-bold text-slate-300 group-hover:text-slate-500 transition-colors uppercase">{s.minutesBooked}m usage</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Breakdown by Court - Elegant Table */}
                    <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500"></div>
                        <div className="p-10 border-b border-slate-50 flex items-center justify-between">
                            <div className="space-y-1">
                                <h3 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                                    <Settings2 className="w-6 h-6 text-indigo-600" />
                                    Detalle por Pista
                                </h3>
                                <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Rendimiento individual y rentabilidad</p>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="text-left bg-slate-50/50">
                                        <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] first:rounded-tl-3xl">Pista de Juego</th>
                                        <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Eficiencia Occupation</th>
                                        <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Tiempo Neto</th>
                                        <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Rentabilidad (€)</th>
                                        <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] last:rounded-tr-3xl">Tickets</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {data.byCourt.map((c) => (
                                        <tr key={c.courtId} className="hover:bg-indigo-50/20 transition-all group">
                                            <td className="px-10 py-8">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-black text-xs shadow-lg group-hover:scale-110 transition-transform italic">
                                                        {c.courtName.substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <p className="font-black text-slate-900 tracking-tight text-lg">{c.courtName}</p>
                                                </div>
                                            </td>
                                            <td className="px-10 py-8">
                                                <div className="space-y-3">
                                                    <div className="flex items-center justify-between text-[10px] font-black uppercase">
                                                        <span className="text-indigo-600">{c.occupancyPct}%</span>
                                                        <span className="text-slate-300">Target 85%</span>
                                                    </div>
                                                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                                                        <div
                                                            className="h-full bg-indigo-600 rounded-full shadow-lg group-hover:shadow-indigo-500/50 transition-all duration-700 ease-out"
                                                            style={{ width: `${c.occupancyPct}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-10 py-8">
                                                <div className="flex items-center gap-2">
                                                    <Clock className="w-4 h-4 text-slate-300" />
                                                    <span className="text-sm font-black text-slate-700 italic">{(c.minutesBooked / 60).toFixed(1)}h</span>
                                                </div>
                                            </td>
                                            <td className="px-10 py-8">
                                                <div className="flex flex-col">
                                                    <span className="text-xl font-black text-emerald-600 tracking-tighter">€{c.revenue.toLocaleString('es-ES')}</span>
                                                    <span className="text-[10px] font-bold text-slate-300">Neto por periodo</span>
                                                </div>
                                            </td>
                                            <td className="px-10 py-8">
                                                <span className={cn(
                                                    "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm",
                                                    c.cancelledCount > 5 ? "bg-rose-50 text-rose-500" : "bg-slate-100 text-slate-600"
                                                )}>
                                                    {c.reservations} <span className="text-[8px] opacity-60">({c.cancelledCount} can)</span>
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {!data && !loading && (
                <div className="flex flex-col items-center justify-center py-48 gap-6 bg-white rounded-[3rem] border-4 border-dashed border-slate-50 italic">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                        <BarChart3 className="w-10 h-10" />
                    </div>
                    <p className="text-slate-400 font-bold text-lg tracking-tight">No se han procesado métricas para este rango temporal.</p>
                </div>
            )}

            {loading && (
                <div className="fixed inset-0 bg-white/60 backdrop-blur-md z-[100] flex flex-col items-center justify-center gap-6 animate-in fade-in transition-all">
                    <div className="relative">
                        <Loader2 className="w-24 h-24 text-indigo-600 animate-spin transition-all" strokeWidth={1} />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Flame className="w-8 h-8 text-indigo-400 animate-pulse" />
                        </div>
                    </div>
                    <div className="text-center space-y-2">
                        <p className="text-2xl font-black text-slate-900 tracking-tighter">Big Data Engine</p>
                        <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.5em] animate-pulse">Computando patrones de usuario</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default KpisOperativos;
