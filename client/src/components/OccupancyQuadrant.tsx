import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { Printer, Calendar, Clock, Lock, GraduationCap, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, parseISO, startOfDay, addMinutes, isSameMinute, addDays, subDays } from 'date-fns';
import { cn } from '../lib/utils';
import { apiFetch } from "../lib/api";

interface OccupancyItem {
    id: string;
    type: 'BOOKING' | 'BLOCK' | 'CLASS';
    court_id: string;
    start_at: string;
    end_at: string;
    title: string;
    status?: string;
    strategy?: string;
}

interface Court {
    id: string;
    name: string;
}

export default function OccupancyQuadrant() {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [courts, setCourts] = useState<Court[]>([]);
    const [occupancy, setOccupancy] = useState<OccupancyItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [courtsData, occData] = await Promise.all([
                    apiFetch<{ courts: Court[] }>('/courts'),
                    apiFetch<{ occupancy: OccupancyItem[] }>(`/occupancy/daily?date=${date}`)
                ]);

                setCourts(courtsData.courts);
                setOccupancy(occData.occupancy);
            } catch (err) {
                console.error("Error fetching quadrant data:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [date]);

    const handlePrint = () => window.print();

    const confirmPayment = async (bookingId: string) => {
        try {
            await apiFetch(`/bookings/${bookingId}/confirm-all`, {
                method: 'POST',
            });
            const occData = await apiFetch<{ occupancy: OccupancyItem[] }>(`/occupancy/daily?date=${date}`);
            setOccupancy(occData.occupancy);
        } catch (err) {
            console.error("Error confirming payment:", err);
        }
    };

    const slots = [];
    let current = startOfDay(parseISO(date));
    current.setHours(8, 0, 0, 0);
    const end = new Date(current);
    end.setHours(23, 0, 0, 0);

    while (current < end) {
        slots.push(new Date(current));
        current = addMinutes(current, 30);
    }

    return (
        <Card variant="default" className="p-0 border-none shadow-premium overflow-visible">
            {/* Header Control Panel */}
            <div className="p-8 bg-white rounded-t-card border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6 print:hidden">
                <div className="flex items-center gap-5">
                    <motion.div
                        whileHover={{ scale: 1.05, rotate: 5 }}
                        className="p-4 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl text-white shadow-lg shadow-primary-500/30"
                    >
                        <Calendar className="w-6 h-6" />
                    </motion.div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none">Cuadrante de Pistas</h2>
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.25em] mt-2 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Live System Status
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-2xl border border-slate-100 shadow-inner">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="w-10 h-10 p-0 rounded-xl hover:bg-white hover:shadow-sm"
                        onClick={() => setDate(format(subDays(parseISO(date), 1), 'yyyy-MM-dd'))}
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </Button>

                    <div className="relative">
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="bg-transparent border-none py-1.5 px-2 text-sm font-black text-slate-700 focus:outline-none focus:ring-0 cursor-pointer uppercase tracking-widest"
                        />
                    </div>

                    <Button
                        variant="ghost"
                        size="sm"
                        className="w-10 h-10 p-0 rounded-xl hover:bg-white hover:shadow-sm"
                        onClick={() => setDate(format(addDays(parseISO(date), 1), 'yyyy-MM-dd'))}
                    >
                        <ChevronRight className="w-5 h-5" />
                    </Button>
                </div>

                <div className="flex items-center gap-3">
                    <Button variant="secondary" size="md" onClick={handlePrint} icon={<Printer className="w-4 h-4" />}>
                        IMPRIMIR
                    </Button>
                </div>
            </div>

            {/* Grid Table */}
            <div className="overflow-x-auto relative min-h-[600px] bg-slate-50/30 p-4">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={date}
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.02 }}
                        transition={{ duration: 0.3 }}
                    >
                        <table className="w-full border-separate border-spacing-2">
                            <thead>
                                <tr>
                                    <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] w-28 text-center bg-white/50 backdrop-blur-md rounded-xl border border-slate-100 shadow-sm">
                                        Timing
                                    </th>
                                    {courts.map(court => (
                                        <th key={court.id} className="p-4 text-xs font-black text-slate-800 uppercase tracking-widest text-center bg-white/80 backdrop-blur-md rounded-xl border border-slate-100 shadow-sm min-w-[200px]">
                                            {court.name}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {slots.map(slot => (
                                    <tr key={slot.toISOString()}>
                                        <td className="p-4 text-center">
                                            <div className="flex items-center justify-center gap-2 bg-white/40 py-2 rounded-xl border border-slate-100/50">
                                                <span className="text-xs font-black text-slate-600 tracking-tighter">{format(slot, 'HH:mm')}</span>
                                            </div>
                                        </td>
                                        {courts.map(court => {
                                            const item = occupancy.find(occ =>
                                                occ.court_id === court.id &&
                                                isSameMinute(parseISO(occ.start_at), slot)
                                            );

                                            if (!item) return <td key={court.id} className="p-2">
                                                <div className="h-16 rounded-2xl border-2 border-dashed border-slate-100 hover:border-primary-100 hover:bg-primary-50/30 transition-all duration-300 cursor-pointer" />
                                            </td>;

                                            const isBooking = item.type === 'BOOKING';
                                            const isBlock = item.type === 'BLOCK';
                                            const isClass = item.type === 'CLASS';
                                            const isPending = item.status === 'PENDING_PAYMENT';

                                            return (
                                                <td key={court.id} className="p-1">
                                                    <motion.div
                                                        whileHover={{ scale: 1.02, y: -2 }}
                                                        className={cn(
                                                            "p-4 rounded-2xl border-2 text-sm h-full shadow-lg relative group overflow-hidden",
                                                            isBooking && isPending && "bg-amber-400 border-amber-300 text-amber-950 shadow-amber-200/50",
                                                            isBooking && !isPending && "bg-white border-primary-100 text-slate-900 shadow-primary-200/20",
                                                            isBlock && "bg-slate-900 border-slate-800 text-white shadow-slate-900/20",
                                                            isClass && "bg-indigo-600 border-indigo-500 text-white shadow-indigo-500/30"
                                                        )}
                                                    >
                                                        {/* Gradient overlays for vibrancy */}
                                                        {isBooking && !isPending && <div className="absolute inset-0 bg-gradient-to-br from-primary-50/50 to-transparent pointer-events-none" />}

                                                        <div className="font-black truncate uppercase mb-1 flex items-center gap-2 relative z-10">
                                                            {isBooking && <Calendar className={cn("w-4 h-4", isPending ? "text-amber-900" : "text-primary-500")} />}
                                                            {isBlock && <Lock className="w-4 h-4 text-slate-400" />}
                                                            {isClass && <GraduationCap className="w-4 h-4 text-indigo-300" />}
                                                            <span className="tracking-tight">{item.title}</span>
                                                        </div>

                                                        <div className="font-bold opacity-60 text-[10px] flex items-center gap-1.5 relative z-10">
                                                            <Clock className="w-3 h-3" />
                                                            {format(parseISO(item.start_at), 'HH:mm')} — {format(parseISO(item.end_at), 'HH:mm')}
                                                        </div>

                                                        {isBooking && isPending && (
                                                            <motion.div
                                                                initial={{ height: 0, opacity: 0 }}
                                                                animate={{ height: "auto", opacity: 1 }}
                                                                className="mt-3 pt-3 border-t border-amber-900/10 relative z-10"
                                                            >
                                                                <Badge variant="glass" className="bg-amber-950/20 text-amber-900 border-amber-900/10 mb-2">PAGO PENDIENTE</Badge>
                                                                <button
                                                                    onClick={() => confirmPayment(item.id)}
                                                                    className="w-full bg-amber-950 text-white py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-colors"
                                                                >
                                                                    CONFIRMAR BIZUM
                                                                </button>
                                                            </motion.div>
                                                        )}

                                                        {isBooking && !isPending && (
                                                            <div className="mt-3 flex items-center gap-1.5 text-[9px] font-black text-primary-600 uppercase tracking-tighter bg-primary-100/50 w-fit px-2 py-0.5 rounded-full relative z-10">
                                                                <CheckCircle className="w-3 h-3" /> CONFIRMADA
                                                            </div>
                                                        )}
                                                    </motion.div>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </motion.div>
                </AnimatePresence>
            </div>
        </Card>
    );
}
