import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UserPlus, CheckCircle, Smartphone, Send, MessageCircle, Loader2 } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { apiFetch } from "../lib/api";

interface Member {
    id: string;
    full_name: string;
    whatsapp_phone: string;
}

interface InvitationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    member?: Member | null;
}

export default function InvitationModal({ isOpen, onClose, onSuccess, member }: InvitationModalProps) {
    const [fullName, setFullName] = useState('');
    const [whatsappPhone, setWhatsappPhone] = useState('');
    const [loading, setLoading] = useState(false);
    const [successData, setSuccessData] = useState<any>(null);
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (member) {
            setFullName(member.full_name);
            setWhatsappPhone(member.whatsapp_phone);
            handleExternalInvite(member);
        } else {
            setFullName('');
            setWhatsappPhone('');
            setSuccessData(null);
            setMessage('');
        }
    }, [member, isOpen]);

    const handleExternalInvite = async (m: Member) => {
        setLoading(true);
        try {
            const data = await apiFetch<any>('/members/invitations', {
                method: 'POST',
                body: JSON.stringify({
                    fullName: m.full_name,
                    whatsappPhone: m.whatsapp_phone
                })
            });
            setSuccessData(data);
            const publicUrl = (import.meta as any).env.VITE_PUBLIC_URL || window.location.origin;
            const inviteLink = `${publicUrl}${data.inviteUrl}`;
            setMessage(`¡Hola ${m.full_name}! 👋 Bienvenido a nuestro club. Ya puedes reservar pistas y pagar desde tu móvil aquí: ${inviteLink}`);
        } catch (err) {
            console.error("Error creating invitation:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const data = await apiFetch<any>('/members/invitations', {
                method: 'POST',
                body: JSON.stringify({ fullName, whatsappPhone })
            });
            setSuccessData(data);
            const publicUrl = (import.meta as any).env.VITE_PUBLIC_URL || window.location.origin;
            const inviteLink = `${publicUrl}${data.inviteUrl}`;
            setMessage(`¡Hola ${fullName}! 👋 Bienvenido a nuestro club. Ya puedes reservar pistas y pagar desde tu móvil aquí: ${inviteLink}`);
            onSuccess();
        } catch (err) {
            console.error("Error creating invitation:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleShareWhatsApp = () => {
        if (!successData || !message) return;
        const cleanPhone = whatsappPhone.replace(/\D/g, '');
        const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
        window.open(waUrl, '_blank');
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden relative"
                    >
                        <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-indigo-500 rounded-xl text-white shadow-lg shadow-indigo-500/20">
                                    <UserPlus className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-slate-900 tracking-tight">
                                        {member ? 'Enviar Invitación' : 'Nueva Invitación'}
                                    </h3>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Acceso para Miembros</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                title="Cerrar modal"
                                className="p-2 hover:bg-white rounded-full transition-colors text-slate-400 shadow-sm border border-transparent hover:border-slate-100"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {!successData ? (
                            <form onSubmit={handleSubmit} className="p-8 space-y-6">
                                <div className="space-y-4">
                                    <Input
                                        label="Nombre Completo"
                                        required
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        placeholder="Ej: Juan Pérez"
                                        className="py-4"
                                    />
                                    <Input
                                        label="WhatsApp"
                                        required
                                        value={whatsappPhone}
                                        onChange={(e) => setWhatsappPhone(e.target.value)}
                                        placeholder="Ej: +34 600 000 000"
                                        className="py-4"
                                        icon={<Smartphone className="w-4 h-4" />}
                                    />
                                </div>
                                <Button type="submit" loading={loading} className="w-full py-6 group bg-slate-900 hover:bg-black text-white rounded-2xl" variant="primary">
                                    CREAR INVITACIÓN Y GENERAR LINK
                                </Button>
                            </form>
                        ) : (
                            <div className="p-8 space-y-6 text-center">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto rotate-3"
                                >
                                    <CheckCircle className="w-8 h-8" />
                                </motion.div>
                                <div>
                                    <h4 className="text-xl font-black text-slate-900 tracking-tight">¡Invitación Lista!</h4>
                                    <p className="text-slate-500 text-xs font-medium mt-1 leading-relaxed">
                                        Revisa y edita el mensaje para <strong>{fullName}</strong>:
                                    </p>
                                </div>

                                <div className="space-y-2 text-left">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 flex items-center gap-1.5">
                                        <MessageCircle className="w-3 h-3" /> Mensaje Personalizado
                                    </label>
                                    <textarea
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm text-slate-600 focus:bg-white focus:border-indigo-500/20 focus:ring-0 transition-all shadow-inner min-h-[120px] resize-none outline-none font-medium leading-relaxed"
                                        placeholder="Escribe el mensaje aquí..."
                                        title="Mensaje de WhatsApp"
                                    />
                                </div>

                                <div className="space-y-3 pt-2">
                                    <Button
                                        onClick={handleShareWhatsApp}
                                        variant="primary"
                                        className="w-full py-6 bg-[#25D366] hover:bg-[#128C7E] shadow-xl shadow-emerald-900/10 text-white rounded-2xl group border-none"
                                    >
                                        <div className="flex items-center justify-center gap-2">
                                            <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                            <span className="font-black uppercase tracking-widest">ENVIAR POR WHATSAPP</span>
                                        </div>
                                    </Button>

                                    <button
                                        onClick={() => {
                                            const publicUrl = (import.meta as any).env.VITE_PUBLIC_URL || window.location.origin;
                                            navigator.clipboard.writeText(`${publicUrl}/join/${successData.token}`);
                                            alert("Copiado al portapapeles");
                                        }}
                                        className="w-full py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-primary-600 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <span className="border-b border-slate-200 hover:border-primary-500 pb-0.5">O copiar enlace manual</span>
                                    </button>

                                    <Button
                                        onClick={onClose}
                                        variant="secondary"
                                        className="w-full py-6 bg-slate-100 text-slate-900 rounded-2xl font-black uppercase tracking-widest shadow-sm hover:bg-slate-200"
                                    >
                                        FINALIZAR
                                    </Button>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

