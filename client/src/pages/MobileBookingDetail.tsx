import { useParams, useNavigate } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import MobileLayout from '../components/MobileLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Share2, Clock, MessageCircle, Info, Copy, Wallet, ChevronRight, Check, Loader2, Users, MapPin, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { apiFetch } from '../lib/api';
import { format } from 'date-fns';

export default function MobileBookingDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [booking, setBooking] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [timeLeft, setTimeLeft] = useState<string>('');
    const [justNotified, setJustNotified] = useState(false);
    const [joining, setJoining] = useState(false);

    const fetchBooking = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const data = await apiFetch<any>(`/bookings/${id}`);
            setBooking(data.booking);
        } catch (err) {
            console.error("Error fetching booking:", err);
        } finally {
            if (!silent) setLoading(false);
        }
    };

    useEffect(() => {
        const init = async () => {
            await fetchBooking();
        };
        init();
    }, [id]);

    useEffect(() => {
        const attemptJoin = async () => {
            const userStr = localStorage.getItem('user');
            if (!userStr || !booking || booking.strategy !== 'SPLIT') return;
            const user = JSON.parse(userStr);

            // If user is owner, no need to join
            if (booking.user_id === user.id) return;

            // Check if user already has a share
            const hasShare = booking.shares?.some((s: any) => s.user_id === user.id);
            if (hasShare) return;

            // Attempt to join
            setJoining(true);
            try {
                await apiFetch(`/reservations/${id}/join`, { method: 'POST' });
                // Re-fetch booking to show the updated shares
                await fetchBooking(true);
            } catch (err) {
                console.error("Error joining booking:", err);
            } finally {
                setJoining(false);
            }
        };

        if (booking && !joining) {
            attemptJoin();
        }
    }, [booking?.id, joining]);

    // Polling for status confirmation
    useEffect(() => {
        if (!booking || booking.status !== 'PENDING_PAYMENT') return;

        const interval = setInterval(() => {
            fetchBooking(true);
        }, 10000); // Poll every 10 seconds

        return () => clearInterval(interval);
    }, [booking?.status]);

    useEffect(() => {
        if (!booking || booking.status !== 'PENDING_PAYMENT') return;

        const timer = setInterval(() => {
            const now = new Date().getTime();
            const expiry = new Date(booking.expires_at).getTime();
            const diff = expiry - now;

            if (diff <= 0) {
                setTimeLeft('EXPIRADO');
                clearInterval(timer);
            } else {
                const totalMinutes = Math.floor(diff / (1000 * 60));
                const seconds = Math.floor((diff % (1000 * 60)) / 1000);
                setTimeLeft(`${totalMinutes}:${seconds.toString().padStart(2, '0')}`);
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [booking]);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        // Simple visual feedback instead of alert if possible, but alert works for now
    };

    if (loading) {
        return (
            <MobileLayout title="Detalle">
                <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                    <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
                    <p className="text-slate-400 font-black text-xs uppercase tracking-widest">Obteniendo detalles...</p>
                </div>
            </MobileLayout>
        );
    }

    if (!booking) {
        return (
            <MobileLayout title="Error">
                <div className="p-8 text-center space-y-4">
                    <h2 className="text-xl font-black text-slate-900">Reserva no encontrada</h2>
                    <p className="text-slate-500">No pudimos encontrar la información de esta reserva.</p>
                </div>
            </MobileLayout>
        );
    }

    const bizumCode = `B-${booking.id.slice(0, 8)}`;
    const myShare = booking.shares?.find((s: any) => s.user_id === JSON.parse(localStorage.getItem('user') || '{}').id) || booking.shares?.[0];
    const amountToPayInCents = myShare ? myShare.amount : booking.total_cents;
    const amountToPay = `${(amountToPayInCents / 100).toFixed(2)}€`;
    const bizumNumber = booking.club?.bizum_payee || '+34 600 000 000';

    const handleWhatsApp = () => {
        setJustNotified(true);
        const phone = (booking.club?.bizum_payee || bizumNumber).replace(/\D/g, '');
        const msg = `Hola! Acabo de hacer un Bizum de ${amountToPay} para la reserva ${bizumCode}.`;
        const url = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;

        window.open(url, '_blank');
        setTimeout(() => fetchBooking(true), 5000);
    };

    const handleInvite = () => {
        const inviteLink = `${window.location.origin}/m/booking/${booking.id}`;
        const msg = `¡Hola! Te invito a unirte a mi reserva en ${booking.court?.name}. Puedes pagar tu parte aquí: ${inviteLink}`;
        const url = `https://wa.me/?text=${encodeURIComponent(msg)}`;
        window.open(url, '_blank');
    };

    return (
        <MobileLayout title={booking.status === 'CONFIRMED' ? '¡Éxito!' : 'Gestión de Pago'}>
            <div className="space-y-10 pb-16">
                {/* Status Hero Card */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                >
                    <Card className={cn(
                        "p-12 flex flex-col items-center text-center gap-8 border-none rounded-[4rem] relative overflow-hidden transition-all duration-700",
                        booking.status === 'CONFIRMED'
                            ? "bg-emerald-500 shadow-[0_20px_50px_rgba(16,185,129,0.3)] text-white"
                            : "bg-amber-500/10 shadow-amber-500/10"
                    )}>
                        {booking.status === 'CONFIRMED' && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.2),transparent)]"
                            />
                        )}

                        <div className={cn(
                            "w-24 h-24 rounded-[2.5rem] flex items-center justify-center shadow-2xl relative z-10 transition-all duration-700",
                            booking.status === 'CONFIRMED'
                                ? "bg-white text-emerald-500 scale-110"
                                : "bg-amber-500 text-white shadow-amber-500/50 animate-pulse"
                        )}>
                            {booking.status === 'CONFIRMED' ? <Check className="w-12 h-12 stroke-[4px]" /> : <Clock className="w-12 h-12" />}
                        </div>

                        <div className="relative z-10 space-y-4">
                            <Badge className={cn(
                                "px-6 py-2 rounded-full font-black uppercase tracking-[0.2em] text-[10px] border-none",
                                booking.status === 'CONFIRMED' ? "bg-emerald-400/20 text-white" : "bg-amber-500/20 text-amber-600"
                            )}>
                                {booking.status === 'CONFIRMED' ? 'RESERVA CONFIRMADA' : 'ESPERANDO PAGO BIZUM'}
                            </Badge>

                            {booking.status === 'CONFIRMED' ? (
                                <motion.div
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.2 }}
                                    className="space-y-4"
                                >
                                    <h2 className="text-4xl font-black tracking-tighter uppercase leading-none italic">
                                        ¡Todo Listo!
                                    </h2>
                                    <p className="text-emerald-100 text-sm font-bold max-w-[200px] mx-auto leading-tight">
                                        Tu reserva en <span className="text-white underline decoration-2">{booking.court?.name}</span> ya es oficial. ¡Nos vemos en el club!
                                    </p>
                                </motion.div>
                            ) : (
                                <div className="mt-4">
                                    <span className="text-6xl font-black text-slate-900 font-mono tracking-tighter">
                                        {timeLeft || '--:--'}
                                    </span>
                                    <p className="text-[10px] font-black text-slate-400 tracking-widest mt-2 uppercase">tiempo restante de reserva</p>
                                </div>
                            )}
                        </div>
                    </Card>
                </motion.div>

                {/* Just Notified Feedback */}
                <AnimatePresence>
                    {justNotified && booking.status !== 'CONFIRMED' && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="bg-primary-50 border border-primary-100 p-6 rounded-[2.5rem] flex items-start gap-4"
                        >
                            <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-white shrink-0">
                                <Check className="w-5 h-5" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-black text-primary-900 uppercase tracking-tighter">Comprobante enviado</p>
                                <p className="text-[10px] font-bold text-primary-600 leading-tight">Estamos revisando tu pago. Esta pantalla se actualizará automáticamente en cuanto esté confirmado.</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Booking Info Card (Always show summary) */}
                <section className="space-y-4">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] px-2">Detalles de la Reserva</h3>
                    <Card className="p-6 border-slate-100 bg-white rounded-3xl space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center">
                                    <MapPin className="w-5 h-5 text-slate-400" />
                                </div>
                                <span className="font-black text-slate-900 uppercase text-xs tracking-tighter">{booking.court?.name}</span>
                            </div>
                            <div className="text-right">
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Pista</p>
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center">
                                    <Calendar className="w-5 h-5 text-slate-400" />
                                </div>
                                <span className="font-black text-slate-900 uppercase text-xs tracking-tighter">{format(new Date(booking.start_at), 'dd MMM, HH:mm')}</span>
                            </div>
                            <div className="text-right">
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Horario</p>
                            </div>
                        </div>
                    </Card>
                </section>

                {/* Split Payment Progress (if applicable) */}
                {booking.strategy === 'SPLIT' && (
                    <section className="space-y-4">
                        <div className="flex items-center justify-between px-2">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">Estado de Pagos (4)</h3>
                            <Badge variant="neutral" className="bg-slate-100 text-[8px] font-black text-slate-600">5.00€ POR PERSONA</Badge>
                        </div>
                        <div className="grid grid-cols-4 gap-3">
                            {booking.shares.map((share: any, idx: number) => (
                                <div key={share.id} className="flex flex-col items-center gap-2">
                                    <div className={cn(
                                        "w-full aspect-square rounded-2xl flex items-center justify-center border-2 transition-all duration-500",
                                        share.status === 'PAID'
                                            ? "bg-emerald-500 border-emerald-500 text-white shadow-lg"
                                            : "bg-white border-slate-100 text-slate-300"
                                    )}>
                                        {share.status === 'PAID' ? <Check className="w-6 h-6 stroke-[3px]" /> : <Users className="w-5 h-5" />}
                                    </div>
                                    <span className={cn(
                                        "text-[8px] font-black uppercase tracking-tighter transition-colors",
                                        share.status === 'PAID' ? "text-emerald-600" : "text-slate-400"
                                    )}>
                                        {idx === 0 ? 'TÚ' : `P${idx + 1}`}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {booking.status === 'PENDING_PAYMENT' && (
                            <Button
                                variant="secondary"
                                onClick={handleInvite}
                                className="w-full py-6 mt-4 border-2 border-primary-100 text-primary-600 rounded-2xl flex items-center justify-center gap-2 font-black uppercase tracking-widest text-[10px] hover:bg-primary-50 transition-all shadow-sm"
                            >
                                <Share2 className="w-4 h-4" />
                                INVITAR AMIGOS A PAGAR
                            </Button>
                        )}
                    </section>
                )}

                {/* Bizum Execution Steps */}
                {booking.status !== 'CONFIRMED' && (
                    <section className="space-y-6">
                        <div className="flex items-center gap-3 px-2">
                            <Wallet className="w-4 h-4 text-primary-500" />
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">Pasos para confirmar</h3>
                        </div>

                        <div className="space-y-4">
                            <Card className="p-8 border-none bg-white shadow-premium rounded-[2.5rem] group overflow-hidden">
                                <div className="space-y-6 relative z-10">
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">1. Bizum al número</p>
                                        <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                            <p className="text-2xl font-black text-slate-900 tracking-tighter">{bizumNumber}</p>
                                            <button
                                                onClick={() => copyToClipboard(bizumNumber)}
                                                className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-slate-400 hover:text-primary-500 active:scale-95 transition-all"
                                                title="Copiar número Bizum"
                                            >
                                                <Copy className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">2. Concepto obligatorio</p>
                                        <div className="bg-slate-900 px-6 py-5 rounded-3xl flex items-center justify-between shadow-xl shadow-slate-900/20">
                                            <span className="text-3xl font-black text-primary-500 font-mono tracking-tighter">{bizumCode}</span>
                                            <button
                                                onClick={() => copyToClipboard(bizumCode)}
                                                className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/20 hover:text-white/60 active:scale-95 transition-all"
                                                title="Copiar código de reserva"
                                            >
                                                <Copy className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            <Button
                                variant="primary"
                                className="w-full py-8 bg-emerald-600 hover:bg-emerald-700 shadow-[0_20px_40px_rgba(5,150,105,0.3)] rounded-[2.5rem] group overflow-hidden relative"
                                onClick={handleWhatsApp}
                            >
                                <motion.div
                                    whileTap={{ scale: 0.95 }}
                                    className="flex flex-col items-center relative z-10"
                                >
                                    <div className="flex items-center gap-3">
                                        <MessageCircle className="w-6 h-6" />
                                        <span className="font-black tracking-[0.1em] uppercase text-lg">PAGADO {amountToPay}</span>
                                    </div>
                                    <span className="text-[9px] font-bold opacity-70 mt-1 uppercase tracking-widest">Notificar al club por WhatsApp</span>
                                </motion.div>
                                <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            </Button>
                        </div>
                    </section>
                )}

                {/* Action for confirmed bookings */}
                {booking.status === 'CONFIRMED' && (
                    <Button
                        variant="secondary"
                        className="w-full py-6 rounded-[2rem] bg-slate-100 text-slate-600 font-black uppercase tracking-widest text-xs"
                        onClick={() => navigate('/m')}
                    >
                        Volver al Inicio
                    </Button>
                )}
            </div>
        </MobileLayout>
    );
}

