import React, { useEffect, useState } from 'react';
import MobileLayout from '../components/MobileLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { PlusCircle, Calendar, History, Star, TrendingUp, Zap, ChevronRight, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { apiFetch } from '../lib/api';

export default function MobileHome() {
    const navigate = useNavigate();
    const [stats, setStats] = useState({ reservations: 0, matches: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Endpoint defined in users.ts or analytics.ts typically
                const data = await apiFetch<any>('/users/me/stats');
                setStats({
                    reservations: data.activeReservations || 0,
                    matches: data.playedMatches || 0
                });
            } catch (err) {
                console.error("Error fetching stats:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    return (
        <MobileLayout title="ClubManager Pro">
            <div className="space-y-10 pb-10">
                {/* Visual Hero Section */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    whileTap={{ scale: 0.98 }}
                >
                    <Card className="bg-slate-900 p-10 text-white shadow-2xl relative overflow-hidden group border-none cursor-pointer">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(var(--primary-500-rgb),0.2),transparent)]" />
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary-500/10 rounded-full blur-3xl -ml-16 -mb-16" />

                        <div className="relative z-10 space-y-6">
                            <Badge variant="glass" className="bg-white/10 text-primary-400 border-white/10">PREMIUM MEMBER</Badge>
                            <div>
                                <h2 className="text-3xl font-black tracking-tighter leading-none italic">
                                    Domina la<br />Pista Hoy<span className="text-primary-500">.</span>
                                </h2>
                                <p className="text-slate-400 text-xs font-bold leading-relaxed mt-4">
                                    Reserva rápida. Pago seguro. Juega sin límites.
                                </p>
                            </div>
                            <Button
                                variant="primary"
                                className="w-full py-6 rounded-2xl shadow-lg shadow-primary-500/20 active:scale-95 transition-transform"
                                onClick={() => navigate('/m/book')}
                                icon={<PlusCircle className="w-6 h-6" />}
                            >
                                NUEVA RESERVA
                            </Button>
                        </div>
                    </Card>
                </motion.div>

                {/* Status Dashboard Mini */}
                <div className="grid grid-cols-2 gap-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        whileTap={{ scale: 0.95 }}
                        className="p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-premium flex flex-col items-center text-center gap-3 group transition-all cursor-pointer"
                    >
                        <div className="p-4 bg-primary-50 rounded-2xl text-primary-600 group-hover:rotate-12 transition-transform">
                            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Calendar className="w-6 h-6" />}
                        </div>
                        <div>
                            <span className="block text-3xl font-black text-slate-900 tracking-tighter leading-none">
                                {loading ? '...' : stats.reservations}
                            </span>
                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mt-2 block">Reservas</span>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        whileTap={{ scale: 0.95 }}
                        className="p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-premium flex flex-col items-center text-center gap-3 group transition-all cursor-pointer"
                    >
                        <div className="p-4 bg-amber-50 rounded-2xl text-amber-500 group-hover:rotate-12 transition-transform">
                            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Star className="w-6 h-6" />}
                        </div>
                        <div>
                            <span className="block text-3xl font-black text-slate-900 tracking-tighter leading-none">
                                {loading ? '...' : stats.matches}
                            </span>
                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mt-2 block">Partidos</span>
                        </div>
                    </motion.div>
                </div>

                {/* Activity Section */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-2">
                            <Zap className="w-4 h-4 text-primary-500" />
                            <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.25em]">Actividad</h3>
                        </div>
                        <Button variant="ghost" size="sm" className="text-primary-600 p-0 text-[10px] font-black tracking-widest hover:bg-transparent">
                            VER TODO
                        </Button>
                    </div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="p-10 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[3rem] text-center"
                    >
                        <div className="p-5 bg-white rounded-3xl w-fit mx-auto mb-6 shadow-sm">
                            <History className="w-10 h-10 text-slate-200" />
                        </div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Sin actividad reciente</p>
                        <p className="text-[10px] font-bold text-slate-300 mt-2 italic">Tus próximas victorias aparecerán aquí.</p>
                    </motion.div>
                </div>

                {/* Visual Accent */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    whileTap={{ scale: 0.98 }}
                    className="p-8 bg-gradient-to-r from-primary-600 to-primary-500 rounded-[2.5rem] text-white flex items-center justify-between overflow-hidden relative shadow-lg shadow-primary-500/20 cursor-pointer group"
                >
                    <div className="relative z-10 flex items-center gap-4">
                        <TrendingUp className="w-6 h-6 text-primary-200 group-hover:scale-110 transition-transform" />
                        <div>
                            <span className="block text-sm font-black tracking-tight">Sube de Nivel</span>
                            <span className="text-[10px] font-black text-primary-100 uppercase tracking-widest opacity-80">Ránking del Club</span>
                        </div>
                    </div>
                    <ChevronRight className="w-5 h-5 relative z-10 opacity-50 group-hover:translate-x-1 transition-transform" />
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                </motion.div>
            </div>
        </MobileLayout>
    );
}
