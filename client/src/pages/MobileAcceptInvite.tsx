import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { CheckCircle2, Loader2, XCircle, Sparkles, ShieldCheck, ArrowRight, UserCheck, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from "../lib/api";

export default function MobileAcceptInvite() {
    const { token } = useParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState<'LOADING' | 'READY' | 'SUCCESS' | 'ERROR'>('LOADING');
    const [message, setMessage] = useState('');
    const [invitationData, setInvitationData] = useState<any>(null);

    useEffect(() => {
        const validateInvite = async () => {
            try {
                // Initial check without consuming
                const data = await apiFetch<any>(`/members/invitations/${token}`);
                setInvitationData(data);
                setStatus('READY');
            } catch (err: any) {
                setStatus('ERROR');
                setMessage(err.message || 'El enlace de invitación no es válido o ha expirado.');
            }
        };
        if (token) validateInvite();
    }, [token]);

    const handleAccept = async () => {
        setStatus('LOADING');
        try {
            const data = await apiFetch<any>('/members/invitations/accept', {
                method: 'POST',
                body: JSON.stringify({ token })
            });

            setStatus('SUCCESS');
            setMessage(data.message);
            if (data.token) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
            }
        } catch (err: any) {
            setStatus('ERROR');
            setMessage(err.message || 'No se pudo procesar la invitación.');
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8 max-w-md mx-auto relative overflow-hidden font-sans">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 rounded-full blur-3xl -mr-32 -mt-32" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -ml-32 -mb-32" />

            <AnimatePresence mode="wait">
                <motion.div
                    key={status}
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 1.1, y: -20 }}
                    transition={{ type: "spring", damping: 20, stiffness: 100 }}
                    className="w-full relative z-10"
                >
                    <Card className="w-full p-10 flex flex-col items-center text-center gap-8 border-none shadow-2xl bg-white/95 backdrop-blur-xl rounded-[3rem]">
                        {status === 'LOADING' && (
                            <div className="space-y-8 py-4">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-primary-500/20 blur-2xl rounded-full scale-150 animate-pulse" />
                                    <Loader2 className="w-20 h-20 text-primary-600 animate-spin relative z-10" />
                                </div>
                                <div className="space-y-4">
                                    <Badge variant="neutral" className="bg-primary-50 text-primary-600 border-primary-100 uppercase tracking-widest">Protocolo Seguro</Badge>
                                    <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">
                                        Validando<br />Invitación
                                    </h2>
                                    <p className="text-xs font-bold text-slate-400">Verificando credenciales del club...</p>
                                </div>
                            </div>
                        )}

                        {status === 'READY' && (
                            <div className="space-y-8">
                                <div className="relative">
                                    <div className="w-24 h-24 bg-indigo-500 rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-indigo-500/30">
                                        <UserCheck className="w-12 h-12" />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <Badge variant="neutral" className="bg-indigo-50 text-indigo-600 border-indigo-100 uppercase tracking-widest">Invitación Válida</Badge>
                                    <h2 className="text-4xl font-black text-slate-900 tracking-tighter italic uppercase leading-none">
                                        ¡Únete al<br />Club!
                                    </h2>
                                    <p className="text-sm font-medium text-slate-500 leading-relaxed">
                                        Hola <strong className="text-slate-900">{invitationData?.member?.full_name}</strong>, has sido invitado a unirte a la app de gestión de tu club.
                                    </p>
                                </div>
                                <Button
                                    variant="primary"
                                    className="w-full py-7 rounded-[2rem] bg-indigo-600 text-white shadow-xl shadow-indigo-600/30 hover:bg-black group"
                                    onClick={handleAccept}
                                >
                                    <span className="flex items-center justify-center gap-3 font-black tracking-widest uppercase">
                                        ACEPTAR INVITACIÓN <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </span>
                                </Button>
                            </div>
                        )}

                        {status === 'SUCCESS' && (
                            <div className="space-y-8">
                                <div className="relative">
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="w-24 h-24 bg-emerald-500 rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-emerald-500/50"
                                    >
                                        <CheckCircle2 className="w-12 h-12" />
                                    </motion.div>
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                                        className="absolute -top-4 -right-4 text-emerald-300"
                                    >
                                        <Sparkles className="w-8 h-8" />
                                    </motion.div>
                                </div>

                                <div className="space-y-4">
                                    <h2 className="text-4xl font-black text-slate-900 tracking-tighter italic uppercase leading-none">
                                        ¡Bienvenido!
                                    </h2>
                                    <p className="text-sm font-medium text-slate-500 leading-relaxed px-4">
                                        {message || "Tu perfil ha sido configurado con éxito. Ya eres miembro oficial en la App."}
                                    </p>
                                </div>

                                <Button
                                    variant="primary"
                                    className="w-full py-7 rounded-[2rem] bg-slate-900 text-white shadow-xl shadow-slate-900/40 hover:bg-black group"
                                    onClick={() => navigate('/m/book')}
                                >
                                    <span className="flex items-center justify-center gap-3 font-black tracking-widest uppercase">
                                        COMENZAR A RESERVAR <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </span>
                                </Button>
                            </div>
                        )}

                        {status === 'ERROR' && (
                            <div className="space-y-8 py-4">
                                <div className="w-20 h-20 bg-rose-500/10 rounded-[2rem] flex items-center justify-center text-rose-600 shadow-inner">
                                    <AlertCircle className="w-10 h-10" />
                                </div>
                                <div className="space-y-4">
                                    <h2 className="text-3xl font-black text-slate-900 tracking-tighter italic uppercase leading-none">Acceso<br />Denegado</h2>
                                    <p className="text-sm font-bold text-rose-500 leading-relaxed px-6">
                                        {message}
                                    </p>
                                </div>
                                <Button
                                    variant="secondary"
                                    className="w-full py-6 rounded-[2rem] border-2 border-slate-100 font-black tracking-widest uppercase text-slate-600"
                                    onClick={() => navigate('/login')}
                                >
                                    IR AL LOGIN
                                </Button>
                            </div>
                        )}
                    </Card>
                </motion.div>
            </AnimatePresence>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="mt-12 flex items-center gap-3"
            >
                <div className="h-px w-8 bg-slate-200" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-primary-500" />
                    ClubManager <span className="text-slate-900">PRO</span>
                </p>
                <div className="h-px w-8 bg-slate-200" />
            </motion.div>
        </div>
    );
}
