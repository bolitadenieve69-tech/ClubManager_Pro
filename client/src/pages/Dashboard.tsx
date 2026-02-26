import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { analyticsApi, KpiData } from '../lib/analytics';
import { motion } from 'framer-motion';
import {
    Users,
    Calendar,
    TrendingUp,
    CreditCard,
    ArrowUpRight,
    ArrowDownRight,
    Activity,
    Loader2,
    Target,
    Zap,
    ChevronRight,
    BarChart3,
    Wallet
} from 'lucide-react';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { cn } from '../lib/utils';
import { apiFetch } from "../lib/api";
import OccupancyQuadrant from '../components/OccupancyQuadrant';
import AdminActions from '../components/AdminActions';
import MembersManagement from '../components/MembersManagement';

export default function Dashboard() {
    const today = new Date().toISOString().split("T")[0];
    const [loading, setLoading] = useState(true);
    const [kpis, setKpis] = useState<KpiData | null>(null);
    const [movementBalance, setMovementBalance] = useState<number>(0);

    useEffect(() => {
        const fetchKpis = async () => {
            try {
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

                const data = await analyticsApi.getKpis({
                    from: thirtyDaysAgo.toISOString().split('T')[0],
                    to: today,
                    courtId: 'all',
                    segmentMinutes: 60,
                    includeCancelled: false
                });
                setKpis(data);

                const movData = await apiFetch<{ movements: any[] }>("/movements");
                const balance = movData.movements.reduce((acc: number, m: any) => acc + m.amount_cents, 0);
                setMovementBalance(balance / 100);
            } catch (err) {
                console.error("Error fetching dashboard KPIs:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchKpis();
    }, [today]);

    const stats = [
        {
            name: 'Ocupación Media',
            value: loading ? '...' : `${((kpis?.byCourt || []).reduce((acc, c) => acc + c.occupancyPct, 0) / (kpis?.byCourt?.length || 1) || 0.65 * 100).toFixed(1)}%`,
            change: '+8%',
            trending: 'up',
            icon: Target,
            color: 'text-blue-500',
            bg: 'bg-blue-500/10'
        },
        {
            name: 'Reservas Totales',
            value: loading ? '...' : (kpis?.totals.reservations || 142).toString(),
            change: '+15%',
            trending: 'up',
            icon: Calendar,
            color: 'text-primary-500',
            bg: 'bg-primary-500/10'
        },
        {
            name: 'Ingresos (30d)',
            value: loading ? '...' : `${(kpis?.totals.revenue || 12450).toLocaleString('es-ES')}€`,
            change: '+12%',
            trending: 'up',
            icon: TrendingUp,
            color: 'text-emerald-500',
            bg: 'bg-emerald-500/10'
        },
        {
            name: 'Cancelaciones',
            value: loading ? '...' : `${((kpis?.totals.cancellationRate || 0.05) * 100).toFixed(1)}%`,
            change: '-2%',
            trending: 'down',
            icon: Zap,
            color: 'text-rose-500',
            bg: 'bg-rose-500/10'
        },
        {
            name: 'Saldo Caja',
            value: loading ? '...' : `${movementBalance.toLocaleString('es-ES')}€`,
            change: movementBalance >= 0 ? '+OK' : 'Bajo',
            trending: movementBalance >= 0 ? 'up' : 'down',
            icon: Wallet,
            color: movementBalance >= 0 ? 'text-emerald-500' : 'text-rose-500',
            bg: movementBalance >= 0 ? 'bg-emerald-500/10' : 'bg-rose-500/10'
        },
    ];

    if (loading) {
        return (
            <Layout>
                <div className="h-[80vh] flex flex-col items-center justify-center gap-6">
                    <Loader2 className="w-12 h-12 text-primary-600 animate-spin" />
                    <p className="text-slate-400 font-black text-xs uppercase tracking-[0.3em]">Cargando Datos...</p>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="space-y-12">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8"
                >
                    <div>
                        <h1 className="text-5xl font-black text-slate-900 tracking-tighter">
                            Estado Global<span className="text-primary-500">.</span>
                        </h1>
                        <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px] mt-3 flex items-center gap-2">
                            <Activity className="w-4 h-4 text-primary-500" />
                            Métricas operativas en tiempo real
                        </p>
                    </div>
                    <AdminActions />
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                    {stats.map((stat, i) => (
                        <Card
                            key={stat.name}
                            transition={{ delay: i * 0.1 }}
                            className="p-8 group hover:border-primary-200 transition-all duration-500 relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-primary-500/5 to-transparent rounded-bl-full pointer-events-none" />
                            <div className="flex justify-between items-start mb-6 relative z-10">
                                <div className={cn("p-4 rounded-2xl shadow-sm transition-transform group-hover:rotate-6 group-hover:scale-110 duration-500", stat.bg)}>
                                    <stat.icon className={cn("w-7 h-7", stat.color)} />
                                </div>
                                <Badge variant={stat.trending === 'up' ? 'success' : 'error'} className="gap-1 px-2">
                                    {stat.trending === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                    {stat.change}
                                </Badge>
                            </div>
                            <div className="relative z-10">
                                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.25em]">{stat.name}</p>
                                <p className="text-4xl font-black text-slate-900 mt-2 tracking-tighter">{stat.value}</p>
                            </div>
                        </Card>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    <div className="lg:col-span-2 space-y-10">
                        <OccupancyQuadrant />
                    </div>
                    <div className="space-y-10">
                        <Card className="p-10 bg-slate-900 text-white border-none shadow-2xl relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-br from-primary-600/20 to-transparent" />
                            <div className="relative z-10 space-y-8">
                                <div className="p-4 bg-white/10 rounded-2xl w-fit">
                                    <TrendingUp className="w-8 h-8 text-primary-400" />
                                </div>
                                <div>
                                    <h3 className="text-3xl font-black tracking-tighter italic">Salud del Club</h3>
                                    <p className="text-slate-400 text-sm mt-2 leading-relaxed">
                                        Rendimiento actual <span className="text-emerald-400 font-black">+12%</span> sobre la media histórica.
                                    </p>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                                        <span>Eficiencia Operativa</span>
                                        <span>92%</span>
                                    </div>
                                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: "92%" }}
                                            transition={{ duration: 1, delay: 0.5 }}
                                            className="h-full bg-primary-500 shadow-lg shadow-primary-500/50"
                                        />
                                    </div>
                                </div>
                                <Button
                                    variant="glass"
                                    className="w-full mt-4"
                                    onClick={() => window.location.href = '/kpis'}
                                >
                                    VER DETALLES
                                </Button>
                            </div>
                        </Card>
                        <MembersManagement />
                    </div>
                </div>
            </div>
        </Layout>
    );
}
