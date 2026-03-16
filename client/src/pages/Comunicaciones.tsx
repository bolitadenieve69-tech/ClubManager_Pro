import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { apiFetch } from '../lib/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import {
    Megaphone, Plus, Trash2, Eye, EyeOff, Pin, Send,
    Loader2, X, ExternalLink, MessageCircle, Users, CheckCircle2, Zap, ImageIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Announcement {
    id: string;
    title: string;
    body: string;
    image_url: string | null;
    cta_label: string | null;
    cta_url: string | null;
    active: boolean;
    pinned: boolean;
    created_at: string;
    expires_at: string | null;
}

interface Contact {
    name: string;
    phone: string;
    waUrl: string;
}

export default function Comunicaciones() {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [broadcastData, setBroadcastData] = useState<{ contacts: Contact[]; messageText: string } | null>(null);
    const [broadcastLoading, setBroadcastLoading] = useState(false);
    const [sentCount, setSentCount] = useState(0);

    // Quick Send state
    const [quickMessage, setQuickMessage] = useState('');
    const [quickSending, setQuickSending] = useState(false);

    const [form, setForm] = useState({
        title: '',
        body: '',
        image_url: '',
        cta_label: '',
        cta_url: '',
        pinned: false,
        expires_at: '',
    });

    const fetchAnnouncements = async () => {
        setLoading(true);
        try {
            const data = await apiFetch<any>('/announcements/all');
            setAnnouncements(data.announcements || []);
        } catch (err: any) {
            setError(err.message || 'Error al cargar comunicaciones');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchAnnouncements(); }, []);

    const handleSave = async () => {
        if (!form.title.trim() || !form.body.trim()) {
            setError('El título y el mensaje son obligatorios.');
            return;
        }
        setSaving(true);
        try {
            await apiFetch('/announcements', {
                method: 'POST',
                body: JSON.stringify({
                    title: form.title,
                    body: form.body,
                    image_url: form.image_url || null,
                    cta_label: form.cta_label || null,
                    cta_url: form.cta_url || null,
                    pinned: form.pinned,
                    expires_at: form.expires_at || null,
                })
            });
            setForm({ title: '', body: '', image_url: '', cta_label: '', cta_url: '', pinned: false, expires_at: '' });
            setShowForm(false);
            fetchAnnouncements();
        } catch (err: any) {
            setError(err.message || 'Error al guardar');
        } finally {
            setSaving(false);
        }
    };

    const handleToggle = async (id: string) => {
        try {
            await apiFetch(`/announcements/${id}/toggle`, { method: 'PATCH' });
            fetchAnnouncements();
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Eliminar este anuncio?')) return;
        try {
            await apiFetch(`/announcements/${id}`, { method: 'DELETE' });
            fetchAnnouncements();
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleBroadcast = async (id: string) => {
        setBroadcastLoading(true);
        setSentCount(0);
        try {
            const data = await apiFetch<any>(`/announcements/${id}/whatsapp-preview`);
            setBroadcastData(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setBroadcastLoading(false);
        }
    };

    const handleQuickSend = async () => {
        if (!quickMessage.trim()) return;
        setQuickSending(true);
        setSentCount(0);
        try {
            const data = await apiFetch<any>('/announcements/quick-send', {
                method: 'POST',
                body: JSON.stringify({ message: quickMessage.trim() })
            });
            setBroadcastData(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setQuickSending(false);
        }
    };

    const inputClass = "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all";

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Cargando comunicaciones...</p>
            </div>
        );
    }

    return (
        <Layout>
            <div className="space-y-8 max-w-5xl mx-auto pb-20">

                {/* WhatsApp Broadcast Modal */}
                <AnimatePresence>
                    {broadcastData && (
                        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto pt-10">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden"
                            >
                                <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-[#25D366] rounded-xl text-white shadow-lg">
                                            <MessageCircle className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black text-slate-900">Envío Masivo WhatsApp</h3>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{broadcastData.contacts.length} socios activos</p>
                                        </div>
                                    </div>
                                    <button type="button" onClick={() => setBroadcastData(null)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="p-8 space-y-6">
                                    <div className="bg-slate-50 rounded-2xl p-4 text-sm text-slate-600 font-medium leading-relaxed whitespace-pre-wrap border border-slate-100">
                                        {broadcastData.messageText}
                                    </div>

                                    <div className="space-y-3">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                            <Users className="w-3.5 h-3.5" /> Pulsa cada socio para abrir WhatsApp
                                        </p>
                                        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                                            {broadcastData.contacts.map((c, i) => (
                                                <a
                                                    key={i}
                                                    href={c.waUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    onClick={() => setSentCount(n => n + 1)}
                                                    className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl hover:border-[#25D366] hover:bg-emerald-50/30 transition-all group"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center font-black text-slate-500 text-xs">
                                                            {c.name[0]}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-slate-900">{c.name}</p>
                                                            <p className="text-[10px] text-slate-400 font-mono">{c.phone}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-[#25D366]">
                                                        <Send className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                                                    </div>
                                                </a>
                                            ))}
                                        </div>
                                    </div>

                                    {sentCount > 0 && (
                                        <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 rounded-2xl px-4 py-3">
                                            <CheckCircle2 className="w-4 h-4" />
                                            <p className="text-xs font-black">{sentCount} de {broadcastData.contacts.length} mensajes enviados</p>
                                        </div>
                                    )}

                                    <Button
                                        variant="secondary"
                                        className="w-full"
                                        onClick={() => setBroadcastData(null)}
                                    >
                                        CERRAR
                                    </Button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-primary-500 mb-2">
                            <Megaphone className="w-5 h-5" />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Marketing & Comunicación</span>
                        </div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight italic uppercase">
                            Comunicaciones <span className="text-primary-600">y Ofertas</span>
                        </h1>
                        <p className="text-slate-500 font-medium">Crea anuncios, promociones y campeonatos. Envíalos a todos tus socios por WhatsApp.</p>
                    </div>
                    <Button
                        variant="primary"
                        icon={<Plus className="w-4 h-4" />}
                        onClick={() => setShowForm(v => !v)}
                    >
                        {showForm ? 'CANCELAR' : 'NUEVO ANUNCIO'}
                    </Button>
                </div>

                {error && (
                    <div className="bg-rose-50 border border-rose-100 text-rose-600 p-4 rounded-2xl flex items-center gap-3">
                        <Badge variant="error" className="bg-rose-500 text-white">ERROR</Badge>
                        <p className="font-bold text-sm">{error}</p>
                        <button type="button" onClick={() => setError('')} className="ml-auto text-rose-400 hover:text-rose-600">✕</button>
                    </div>
                )}

                {/* Envío Rápido */}
                <Card className="p-8 border-none bg-gradient-to-br from-slate-900 to-slate-800 shadow-2xl rounded-[2rem] text-white overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-primary-500/10 rounded-full blur-3xl -mr-24 -mt-24" />
                    <div className="relative z-10 space-y-5">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-primary-500/20 rounded-xl">
                                <Zap className="w-5 h-5 text-primary-400" />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-white uppercase tracking-widest">Envío Rápido</h3>
                                <p className="text-[10px] font-bold text-slate-400">Pega un enlace, imagen o escribe un mensaje y envía a todos los socios</p>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <ImageIcon className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Mensaje / URL del archivo (imagen, PDF, flyer...)</span>
                            </div>
                            <textarea
                                className="w-full bg-white/10 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-primary-500/50 resize-none min-h-[80px]"
                                placeholder={"Escribe aquí tu mensaje o pega la URL del archivo de marketing...\n\nEjemplo: https://drive.google.com/file/tu-flyer.jpg"}
                                value={quickMessage}
                                onChange={e => setQuickMessage(e.target.value)}
                            />
                        </div>
                        <Button
                            variant="primary"
                            onClick={handleQuickSend}
                            loading={quickSending}
                            disabled={!quickMessage.trim()}
                            icon={<Send className="w-4 h-4" />}
                            className="w-full py-5 bg-primary-500 hover:bg-primary-600 shadow-lg shadow-primary-500/30"
                        >
                            ENVIAR A TODOS LOS SOCIOS
                        </Button>
                    </div>
                </Card>

                {/* Form */}
                <AnimatePresence>
                    {showForm && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                        >
                            <Card className="p-8 border-none bg-white shadow-premium rounded-[2rem]">
                                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6">Nuevo Anuncio / Oferta</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="md:col-span-2 space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Título *</label>
                                        <input className={inputClass} placeholder="Ej: ¡Torneo de Verano 2026!" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
                                    </div>
                                    <div className="md:col-span-2 space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Mensaje *</label>
                                        <textarea
                                            className={`${inputClass} min-h-[100px] resize-none`}
                                            placeholder="Describe la oferta, promoción o evento..."
                                            value={form.body}
                                            onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">URL imagen (opcional)</label>
                                        <input className={inputClass} placeholder="https://..." value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Fecha expiración (opcional)</label>
                                        <input type="date" className={inputClass} value={form.expires_at} onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Texto botón CTA (opcional)</label>
                                        <input className={inputClass} placeholder="Ej: Inscribirse ahora" value={form.cta_label} onChange={e => setForm(f => ({ ...f, cta_label: e.target.value }))} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">URL botón CTA (opcional)</label>
                                        <input className={inputClass} placeholder="https://..." value={form.cta_url} onChange={e => setForm(f => ({ ...f, cta_url: e.target.value }))} />
                                    </div>
                                    <div className="md:col-span-2 flex items-center gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setForm(f => ({ ...f, pinned: !f.pinned }))}
                                            className={`w-10 h-6 rounded-full transition-colors ${form.pinned ? 'bg-primary-500' : 'bg-slate-200'}`}
                                        >
                                            <div className={`w-4 h-4 bg-white rounded-full shadow mx-1 transition-transform ${form.pinned ? 'translate-x-4' : ''}`} />
                                        </button>
                                        <span className="text-sm font-bold text-slate-600">Fijar en la app (aparece primero)</span>
                                    </div>
                                </div>
                                <div className="mt-6 flex justify-end">
                                    <Button variant="primary" onClick={handleSave} loading={saving} icon={<Megaphone className="w-4 h-4" />}>
                                        PUBLICAR ANUNCIO
                                    </Button>
                                </div>
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* List */}
                {announcements.length === 0 ? (
                    <Card className="p-20 text-center border-none bg-white shadow-premium rounded-[2rem]">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Megaphone className="w-10 h-10 text-slate-200" />
                        </div>
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Sin anuncios todavía</p>
                        <p className="text-slate-300 text-xs mt-2">Crea tu primer anuncio para enviarlo a los socios</p>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {announcements.map(a => (
                            <motion.div key={a.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                <Card className={`p-6 border-none shadow-premium rounded-[1.5rem] bg-white transition-opacity ${!a.active ? 'opacity-50' : ''}`}>
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap mb-2">
                                                {a.pinned && <Badge variant="neutral" className="bg-amber-100 text-amber-700 border-none text-[9px] font-black uppercase"><Pin className="w-2.5 h-2.5 inline mr-1" />Fijado</Badge>}
                                                <Badge variant={a.active ? 'success' : 'neutral'} className="text-[9px] font-black uppercase">
                                                    {a.active ? 'ACTIVO' : 'INACTIVO'}
                                                </Badge>
                                                {a.expires_at && (
                                                    <span className="text-[9px] font-black text-slate-400 uppercase">
                                                        Expira: {format(new Date(a.expires_at), 'dd MMM yyyy', { locale: es })}
                                                    </span>
                                                )}
                                            </div>
                                            <h3 className="text-lg font-black text-slate-900 truncate">{a.title}</h3>
                                            <p className="text-sm text-slate-500 font-medium mt-1 line-clamp-2">{a.body}</p>
                                            {a.cta_label && a.cta_url && (
                                                <a href={a.cta_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-2 text-[10px] font-black text-primary-600 hover:text-primary-700">
                                                    <ExternalLink className="w-3 h-3" /> {a.cta_label}
                                                </a>
                                            )}
                                            {a.image_url && (
                                                <img src={a.image_url} alt={a.title} className="mt-3 rounded-xl h-24 w-auto object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                            )}
                                        </div>
                                        <div className="flex flex-col gap-2 flex-shrink-0">
                                            <Button
                                                size="sm"
                                                variant="secondary"
                                                onClick={() => handleBroadcast(a.id)}
                                                loading={broadcastLoading}
                                                className="text-[10px] font-black bg-[#25D366]/10 text-[#128C7E] border-[#25D366]/20 hover:bg-[#25D366]/20 whitespace-nowrap"
                                                icon={<Send className="w-3 h-3" />}
                                            >
                                                ENVIAR WHATSAPP
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="secondary"
                                                onClick={() => handleToggle(a.id)}
                                                className="text-[10px] font-black"
                                                icon={a.active ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                            >
                                                {a.active ? 'DESACTIVAR' : 'ACTIVAR'}
                                            </Button>
                                            <button
                                                type="button"
                                                onClick={() => handleDelete(a.id)}
                                                className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors self-end"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                    <p className="text-[9px] text-slate-300 font-bold mt-4 uppercase tracking-widest">
                                        Creado {format(new Date(a.created_at), "dd MMM yyyy 'a las' HH:mm", { locale: es })}
                                    </p>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </Layout>
    );
}
