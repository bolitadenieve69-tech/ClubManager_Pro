import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { CheckCircle2, Loader2, XCircle, Sparkles, ShieldCheck, ArrowRight, UserCheck, AlertCircle, Eye, EyeOff, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch, ApiError } from "../lib/api";

export default function MobileAcceptInvite() {
    const { token } = useParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState<'LOADING' | 'READY' | 'SETUP' | 'SUCCESS' | 'ERROR' | 'ALREADY_USED'>('LOADING');
    const [message, setMessage] = useState('');
    const [invitationData, setInvitationData] = useState<any>(null);
    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [passwordError, setPasswordError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const validateInvite = async () => {
            try {
                const data = await apiFetch<any>(`/members/invitations/${token}`);
                setInvitationData(data);
                setStatus('READY');
            } catch (err: any) {
                if (err instanceof ApiError && err.code === 'ALREADY_USED') {
                    setStatus('ALREADY_USED');
                } else {
                    setStatus('ERROR');
                    setMessage(err.message || 'El enlace de invitación no es válido o ha expirado.');
                }
            }
        };
        if (token) validateInvite();
    }, [token]);

    const handleAccept = async () => {
        setPasswordError('');
        if (password.length < 4) {
            setPasswordError('La contraseña debe tener al menos 4 caracteres.');
            return;
        }
        if (password !== passwordConfirm) {
            setPasswordError('Las contraseñas no coinciden.');
            return;
        }

        setSubmitting(true);
        try {
            const data = await apiFetch<any>('/members/invitations/accept', {
                method: 'POST',
                body: JSON.stringify({ token, password })
            });

            if (data.token) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
            }
            setStatus('SUCCESS');
            setMessage(data.message);
        } catch (err: any) {
            setStatus('ERROR');
            setMessage(err.message || 'No se pudo procesar la invitación.');
        } finally {
            setSubmitting(false);
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
                                <div className="w-24 h-24 bg-indigo-500 rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-indigo-500/30">
                                    <UserCheck className="w-12 h-12" />
                                </div>
                                <div className="space-y-4">
                                    <Badge variant="neutral" className="bg-indigo-50 text-indigo-600 border-indigo-100 uppercase tracking-widest">Invitación Válida</Badge>
                                    <h2 className="text-4xl font-black text-slate-900 tracking-tighter italic uppercase leading-none">
                                        ¡Únete al<br />Club!
                                    </h2>
                                    <p className="text-sm font-medium text-slate-500 leading-relaxed">
                                        Hola <strong className="text-slate-900">{invitationData?.member?.full_name}</strong>, has sido invitado a unirte a la app de tu club.
                                    </p>
                                </div>
                                <Button
                                    variant="primary"
                                    className="w-full py-7 rounded-[2rem] bg-indigo-600 text-white shadow-xl shadow-indigo-600/30 hover:bg-black group"
                                    onClick={() => setStatus('SETUP')}
                                >
                                    <span className="flex items-center justify-center gap-3 font-black tracking-widest uppercase">
                                        CONTINUAR <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </span>
                                </Button>
                            </div>
                        )}

                        {status === 'SETUP' && (
                            <div className="w-full space-y-8">
                                <div className="w-20 h-20 bg-slate-900 rounded-[2rem] flex items-center justify-center text-white shadow-2xl mx-auto">
                                    <Lock className="w-10 h-10" />
                                </div>
                                <div className="space-y-2">
                                    <h2 className="text-3xl font-black text-slate-900 tracking-tighter italic uppercase leading-none">
                                        Crea tu<br />Contraseña
                                    </h2>
                                    <p className="text-xs font-medium text-slate-400">
                                        La usarás para entrar la próxima vez.
                                    </p>
                                </div>

                                <div className="space-y-4 text-left w-full">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Contraseña</label>
                                        <div className="relative">
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                value={password}
                                                onChange={e => setPassword(e.target.value)}
                                                placeholder="Mínimo 4 caracteres"
                                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-4 text-sm focus:border-indigo-400 focus:bg-white outline-none transition-all pr-12"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(v => !v)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                                            >
                                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Confirmar Contraseña</label>
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={passwordConfirm}
                                            onChange={e => setPasswordConfirm(e.target.value)}
                                            placeholder="Repite la contraseña"
                                            onKeyDown={e => e.key === 'Enter' && handleAccept()}
                                            className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-4 text-sm focus:border-indigo-400 focus:bg-white outline-none transition-all"
                                        />
                                    </div>
                                    {passwordError && (
                                        <p className="text-xs font-bold text-rose-500 flex items-center gap-1.5 pl-1">
                                            <XCircle className="w-3.5 h-3.5" /> {passwordError}
                                        </p>
                                    )}
                                </div>

                                <Button
                                    variant="primary"
                                    className="w-full py-7 rounded-[2rem] bg-slate-900 text-white shadow-xl hover:bg-black group"
                                    onClick={handleAccept}
                                    loading={submitting}
                                >
                                    <span className="flex items-center justify-center gap-3 font-black tracking-widest uppercase">
                                        ACTIVAR MI CUENTA <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
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
                                        {message || "Tu cuenta está activa. Ya puedes reservar pistas desde tu móvil."}
                                    </p>
                                </div>
                                <Button
                                    variant="primary"
                                    className="w-full py-7 rounded-[2rem] bg-slate-900 text-white shadow-xl shadow-slate-900/40 hover:bg-black group"
                                    onClick={() => navigate('/m')}
                                >
                                    <span className="flex items-center justify-center gap-3 font-black tracking-widest uppercase">
                                        COMENZAR A RESERVAR <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </span>
                                </Button>
                            </div>
                        )}

                        {status === 'ALREADY_USED' && (
                            <div className="space-y-8 py-4">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="w-20 h-20 bg-blue-50 rounded-[2rem] flex items-center justify-center text-blue-600 shadow-inner mx-auto"
                                >
                                    <UserCheck className="w-10 h-10" />
                                </motion.div>
                                <div className="space-y-3">
                                    <h2 className="text-3xl font-black text-slate-900 tracking-tighter italic uppercase leading-none">Cuenta<br />Activa</h2>
                                    <p className="text-sm font-medium text-slate-500 leading-relaxed">
                                        Tu cuenta ya está creada. Entra con tu <strong>teléfono y contraseña</strong> para reservar.
                                    </p>
                                </div>
                                <Button
                                    variant="primary"
                                    className="w-full py-7 rounded-[2rem] bg-blue-600 text-white shadow-xl shadow-blue-600/20 hover:bg-blue-700 group"
                                    onClick={() => navigate('/login?mode=member')}
                                >
                                    <span className="flex items-center justify-center gap-3 font-black tracking-widest uppercase">
                                        ENTRAR A MI APP <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
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
                                    <h2 className="text-3xl font-black text-slate-900 tracking-tighter italic uppercase leading-none">Enlace<br />Expirado</h2>
                                    <p className="text-sm font-bold text-rose-500 leading-relaxed px-6">
                                        {message}
                                    </p>
                                </div>
                                <Button
                                    variant="secondary"
                                    className="w-full py-6 rounded-[2rem] border-2 border-slate-100 font-black tracking-widest uppercase text-slate-600"
                                    onClick={() => navigate('/login?mode=member')}
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
                    PadelClub <span className="text-slate-900">2026</span>
                </p>
                <div className="h-px w-8 bg-slate-200" />
            </motion.div>
        </div>
    );
}
