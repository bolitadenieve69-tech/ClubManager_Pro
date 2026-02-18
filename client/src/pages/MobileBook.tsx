import React, { useState, useEffect } from 'react';
import MobileLayout from '../components/MobileLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Calendar, Clock, Users, ArrowRight, Loader2, CheckCircle2, Star, Sparkles, ChevronRight, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format, addDays, parseISO } from 'date-fns';
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
    const [courts, setCourts] = useState<any[]>([]);
    const [selectedCourtId, setSelectedCourtId] = useState<string>('');
    const [slots, setSlots] = useState<any[]>([]);
    const [selectedSlot, setSelectedSlot] = useState<any>(null);
    const [strategy, setStrategy] = useState<'SPLIT' | 'SINGLE'>('SPLIT');

    // Load initial data
    useEffect(() => {
        const loadCourts = async () => {
            try {
                const data = await apiFetch<any>('/courts');
                setCourts(data.courts || []);
                if (data.courts?.length > 0) {
                    setSelectedCourtId(data.courts[0].id);
                }
            } catch (err) {
                console.error("Error loading courts", err);
            }
        };
        loadCourts();
    }, []);

    // Load availability when date or court changes
    useEffect(() => {
        if (!selectedCourtId) return;

        const loadAvailability = async () => {
            setFetchingSlots(true);
            try {
                const userStr = localStorage.getItem('user');
                const user = userStr ? JSON.parse(userStr) : null;
                const clubId = user?.club_id;

                if (!clubId) return;

                const data = await apiFetch<any>(`/occupancy/availability?clubId=${clubId}&date=${date}&courtId=${selectedCourtId}`);
                setSlots(data.slots || []);
                setSelectedSlot(null);
            } catch (err) {
                console.error("Error loading availability", err);
            } finally {
                setFetchingSlots(false);
            }
        };
        loadAvailability();
    }, [date, selectedCourtId]);

    const handleBook = async () => {
        if (!selectedSlot || !selectedCourtId) return;

        setLoading(true);
        try {
            const userStr = localStorage.getItem('user');
            const user = userStr ? JSON.parse(userStr) : null;

            const res = await apiFetch<any>('/reservations', {
                method: 'POST',
                body: JSON.stringify({
                    court_id: selectedCourtId,
                    user_id: user?.id,
                    start_time: selectedSlot.start,
                    end_time: selectedSlot.end,
                    strategy: strategy
                })
            });

            navigate(`/m/booking/${res.reservation.id}`);
        } catch (err: any) {
            alert(err.message || "Error al crear la reserva");
        } finally {
            setLoading(false);
        }
    };

    return (
        <MobileLayout title="Reservar">
            <div className="space-y-10 pb-12">
                {/* Visual Progress Steps */}
                <div className="flex items-center justify-between px-6 relative">
                    <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-100 -translate-y-1/2 -z-10" />
                    {[1, 2, 3].map((s) => (
                        <div key={s} className="relative">
                            <motion.div
                                initial={false}
                                animate={{
                                    scale: step === s ? 1.2 : 1,
                                    backgroundColor: step >= s ? '#0f172a' : '#f1f5f9',
                                    color: step >= s ? '#ffffff' : '#94a3b8'
                                }}
                                className="w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xs shadow-lg transition-colors border-4 border-white"
                            >
                                {step > s ? <CheckCircle2 className="w-5 h-5" /> : s}
                            </motion.div>
                            {step === s && (
                                <motion.div
                                    layoutId="step-glow"
                                    className="absolute inset-0 bg-primary-500/20 blur-xl rounded-full -z-20"
                                />
                            )}
                        </div>
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-8"
                        >
                            <section className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-primary-500" /> Día de juego
                                    </h3>
                                    <Badge variant="neutral" className="bg-slate-50 border-slate-100 text-[8px]">{format(new Date(date), 'MMMM yyyy')}</Badge>
                                </div>
                                <div className="flex gap-4 overflow-x-auto pb-4 -mx-6 px-6 no-scrollbar">
                                    {[...Array(30)].map((_, offset) => {
                                        const d = addDays(new Date(), offset);
                                        const iso = d.toISOString().split('T')[0];
                                        const active = date === iso;
                                        return (
                                            <button
                                                key={iso}
                                                onClick={() => setDate(iso)}
                                                className={cn(
                                                    "flex-shrink-0 w-20 h-28 rounded-[2rem] border-2 flex flex-col items-center justify-center gap-2 transition-all duration-300",
                                                    active
                                                        ? "bg-slate-900 border-slate-900 text-white shadow-2xl translate-y-[-4px]"
                                                        : "bg-white border-slate-100 text-slate-400 hover:border-primary-100"
                                                )}
                                            >
                                                <span className="text-[10px] font-black uppercase tracking-widest">{format(d, 'EEE')}</span>
                                                <span className="text-2xl font-black">{format(d, 'dd')}</span>
                                                {active && <div className="w-1.5 h-1.5 rounded-full bg-primary-500" />}
                                            </button>
                                        );
                                    })}
                                </div>
                            </section>

                            <section className="space-y-6">
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-primary-500" /> Pista
                                </h3>
                                <div className="flex gap-4 overflow-x-auto pb-4 -mx-6 px-6 no-scrollbar">
                                    {courts.map((court) => (
                                        <button
                                            key={court.id}
                                            onClick={() => setSelectedCourtId(court.id)}
                                            className={cn(
                                                "flex-shrink-0 px-6 py-4 rounded-[1.5rem] border-2 font-black text-xs transition-all",
                                                selectedCourtId === court.id
                                                    ? "bg-slate-900 border-slate-900 text-white shadow-lg"
                                                    : "bg-white border-slate-100 text-slate-400 hover:border-slate-200"
                                            )}
                                        >
                                            {court.name}
                                        </button>
                                    ))}
                                </div>
                            </section>

                            <section className="space-y-6">
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-primary-500" /> Horas libres
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    {fetchingSlots ? (
                                        <div className="col-span-2 py-10 flex flex-col items-center gap-4">
                                            <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Consultando disponibilidad...</span>
                                        </div>
                                    ) : slots.length === 0 ? (
                                        <div className="col-span-2 py-10 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-100">
                                            <p className="text-slate-400 italic text-sm font-medium">No hay pistas disponibles</p>
                                        </div>
                                    ) : slots.map((s) => (
                                        <button
                                            key={s.start}
                                            disabled={!s.available}
                                            onClick={() => setSelectedSlot(s)}
                                            className={cn(
                                                "py-5 px-6 rounded-3xl border-2 text-sm font-black transition-all flex items-center justify-between",
                                                !s.available && "opacity-30 cursor-not-allowed grayscale",
                                                selectedSlot?.start === s.start
                                                    ? "bg-primary-500 text-white border-primary-500 shadow-xl shadow-primary-500/30"
                                                    : "bg-white border-slate-50 text-slate-400 hover:border-slate-200"
                                            )}
                                        >
                                            <span className="tracking-tighter">{format(parseISO(s.start), 'HH:mm')}</span>
                                            {selectedSlot?.start === s.start && <Sparkles className="w-4 h-4" />}
                                        </button>
                                    ))}
                                </div>
                            </section>

                            <Button
                                variant="primary"
                                disabled={!selectedSlot}
                                className="w-full py-7 mt-6 rounded-[2rem] shadow-xl shadow-primary-500/20"
                                onClick={() => setStep(2)}
                            >
                                CONTINUAR <ArrowRight className="ml-2 w-6 h-6" />
                            </Button>
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-8"
                        >
                            <section className="space-y-6">
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] flex items-center gap-2">
                                    <Users className="w-4 h-4 text-primary-500" /> Método de Pago
                                </h3>
                                <div className="space-y-4">
                                    <button
                                        onClick={() => setStrategy('SPLIT')}
                                        className={cn(
                                            "w-full p-8 rounded-[2.5rem] border-2 text-left flex items-start gap-6 transition-all relative overflow-hidden",
                                            strategy === 'SPLIT'
                                                ? "bg-slate-900 border-slate-900 text-white shadow-2xl"
                                                : "bg-white border-slate-100 opacity-60"
                                        )}
                                    >
                                        <div className={cn("p-4 rounded-2xl", strategy === 'SPLIT' ? "bg-primary-500 text-white" : "bg-slate-100 text-slate-400")}>
                                            <Users className="w-6 h-6" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-black uppercase text-sm tracking-tight">Cruce Dividido</p>
                                            <p className="text-[11px] font-medium opacity-60 mt-2 leading-relaxed italic">Cada uno paga sus 5€. Confirmación grupal.</p>
                                        </div>
                                        {strategy === 'SPLIT' && <div className="absolute top-0 right-0 w-24 h-24 bg-primary-500/10 rounded-bl-[4rem] -mr-4 -mt-4" />}
                                    </button>
                                    <button
                                        onClick={() => setStrategy('SINGLE')}
                                        className={cn(
                                            "w-full p-8 rounded-[2.5rem] border-2 text-left flex items-start gap-6 transition-all relative overflow-hidden",
                                            strategy === 'SINGLE'
                                                ? "bg-slate-900 border-slate-900 text-white shadow-2xl"
                                                : "bg-white border-slate-100 opacity-60"
                                        )}
                                    >
                                        <div className={cn("p-4 rounded-2xl", strategy === 'SINGLE' ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-400")}>
                                            <Star className="w-6 h-6" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-black uppercase text-sm tracking-tight">Pago Íntegro</p>
                                            <p className="text-[11px] font-medium opacity-60 mt-2 leading-relaxed italic">Tú pagas los 20€ del partido. Confirmación inmediata.</p>
                                        </div>
                                        {strategy === 'SINGLE' && <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-bl-[4rem] -mr-4 -mt-4" />}
                                    </button>
                                </div>
                            </section>

                            <div className="flex gap-4 pt-6">
                                <Button variant="secondary" className="flex-1 py-7 rounded-[2rem]" onClick={() => setStep(1)}>VOLVER</Button>
                                <Button variant="primary" className="flex-2 py-7 px-10 rounded-[2rem]" onClick={() => setStep(3)}>RESUMEN</Button>
                            </div>
                        </motion.div>
                    )}

                    {step === 3 && (
                        <motion.div
                            key="step3"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="space-y-8"
                        >
                            <Card className="p-10 bg-slate-900 text-white border-none shadow-2xl relative overflow-hidden rounded-[3rem]">
                                <div className="absolute inset-0 bg-gradient-to-br from-primary-600/30 to-transparent" />
                                <div className="relative z-10 space-y-8">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-2xl font-black italic tracking-tighter">Tu Partida</h3>
                                        <Badge variant="glass" className="bg-white/10 text-primary-400 border-white/10 uppercase tracking-widest text-[8px]">Review</Badge>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl backdrop-blur-sm border border-white/5">
                                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">DÍA Y HORA</span>
                                            <span className="text-sm font-black">
                                                {format(new Date(date), 'dd/MM')} — {selectedSlot ? format(parseISO(selectedSlot.start), 'HH:mm') : '--:--'}H
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl backdrop-blur-sm border border-white/5">
                                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">PISTA</span>
                                            <span className="text-sm font-black">
                                                {courts.find(c => c.id === selectedCourtId)?.name || 'Cualquiera'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl backdrop-blur-sm border border-white/5">
                                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">MODALIDAD</span>
                                            <span className="text-sm font-black">{strategy === 'SPLIT' ? 'DIVIDIDO (BIZUM)' : 'TOTAL (BIZUM)'}</span>
                                        </div>
                                    </div>

                                    <div className="pt-8 border-t border-white/10 flex flex-col items-center gap-2">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Total a pagar</span>
                                        <span className="text-6xl font-black text-primary-500 tracking-tighter shadow-primary-500/20">{strategy === 'SPLIT' ? '5€' : '20€'}</span>
                                    </div>
                                </div>
                            </Card>

                            <div className="flex gap-4">
                                <Button variant="secondary" className="flex-1 py-7 rounded-[2rem]" onClick={() => setStep(2)}>EDITAR</Button>
                                <Button
                                    variant="primary"
                                    className="flex-2 py-7 px-10 rounded-[2rem] bg-emerald-600 hover:bg-emerald-700 shadow-xl shadow-emerald-900/20"
                                    onClick={handleBook}
                                    disabled={loading}
                                    icon={loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <ChevronRight className="w-6 h-6" />}
                                >
                                    CONFIRMAR
                                </Button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </MobileLayout>
    );
}
