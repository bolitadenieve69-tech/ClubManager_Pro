import { useEffect, useState } from "react";
import { apiFetch, ApiError } from "../lib/api";
import { invoicesApi, Invoice } from "../lib/invoices";
import {
    FileText,
    Download,
    Plus,
    CheckCircle2,
    Clock,
    AlertCircle,
    XCircle,
    Loader2,
    Search,
    Filter
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export default function Facturas() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [ok, setOk] = useState("");
    const [busyId, setBusyId] = useState<string | null>(null);
    const [search, setSearch] = useState("");

    async function load() {
        setLoading(true);
        setError("");
        try {
            const data = await invoicesApi.list();
            setInvoices(data.invoices);
        } catch (e: any) {
            setError(e instanceof ApiError ? e.message : "No se pudieron cargar las facturas.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load();
    }, []);

    async function generate() {
        setBusyId("generate-action");
        setError("");
        setOk("");
        try {
            await invoicesApi.generate();
            setOk("Se han generado nuevas facturas basadas en las reservas completadas.");
            setTimeout(() => setOk(""), 5000);
            await load();
        } catch (e: any) {
            setError(e instanceof ApiError ? e.message : "No se pudo generar la facturación.");
        } finally {
            setBusyId(null);
        }
    }

    async function download(id: string, num: number) {
        setError("");
        setBusyId(id);
        try {
            await invoicesApi.downloadPdf(id, `factura-${String(num).padStart(4, '0')}.pdf`);
        } catch (e: any) {
            setError("Error al descargar el PDF de la factura.");
        } finally {
            setBusyId(null);
        }
    }

    const filteredInvoices = invoices.filter(inv =>
        String(inv.number).includes(search) ||
        inv.status.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Historial de Facturas</h1>
                    <p className="text-slate-500">Consulta y gestiona los documentos fiscales generados.</p>
                </div>
                <button
                    onClick={generate}
                    disabled={busyId === "generate-action"}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg shadow-indigo-100 flex items-center gap-2 group"
                >
                    {busyId === "generate-action" ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <>
                            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                            Generar Facturación
                        </>
                    )}
                </button>
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

            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden min-h-[500px]">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <FileText className="w-6 h-6 text-indigo-600" />
                        <h2 className="text-lg font-bold text-slate-900">Documentos</h2>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                placeholder="Buscar por número..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none w-64 transition-all shadow-sm"
                            />
                        </div>
                        <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white border border-transparent hover:border-slate-200 rounded-xl transition-all">
                            <Filter className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="p-24 text-center flex flex-col items-center gap-4">
                            <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
                            <p className="text-slate-500 font-medium italic">Accediendo al archivo fiscal...</p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100">
                                    <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Factura</th>
                                    <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fecha de Emisión</th>
                                    <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Importe Total</th>
                                    <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Estado</th>
                                    <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredInvoices.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-8 py-20 text-center text-slate-400 italic font-medium">
                                            {search ? "No se han encontrado facturas que coincidan con la búsqueda." : "Aún no se han generado facturas en este periodo."}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredInvoices.map((inv) => (
                                        <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                                        <FileText className="w-5 h-5" />
                                                    </div>
                                                    <span className="text-sm font-black text-slate-900 tracking-tight">
                                                        #{String(inv.number).padStart(4, '0')}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-semibold text-slate-700">
                                                        {new Date(inv.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                        {new Date(inv.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className="text-lg font-black text-slate-900 tracking-tight">
                                                    {(inv.total_cents / 100).toFixed(2)}
                                                    <span className="text-indigo-500 ml-1 text-sm">€</span>
                                                </span>
                                            </td>
                                            <td className="px-8 py-5 text-center">
                                                <span className={cn(
                                                    "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border",
                                                    inv.status === 'PAID' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                                        inv.status === 'ISSUED' ? "bg-amber-50 text-amber-600 border-amber-100" :
                                                            "bg-red-50 text-red-600 border-red-100"
                                                )}>
                                                    {inv.status === 'PAID' ? <CheckCircle2 className="w-3 h-3" /> :
                                                        inv.status === 'ISSUED' ? <Clock className="w-3 h-3" /> :
                                                            <AlertCircle className="w-3 h-3" />}
                                                    {inv.status}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <button
                                                    onClick={() => download(inv.id, inv.number)}
                                                    disabled={busyId === inv.id}
                                                    className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all shadow-md shadow-slate-200 disabled:opacity-50"
                                                >
                                                    {busyId === inv.id ? (
                                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                    ) : (
                                                        <Download className="w-3.5 h-3.5" />
                                                    )}
                                                    PDF
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-3xl flex items-start gap-4 shadow-sm shadow-indigo-50">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100">
                        <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-indigo-900">Validación Fiscal</h4>
                        <p className="text-xs text-indigo-600/80 leading-relaxed mt-1">Todas las facturas cumplen con la normativa vigente y son correlativas.</p>
                    </div>
                </div>
                {/* Additional info cards could go here */}
            </div>
        </div>
    );
}
