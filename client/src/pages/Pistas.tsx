import { useEffect, useState } from "react";
import { apiFetch, ApiError } from "../lib/api";
import {
    Plus,
    Trash2,
    Save,
    Table2,
    Zap,
    ZapOff,
    CheckCircle2,
    XCircle,
    Loader2
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

type Court = {
    id: string;
    name: string;
    surface_type: string | null;
    lighting: boolean;
    is_active: boolean;
    created_at: string;
};

export default function Pistas() {
    const [courts, setCourts] = useState<Court[]>([]);
    const [name, setName] = useState("");
    const [surface, setSurface] = useState("");
    const [lighting, setLighting] = useState(false);
    const [error, setError] = useState("");
    const [ok, setOk] = useState("");
    const [busyId, setBusyId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    async function load() {
        setLoading(true);
        setError("");
        try {
            const data = await apiFetch<{ courts: Court[] }>("/courts");
            setCourts(data.courts);
        } catch (e: any) {
            setError(e instanceof ApiError ? e.message : "No se pudieron cargar las pistas.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load();
    }, []);

    async function create() {
        if (!name.trim()) {
            setError("Por favor, introduce un nombre para la pista.");
            return;
        }
        setError("");
        setOk("");
        try {
            await apiFetch("/courts", {
                method: "POST",
                body: JSON.stringify({
                    name,
                    surface_type: surface ? surface : null,
                    lighting,
                }),
            });
            setName("");
            setSurface("");
            setLighting(false);
            setOk("Pista creada correctamente.");
            setTimeout(() => setOk(""), 3000);
            await load();
        } catch (e: any) {
            setError(e instanceof ApiError ? e.message : "No se pudo crear la pista.");
        }
    }

    async function remove(id: string) {
        if (!confirm("¿Seguro que quieres eliminar esta pista?")) return;
        setError("");
        setOk("");
        setBusyId(id);
        try {
            await apiFetch(`/courts/${id}`, { method: "DELETE" });
            setOk("Pista eliminada.");
            setTimeout(() => setOk(""), 3000);
            await load();
        } catch (e: any) {
            setError(e instanceof ApiError ? e.message : "No se pudo eliminar la pista.");
        } finally {
            setBusyId(null);
        }
    }

    async function update(id: string, patch: Partial<Court>) {
        setError("");
        setOk("");
        setBusyId(id);
        try {
            await apiFetch(`/courts/${id}`, {
                method: "PUT",
                body: JSON.stringify({
                    name: patch.name,
                    surface_type: patch.surface_type,
                    lighting: patch.lighting,
                    is_active: patch.is_active,
                }),
            });
            setOk("Cambios guardados.");
            setTimeout(() => setOk(""), 3000);
            await load();
        } catch (e: any) {
            setError(e instanceof ApiError ? e.message : "No se pudieron guardar los cambios.");
        } finally {
            setBusyId(null);
        }
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Gestión de Pistas</h1>
                <p className="text-slate-500">Configura y administra las pistas de tu club.</p>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl flex items-center gap-3 animate-in fade-in duration-300">
                    <XCircle className="w-5 h-5 flex-shrink-0" />
                    <p className="text-sm font-medium">{error}</p>
                </div>
            )}

            {ok && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-600 px-4 py-3 rounded-xl flex items-center gap-3 animate-in fade-in duration-300">
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                    <p className="text-sm font-medium">{ok}</p>
                </div>
            )}

            {/* Create Form Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                            <Plus className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900">Nueva Pista</h2>
                            <p className="text-xs text-slate-500">Añade una pista al inventario</p>
                        </div>
                    </div>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nombre</label>
                        <input
                            placeholder="Ej: Pista Central"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Superficie</label>
                        <input
                            placeholder="Ej: Cristal / Muro"
                            value={surface}
                            onChange={(e) => setSurface(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        />
                    </div>
                    <div className="flex items-center gap-4 h-10 px-2">
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <input
                                type="checkbox"
                                checked={lighting}
                                onChange={(e) => setLighting(e.target.checked)}
                                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                            />
                            <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900 transition-colors flex items-center gap-1.5">
                                {lighting ? <Zap className="w-4 h-4 text-amber-500" /> : <ZapOff className="w-4 h-4 text-slate-400" />}
                                Luz disponible
                            </span>
                        </label>
                    </div>
                    <button
                        onClick={create}
                        disabled={!name.trim()}
                        className="h-10 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 px-6"
                    >
                        <Plus className="w-4 h-4" />
                        Crear Pista
                    </button>
                </div>
            </div>

            {/* List Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 text-lg">
                            <Table2 className="w-5 h-5" />
                        </div>
                        <h2 className="text-lg font-bold text-slate-900">Pistas Existentes</h2>
                    </div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-full">
                        {courts.length} Total
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="p-12 text-center flex flex-col items-center gap-4">
                            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                            <p className="text-sm text-slate-500 italic">Cargando pistas...</p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100">
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Nombre de la Pista</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Superficie</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Luz</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Estado</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {courts.map((c) => (
                                    <tr key={c.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <input
                                                value={c.name}
                                                onChange={(e) =>
                                                    setCourts((prev) =>
                                                        prev.map((x) => (x.id === c.id ? { ...x, name: e.target.value } : x))
                                                    )
                                                }
                                                className="w-full bg-transparent border-none focus:ring-2 focus:ring-indigo-500 rounded px-2 py-1 text-sm font-semibold text-slate-700 outline-none hover:bg-white"
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <input
                                                value={c.surface_type ?? ""}
                                                onChange={(e) =>
                                                    setCourts((prev) =>
                                                        prev.map((x) =>
                                                            x.id === c.id
                                                                ? { ...x, surface_type: e.target.value ? e.target.value : null }
                                                                : x
                                                        )
                                                    )
                                                }
                                                className="w-full bg-transparent border-none focus:ring-2 focus:ring-indigo-500 rounded px-2 py-1 text-sm text-slate-600 outline-none hover:bg-white"
                                            />
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button
                                                onClick={() => update(c.id, { ...c, lighting: !c.lighting })}
                                                className={cn(
                                                    "inline-flex items-center justify-center p-2 rounded-lg transition-all",
                                                    c.lighting ? "text-amber-500 bg-amber-50" : "text-slate-300 bg-slate-100"
                                                )}
                                            >
                                                {c.lighting ? <Zap className="w-5 h-5 fill-amber-500" /> : <ZapOff className="w-5 h-5" />}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={c.is_active}
                                                    className="sr-only peer"
                                                    onChange={(e) => update(c.id, { ...c, is_active: e.target.checked })}
                                                />
                                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none ring-offset-white peer-focus:ring-2 peer-focus:ring-indigo-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                                            </label>
                                        </td>
                                        <td className="px-6 py-4 text-right space-x-2">
                                            <button
                                                onClick={() => update(c.id, c)}
                                                disabled={busyId === c.id}
                                                className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all disabled:opacity-50"
                                                title="Guardar cambios"
                                            >
                                                {busyId === c.id ? (
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                ) : (
                                                    <Save className="w-5 h-5" />
                                                )}
                                            </button>
                                            <button
                                                onClick={() => remove(c.id)}
                                                disabled={busyId === c.id}
                                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50"
                                                title="Eliminar pista"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {courts.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-slate-500 italic text-sm">
                                            No hay pistas creadas todavía.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
