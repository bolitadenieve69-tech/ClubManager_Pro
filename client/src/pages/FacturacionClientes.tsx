import React, { useState, useEffect } from "react";
import { billingApi, BillingSummary } from "../lib/billing";
import {
    Users,
    Calendar,
    Download,
    RefreshCcw,
    AlertCircle,
    User,
    Clock,
    TrendingUp,
    FileSpreadsheet,
    ChevronRight,
    Loader2,
    CheckCircle2
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const FacturacionClientes: React.FC = () => {
    const today = new Date().toISOString().split("T")[0];
    const [from, setFrom] = useState(today);
    const [to, setTo] = useState(today);
    const [includeCancelled, setIncludeCancelled] = useState(false);

    const [data, setData] = useState<BillingSummary | null>(null);
    const [loading, setLoading] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchSummary = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await billingApi.getSummary({ from, to, includeCancelled });
            setData(res);
        } catch (err: any) {
            setError(err.message || "Error al cargar facturación");
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        setExporting(true);
        try {
            await billingApi.exportXlsx(
                { from, to, includeCancelled },
                `facturacion_clientes_${from}_a_${to}.xlsx`
            );
        } catch (err: any) {
            setError(err.message || "Error al exportar Excel");
        } finally {
            setExporting(false);
        }
    };

    useEffect(() => {
        fetchSummary();
    }, []);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Facturación de Clientes</h1>
                    <p className="text-slate-500">Análisis detallado de ingresos por usuario y periodo.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleExport}
                        disabled={exporting || !data}
                        className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg shadow-emerald-100 flex items-center gap-2 group"
                    >
                        {exporting ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                <FileSpreadsheet className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                Exportar Excel
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl flex items-center gap-3 animate-in shake-in">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <p className="text-sm font-medium">{error}</p>
                </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                {/* Filters Sidebar */}
                <div className="xl:col-span-1 space-y-6">
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 space-y-6">
                        <div className="flex items-center gap-2 pb-4 border-b border-slate-50">
                            <RefreshCcw className="w-4 h-4 text-indigo-600" />
                            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Filtros</h2>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                    <Calendar className="w-3 h-3" /> Fecha Inicio
                                </label>
                                <input
                                    type="date"
                                    value={from}
                                    onChange={(e) => setFrom(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                    <Calendar className="w-3 h-3" /> Fecha Fin
                                </label>
                                <input
                                    type="date"
                                    value={to}
                                    onChange={(e) => setTo(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                />
                            </div>

                            <div className="pt-2">
                                <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer group hover:bg-slate-100 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={includeCancelled}
                                        onChange={(e) => setIncludeCancelled(e.target.checked)}
                                        className="w-5 h-5 text-indigo-600 rounded-lg border-slate-300 focus:ring-indigo-500 transition-all cursor-pointer"
                                    />
                                    <span className="text-xs font-bold text-slate-600 group-hover:text-slate-900">Incluir canceladas</span>
                                </label>
                            </div>
                        </div>

                        <button
                            onClick={fetchSummary}
                            disabled={loading}
                            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-2xl transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCcw className="w-5 h-5" />}
                            Actualizar Datos
                        </button>
                    </div>

                    {data && (
                        <div className="bg-indigo-600 rounded-3xl p-6 text-white shadow-xl shadow-indigo-100 space-y-6 relative overflow-hidden group">
                            <TrendingUp className="absolute -right-4 -bottom-4 w-32 h-32 text-white/10 group-hover:scale-110 transition-transform duration-700" />
                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/70">Resumen Periodo</h3>
                            <div className="space-y-4 relative z-10">
                                <div className="flex items-end justify-between">
                                    <span className="text-4xl font-black leading-none tracking-tighter">€{data.totals.revenue.toFixed(2)}</span>
                                    <div className="flex flex-col items-end">
                                        <span className="text-[10px] font-bold text-white/60">TOTAL INGRESOS</span>
                                        <div className="h-1 w-8 bg-white/30 rounded-full mt-1"></div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10 text-[10px] font-bold">
                                    <div className="flex flex-col">
                                        <span className="text-white/60 uppercase tracking-widest">Reservas</span>
                                        <span className="text-lg font-black mt-1">{data.totals.reservations}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-white/60 uppercase tracking-widest">Horas</span>
                                        <span className="text-lg font-black mt-1">{data.totals.hours}h</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Data Table */}
                <div className="xl:col-span-3">
                    <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden min-h-[600px] flex flex-col">
                        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center text-indigo-600">
                                    <Users className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900">Listado de Facturación</h2>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                        {data?.byClient.length || 0} Clientes con actividad
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-x-auto">
                            {loading && !data ? (
                                <div className="p-32 text-center flex flex-col items-center gap-4">
                                    <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
                                    <p className="text-slate-500 font-bold italic">Analizando transacciones...</p>
                                </div>
                            ) : (
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50/50">
                                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Cliente</th>
                                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Reservas</th>
                                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Canceladas</th>
                                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Horas</th>
                                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Importe</th>
                                            <th className="px-8 py-5 w-16"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {!data || data.byClient.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="px-8 py-32 text-center">
                                                    <div className="flex flex-col items-center gap-4">
                                                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                                                            <Users className="w-10 h-10" />
                                                        </div>
                                                        <p className="text-slate-400 italic font-medium max-w-xs mx-auto">
                                                            No hay actividad registrada para el periodo seleccionado. Prueba a ampliar el rango de fechas.
                                                        </p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            data.byClient.map((c) => (
                                                <tr key={c.clientId} className="group hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-8 py-5">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-all font-black text-xs uppercase">
                                                                {c.clientName.substring(0, 2)}
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-sm font-black text-slate-900 tracking-tight group-hover:text-indigo-600 transition-colors underline decoration-slate-200 decoration-2 underline-offset-4">
                                                                    {c.clientName}
                                                                </span>
                                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{c.clientId}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-5 text-center">
                                                        <span className="text-sm font-bold text-slate-700">{c.reservations}</span>
                                                    </td>
                                                    <td className="px-8 py-5 text-center">
                                                        <span className={cn(
                                                            "text-sm font-bold",
                                                            c.cancelledCount > 0 ? "text-rose-500" : "text-slate-300"
                                                        )}>
                                                            {c.cancelledCount}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-5 text-center">
                                                        <span className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-black text-slate-600 tracking-widest">{c.hours}H</span>
                                                    </td>
                                                    <td className="px-8 py-5 text-right">
                                                        <span className="text-lg font-black text-slate-900 tracking-tighter">
                                                            {c.revenue.toFixed(2)}
                                                            <span className="text-indigo-500 text-xs ml-0.5">€</span>
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-5 text-right">
                                                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-400 transition-colors translate-x-0 group-hover:translate-x-1 duration-300" />
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        {data && data.byClient.length > 0 && (
                            <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Consolidado Final</span>
                                <div className="flex items-center gap-12">
                                    <div className="flex flex-col items-end">
                                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Total Volumen</span>
                                        <span className="text-sm font-black text-slate-900">{data.totals.reservations} Reservas</span>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Total Bruto</span>
                                        <span className="text-xl font-black text-emerald-600 tracking-tighter">€{data.totals.revenue.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="mt-8 bg-indigo-50 border border-indigo-100 p-6 rounded-3xl flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-indigo-100 flex items-center justify-center text-indigo-600">
                                <CheckCircle2 className="w-5 h-5" />
                            </div>
                            <p className="text-sm font-bold text-indigo-900">Periodo certificado por el sistema de gestión centralizado.</p>
                        </div>
                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                            Sincronizado <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse"></div>
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FacturacionClientes;
