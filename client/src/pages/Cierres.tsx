import React, { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { closeoutsApi, Closeout } from "../lib/closeouts";
import {
    Lock,
    Plus,
    Download,
    AlertTriangle,
    Search,
    Clock,
    User,
    Calendar,
    FileSpreadsheet,
    Loader2,
    RefreshCcw,
    X,
    CheckCircle2,
    TrendingUp,
    ChevronRight,
    SearchX
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const Cierres: React.FC = () => {
    const [closeouts, setCloseouts] = useState<Closeout[]>([]);
    const [loading, setLoading] = useState(true);
    const [dbStatus, setDbStatus] = useState<"ok" | "error" | "checking">("checking");
    const [retrying, setRetrying] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Modal state for create
    const [showCreate, setShowCreate] = useState(false);
    const [newCloseout, setNewCloseout] = useState({ from: "", to: "", notes: "" });
    const [creating, setCreating] = useState(false);
    const [busyId, setBusyId] = useState<string | null>(null);

    const checkHealth = async () => {
        try {
            const res = await closeoutsApi.health();
            if (res.status === "ok") {
                setDbStatus("ok");
                setError(null);
            }
        } catch (err) {
            setDbStatus("error");
            setError("Base de Datos no disponible (Modo Degradado)");
        } finally {
            setRetrying(false);
        }
    };

    const fetchCloseouts = async () => {
        if (dbStatus === "error") {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const res = await closeoutsApi.list();
            setCloseouts(res.closeouts || []);
        } catch (err: any) {
            if (dbStatus === "ok") setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        try {
            await closeoutsApi.create(newCloseout);
            setShowCreate(false);
            setNewCloseout({ from: "", to: "", notes: "" });
            await fetchCloseouts();
        } catch (err: any) {
            setError(err.message || "Error al crear el cierre");
        } finally {
            setCreating(false);
        }
    };

    const handleExport = async (id: string) => {
        setBusyId(id);
        try {
            await closeoutsApi.exportXlsx(id, `cierre_${id}.xlsx`);
        } catch (err: any) {
            setError(err.message || "Error al exportar");
        } finally {
            setBusyId(null);
        }
    };

    useEffect(() => {
        checkHealth();
    }, []);

    useEffect(() => {
        if (dbStatus !== "checking") {
            fetchCloseouts();
        }
    }, [dbStatus]);

    return (
        <Layout>
            <div className="space-y-8 animate-in fade-in duration-500 pb-12">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
                            <Lock className="w-8 h-8 text-indigo-600" />
                            Cierres de Caja
                        </h1>
                        <p className="text-slate-500 font-medium">Snapshots financieros inmutables de la actividad del club.</p>
                    </div>
                    <button
                        onClick={() => setShowCreate(true)}
                        disabled={dbStatus === "error"}
                        className="bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold py-3.5 px-8 rounded-2xl transition-all shadow-xl shadow-slate-200 flex items-center gap-2 group"
                    >
                        <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                        Generar Nuevo Cierre
                    </button>
                </div>

                {dbStatus === "error" && (
                    <div className="bg-amber-50 border-2 border-amber-200 p-6 rounded-[2rem] flex flex-col md:flex-row md:items-center justify-between gap-6 animate-in slide-in-from-top-4 duration-500 shadow-sm shadow-amber-100">
                        <div className="flex items-start gap-5">
                            <div className="w-12 h-12 bg-amber-200 rounded-2xl flex items-center justify-center text-amber-700 flex-shrink-0 shadow-inner">
                                <AlertTriangle className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-amber-900 font-black text-lg tracking-tight">Acceso Restringido (Modo Local)</h3>
                                <p className="text-amber-700/80 text-sm font-medium leading-relaxed max-w-xl">
                                    No se ha podido establecer conexión estable con el motor de cierres. Se recomienda reintentar la conexión antes de operar.
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                setRetrying(true);
                                checkHealth();
                            }}
                            disabled={retrying}
                            className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap disabled:opacity-50 shadow-lg shadow-amber-200"
                        >
                            <RefreshCcw className={cn("w-4 h-4", retrying && "animate-spin")} />
                            {retrying ? "Validando..." : "Reconectar"}
                        </button>
                    </div>
                )}

                {error && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl flex items-center gap-3 animate-in shake-in">
                        <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
                        <p className="text-red-700 font-bold text-sm tracking-tight">{error}</p>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {closeouts.map((c) => (
                        <div key={c.id} className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-bl-[4rem] -mr-8 -mt-8 group-hover:bg-indigo-600 transition-colors duration-500"></div>

                            <div className="relative flex justify-between items-start mb-8">
                                <div className="w-14 h-14 bg-indigo-50 group-hover:bg-white/20 rounded-2xl flex items-center justify-center transition-colors shadow-inner">
                                    <Lock className="w-7 h-7 text-indigo-600 group-hover:text-white transition-colors" />
                                </div>
                                <button
                                    onClick={() => handleExport(c.id)}
                                    disabled={busyId === c.id}
                                    className="w-12 h-12 bg-white border border-slate-100 rounded-2xl shadow-sm flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:border-emerald-100 hover:bg-emerald-50 transition-all group-hover:scale-110 active:scale-95 disabled:opacity-30"
                                >
                                    {busyId === c.id ? <Loader2 className="w-6 h-6 animate-spin" /> : <Download className="w-6 h-6" />}
                                </button>
                            </div>

                            <div className="space-y-1 mb-6">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Periodo Contable</h4>
                                <p className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2 group-hover:text-indigo-600 transition-colors">
                                    {new Date(c.from).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                                    <ChevronRight className="w-4 h-4 text-slate-300" />
                                    {new Date(c.to).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pb-6 border-b border-slate-50">
                                <div className="bg-slate-50/50 p-4 rounded-2xl border border-transparent hover:border-emerald-100 transition-all">
                                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">Ingresos</p>
                                    <p className="text-2xl font-black text-emerald-600 tracking-tighter">
                                        €{c.total_revenue.toFixed(2)}
                                    </p>
                                </div>
                                <div className="bg-slate-50/50 p-4 rounded-2xl border border-transparent hover:border-indigo-100 transition-all">
                                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">Actividad</p>
                                    <p className="text-2xl font-black text-slate-900 tracking-tighter">
                                        {c.total_hours}<span className="text-sm font-bold ml-0.5 text-slate-400">h</span>
                                    </p>
                                </div>
                            </div>

                            <div className="mt-6 flex items-center justify-between text-[10px] font-bold text-slate-400 tracking-widest uppercase">
                                <span className="flex items-center gap-1.5"><Calendar className="w-3 h-3" /> {new Date(c.created_at).toLocaleDateString()}</span>
                                <span className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 rounded-full"><User className="w-3 h-3" /> {c.created_by.substring(0, 15)}...</span>
                            </div>
                        </div>
                    ))}
                </div>

                {loading && dbStatus !== "error" && (
                    <div className="flex flex-col items-center justify-center py-32 gap-4 animate-in fade-in transition-all">
                        <Loader2 className="w-16 h-16 text-indigo-500 animate-spin" />
                        <p className="text-slate-500 font-black text-xs uppercase tracking-[0.5em] animate-pulse">Sincronizando Archivos</p>
                    </div>
                )}

                {!loading && closeouts.length === 0 && (
                    <div className="text-center py-32 bg-white rounded-[3rem] border-4 border-dashed border-slate-100 flex flex-col items-center gap-6">
                        <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                            <SearchX className="w-12 h-12" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Caja Vacía</h3>
                            <p className="text-slate-400 font-medium max-w-xs mx-auto mt-2">Aún no se ha consolidado ninguna caja para este periodo.</p>
                        </div>
                        <button
                            onClick={() => setShowCreate(true)}
                            className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-100 hover:scale-105 active:scale-95 transition-all"
                        >
                            Iniciar Primer Cierre
                        </button>
                    </div>
                )}

                {/* Modal Crear */}
                {showCreate && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
                        <form onSubmit={handleCreate} className="bg-white rounded-[3rem] shadow-2xl w-full max-w-lg p-10 space-y-8 animate-in zoom-in-95 duration-300 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-50/50 rounded-bl-[5rem] -mr-10 -mt-10"></div>

                            <div className="relative flex items-center justify-between">
                                <div className="space-y-1">
                                    <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Nuevo Snapshot</h2>
                                    <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Consolidar periodo financiero</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowCreate(false)}
                                    className="p-3 bg-slate-100 text-slate-400 hover:text-slate-900 hover:bg-slate-200 rounded-2xl transition-all"
                                    title="Cerrar formulario"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="space-y-6 relative">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 ml-1">
                                            <Calendar className="w-3 h-3 text-indigo-500" /> Fecha Inicial
                                        </label>
                                        <input
                                            required
                                            type="date"
                                            value={newCloseout.from}
                                            onChange={e => setNewCloseout({ ...newCloseout, from: e.target.value })}
                                            className="w-full bg-slate-50 border-2 border-slate-100 rounded-[1.25rem] px-5 py-4 text-sm font-bold text-slate-700 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100 outline-none transition-all"
                                            title="Fecha de inicio del periodo a cerrar"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 ml-1">
                                            <Calendar className="w-3 h-3 text-emerald-500" /> Fecha Final
                                        </label>
                                        <input
                                            required
                                            type="date"
                                            value={newCloseout.to}
                                            onChange={e => setNewCloseout({ ...newCloseout, to: e.target.value })}
                                            className="w-full bg-slate-50 border-2 border-slate-100 rounded-[1.25rem] px-5 py-4 text-sm font-bold text-slate-700 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100 outline-none transition-all"
                                            title="Fecha de fin del periodo a cerrar"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 ml-1">
                                        <TrendingUp className="w-3 h-3 text-indigo-500" /> Notas de Auditoría
                                    </label>
                                    <textarea
                                        value={newCloseout.notes}
                                        onChange={e => setNewCloseout({ ...newCloseout, notes: e.target.value })}
                                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-[1.25rem] px-5 py-4 text-sm font-bold text-slate-700 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100 outline-none transition-all"
                                        rows={3}
                                        placeholder="Detalles sobre incidencias, ajustes o descuadres..."
                                        title="Notas de auditoría para el cierre"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowCreate(false)}
                                    className="flex-1 px-8 py-5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest text-slate-500 hover:bg-slate-100 transition-all border-2 border-transparent"
                                    title="Descartar y cerrar el formulario"
                                >
                                    Descartar
                                </button>
                                <button
                                    type="submit"
                                    disabled={creating}
                                    className="flex-[2] px-8 py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest shadow-2xl shadow-indigo-200 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                                    title="Consolidar y cerrar el periodo financiero"
                                >
                                    {creating ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <>
                                            <Lock className="w-4 h-4" />
                                            Consolidar y Cerrar
                                        </>
                                    )}
                                </button>
                            </div>

                            <div className="bg-indigo-50 -mx-10 -mb-10 p-6 flex items-center gap-4 border-t border-indigo-100">
                                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-indigo-600 shadow-sm">
                                    <CheckCircle2 className="w-4 h-4" />
                                </div>
                                <p className="text-[10px] font-bold text-indigo-900 leading-snug">
                                    Al confirmar, el periodo quedará sellado y se generarán los informes automáticos.
                                </p>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default Cierres;
