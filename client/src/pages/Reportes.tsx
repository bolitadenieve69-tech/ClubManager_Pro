import React, { useState, useEffect, useRef } from "react";
import { reportsApi, ReportType } from "../lib/reports";
import {
    FileText,
    FileSpreadsheet,
    Download,
    Eye,
    Clock,
    AlertTriangle,
    ChevronRight,
    Settings2,
    Loader2,
    FileSearch,
    RefreshCw,
    CheckCircle2,
    X,
    FileCheck,
    LayoutDashboard,
    LayoutGrid
} from "lucide-react";
import { motion } from "framer-motion";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const Reportes: React.FC = () => {
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [generating, setGenerating] = useState<"pdf" | "xlsx" | null>(null);
    const [error, setError] = useState("");
    const [reportType, setReportType] = useState<ReportType>("summary");
    const [expiresIn, setExpiresIn] = useState<number | null>(null);

    const cleanupTimerRef = useRef<NodeJS.Timeout | null>(null);
    const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        return () => {
            if (pdfUrl) URL.revokeObjectURL(pdfUrl);
            if (cleanupTimerRef.current) clearTimeout(cleanupTimerRef.current);
            if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
        };
    }, []);

    async function generateExport(format: "pdf" | "xlsx") {
        setGenerating(format);
        setError("");

        if (format === "pdf") {
            if (pdfUrl) URL.revokeObjectURL(pdfUrl);
            setPdfUrl(null);
            if (cleanupTimerRef.current) clearTimeout(cleanupTimerRef.current);
            if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
            setExpiresIn(null);
        }

        try {
            // Mock data for demonstration - in production this would be fetched or passed from state
            const reportData = reportType === "summary" ? {
                "Pistas Activas": "4",
                "Reservas hoy": "15",
                "Ocupación Media": "78%",
                "items": [
                    { metrica: "Turnos Mañana", valor: "8" },
                    { metrica: "Turnos Tarde", valor: "7" }
                ]
            } : reportType === "invoice" ? {
                items: [
                    { number: 1, created_at: new Date(), clientName: "Cliente VIP", total_cents: 1550, status: "PAID" },
                    { number: 2, created_at: new Date(), clientName: "Socio Oro", total_cents: 2000, status: "PENDING" }
                ],
                total_cents: 3550
            } : {
                items: [
                    { start_at: new Date().toISOString(), courtName: "Pista Central", userName: "Angel G.", total_cents: 1500 },
                    { start_at: new Date().toISOString(), courtName: "Pista 2", userName: "Maria L.", total_cents: 1500 }
                ]
            };

            const blob = await reportsApi.generate(reportType, reportData, format);
            const urlBlob = URL.createObjectURL(blob);

            if (format === "xlsx") {
                reportsApi.downloadBlob(blob, `reporte-${reportType}-${new Date().getTime()}.xlsx`);
            } else {
                setPdfUrl(urlBlob);
                setExpiresIn(60);
                countdownIntervalRef.current = setInterval(() => {
                    setExpiresIn(prev => (prev && prev > 0 ? prev - 1 : 0));
                }, 1000);
                cleanupTimerRef.current = setTimeout(() => {
                    URL.revokeObjectURL(urlBlob);
                    setPdfUrl(null);
                    setExpiresIn(null);
                    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
                }, 60000);
            }
        } catch (e: any) {
            setError(e.message || "Error al conectar con el motor de informes.");
        } finally {
            setGenerating(null);
        }
    }

    return (
        <div className="space-y-10 animate-in fade-in duration-700 pb-16">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                    <h1 className="text-4xl font-black tracking-tighter text-slate-900 flex items-center gap-4">
                        <div className="p-3 bg-indigo-600 rounded-2xl shadow-xl shadow-indigo-200">
                            <FileText className="w-8 h-8 text-white" />
                        </div>
                        Centro de Reportes
                    </h1>
                    <p className="text-slate-500 font-medium text-lg leading-snug">Consolida y exporta la actividad de tu club en formatos profesionales.</p>
                </div>
                <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200/50 shadow-inner">
                    <button className="px-6 py-2.5 bg-white rounded-xl shadow-sm text-xs font-black text-indigo-600 transition-all">Exportación Directa</button>
                    <button className="px-6 py-2.5 text-xs font-black text-slate-400 hover:text-slate-600 transition-all">Auditoría</button>
                </div>
            </header>

            {error && (
                <div className="bg-rose-50 border-2 border-rose-100 p-6 rounded-3xl flex items-center gap-4 animate-in shake-in">
                    <div className="w-12 h-12 bg-rose-100 rounded-2xl flex items-center justify-center text-rose-600">
                        <AlertTriangle className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-rose-900 font-black text-xs uppercase tracking-widest">Error de Generación</p>
                        <p className="text-rose-700 font-bold tracking-tight mt-0.5">{error}</p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Configurator Side */}
                <div className="lg:col-span-4 space-y-8">
                    <div className="bg-white rounded-[3rem] border border-slate-100 shadow-2xl shadow-slate-200/40 p-10 space-y-10 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-bl-[4rem] -mr-8 -mt-8 group-hover:bg-indigo-600 transition-colors duration-500 opacity-20 group-hover:opacity-10"></div>

                        <div className="space-y-6">
                            <div className="flex items-center gap-3 mb-2">
                                <Settings2 className="w-5 h-5 text-indigo-600" />
                                <h3 className="text-xl font-black text-slate-900 tracking-tight italic">Configurar Informe</h3>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                                    <FileSearch className="w-3 h-3" /> Módulo de Datos
                                </label>
                                <div className="grid gap-3">
                                    {[
                                        { id: 'summary', name: 'Resumen Operativo', icon: LayoutDashboard },
                                        { id: 'invoice', name: 'Histórico de Facturas', icon: FileCheck },
                                        { id: 'reservation', name: 'Listado de Reservas', icon: Clock }
                                    ].map((type) => (
                                        <button
                                            key={type.id}
                                            onClick={() => setReportType(type.id as ReportType)}
                                            className={cn(
                                                "flex items-center justify-between p-5 rounded-3xl border-2 transition-all group/btn",
                                                reportType === type.id
                                                    ? "bg-indigo-600 border-indigo-600 shadow-xl shadow-indigo-100 ring-4 ring-indigo-50"
                                                    : "bg-slate-50 border-slate-50 hover:border-indigo-100 hover:bg-white"
                                            )}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={cn(
                                                    "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                                                    reportType === type.id ? "bg-white/20 text-white" : "bg-white text-slate-400 group-hover/btn:text-indigo-600 shadow-sm"
                                                )}>
                                                    <type.icon className="w-5 h-5" />
                                                </div>
                                                <span className={cn(
                                                    "text-sm font-black tracking-tight",
                                                    reportType === type.id ? "text-white" : "text-slate-700"
                                                )}>{type.name}</span>
                                            </div>
                                            {reportType === type.id && <CheckCircle2 className="w-5 h-5 text-white animate-in zoom-in" />}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <button
                                onClick={() => generateExport("pdf")}
                                disabled={!!generating}
                                className="w-full bg-slate-900 hover:bg-slate-800 text-white py-5 rounded-[1.75rem] font-black text-[11px] uppercase tracking-[0.3em] transition-all shadow-2xl shadow-slate-200 flex items-center justify-center gap-4 group active:scale-[0.98] disabled:opacity-50"
                            >
                                {generating === "pdf" ? <Loader2 className="w-6 h-6 animate-spin" /> : <Eye className="w-6 h-6 group-hover:scale-110 transition-transform" />}
                                {generating === "pdf" ? "GENERANDO VISTA..." : "PREVISUALIZAR PDF"}
                            </button>

                            <button
                                onClick={() => generateExport("xlsx")}
                                disabled={!!generating}
                                className="w-full bg-white border-2 border-emerald-100 text-emerald-600 py-5 rounded-[1.75rem] font-black text-[11px] uppercase tracking-[0.3em] transition-all hover:bg-emerald-50 active:scale-[0.98] flex items-center justify-center gap-4 group disabled:opacity-50"
                            >
                                {generating === "xlsx" ? <Loader2 className="w-6 h-6 animate-spin text-emerald-600" /> : <FileSpreadsheet className="w-6 h-6 group-hover:scale-110 transition-transform" />}
                                {generating === "xlsx" ? "EXPORTANDO..." : "EXPORTAR A EXCEL"}
                            </button>
                        </div>

                        {pdfUrl && expiresIn !== null && (
                            <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100 animate-in slide-in-from-bottom-2">
                                <div className="flex items-center justify-between mb-3">
                                    <p className="text-[9px] font-black text-amber-700 uppercase tracking-widest flex items-center gap-2">
                                        <Clock className="w-3.5 h-3.5 animate-pulse" /> Memoria Temporal
                                    </p>
                                    <span className="text-xs font-black text-amber-800">{expiresIn}s</span>
                                </div>
                                <div className="w-full h-1.5 bg-amber-200/30 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: "100%" }}
                                        animate={{ width: `${(expiresIn / 60) * 100}%` }}
                                        transition={{ duration: 1, ease: "linear" }}
                                        className="h-full bg-amber-500 rounded-full"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Preview Side */}
                <div className="lg:col-span-8 flex flex-col h-[850px]">
                    <div className="flex-1 bg-white rounded-[3.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden relative group">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 z-10"></div>

                        {pdfUrl ? (
                            <iframe
                                src={pdfUrl}
                                title="Vista Previa PDF"
                                className="w-full h-full border-none animate-in fade-in zoom-in-95 duration-500"
                            />
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center p-20 gap-8">
                                <div className="relative">
                                    <div className="w-40 h-40 bg-slate-50 rounded-[3rem] flex items-center justify-center group-hover:scale-110 transition-transform duration-700">
                                        <FileText className="w-20 h-20 text-slate-100" strokeWidth={1} />
                                    </div>
                                    <div className="absolute -bottom-4 -right-4 p-4 bg-white rounded-3xl shadow-xl border border-slate-50 animate-bounce">
                                        <RefreshCw className="w-8 h-8 text-indigo-400" />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <h3 className="text-3xl font-black text-slate-900 tracking-tighter italic">Preview Estéril</h3>
                                    <p className="text-slate-400 font-medium max-w-sm mx-auto leading-relaxed">
                                        Genera un reporte para visualizarlo instantáneamente. Los archivos temporales se purgan automáticamente tras 60 segundos por seguridad.
                                    </p>
                                </div>
                                <div className="flex bg-slate-50 rounded-2xl p-1 shadow-inner">
                                    <div className="px-6 py-3 flex items-center gap-3 text-xs font-black text-slate-400">
                                        <Clock className="w-4 h-4" /> 60s TTL
                                    </div>
                                    <div className="w-px h-8 bg-slate-200 my-auto"></div>
                                    <div className="px-6 py-3 flex items-center gap-3 text-xs font-black text-slate-400">
                                        <Download className="w-4 h-4" /> 100% BLOB
                                    </div>
                                </div>
                            </div>
                        )}

                        {pdfUrl && (
                            <button
                                onClick={() => {
                                    setPdfUrl(null);
                                    setExpiresIn(null);
                                    if (cleanupTimerRef.current) clearTimeout(cleanupTimerRef.current);
                                    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
                                }}
                                title="Cerrar vista previa"
                                className="absolute top-6 right-6 p-4 bg-slate-900/10 backdrop-blur-md text-slate-900 hover:bg-rose-500 hover:text-white rounded-2xl transition-all shadow-xl z-20"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Reportes;
