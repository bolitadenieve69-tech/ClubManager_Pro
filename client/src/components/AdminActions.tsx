import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Lock, GraduationCap, Zap, Sparkles, ChevronRight } from 'lucide-react';

export default function AdminActions() {
    const navigate = useNavigate();

    return (
        <Card className="p-10 border-none shadow-premium relative overflow-hidden bg-white/90 backdrop-blur-xl group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/5 rounded-bl-[4rem] pointer-events-none group-hover:scale-110 transition-transform duration-700" />

            <div className="flex items-center gap-5 mb-10">
                <div className="p-4 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl text-white shadow-lg shadow-primary-500/20 group-hover:rotate-6 transition-transform">
                    <Zap className="w-6 h-6" />
                </div>
                <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Acciones</h2>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.25em] mt-1 flex items-center gap-2">
                        <Sparkles className="w-3 h-3 text-primary-400" />
                        Control Instantáneo
                    </p>
                </div>
            </div>

            <div className="space-y-4">
                <motion.div whileHover={{ x: 5 }}>
                    <Button
                        variant="secondary"
                        onClick={() => navigate('/reservations')}
                        className="w-full h-20 flex justify-between items-center px-6 border-2 border-dashed border-slate-100 hover:border-primary-100 hover:bg-primary-50/50 hover:shadow-sm"
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white rounded-xl shadow-sm">
                                <Lock className="w-5 h-5 text-slate-900" />
                            </div>
                            <div className="text-left">
                                <span className="block text-sm font-black text-slate-900 tracking-tight">Bloquear Pista</span>
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Mantenimiento / Evento</span>
                            </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-300" />
                    </Button>
                </motion.div>

                <motion.div whileHover={{ x: 5 }}>
                    <Button
                        variant="secondary"
                        onClick={() => navigate('/schedule')}
                        className="w-full h-20 flex justify-between items-center px-6 border-2 border-dashed border-indigo-50 hover:border-indigo-200 hover:bg-indigo-50/50 hover:shadow-sm"
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white rounded-xl shadow-sm">
                                <GraduationCap className="w-5 h-5 text-indigo-600" />
                            </div>
                            <div className="text-left">
                                <span className="block text-sm font-black text-indigo-600 tracking-tight">Agendar Clase</span>
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Sesión de Entrenamiento</span>
                            </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-indigo-300" />
                    </Button>
                </motion.div>
            </div>

            <div className="mt-8 p-6 bg-slate-50/50 rounded-2xl border border-slate-100/50">
                <p className="text-[10px] font-bold text-slate-500 leading-relaxed italic">
                    Tip: Los bloqueos se sincronizan automáticamente con la vista del socio para evitar solapamientos.
                </p>
            </div>
        </Card>
    );
}
