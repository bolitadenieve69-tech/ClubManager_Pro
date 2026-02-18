import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UserPlus, CheckCircle, Smartphone } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';

interface InvitationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function InvitationModal({ isOpen, onClose, onSuccess }: InvitationModalProps) {
    const [fullName, setFullName] = useState('');
    const [whatsappPhone, setWhatsappPhone] = useState('');
    const [loading, setLoading] = useState(false);
    const [successData, setSuccessData] = useState<any>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:3000/members/invitations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ fullName, whatsappPhone })
            });
            const data = await res.json();
            setSuccessData(data);
            onSuccess();
        } catch (err) {
            console.error("Error creating invitation:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleShareWhatsApp = () => {
        if (!successData) return;
        const inviteLink = `${window.location.origin}${successData.inviteUrl}`;
        const msg = `¡Hola ${fullName}! Te invito a unirte a ClubManager Pro. Puedes acceder aquí para configurar tu cuenta: ${inviteLink}`;
        window.open(`https://wa.me/${whatsappPhone.replace(/\+/g, '').replace(/\s+/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
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
                                    <h3 className="text-lg font-black text-slate-900 tracking-tight">Nueva Invitación</h3>
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
                                    GENERAR LINK DE ACCESO
                                </Button>
                            </form>
                        ) : (
                            <div className="p-8 space-y-8 text-center">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto rotate-3"
                                >
                                    <CheckCircle className="w-10 h-10" />
                                </motion.div>
                                <div>
                                    <h4 className="text-xl font-black text-slate-900 tracking-tight">¡Invitación Creada!</h4>
                                    <p className="text-slate-500 text-sm font-medium mt-2 leading-relaxed px-4">
                                        El enlace de acceso para <strong>{fullName}</strong> ha sido generado correctamente.
                                    </p>
                                </div>
                                <div className="space-y-3">
                                    <Button onClick={handleShareWhatsApp} variant="primary" className="w-full py-6 bg-emerald-600 hover:bg-emerald-700 shadow-xl shadow-emerald-900/20 text-white rounded-2xl">
                                        ENVIAR POR WHATSAPP
                                    </Button>
                                    <button
                                        onClick={onClose}
                                        className="w-full py-4 text-xs font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors"
                                    >
                                        TERMINAR
                                    </button>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
