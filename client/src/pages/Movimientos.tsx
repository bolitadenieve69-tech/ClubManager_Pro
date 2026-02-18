import React, { useEffect, useState } from "react";
import {
    Wallet,
    Plus,
    Trash2,
    ArrowUpCircle,
    ArrowDownCircle,
    Search,
    Loader2,
    Calendar,
    Tag,
    Info
} from "lucide-react";
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { cn } from '../lib/utils';

interface Movement {
    id: string;
    amount_cents: number;
    concept: string;
    category: string | null;
    date: string;
}

export default function Movimientos() {
    const [movements, setMovements] = useState<Movement[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form state
    const [amount, setAmount] = useState("");
    const [concept, setConcept] = useState("");
    const [category, setCategory] = useState("Varios");
    const [type, setType] = useState<"income" | "expense">("income");
    const [submitting, setSubmitting] = useState(false);
    const [from, setFrom] = useState<string | undefined>(undefined);
    const [to, setTo] = useState<string | undefined>(undefined);

    useEffect(() => {
        fetchMovements();
    }, []);

    const fetchMovements = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("token");
            const res = await fetch("http://localhost:3000/movements", {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error("Error al cargar los movimientos");
            const data = await res.json();
            setMovements(data.movements);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            const token = localStorage.getItem("token");
            const amountCents = Math.round(parseFloat(amount) * 100) * (type === "expense" ? -1 : 1);

            const res = await fetch("http://localhost:3000/movements", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    amount_cents: amountCents,
                    concept,
                    category,
                })
            });

            if (!res.ok) throw new Error("Error al crear el movimiento");

            setIsModalOpen(false);
            setAmount("");
            setConcept("");
            fetchMovements();
        } catch (err: any) {
            alert(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("¿Seguro que quieres eliminar este movimiento?")) return;
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`http://localhost:3000/movements/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error("Error al eliminar");
            fetchMovements();
        } catch (err: any) {
            alert(err.message);
        }
    };

    const totalBalanceCents = movements.reduce((acc, m) => acc + m.amount_cents, 0);

    return (
        <div className="space-y-6">
            <Card className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 border border-slate-200">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                        <Wallet className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Movimientos Internos</h1>
                        <p className="text-slate-500 font-medium">Gestión de ingresos y gastos de caja.</p>
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-3">
                    <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-button">
                        <button
                            onClick={() => {
                                const start = new Date();
                                start.setDate(1);
                                setFrom(start.toISOString().split("T")[0]);
                                setTo(undefined); // Clear 'to' date for "Este mes"
                            }}
                            className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-white rounded-button transition-all"
                        >
                            Este mes
                        </button>
                    </div>
                    <Button
                        onClick={() => setIsModalOpen(true)}
                        icon={<Plus className="w-5 h-5" />}
                    >
                        Nuevo Movimiento
                    </Button>
                </div>
            </Card>

            {loading ? (
                <Card className="flex flex-col items-center justify-center py-24 border border-slate-200">
                    <Loader2 className="w-10 h-10 text-primary-500 animate-spin mb-4" />
                    <p className="text-slate-500 font-medium">Cargando movimientos...</p>
                </Card>
            ) : movements.length === 0 ? (
                <Card className="flex flex-col items-center justify-center py-24 border border-slate-200">
                    <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mb-4">
                        <Info className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">Sin movimientos</h3>
                    <p className="text-slate-500">No hay registros para este periodo.</p>
                </Card>
            ) : (
                <Card className="border border-slate-200">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-200">
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Fecha</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Concepto</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Categoría</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Importe</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {movements.map((movement) => (
                                <tr key={movement.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-slate-600">
                                            <Calendar className="w-4 h-4 text-slate-400" />
                                            {new Date(movement.date).toLocaleDateString("es-ES", {
                                                day: "2-digit",
                                                month: "short",
                                                year: "numeric"
                                            })}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-semibold text-slate-900">{movement.concept}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-medium">
                                            <Tag className="w-3 h-3" />
                                            {movement.category || "Varios"}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className={`flex items-center justify-end gap-1.5 font-bold ${movement.amount_cents >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                                            {movement.amount_cents >= 0 ? <ArrowUpCircle className="w-4 h-4" /> : <ArrowDownCircle className="w-4 h-4" />}
                                            {(movement.amount_cents / 100).toLocaleString("es-ES", { style: "currency", currency: "EUR" })}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => handleDelete(movement.id)}
                                            title="Eliminar movimiento"
                                            className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Card>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-card w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-8">
                            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                                    <Plus className="w-5 h-5" />
                                </div>
                                Nuevo Movimiento
                            </h2>
                            <form onSubmit={handleCreate} className="space-y-4">
                                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-button">
                                    <button
                                        type="button"
                                        onClick={() => setType("income")}
                                        className={cn(
                                            "py-2 px-4 rounded-button text-sm font-bold transition-all",
                                            type === "income" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                                        )}
                                    >
                                        Ingreso
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setType("expense")}
                                        className={cn(
                                            "py-2 px-4 rounded-button text-sm font-bold transition-all",
                                            type === "expense" ? "bg-white text-rose-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                                        )}
                                    >
                                        Gasto
                                    </button>
                                </div>

                                <Input
                                    label="Importe (€)"
                                    type="number"
                                    step="0.01"
                                    autoFocus
                                    value={amount}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAmount(e.target.value)}
                                    placeholder="0.00"
                                    className="font-bold text-lg"
                                />

                                <Input
                                    label="Concepto"
                                    type="text"
                                    required
                                    value={concept}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConcept(e.target.value)}
                                    placeholder="Ej: Material de oficina"
                                />

                                <Select
                                    label="Categoría"
                                    value={category}
                                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCategory(e.target.value)}
                                    options={[
                                        { value: "Varios", label: "Varios" },
                                        { value: "Mantenimiento", label: "Mantenimiento" },
                                        { value: "Limpieza", label: "Limpieza" },
                                        { value: "Suministros", label: "Suministros" },
                                    ]}
                                />

                                <div className="flex gap-3 pt-4">
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        onClick={() => setIsModalOpen(false)}
                                        className="flex-1"
                                    >
                                        Cancelar
                                    </Button>
                                    <Button
                                        type="submit"
                                        loading={submitting}
                                        className="flex-[2]"
                                        icon={<Plus className="w-5 h-5" />}
                                    >
                                        Crear Movimiento
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
