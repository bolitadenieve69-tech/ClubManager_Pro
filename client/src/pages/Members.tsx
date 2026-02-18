import React, { useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Users, Download, UserPlus, Search, Mail, Phone, ExternalLink, Loader2, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

interface Member {
    id: string;
    full_name: string;
    whatsapp_phone: string;
    status: string;
    user_id: string | null;
}

export default function Members() {
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [exporting, setExporting] = useState(false);
    const [error, setError] = useState("");
    const [creating, setCreating] = useState(false);
    const [isCreatingManual, setIsCreatingManual] = useState(false);
    const [newName, setNewName] = useState("");
    const [newPhone, setNewPhone] = useState("");

    const fetchMembers = async () => {
        setLoading(true);
        try {
            const data = await apiFetch<any>('/members');
            setMembers(data.members || []);
        } catch (err: any) {
            setError(err.message || "Error al cargar socios");
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchMembers();
    }, []);

    const handleCreateMember = async () => {
        if (!newName.trim() || !newPhone.trim()) {
            setError("Por favor, completa el nombre y el teléfono.");
            return;
        }

        setCreating(true);
        try {
            await apiFetch('/members', {
                method: 'POST',
                body: JSON.stringify({
                    full_name: newName,
                    whatsapp_phone: newPhone,
                    status: 'APPROVED'
                })
            });
            setNewName("");
            setNewPhone("");
            setIsCreatingManual(false);
            fetchMembers();
        } catch (err: any) {
            setError(err.message || "Error al crear socio");
        } finally {
            setCreating(false);
        }
    };

    const handleExport = async () => {
        setExporting(true);
        try {
            const baseUrl = (import.meta as any).env.VITE_API_BASE_URL;
            const response = await fetch(`${baseUrl}/members/export`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `clientes_club_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Error exporting members:", err);
        } finally {
            setExporting(false);
        }
    };

    const filteredMembers = members.filter(m =>
        m.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.whatsapp_phone.includes(searchTerm)
    );

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Cargando base de datos...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-20">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-primary-500 mb-2">
                        <Users className="w-5 h-5" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em]">Gestión de Clientes</span>
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight italic uppercase">
                        Socios y <span className="text-primary-600">Usuarios</span>
                    </h1>
                    <p className="text-slate-500 font-medium">Administra la base de datos de tu club y exporta contactos para marketing.</p>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        variant="secondary"
                        onClick={handleExport}
                        disabled={exporting}
                        className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm"
                        icon={exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    >
                        {exporting ? "Exportando..." : "Exportar CSV"}
                    </Button>
                    <Button
                        variant="primary"
                        icon={creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                        onClick={() => setIsCreatingManual(!isCreatingManual)}
                        disabled={creating}
                    >
                        {isCreatingManual ? "Cancelar" : "Nuevo Socio"}
                    </Button>
                </div>
            </div>

            {isCreatingManual && (
                <Card className="p-6 border-none bg-white shadow-premium animate-in slide-in-from-top-4 duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Nombre Completo</label>
                            <input
                                autoFocus
                                placeholder="Ej: Juan Pérez"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                className="w-full bg-slate-50 border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Teléfono WhatsApp</label>
                            <input
                                placeholder="Ej: +34 600 000 000"
                                value={newPhone}
                                onChange={(e) => setNewPhone(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleCreateMember()}
                                className="w-full bg-slate-50 border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                            />
                        </div>
                        <Button
                            variant="primary"
                            className="h-[46px]"
                            onClick={handleCreateMember}
                            loading={creating}
                        >
                            Confirmar Registro
                        </Button>
                    </div>
                </Card>
            )}

            {error && (
                <div className="bg-rose-50 border border-rose-100 text-rose-600 p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                    <Badge variant="error" className="bg-rose-500 text-white">ERROR</Badge>
                    <p className="font-bold text-sm">{error}</p>
                    <button onClick={() => setError("")} className="ml-auto text-rose-400 hover:text-rose-600">✕</button>
                </div>
            )}

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: "Total Clientes", value: members.length, icon: Users, color: "primary" },
                    { label: "Usuarios PWA", value: members.filter(m => m.user_id).length, icon: ExternalLink, color: "emerald" },
                    { label: "Pendientes", value: members.filter(m => m.status === 'PENDING').length, icon: Mail, color: "amber" },
                ].map((stat) => (
                    <Card key={stat.label} className="p-6 border-none bg-white shadow-premium group transition-all hover:-translate-y-1">
                        <div className="flex items-center gap-5">
                            <div className={cn(
                                "w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:rotate-6",
                                stat.color === 'primary' ? "bg-primary-500 text-white shadow-primary-500/30" :
                                    stat.color === 'emerald' ? "bg-emerald-500 text-white shadow-emerald-500/30" :
                                        "bg-amber-500 text-white shadow-amber-500/30"
                            )}>
                                <stat.icon className="w-7 h-7" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                                <p className="text-3xl font-black text-slate-900 tracking-tighter">{stat.value}</p>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Table Section */}
            <Card className="border-none shadow-premium overflow-hidden bg-white rounded-[2rem]">
                <div className="p-6 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre o teléfono..."
                            className="w-full bg-white border-slate-200 rounded-xl pl-12 py-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Nombre</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">WhatsApp</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">App PWA</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredMembers.map((member) => (
                                <motion.tr
                                    key={member.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="hover:bg-slate-50/50 transition-colors group"
                                >
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-black text-slate-500 text-xs border-2 border-white shadow-sm">
                                                {member.full_name[0]}
                                            </div>
                                            <span className="font-bold text-slate-900">{member.full_name}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-2 text-slate-500">
                                            <Phone className="w-3.5 h-3.5 text-emerald-500" />
                                            <span className="font-mono text-sm">{member.whatsapp_phone}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <Badge variant={member.status === 'APPROVED' ? 'success' : 'warning'} className="font-black uppercase tracking-tighter text-[9px]">
                                            {member.status === 'APPROVED' ? 'ACTIVO' : 'PENDIENTE'}
                                        </Badge>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        {member.user_id ? (
                                            <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-black">
                                                <Check className="w-3 h-3" /> REGISTRADO
                                            </div>
                                        ) : (
                                            <span className="text-[10px] font-bold text-slate-300 uppercase italic">Sin registro</span>
                                        )}
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredMembers.length === 0 && (
                    <div className="p-20 text-center space-y-4">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                            <Search className="w-10 h-10 text-slate-200" />
                        </div>
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No se encontraron socios</p>
                    </div>
                )}
            </Card>
        </div>
    );
}
