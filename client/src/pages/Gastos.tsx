import React, { useEffect, useState } from "react";
import {
    Receipt,
    Plus,
    Trash2,
    Search,
    Loader2,
    Calendar,
    Tag,
    Info,
    Building2,
    ExternalLink,
    CheckCircle2,
    Clock
} from "lucide-react";
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { cn } from '../lib/utils';
import { apiFetch } from "../lib/api";
import Layout from "../components/Layout";

interface SupplierInvoice {
    id: string;
    provider_name: string;
    category: string;
    amount_cents: number;
    date: string;
    invoice_number: string | null;
    attachment_url: string | null;
    status: "PENDING" | "PAID";
}

export default function Gastos() {
    const [invoices, setInvoices] = useState<SupplierInvoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form state
    const [providerName, setProviderName] = useState("");
    const [amount, setAmount] = useState("");
    const [category, setCategory] = useState("Suministros");
    const [invoiceNumber, setInvoiceNumber] = useState("");
    const [attachmentUrl, setAttachmentUrl] = useState("");
    const [status, setStatus] = useState<"PENDING" | "PAID">("PENDING");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchInvoices();
    }, []);

    const fetchInvoices = async () => {
        try {
            setLoading(true);
            const data = await apiFetch<{ invoices: SupplierInvoice[] }>("/supplier-invoices");
            setInvoices(data.invoices);
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
            const amountCents = Math.round(parseFloat(amount) * 100);

            await apiFetch("/supplier-invoices", {
                method: "POST",
                body: JSON.stringify({
                    provider_name: providerName,
                    category,
                    amount_cents: amountCents,
                    invoice_number: invoiceNumber || undefined,
                    attachment_url: attachmentUrl || undefined,
                    status
                })
            });

            setIsModalOpen(false);
            setProviderName("");
            setAmount("");
            setInvoiceNumber("");
            setAttachmentUrl("");
            fetchInvoices();
        } catch (err: any) {
            alert(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("¿Seguro que quieres eliminar esta factura?")) return;
        try {
            await apiFetch(`/supplier-invoices/${id}`, {
                method: "DELETE",
            });
            fetchInvoices();
        } catch (err: any) {
            alert(err.message);
        }
    };

    const handleToggleStatus = async (invoice: SupplierInvoice) => {
        const newStatus = invoice.status === "PENDING" ? "PAID" : "PENDING";
        try {
            await apiFetch(`/supplier-invoices/${invoice.id}`, {
                method: "PATCH",
                body: JSON.stringify({ status: newStatus })
            });
            fetchInvoices();
        } catch (err: any) {
            alert(err.message);
        }
    };

    return (
        <Layout>
            <div className="space-y-6">
                <Card className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 border border-slate-200">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
                            <Receipt className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">Facturas de Proveedores</h1>
                            <p className="text-slate-500 font-medium">Gestión de gastos operativos y facturas externas.</p>
                        </div>
                    </div>
                    <Button
                        onClick={() => setIsModalOpen(true)}
                        icon={<Plus className="w-5 h-5" />}
                        className="bg-rose-600 hover:bg-rose-700"
                    >
                        Nueva Factura
                    </Button>
                </Card>

                {loading ? (
                    <Card className="flex flex-col items-center justify-center py-24 border border-slate-200">
                        <Loader2 className="w-10 h-10 text-primary-500 animate-spin mb-4" />
                        <p className="text-slate-500 font-medium">Cargando facturas...</p>
                    </Card>
                ) : invoices.length === 0 ? (
                    <Card className="flex flex-col items-center justify-center py-24 border border-slate-200">
                        <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mb-4">
                            <Info className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">Sin facturas</h3>
                        <p className="text-slate-500">No hay facturas registradas aún.</p>
                    </Card>
                ) : (
                    <Card className="border border-slate-200">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-200">
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Proveedor / Nº</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Categoría</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Fecha</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Estado</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Importe</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {invoices.map((inv) => (
                                    <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                                                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                                                    {inv.provider_name}
                                                </span>
                                                <span className="text-xs text-slate-500">#{inv.invoice_number || inv.id.slice(0, 8)}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-medium">
                                                <Tag className="w-3 h-3" />
                                                {inv.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-slate-600 text-xs">
                                                <Calendar className="w-4 h-4 text-slate-400" />
                                                {new Date(inv.date).toLocaleDateString("es-ES")}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => handleToggleStatus(inv)}
                                                className="hover:opacity-80 transition-opacity"
                                            >
                                                {inv.status === "PAID" ? (
                                                    <Badge variant="success" className="gap-1">
                                                        <CheckCircle2 className="w-3 h-3" /> PAGADO
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="warning" className="gap-1">
                                                        <Clock className="w-3 h-3" /> PENDIENTE
                                                    </Badge>
                                                )}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="font-bold text-slate-900">
                                                {(inv.amount_cents / 100).toLocaleString("es-ES", { style: "currency", currency: "EUR" })}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {inv.attachment_url && (
                                                    <a
                                                        href={inv.attachment_url}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-lg"
                                                        title="Ver adjunto"
                                                    >
                                                        <ExternalLink className="w-4 h-4" />
                                                    </a>
                                                )}
                                                <button
                                                    onClick={() => handleDelete(inv.id)}
                                                    className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg"
                                                    title="Eliminar"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
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
                                    <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
                                        <Plus className="w-5 h-5" />
                                    </div>
                                    Nueva Factura de Proveedor
                                </h2>
                                <form onSubmit={handleCreate} className="space-y-4">
                                    <Input
                                        label="Proveedor"
                                        type="text"
                                        required
                                        autoFocus
                                        value={providerName}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProviderName(e.target.value)}
                                        placeholder="Ej: Endesa, Amazon, Mantenimiento..."
                                    />

                                    <div className="grid grid-cols-2 gap-4">
                                        <Input
                                            label="Importe (€)"
                                            type="number"
                                            step="0.01"
                                            required
                                            value={amount}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAmount(e.target.value)}
                                            placeholder="0.00"
                                        />
                                        <Select
                                            label="Categoría"
                                            value={category}
                                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCategory(e.target.value)}
                                            options={[
                                                { value: "Suministros", label: "Suministros" },
                                                { value: "Personal", label: "Personal" },
                                                { value: "Mantenimiento", label: "Mantenimiento" },
                                                { value: "Alquiler", label: "Alquiler" },
                                                { value: "Marketing", label: "Marketing" },
                                                { value: "Otros", label: "Otros" },
                                            ]}
                                        />
                                    </div>

                                    <Input
                                        label="Número de Factura"
                                        type="text"
                                        value={invoiceNumber}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInvoiceNumber(e.target.value)}
                                        placeholder="Ej: INV-2024-001"
                                    />

                                    <Input
                                        label="URL Adjunto / Imagen"
                                        type="text"
                                        value={attachmentUrl}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAttachmentUrl(e.target.value)}
                                        placeholder="https://ejemplo.com/factura.jpg"
                                    />

                                    <div className="flex items-center gap-4 py-2">
                                        <label className="text-sm font-bold text-slate-700">Estado:</label>
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setStatus("PENDING")}
                                                className={cn(
                                                    "px-4 py-1.5 rounded-full text-xs font-black transition-all",
                                                    status === "PENDING" ? "bg-amber-100 text-amber-700 border-2 border-amber-200" : "bg-slate-100 text-slate-400 border-2 border-transparent"
                                                )}
                                            >
                                                PENDIENTE
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setStatus("PAID")}
                                                className={cn(
                                                    "px-4 py-1.5 rounded-full text-xs font-black transition-all",
                                                    status === "PAID" ? "bg-emerald-100 text-emerald-700 border-2 border-emerald-200" : "bg-slate-100 text-slate-400 border-2 border-transparent"
                                                )}
                                            >
                                                PAGADO
                                            </button>
                                        </div>
                                    </div>

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
                                            className="flex-[2] bg-rose-600 hover:bg-rose-700"
                                            icon={<Plus className="w-5 h-5" />}
                                        >
                                            Guardar Factura
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
}
