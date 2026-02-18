import React, { useState, useEffect } from "react";
import { accountingApi, AccountingSummary } from "../lib/accounting";
import {
    Calculator,
    Calendar,
    FileSpreadsheet,
    TrendingUp,
    ArrowUpCircle,
    ArrowDownCircle,
    Percent,
    Loader2,
    AlertCircle,
    CheckCircle2,
    Briefcase,
    Wallet
} from "lucide-react";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { cn } from "../lib/utils";

const Contabilidad: React.FC = () => {
    const [period, setPeriod] = useState<"weekly" | "monthly" | "quarterly" | "yearly">("monthly");
    const [year, setYear] = useState(new Date().getFullYear());
    const [value, setValue] = useState(new Date().getMonth() + 1); // Default to current month

    const [summary, setSummary] = useState<AccountingSummary | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [exporting, setExporting] = useState(false);

    const fetchSummary = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await accountingApi.getSummary({ period, year, value });
            setSummary(data);
        } catch (err: any) {
            setError(err.message || "Error al cargar datos contables");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSummary();
    }, [period, year, value]);

    const handleExport = async () => {
        setExporting(true);
        try {
            await accountingApi.exportXlsx(
                { period, year, value },
                `contabilidad_${period}_${year}.xlsx`
            );
        } catch (err: any) {
            setError("Error al exportar Excel");
        } finally {
            setExporting(false);
        }
    };

    const getPeriodLabel = () => {
        if (period === "weekly") return "Esta Semana";
        if (period === "monthly") {
            const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
            return months[value - 1];
        }
        if (period === "quarterly") return `Trimestre ${value} (Q${value})`;
        return `Año ${year}`;
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-4 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-200">
                        <Calculator className="w-8 h-8" />
                    </div>
                    <div className="space-y-1">
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Contabilidad General</h1>
                        <p className="text-slate-500 font-bold flex items-center gap-2 uppercase tracking-widest text-[10px]">
                            <Briefcase className="w-3 h-3 text-indigo-400" /> Control Financiero y Modelo IVA
                        </p>
                    </div>
                </div>
                <Button
                    onClick={handleExport}
                    disabled={exporting || !summary}
                    className="bg-emerald-600 hover:bg-emerald-700 h-14 px-8 rounded-2xl text-lg font-black shadow-xl shadow-emerald-100"
                    icon={exporting ? <Loader2 className="w-6 h-6 animate-spin" /> : <FileSpreadsheet className="w-6 h-6" />}
                >
                    Generar Reporte Excel
                </Button>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-6 py-4 rounded-2xl flex items-center gap-3 animate-in bounce-in">
                    <AlertCircle className="w-6 h-6 flex-shrink-0" />
                    <p className="font-bold">{error}</p>
                </div>
            )}

            {/* Period Selection Controls */}
            <Card className="p-2 border border-slate-200 bg-white/50 backdrop-blur-xl">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                    {["weekly", "monthly", "quarterly", "yearly"].map((p) => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p as any)}
                            className={cn(
                                "py-4 px-6 rounded-xl font-black text-sm transition-all duration-300 uppercase tracking-[0.15em]",
                                period === p
                                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200 scale-105"
                                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                            )}
                        >
                            {p === "weekly" ? "Semanal" : p === "monthly" ? "Mensual" : p === "quarterly" ? "Trimestral" : "Anual"}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 lg:p-6 bg-slate-50/50 rounded-2xl mt-2 border border-slate-100">
                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Seleccionar Año</label>
                        <select
                            title="Seleccionar Año"
                            value={year}
                            onChange={(e) => setYear(Number(e.target.value))}
                            className="bg-white border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        >
                            {[2023, 2024, 2025, 2026].map((y) => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>

                    {period !== "yearly" && period !== "weekly" && (
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">
                                {period === "monthly" ? "Seleccionar Mes" : "Seleccionar Trimestre"}
                            </label>
                            <select
                                title={period === "monthly" ? "Seleccionar Mes" : "Seleccionar Trimestre"}
                                value={value}
                                onChange={(e) => setValue(Number(e.target.value))}
                                className="bg-white border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                            >
                                {period === "monthly" ? (
                                    ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"].map((m, i) => (
                                        <option key={m} value={i + 1}>{m}</option>
                                    ))
                                ) : (
                                    [1, 2, 3, 4].map((q) => (
                                        <option key={q} value={q}>Trimestre {q} (Q{q})</option>
                                    ))
                                )}
                            </select>
                        </div>
                    )}
                </div>
            </Card>

            {/* Main Stats */}
            {loading ? (
                <div className="py-24 text-center">
                    <Loader2 className="w-16 h-16 text-indigo-500 animate-spin mx-auto mb-6" />
                    <p className="text-xl font-bold text-slate-400 italic">Consolidando registros financieros...</p>
                </div>
            ) : summary ? (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Income Card */}
                        <div className="bg-white p-6 rounded-[2rem] shadow-xl shadow-slate-200 border border-slate-100 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4">
                                <ArrowUpCircle className="w-8 h-8 text-emerald-100 group-hover:text-emerald-200 transition-colors" />
                            </div>
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Ingresos (Fiscal)</h3>
                            <div className="space-y-4">
                                <span className="text-3xl font-black text-slate-900 tracking-tighter">€{summary.income.total.toFixed(2)}</span>
                                <div className="grid grid-cols-1 gap-1 pt-4 border-t border-slate-50 text-[10px] font-bold text-slate-500">
                                    <p>Base: €{summary.income.base.toFixed(2)}</p>
                                    <p className="text-emerald-600">IVA: €{summary.income.vat.toFixed(2)}</p>
                                </div>
                            </div>
                        </div>

                        {/* Expense Card */}
                        <div className="bg-white p-6 rounded-[2rem] shadow-xl shadow-slate-200 border border-slate-100 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4">
                                <ArrowDownCircle className="w-8 h-8 text-rose-100 group-hover:text-rose-200 transition-colors" />
                            </div>
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Gastos (Fiscal)</h3>
                            <div className="space-y-4">
                                <span className="text-3xl font-black text-slate-900 tracking-tighter">€{summary.expense.total.toFixed(2)}</span>
                                <div className="grid grid-cols-1 gap-1 pt-4 border-t border-slate-50 text-[10px] font-bold text-slate-500">
                                    <p>Base: €{summary.expense.base.toFixed(2)}</p>
                                    <p className="text-rose-600">IVA: €{summary.expense.vat.toFixed(2)}</p>
                                </div>
                            </div>
                        </div>

                        {/* Internal Movements Card */}
                        <div className="bg-slate-50 p-6 rounded-[2rem] shadow-xl shadow-slate-200 border border-slate-200 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4">
                                <Wallet className="w-8 h-8 text-slate-200 group-hover:text-slate-300 transition-colors" />
                            </div>
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Caja Interna (No Fiscal)</h3>
                            <div className="space-y-4">
                                <span className={cn(
                                    "text-3xl font-black tracking-tighter",
                                    summary.internal.balance >= 0 ? "text-slate-900" : "text-rose-600"
                                )}>
                                    €{summary.internal.balance.toFixed(2)}
                                </span>
                                <div className="grid grid-cols-1 gap-1 pt-4 border-t border-slate-200 text-[10px] font-bold text-slate-500">
                                    <p>Ingresos: €{summary.internal.income.toFixed(2)}</p>
                                    <p>Gastos: €{summary.internal.expense.toFixed(2)}</p>
                                </div>
                            </div>
                        </div>

                        {/* Global Summary Card */}
                        <div className="bg-slate-900 p-6 rounded-[2rem] shadow-2xl shadow-slate-950/20 text-white relative overflow-hidden">
                            <div className="absolute bottom-0 right-0 p-4 opacity-10">
                                <TrendingUp className="w-20 h-20" />
                            </div>
                            <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-4">Balance Global (Caja Real)</h3>
                            <div className="space-y-4">
                                <p className={cn(
                                    "text-3xl font-black tracking-tighter",
                                    summary.balance >= 0 ? "text-white" : "text-rose-400"
                                )}>
                                    €{summary.balance.toFixed(2)}
                                </p>
                                <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                                    <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1">
                                        <Percent className="w-2.5 h-2.5" /> IVA (A Liquidar)
                                    </p>
                                    <p className={cn(
                                        "text-xl font-black",
                                        summary.vat_result >= 0 ? "text-amber-400" : "text-emerald-400"
                                    )}>
                                        €{summary.vat_result.toFixed(2)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Information Banner */}
                    <Card className="bg-indigo-50 border-indigo-100 p-8 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100 shrink-0">
                                <Calculator className="w-8 h-8" />
                            </div>
                            <div className="space-y-1">
                                <h4 className="text-xl font-black text-indigo-950 tracking-tight">Diferenciación de Flujos (Fiscal vs Interno)</h4>
                                <p className="text-indigo-700/70 font-bold leading-relaxed max-w-xl text-sm">
                                    Las sumas <strong>Fiscales</strong> incluyen ingresos por facturación y gastos de proveedores con IVA. La <strong>Caja Interna</strong> refleja movimientos manuales sin trascendencia tributaria. El <strong>Balance Global</strong> es el saldo real de tu caja.
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <div className="px-5 py-2 bg-indigo-600 text-white font-black text-xs rounded-full uppercase tracking-widest shadow-lg shadow-indigo-100">
                                Auditoría Interna
                            </div>
                            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2 mt-2">
                                Desglose Modelo 303 <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse"></div>
                            </span>
                        </div>
                    </Card>
                </>
            ) : null}
        </div>
    );
};

export default Contabilidad;
