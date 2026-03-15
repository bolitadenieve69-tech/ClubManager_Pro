import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    User, 
    Settings, 
    LogOut, 
    Shield, 
    CreditCard, 
    Bell, 
    ChevronRight, 
    Trophy, 
    Calendar,
    ArrowLeft,
    Mail,
    Phone,
    UserCircle
} from 'lucide-react';
import { apiFetch } from '../lib/api';
import { cn } from '../lib/utils';

interface UserData {
    id: string;
    full_name: string;
    email: string;
    role: string;
}

export default function MobileProfile() {
    const navigate = useNavigate();
    const [user, setUser] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const data = await apiFetch<UserData>('/auth/me');
                setUser(data);
            } catch (error) {
                console.error('Error fetching user:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user_email');
        navigate('/login');
    };

    const menuItems = [
        { icon: Settings, label: 'Ajustes de Cuenta', detail: 'Privacidad y seguridad', path: '/settings' },
        { icon: Bell, label: 'Notificaciones', detail: 'Alertas de reserva', path: '#' },
        { icon: CreditCard, label: 'Métodos de Pago', detail: 'Gestionar tarjetas', path: '#' },
        { icon: Shield, label: 'Soporte Técnico', detail: 'Centro de ayuda', path: '#' },
    ];

    if (loading) {
        return (
            <div className="min-h-screen bg-[#FDFCFB] flex items-center justify-center p-6">
                <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FDFCFB] font-sans pb-24">
            {/* Header / Cover Area */}
            <div className="relative h-48 bg-slate-900 overflow-hidden">
                <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-primary-600/20 rounded-full blur-[80px]" />
                <div className="absolute bottom-[-20%] left-[-10%] w-48 h-48 bg-emerald-600/10 rounded-full blur-[60px]" />
                
                <div className="absolute inset-0 p-6 flex flex-col justify-between">
                    <button 
                        onClick={() => navigate(-1)}
                        aria-label="Volver"
                        className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white border border-white/10"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-end gap-5 mb-[-24px]"
                    >
                        <div className="relative">
                            <div className="w-24 h-24 rounded-3xl bg-white p-1 shadow-2xl overflow-hidden border-4 border-[#FDFCFB]">
                                {user?.full_name ? (
                                    <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400">
                                        <UserCircle className="w-16 h-16" />
                                    </div>
                                ) : (
                                    <div className="w-full h-full bg-primary-600 flex items-center justify-center text-white text-3xl font-black">
                                        {user?.email?.[0].toUpperCase()}
                                    </div>
                                )}
                            </div>
                            <div className="absolute bottom-1 right-1 w-6 h-6 bg-green-500 rounded-full border-4 border-white" />
                        </div>
                        <div className="pb-6">
                            <h1 className="text-2xl font-black text-white italic tracking-tight uppercase">
                                {user?.full_name || 'Usuario'}
                            </h1>
                            <div className="flex items-center gap-2 text-primary-400">
                                <Trophy className="w-3.5 h-3.5" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Nivel Pro Member</span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            <main className="px-6 pt-12 space-y-8">
                {/* Stats Grid */}
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="grid grid-cols-2 gap-4"
                >
                    <div className="glass p-5 rounded-[2rem] border-slate-100 flex flex-col gap-2 shadow-sm">
                        <div className="w-8 h-8 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600">
                            <Calendar className="w-4 h-4" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Reservas</p>
                            <p className="text-xl font-black text-slate-900 italic">12</p>
                        </div>
                    </div>
                    <div className="glass p-5 rounded-[2rem] border-slate-100 flex flex-col gap-2 shadow-sm">
                        <div className="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
                            <Trophy className="w-4 h-4" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Puntos</p>
                            <p className="text-xl font-black text-slate-900 italic">8,450</p>
                        </div>
                    </div>
                </motion.div>

                {/* Personal Info Area */}
                <div className="space-y-4">
                    <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Datos de Contacto</h2>
                    <div className="glass p-2 rounded-[2rem] border-white/40 space-y-1">
                        <div className="flex items-center gap-4 p-4 rounded-[1.5rem] bg-slate-50/50">
                            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-slate-400 shadow-sm border border-slate-100">
                                <Mail className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email</p>
                                <p className="text-sm font-bold text-slate-900">{user?.email}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 p-4 rounded-[1.5rem]">
                            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-slate-400 shadow-sm border border-slate-100">
                                <Phone className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">WhatsApp</p>
                                <p className="text-sm font-bold text-slate-900">+34 600 000 000</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Menu Area */}
                <div className="space-y-4">
                    <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Configuración</h2>
                    <div className="glass rounded-[2rem] border-white/40 overflow-hidden shadow-premium">
                        {menuItems.map((item, index) => (
                            <button
                                key={index}
                                onClick={() => navigate(item.path)}
                                className={cn(
                                    "w-full flex items-center gap-4 p-6 hover:bg-slate-50 active:bg-slate-100 transition-colors text-left",
                                    index !== menuItems.length - 1 && "border-b border-slate-100/50"
                                )}
                            >
                                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-600 group">
                                    <item.icon className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-black text-slate-900 uppercase italic tracking-tight">{item.label}</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.detail}</p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-slate-200" />
                            </button>
                        ))}
                    </div>
                </div>

                {/* Logout Button */}
                <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={handleLogout}
                    className="w-full h-16 rounded-[1.5rem] bg-rose-50 text-rose-600 flex items-center justify-center gap-3 font-black uppercase italic tracking-widest text-sm border border-rose-100 shadow-sm hover:bg-rose-100 transition-colors"
                >
                    <LogOut className="w-5 h-5" />
                    Cerrar Sesión
                </motion.button>

                <p className="text-center text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] py-4">
                    ClubManager Pro Version 1.0.2
                </p>
            </main>
        </div>
    );
}
