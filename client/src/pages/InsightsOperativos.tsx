import React, { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { analyticsApi, InsightData } from "../lib/analytics";
import { courtsApi } from "../lib/courts";
import {
    Lightbulb,
    Bell,
    TrendingUp,
    TrendingDown,
    AlertTriangle,
    CheckCircle2,
    Calendar,
    Settings2,
    RefreshCw,
    Sparkles,
    ChevronRight,
    ArrowUpRight,
    ArrowDownRight,
    Info,
    LayoutDashboard,
    Loader2
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const InsightsOperativos: React.FC = () => {
    const today = new Date().toISOString().split("T")[0];
    const [filters, setFilters] = useState({
        from: today,
        to: today,
        courtId: "all",
        compareToPreviousPeriod: true
    });

    const [courts, setCourts] = useState<any[]>([]);
    const [data, setData] = useState<InsightData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadCourts = async () => {
        try {
            const res = await courtsApi.list();
            setCourts(res.courts || []);
        } catch { }
    };

    const fetchInsights = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await analyticsApi.getInsights(filters);
            setData(res);
        } catch (err: any) {
            setError(err.message || "Error al cargar insights");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCourts();
        fetchInsights();
    }, []);

    const DeltaBadge = ({ val, suffix = "" }: { val: number, suffix?: string }) => {
        const isPos = val > 0;
        const color = isPos ? "text-emerald-600 bg-emerald-50" : "text-rose-600 bg-rose-50 border-rose-100";
        const Icon = isPos ? ArrowUpRight : ArrowDownRight;
        return (
            <span className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all shadow-sm",
                color
            )}>
                <Icon className="w-3.5 h-3.5" />
                {isPos ? "+" : ""}{val}{suffix}
            </span>
        );
    };

    return (
        <Layout>
            <div className="space-y-10 animate-in fade-in duration-700 pb-12">
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-1.5">
                        <h1 className="text-4xl font-black tracking-tighter text-slate-900 flex items-center gap-4">
                            <div className="p-3 bg-amber-100 rounded-[1.25rem] shadow-sm shadow-amber-200/50">
                                <Lightbulb className="w-8 h-8 text-amber-600" />
                            </div>
                            Inteligencia de Negocio
                        </h1>
                        <p className="text-slate-500 font-medium text-lg leading-snug">Sugerencias algorítmicas y detección precoz de anomalías operativas.</p>
                    </div>
                    <div className="flex bg-slate-100 p-1.5 rounded-2xl">
                        <button className="px-6 py-2.5 bg-white rounded-xl shadow-sm text-xs font-black text-indigo-600">Periodo Actual</button>
                        <button className="px-6 py-2.5 text-xs font-black text-slate-400 hover:text-slate-600 transition-all">Consolidado</button>
                    </div>
                </header>

                {/* Premium Filters Glassmorphism */}
                <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-indigo-900/5 border border-white p-10 flex flex-wrap items-end gap-8 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 rounded-full -mr-40 -mt-40 blur-3xl group-hover:scale-110 transition-transform duration-1000"></div>

                    <div className="flex-[2] min-w-[300px] space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 ml-1">
                            <Calendar className="w-3.5 h-3.5 text-indigo-500" /> Ventana de Análisis
                        </label>
                        <div className="flex items-center gap-3">
                            <input
                                type="date"
                                value={filters.from}
                                onChange={e => setFilters({ ...filters, from: e.target.value })}
                                className="flex-1 bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold text-slate-700 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100 outline-none transition-all cursor-pointer"
                            />
                            <div className="w-10 h-1 bg-slate-100 rounded-full"></div>
                            <input
                                type="date"
                                value={filters.to}
                                onChange={e => setFilters({ ...filters, to: e.target.value })}
                                className="flex-1 bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold text-slate-700 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100 outline-none transition-all cursor-pointer"
                            />
                        </div>
                    </div>
                    <div className="flex-1 min-w-[220px] space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 ml-1">
                            <Settings2 className="w-3.5 h-3.5 text-slate-400" /> Alcance del Filtro
                        </label>
                        <select
                            value={filters.courtId}
                            onChange={e => setFilters({ ...filters, courtId: e.target.value })}
                            className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-sm font-black text-slate-700 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100 outline-none transition-all cursor-pointer appearance-none"
                        >
                            <option value="all">Visión Corporativa (Global)</option>
                            {courts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <button
                        onClick={fetchInsights}
                        disabled={loading}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-4.5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.3em] transition-all shadow-2xl shadow-indigo-200 disabled:opacity-50 flex items-center justify-center gap-3 group active:scale-95"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />}
                        Ejecutar Algoritmo
                    </button>
                </div>

                {error && (
                    <div className="bg-rose-50 border-2 border-rose-100 p-6 rounded-3xl flex items-center gap-4 animate-in shake-in">
                        <div className="w-12 h-12 bg-rose-100 rounded-2xl flex items-center justify-center text-rose-600">
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-rose-900 font-black text-xs uppercase tracking-widest">Error de Sincronización</p>
                            <p className="text-rose-700 font-bold tracking-tight mt-0.5">{error}</p>
                        </div>
                    </div>
                )}

                {data && (
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
                        {/* Alertas Críticas de Negocio */}
                        {data.alerts.length > 0 && (
                            <div className="lg:col-span-4 space-y-4">
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2 flex items-center gap-2">
                                    <Bell className="w-3.5 h-3.5 text-rose-500 animate-bounce" /> Alertas en Tiempo Real
                                </h3>
                                {data.alerts.map(alert => (
                                    <div key={alert.id} className="bg-white border border-rose-100 rounded-[2.5rem] shadow-xl shadow-rose-900/5 p-8 flex items-center justify-between group hover:shadow-2xl hover:shadow-rose-900/10 transition-all duration-500 overflow-hidden relative">
                                        <div className="absolute top-0 left-0 w-2 h-full bg-rose-500"></div>
                                        <div className="flex items-center gap-6">
                                            <div className="w-16 h-16 bg-rose-50 rounded-[1.5rem] flex items-center justify-center text-rose-600 shadow-inner group-hover:rotate-6 transition-transform">
                                                <Bell className="w-8 h-8" />
                                            </div>
                                            <div>
                                                <h4 className="text-2xl font-black text-slate-900 tracking-tighter italic">{alert.title}</h4>
                                                <p className="text-slate-500 font-medium mt-1">
                                                    {alert.threshold} • <span className="font-extrabold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-lg">{(alert.value * 100).toFixed(1)}% detectado</span>
                                                </p>
                                            </div>
                                        </div>
                                        <button className="bg-slate-900 text-white px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg active:scale-95">REVISAR MÉTRICAS</button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Resumen de Comparativa - Vertical Strip */}
                        <div className="space-y-8">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">Tendencias de Periodo</h3>
                            <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/50 space-y-10 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-bl-[4rem] -mr-8 -mt-8"></div>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-start">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ocupación</p>
                                        {data.comparisons && <DeltaBadge val={Number((data.comparisons.previousPeriod.delta.occupancyPct * 100).toFixed(1))} suffix="%" />}
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-5xl font-black text-slate-900 tracking-tighter">{(data.currentStatsSummary.occupancyPct * 100).toFixed(1)}%</p>
                                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${data.currentStatsSummary.occupancyPct * 100}%` }}></div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4 pt-10 border-t border-slate-50">
                                    <div className="flex justify-between items-start">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rentabilidad</p>
                                        {data.comparisons && <DeltaBadge val={data.comparisons.previousPeriod.delta.revenue} suffix="€" />}
                                    </div>
                                    <p className="text-5xl font-black text-emerald-600 tracking-tighter">€{data.currentStatsSummary.revenue.toLocaleString('es-ES', { maximumFractionDigits: 0 })}</p>
                                </div>

                                <div className="space-y-4 pt-10 border-t border-slate-50">
                                    <div className="flex justify-between items-start">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Siniestralidad</p>
                                        {data.comparisons && <DeltaBadge val={Number((data.comparisons.previousPeriod.delta.cancellationRate * 100).toFixed(1))} suffix="%" />}
                                    </div>
                                    <p className="text-5xl font-black text-rose-500 tracking-tighter">{(data.currentStatsSummary.cancellationRate * 100).toFixed(1)}%</p>
                                </div>

                                <div className="bg-slate-900 -mx-10 -mb-10 p-8 flex items-center gap-4">
                                    <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white">
                                        <TrendingUp className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">Predictivo v2.1</p>
                                        <p className="text-white text-xs font-bold mt-0.5 whitespace-nowrap">Comparativa vs Periodo Anterior</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Recomendaciones Dinámicas (Insights Card System) */}
                        <div className="lg:col-span-3 space-y-8">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">Insights de Inteligencia Artificial</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {data.insights.map(insight => (
                                    <div key={insight.id} className="bg-white rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/50 p-10 space-y-8 hover:shadow-2xl transition-all duration-500 relative group overflow-hidden">
                                        <div className={cn(
                                            "absolute top-0 right-0 w-32 h-32 rounded-bl-[4rem] -mr-8 -mt-8 opacity-20 transition-all group-hover:scale-125 duration-1000",
                                            insight.severity === 'critical' ? 'bg-rose-500' : 'bg-indigo-500'
                                        )}></div>

                                        <div className="flex items-start justify-between relative">
                                            <div className="flex items-center gap-4">
                                                <div className={cn(
                                                    "w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner transition-colors",
                                                    insight.severity === 'critical' ? 'bg-rose-50 text-rose-600' : 'bg-indigo-50 text-indigo-600'
                                                )}>
                                                    {insight.severity === 'critical' ? <AlertTriangle className="w-6 h-6" /> : <Lightbulb className="w-6 h-6" />}
                                                </div>
                                                <div>
                                                    <h4 className="text-2xl font-black text-slate-900 tracking-tight italic">{insight.title}</h4>
                                                    <span className={cn(
                                                        "text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full border mt-2 inline-block",
                                                        insight.severity === 'critical' ? 'bg-rose-50 border-rose-100 text-rose-600' : 'bg-slate-50 border-slate-100 text-slate-400'
                                                    )}>{insight.severity}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <p className="text-slate-600 text-lg font-medium leading-relaxed relative italic">
                                            "{insight.summary}"
                                        </p>

                                        <div className="space-y-4 pt-4 relative">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                <ChevronRight className="w-3 h-3 text-indigo-500" /> Plan de Acción Sugerido
                                            </p>
                                            <div className="space-y-3">
                                                {insight.recommendations.map((rec: any, i: number) => (
                                                    <div key={i} className="p-5 bg-slate-50 rounded-[1.5rem] border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/50 transition-all group/rec">
                                                        <p className="text-slate-900 font-extrabold text-sm mb-4 leading-snug">{rec.label}</p>
                                                        <div className="flex items-center justify-between pt-4 border-t border-slate-200/50">
                                                            <div className="flex flex-col">
                                                                <span className="text-[8px] font-black text-slate-400 uppercase">Impacto Esperado</span>
                                                                <span className="text-xs font-black text-indigo-600 flex items-center gap-1.5 mt-0.5">
                                                                    <TrendingUp className="w-3 h-3" /> {rec.expectedImpact.direction} {rec.expectedImpact.range}
                                                                </span>
                                                            </div>
                                                            <div className="p-2 bg-white rounded-lg shadow-sm group-hover/rec:bg-indigo-600 group-hover/rec:text-white transition-all cursor-pointer">
                                                                <ArrowUpRight className="w-4 h-4" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {data.insights.length === 0 && (
                                <div className="bg-emerald-50 p-20 rounded-[3.5rem] border-2 border-dashed border-emerald-100 flex flex-col items-center text-center gap-8 shadow-inner">
                                    <div className="w-24 h-24 bg-white rounded-[2rem] shadow-xl flex items-center justify-center text-emerald-500">
                                        <CheckCircle2 className="w-12 h-12" />
                                    </div>
                                    <div className="space-y-3">
                                        <h4 className="text-3xl font-black text-emerald-900 tracking-tighter italic">Salud Operativa al 100%</h4>
                                        <p className="text-emerald-700/70 font-bold text-lg max-w-lg mx-auto leading-relaxed">
                                            No se han detectado anomalías ni cuellos de botella para el periodo seleccionado. Tu club está funcionando bajo los estándares de eficiencia optimizados.
                                        </p>
                                    </div>
                                    <div className="flex gap-4">
                                        <button className="bg-emerald-600 text-white px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-200">Ver Auditoría Completa</button>
                                        <button className="bg-white text-emerald-600 border border-emerald-100 px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest">Configurar Umbrales</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {!data && !loading && (
                    <div className="flex flex-col items-center justify-center py-48 gap-8 bg-white rounded-[4rem] border-4 border-dashed border-slate-50 italic">
                        <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                            <LayoutDashboard className="w-12 h-12" />
                        </div>
                        <div className="text-center">
                            <p className="text-slate-900 font-black text-2xl tracking-tighter italic">Cerebro de Análisis Desconectado</p>
                            <p className="text-slate-400 font-bold text-lg mt-2">Selecciona un rango temporal para activar el motor de insights.</p>
                        </div>
                        <button
                            onClick={() => fetchInsights()}
                            className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl shadow-indigo-100 hover:scale-105 transition-all"
                        >
                            Inicializar Análisis
                        </button>
                    </div>
                )}

                {loading && (
                    <div className="fixed inset-0 bg-white/70 backdrop-blur-2xl z-[100] flex flex-col items-center justify-center gap-8 animate-in fade-in transition-all">
                        <div className="relative">
                            <div className="w-32 h-32 border-4 border-slate-100 rounded-[2.5rem] absolute inset-0"></div>
                            <div className="w-32 h-32 border-t-4 border-indigo-600 rounded-[2.5rem] animate-spin"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Sparkles className="w-10 h-10 text-indigo-400 animate-pulse" />
                            </div>
                        </div>
                        <div className="text-center space-y-3">
                            <p className="text-3xl font-black text-slate-900 tracking-tighter italic">Neural Insight Engine</p>
                            <p className="text-slate-400 font-black text-xs uppercase tracking-[0.5em] animate-pulse">Procesando vectores de rendimiento</p>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default InsightsOperativos;
