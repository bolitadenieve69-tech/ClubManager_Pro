import React, { useState, useEffect, useMemo } from 'react';
import MobileLayout from '../components/MobileLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import {
    Calendar, Clock, Users, ArrowRight, Loader2, CheckCircle2,
    Star, Sparkles, ChevronRight, MapPin, Info,
    CreditCard, Wallet, Smartphone, Timer, AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format, addDays, parseISO, differenceInSeconds } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { apiFetch } from '../lib/api';

export default function MobileBook() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [fetchingSlots, setFetchingSlots] = useState(false);

    // Selection state
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [duration, setDuration] = useState(90);
    const [courtCount, setCourtCount] = useState(1);
    const [slots, setSlots] = useState<any[]>([]);
    const [selectedSlot, setSelectedSlot] = useState<any>(null);

    // Booking Result (HOLD)
    const [holdBooking, setHoldBooking] = useState<any>(null);
    const [secondsLeft, setSecondsLeft] = useState(600);

    // Payment State
    const [paymentMethod, setPaymentMethod] = useState<'BIZUM' | 'CASH'>('BIZUM');
    const [paymentType, setPaymentType] = useState<'TOTAL' | 'PARTIAL'>('TOTAL');
    const [partialAmount, setPartialAmount] = useState<number>(10); // in Euros

    // Pricing (Calculated locally for immediate feedback, then verified by server)
    const pricePer90Min = 20; // Example
    const totalPrice = useMemo(() => {
        const base = (duration / 90) * pricePer90Min;
        return base * courtCount;
    }, [duration, courtCount]);

    // Load availability when date, duration or courtCount changes
    useEffect(() => {
        const loadAvailability = async () => {
            setFetchingSlots(true);
            try {
                const data = await apiFetch<any>(`/reservations/availability?date=${date}&duration=${duration}&courtCount=${courtCount}`);
                setSlots(data.slots || []);
                setSelectedSlot(null);
            } catch (err) {
                console.error("Error loading availability", err);
            } finally {
                setFetchingSlots(false);
            }
        };
        if (step === 3) loadAvailability();
    }, [date, duration, courtCount, step]);

    // Timer logic for HOLD
    useEffect(() => {
        if (!holdBooking) return;
        const interval = setInterval(() => {
            if (!holdBooking.hold_expires_at) return;
            const diff = differenceInSeconds(new Date(holdBooking.hold_expires_at), new Date());
            setSecondsLeft(diff > 0 ? diff : 0);
            if (diff <= 0) {
                setHoldBooking(null);
                setStep(3);
                alert("La reserva ha expirado. Por favor, selecciona una nueva hora.");
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [holdBooking]);

    const handleCreateHold = async () => {
        if (!selectedSlot) return;
        setLoading(true);
        try {
            const startAt = new Date(`${date}T${selectedSlot.time}:00`);
            const endAt = new Date(startAt.getTime() + duration * 60000);

            const res = await apiFetch<any>('/reservations/hold', {
                method: 'POST',
                body: JSON.stringify({
                    courtIds: selectedSlot.courts,
                    startAt: startAt.toISOString(),
                    endAt: endAt.toISOString(),
                    totalCents: Math.round(totalPrice * 100)
                })
            });
            setHoldBooking(res.booking);
            setStep(4);
        } catch (err: any) {
            alert(err.message || "Error al bloquear la pista");
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmBooking = async () => {
        setLoading(true);
        try {
            if (paymentMethod === 'CASH') {
                await apiFetch('/reservations/confirm', {
                    method: 'POST',
                    body: JSON.stringify({ bookingId: holdBooking.id })
                });
                navigate(`/m/booking/${holdBooking.id}`);
            } else {
                // BIZUM
                const amountToPay = paymentType === 'TOTAL' ? totalPrice : partialAmount;
                const res = await apiFetch<any>('/reservations/payments/bizum/create', {
                    method: 'POST',
                    body: JSON.stringify({
                        bookingId: holdBooking.id,
                        amountCents: Math.round(amountToPay * 100)
                    })
                });
                // In a real app, we redirect to res.redirectUrl
                // For simulation, we show success and redirect to detail
                alert(`Redirigiendo a Bizum (${amountToPay}€)...`);
                navigate(`/m/booking/${holdBooking.id}`);
            }
        } catch (err: any) {
            alert(err.message || "Error al procesar la reserva");
        } finally {
            setLoading(false);
        }
    };

    return (
        <MobileLayout title="Nueva Reserva">
            <div className="space-y-8 pb-12 px-2">
                {/* Progress Tracker */}
                <div className="flex items-center justify-between px-8 relative">
                    <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-100 -translate-y-1/2 -z-10" />
                    {[1, 2, 3, 4, 5].map((s) => (
                        <div key={s} className="relative">
                            <motion.div
                                initial={false}
                                animate={{
                                    scale: step === s ? 1.2 : 1,
                                    backgroundColor: step === s ? '#6366f1' : step > s ? '#0f172a' : '#ffffff',
                                    color: step >= s ? '#ffffff' : '#94a3b8',
                                    borderColor: step >= s ? '#6366f1' : '#f1f5f9'
                                }}
                                className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-[10px] shadow-sm transition-colors border-2"
                            >
                                {step > s ? <CheckCircle2 className="w-4 h-4" /> : s}
                            </motion.div>
                        </div>
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    {/* STEP 1: DATE */}
                    {step === 1 && (
                        <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                            <div className="space-y-2">
                                <h3 className="text-2xl font-black text-slate-900 tracking-tight italic uppercase">Selecciona Día</h3>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Paso 1 de 5</p>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                <div className="flex gap-4 overflow-x-auto pb-4 -mx-6 px-6 no-scrollbar">
                                    {[...Array(14)].map((_, i) => {
                                        const d = addDays(new Date(), i);
                                        const iso = d.toISOString().split('T')[0];
                                        const active = date === iso;
                                        return (
                                            <button
                                                key={iso}
                                                onClick={() => setDate(iso)}
                                                className={cn(
                                                    "flex-shrink-0 w-20 h-28 rounded-[2rem] border-2 flex flex-col items-center justify-center gap-1 transition-all",
                                                    active ? "bg-slate-900 border-slate-900 text-white shadow-xl translate-y-[-4px]" : "bg-white border-slate-100 text-slate-400"
                                                )}
                                            >
                                                <span className="text-[10px] font-black uppercase">{format(d, 'EEE')}</span>
                                                <span className="text-2xl font-black">{format(d, 'dd')}</span>
                                                <span className="text-[10px] font-bold opacity-60">{format(d, 'MMM')}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <Button variant="primary" className="w-full py-6 rounded-[2rem] shadow-lg shadow-indigo-500/20" onClick={() => setStep(2)}>
                                SIGUIENTE <ArrowRight className="ml-2 w-5 h-5" />
                            </Button>
                        </motion.div>
                    )}

                    {/* STEP 2: DURATION & COURTS */}
                    {step === 2 && (
                        <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-10">
                            <div className="space-y-8">
                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <Clock className="w-4 h-4" /> Duración de la reserva
                                    </h4>
                                    <div className="grid grid-cols-3 gap-3">
                                        {[60, 90, 120, 150, 180].map((d) => (
                                            <button
                                                key={d}
                                                onClick={() => setDuration(d)}
                                                className={cn(
                                                    "py-4 rounded-2xl border-2 font-black text-sm transition-all",
                                                    duration === d ? "bg-slate-900 border-slate-900 text-white shadow-md" : "bg-white border-slate-100 text-slate-400"
                                                )}
                                            >
                                                {d} min
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <MapPin className="w-4 h-4" /> Número de pistas
                                    </h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        {[1, 2].map((c) => (
                                            <button
                                                key={c}
                                                onClick={() => setCourtCount(c)}
                                                className={cn(
                                                    "p-6 rounded-3xl border-2 text-left space-y-2 transition-all",
                                                    courtCount === c ? "bg-indigo-600 border-indigo-600 text-white shadow-xl" : "bg-white border-slate-100 text-slate-400"
                                                )}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <Star className={cn("w-5 h-5", courtCount === c ? "text-indigo-200" : "text-slate-200")} />
                                                    <span className="text-lg font-black">{c} {c === 1 ? 'Pista' : 'Pistas'}</span>
                                                </div>
                                                <p className="text-[10px] font-medium opacity-70">
                                                    {c === 1 ? 'Reserva estándar de 1 pista.' : 'Reserva 2 pistas simultáneas.'}
                                                </p>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <Button variant="secondary" className="flex-1 py-6 rounded-3xl" onClick={() => setStep(1)}>ATRÁS</Button>
                                <Button variant="primary" className="flex-[2] py-6 rounded-3xl shadow-lg shadow-indigo-500/20" onClick={() => setStep(3)}>VER HORARIOS</Button>
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 3: TIME SLOTS */}
                    {step === 3 && (
                        <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                            <div className="space-y-2">
                                <h3 className="text-2xl font-black text-slate-900 tracking-tight italic uppercase">Elige Hora</h3>
                                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    <span>{format(new Date(date), 'dd MMM')}</span>
                                    <span className="w-1 h-1 bg-slate-300 rounded-full" />
                                    <span>{duration} min</span>
                                    <span className="w-1 h-1 bg-slate-300 rounded-full" />
                                    <span>{courtCount} pista{courtCount > 1 ? 's' : ''}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                {fetchingSlots ? (
                                    <div className="col-span-3 py-20 flex flex-col items-center gap-4">
                                        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Buscando huecos...</p>
                                    </div>
                                ) : slots.length === 0 ? (
                                    <div className="col-span-3 py-16 text-center space-y-4 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-100">
                                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                                            <AlertCircle className="w-6 h-6 text-slate-300" />
                                        </div>
                                        <p className="text-sm font-bold text-slate-400 italic">No hay disponibilidad para estos filtros.</p>
                                    </div>
                                ) : slots.map((s) => (
                                    <button
                                        key={s.time}
                                        onClick={() => setSelectedSlot(s)}
                                        className={cn(
                                            "py-5 rounded-2xl border-2 font-black transition-all text-sm",
                                            selectedSlot?.time === s.time ? "bg-slate-900 border-slate-900 text-white shadow-xl scale-105" : "bg-white border-slate-100 text-slate-500 hover:border-slate-300"
                                        )}
                                    >
                                        {s.time}
                                    </button>
                                ))}
                            </div>

                            <div className="flex gap-4">
                                <Button variant="secondary" className="flex-1 py-6 rounded-3xl" onClick={() => setStep(2)}>ATRÁS</Button>
                                <Button variant="primary" disabled={!selectedSlot} loading={loading} className="flex-[2] py-6 rounded-3xl shadow-lg shadow-indigo-500/30" onClick={handleCreateHold}>
                                    BLOQUEAR HORA <ArrowRight className="ml-2 w-5 h-5" />
                                </Button>
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 4: SUMMARY & TIMER */}
                    {step === 4 && (
                        <motion.div key="step4" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8">
                            <Card className="p-8 bg-slate-900 text-white border-none shadow-2xl relative overflow-hidden rounded-[3rem]">
                                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-transparent pointer-events-none" />
                                <div className="relative z-10 space-y-8">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                                                <CheckCircle2 className="w-6 h-6" />
                                            </div>
                                            <h3 className="text-xl font-black italic tracking-tighter uppercase font-sans">Resumen Reserva</h3>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <Badge variant="neutral" className="bg-amber-500/10 text-amber-500 border-none flex items-center gap-1.5 py-1.5 px-3">
                                                <Timer className="w-3.5 h-3.5" />
                                                <span className="font-black font-mono">
                                                    {Math.floor(secondsLeft / 60)}:{(secondsLeft % 60).toString().padStart(2, '0')}
                                                </span>
                                            </Badge>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/5">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">DÍA Y HORA</span>
                                            <span className="text-sm font-black">{format(new Date(date), 'dd/MM/yyyy')} — {selectedSlot?.time}H</span>
                                        </div>
                                        <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/5">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">PISTAS</span>
                                            <span className="text-sm font-black italic">{courtCount} pista{courtCount > 1 ? 's' : ''}</span>
                                        </div>
                                        <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/5">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">DURACIÓN</span>
                                            <span className="text-sm font-black">{duration} min</span>
                                        </div>
                                    </div>

                                    <div className="pt-6 border-t border-white/10 flex flex-col items-center gap-1">
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.4em]">Precio Total</span>
                                        <span className="text-6xl font-black text-white tracking-tighter shadow-white/10">{totalPrice}€</span>
                                    </div>
                                </div>
                            </Card>

                            <Button variant="primary" className="w-full py-7 rounded-[2.5rem] bg-indigo-600 shadow-xl shadow-indigo-500/30 font-black tracking-widest uppercase flex items-center justify-center gap-3 transition-transform hover:scale-[1.02]" onClick={() => setStep(5)}>
                                PROCEDER AL PAGO <CreditCard className="w-6 h-6" />
                            </Button>
                        </motion.div>
                    )}

                    {/* STEP 5: PAYMENT SELECTION */}
                    {step === 5 && (
                        <motion.div key="step5" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
                            <div className="space-y-2">
                                <h3 className="text-2xl font-black text-slate-900 tracking-tight italic uppercase">Método de Pago</h3>
                                <div className="flex items-center gap-2">
                                    <Timer className="w-4 h-4 text-amber-500 animate-pulse" />
                                    <span className="text-[10px] font-black text-amber-600 font-mono tracking-widest">
                                        TIEMPO RESTANTE: {Math.floor(secondsLeft / 60)}:{(secondsLeft % 60).toString().padStart(2, '0')}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <section className="space-y-4">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">¿Cómo quieres pagar?</h4>
                                    <div className="grid grid-cols-1 gap-4">
                                        <button
                                            onClick={() => setPaymentMethod('BIZUM')}
                                            className={cn(
                                                "p-6 rounded-[2.5rem] border-2 text-left flex items-center gap-6 transition-all",
                                                paymentMethod === 'BIZUM' ? "bg-slate-900 border-slate-900 text-white shadow-2xl" : "bg-white border-slate-100 opacity-60"
                                            )}
                                        >
                                            <div className={cn("p-4 rounded-2xl", paymentMethod === 'BIZUM' ? "bg-primary-500" : "bg-slate-100")}>
                                                <Smartphone className="w-6 h-6" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-black uppercase text-sm tracking-tight italic">Bizum</p>
                                                <p className="text-[10px] font-medium opacity-60">Pago instantáneo desde tu App.</p>
                                            </div>
                                            {paymentMethod === 'BIZUM' && <CheckCircle2 className="w-6 h-6 text-primary-500" />}
                                        </button>

                                        <button
                                            onClick={() => setPaymentMethod('CASH')}
                                            className={cn(
                                                "p-6 rounded-[2.5rem] border-2 text-left flex items-center gap-6 transition-all",
                                                paymentMethod === 'CASH' ? "bg-slate-900 border-slate-900 text-white shadow-2xl" : "bg-white border-slate-100 opacity-60"
                                            )}
                                        >
                                            <div className={cn("p-4 rounded-2xl", paymentMethod === 'CASH' ? "bg-amber-500" : "bg-slate-100")}>
                                                <Wallet className="w-6 h-6" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-black uppercase text-sm tracking-tight italic">Recepción</p>
                                                <p className="text-[10px] font-medium opacity-60">Paga al llegar al club (Metálico/TPV).</p>
                                            </div>
                                            {paymentMethod === 'CASH' && <CheckCircle2 className="w-6 h-6 text-amber-500" />}
                                        </button>
                                    </div>
                                </section>

                                {paymentMethod === 'BIZUM' && (
                                    <motion.section initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4">
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest underline decoration-indigo-500/30 underline-offset-4">Opciones de Bizum</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <button
                                                onClick={() => setPaymentType('TOTAL')}
                                                className={cn(
                                                    "p-5 rounded-3xl border-2 transition-all flex flex-col items-center gap-2",
                                                    paymentType === 'TOTAL' ? "bg-indigo-50 border-indigo-500 text-indigo-700 shadow-md" : "bg-white border-slate-100 text-slate-400"
                                                )}
                                            >
                                                <span className="text-xl font-black">{totalPrice}€</span>
                                                <span className="text-[9px] font-black uppercase tracking-widest">Pago Total</span>
                                            </button>
                                            <button
                                                onClick={() => setPaymentType('PARTIAL')}
                                                className={cn(
                                                    "p-5 rounded-3xl border-2 transition-all flex flex-col items-center gap-2",
                                                    paymentType === 'PARTIAL' ? "bg-indigo-50 border-indigo-500 text-indigo-700 shadow-md" : "bg-white border-slate-100 text-slate-400"
                                                )}
                                            >
                                                <span className="text-xl font-black">{partialAmount}€</span>
                                                <span className="text-[9px] font-black uppercase tracking-widest">Pago Parcial</span>
                                            </button>
                                        </div>
                                        {paymentType === 'PARTIAL' && (
                                            <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 flex items-center justify-between">
                                                <span className="text-[10px] font-bold text-indigo-900 uppercase">Importe Señal</span>
                                                <input
                                                    type="number"
                                                    value={partialAmount}
                                                    aria-label="Importe de la señal"
                                                    onChange={(e) => setPartialAmount(Number(e.target.value))}
                                                    className="bg-white border-none rounded-lg p-2 w-20 text-right font-black text-indigo-600 focus:ring-2 focus:ring-indigo-500 outline-none"
                                                />
                                            </div>
                                        )}
                                    </motion.section>
                                )}
                            </div>

                            <div className="flex gap-4">
                                <Button variant="secondary" className="flex-1 py-6 rounded-3xl" onClick={() => setStep(4)}>MÁS TIEMPO</Button>
                                <Button variant="primary" loading={loading} className="flex-[2] py-6 rounded-3xl bg-indigo-600 shadow-xl shadow-indigo-600/30 font-black tracking-widest uppercase flex items-center justify-center gap-2" onClick={handleConfirmBooking}>
                                    {paymentMethod === 'CASH' ? 'CONFIRMAR RESERVA' : 'PAGAR CON BIZUM'} <ChevronRight className="w-5 h-5" />
                                </Button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Info Card */}
                {step < 5 && (
                    <Card className="p-6 bg-indigo-50 border-none rounded-[2rem] flex gap-4 items-start shadow-sm mx-4">
                        <div className="p-2 bg-indigo-500 rounded-xl text-white shadow-lg shadow-indigo-500/20">
                            <Info className="w-4 h-4" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs font-black text-indigo-900 uppercase tracking-tight italic">Políticas de tu club</p>
                            <p className="text-[10px] text-indigo-700/70 font-medium leading-relaxed">
                                Las reservas deben cancelarse con 24h de antelación para el reembolso. Pago 100% seguro garantizado.
                            </p>
                        </div>
                    </Card>
                )}
            </div>
        </MobileLayout>
    );
}
