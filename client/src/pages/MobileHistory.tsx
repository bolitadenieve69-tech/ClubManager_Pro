import React, { useEffect, useState } from 'react';
import MobileLayout from '../components/MobileLayout';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { History, Calendar, MapPin, ChevronRight, Loader2, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { apiFetch } from '../lib/api';
import { format } from 'date-fns';
import { cn } from '../lib/utils';

export default function MobileHistory() {
    const navigate = useNavigate();
    const [activity, setActivity] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchActivity = async () => {
            try {
                const data = await apiFetch<any[]>('/users/me/activity');
                setActivity(data);
            } catch (err) {
                console.error("Error fetching activity:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchActivity();
    }, []);

    return (
        <MobileLayout title="Mi Actividad">
            <div className="space-y-8 pb-10">
                <div className="flex items-center gap-3 px-2">
                    <Zap className="w-5 h-5 text-primary-500" />
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">Últimas Reservas</h3>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
                        <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest">Cargando historial...</p>
                    </div>
                ) : activity.length === 0 ? (
                    <div className="p-10 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[3rem] text-center">
                        <div className="p-5 bg-white rounded-3xl w-fit mx-auto mb-6 shadow-sm">
                            <History className="w-10 h-10 text-slate-200" />
                        </div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Sin actividad</p>
                        <p className="text-[10px] font-bold text-slate-300 mt-2 italic">Tus próximas victorias aparecerán aquí.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {activity.map((item, idx) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                onClick={() => navigate(`/m/booking/${item.id}`)}
                            >
                                <Card className="p-6 border-slate-100 bg-white rounded-[2rem] flex items-center justify-between group cursor-pointer active:scale-98 transition-all hover:border-primary-100">
                                    <div className="flex items-center gap-5">
                                        <div className={cn(
                                            "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0",
                                            item.status === 'CONFIRMED' ? "bg-emerald-50 text-emerald-600" : "bg-slate-50 text-slate-400"
                                        )}>
                                            <Calendar className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-black text-slate-900 uppercase text-xs tracking-tight">{item.court?.name}</span>
                                                <Badge className={cn(
                                                    "text-[8px] font-black uppercase tracking-widest px-2 py-0.5 border-none",
                                                    item.status === 'CONFIRMED' ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                                                )}>
                                                    {item.status === 'CONFIRMED' ? 'PAGADO' : item.status}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-3 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> PISTA</span>
                                                <span>•</span>
                                                <span>{format(new Date(item.start_at), 'dd MMM, HH:mm')}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-primary-500 transition-colors" />
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </MobileLayout>
    );
}
