import { useState, FormEvent, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiFetch, ApiError } from '../lib/api';
import { LogIn, UserPlus, Smartphone, Mail, Lock, KeyRound, AlertCircle, Eye, EyeOff, ArrowLeft, ShieldCheck, Trophy, Smartphone as SmartphoneIcon } from 'lucide-react';
import { PadelLogo } from '../components/PadelLogo';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { motion, AnimatePresence } from 'framer-motion';

type Mode = 'home' | 'login' | 'register' | 'member';

export default function Login() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [mode, setMode] = useState<Mode>(() =>
        searchParams.get('mode') === 'member' ? 'member' : 'home'
    );

    useEffect(() => {
        if (searchParams.get('mode') === 'member') setMode('member');
    }, [searchParams]);
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [registerCode, setRegisterCode] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    function reset() {
        setError('');
        setEmail('');
        setPhone('');
        setPassword('');
        setShowPassword(false);
    }

    async function login() {
        setError('');
        setLoading(true);
        try {
            const data = await apiFetch<{ token: string }>('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password }),
            });
            localStorage.setItem('token', data.token);
            localStorage.setItem('user_email', email);
            navigate('/dashboard');
        } catch (e: any) {
            if (e instanceof ApiError) setError(e.message);
            else setError('Error desconocido.');
        } finally {
            setLoading(false);
        }
    }

    async function loginMember() {
        setError('');
        setLoading(true);
        try {
            const virtualEmail = `${phone.trim()}@guest.club`;
            const data = await apiFetch<{ token: string }>('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email: virtualEmail, password }),
            });
            localStorage.setItem('token', data.token);
            navigate('/m');
        } catch (e: any) {
            if (e instanceof ApiError) setError('Teléfono o contraseña incorrectos.');
            else setError('Error desconocido.');
        } finally {
            setLoading(false);
        }
    }

    async function register() {
        setError('');
        setLoading(true);
        try {
            const data = await apiFetch<{ token: string; user: { email: string } }>('/auth/register', {
                method: 'POST',
                body: JSON.stringify({ email, password, register_code: registerCode }),
            });
            localStorage.setItem('token', data.token);
            localStorage.setItem('user_email', data.user.email);
            navigate('/dashboard');
        } catch (e: any) {
            if (e instanceof ApiError) setError(e.message);
            else setError('Error desconocido.');
        } finally {
            setLoading(false);
        }
    }

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (mode === 'register') await register();
        else if (mode === 'member') await loginMember();
        else await login();
    };

    const containerVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { 
            opacity: 1, 
            y: 0,
            transition: { duration: 0.6, ease: "easeOut", staggerChildren: 0.1 }
        },
        exit: { opacity: 0, y: -20, transition: { duration: 0.3 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, x: -10 },
        visible: { opacity: 1, x: 0 }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-[#FDFCFB] p-4 font-sans relative overflow-hidden">
            {/* Background Orbs */}
            <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary-100/40 rounded-full blur-[120px] animate-float" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[30%] h-[30%] bg-emerald-100/30 rounded-full blur-[100px] animate-float" style={{ animationDelay: '2s' }} />

            <div className="w-full max-w-[440px] relative z-10">
                {/* Brand Header */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center mb-10"
                >
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-slate-900 rounded-[2rem] shadow-2xl mb-6 relative group overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-tr from-primary-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <PadelLogo className="w-12 h-12 text-primary-400 relative z-10" />
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary-500 rounded-lg flex items-center justify-center shadow-lg">
                            <ShieldCheck className="w-3.5 h-3.5 text-white" />
                        </div>
                    </div>
                    <motion.h1 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl font-black text-slate-900 tracking-tighter italic uppercase"
                    >
                        PadelClub
                    </motion.h1>
                    <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-slate-400 mt-3 font-bold uppercase tracking-[0.2em] text-[10px]"
                    >
                        Gestión de Clubes de Padel - Edición 2026
                    </motion.p>
                </motion.div>

                <AnimatePresence mode="wait">
                    {mode === 'home' && (
                        <motion.div
                            key="home"
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="space-y-4"
                        >
                            <div className="glass p-8 rounded-[2.5rem] shadow-premium border-white/40 space-y-6">
                                <div className="space-y-1">
                                    <h2 className="text-xl font-black text-slate-900 uppercase italic">Bienvenido</h2>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Selecciona tu método de acceso</p>
                                </div>

                                <div className="space-y-3">
                                    <motion.button
                                        variants={itemVariants}
                                        whileHover={{ x: 5, backgroundColor: 'rgba(34, 197, 94, 0.05)' }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => { reset(); setMode('login'); }}
                                        className="w-full flex items-center gap-5 p-5 rounded-[1.5rem] border border-slate-100 bg-white shadow-sm hover:border-primary-200 transition-all text-left relative group overflow-hidden"
                                    >
                                        <div className="w-12 h-12 rounded-2xl bg-primary-50 flex items-center justify-center flex-shrink-0 group-hover:bg-primary-100 transition-colors">
                                            <LogIn className="w-6 h-6 text-primary-600" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-black text-slate-900 uppercase text-xs tracking-tight">Panel de Control</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Ya soy administrador</p>
                                        </div>
                                        <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <ArrowLeft className="w-4 h-4 text-slate-400 rotate-180" />
                                        </div>
                                    </motion.button>

                                    <motion.button
                                        variants={itemVariants}
                                        whileHover={{ x: 5, backgroundColor: 'rgba(16, 185, 129, 0.05)' }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => { reset(); setMode('register'); }}
                                        className="w-full flex items-center gap-5 p-5 rounded-[1.5rem] border border-slate-100 bg-white shadow-sm hover:border-emerald-200 transition-all text-left relative group overflow-hidden"
                                    >
                                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-100 transition-colors">
                                            <UserPlus className="w-6 h-6 text-emerald-600" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-black text-slate-900 uppercase text-xs tracking-tight">Registro Express</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Crear un nuevo club</p>
                                        </div>
                                        <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <ArrowLeft className="w-4 h-4 text-slate-400 rotate-180" />
                                        </div>
                                    </motion.button>

                                    <motion.button
                                        variants={itemVariants}
                                        whileHover={{ x: 5, backgroundColor: 'rgba(59, 130, 246, 0.05)' }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => { reset(); setMode('member'); }}
                                        className="w-full flex items-center gap-5 p-5 rounded-[1.5rem] border border-slate-100 bg-white shadow-sm hover:border-blue-200 transition-all text-left relative group overflow-hidden"
                                    >
                                        <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100 transition-colors">
                                            <Smartphone className="w-6 h-6 text-blue-600" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-black text-slate-900 uppercase text-xs tracking-tight">Soy Miembro</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Reservar pista móvil</p>
                                        </div>
                                        <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <ArrowLeft className="w-4 h-4 text-slate-400 rotate-180" />
                                        </div>
                                    </motion.button>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {mode === 'member' && (
                        <motion.div
                            key="member"
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                        >
                            <div className="glass p-10 rounded-[2.5rem] shadow-premium border-white/40 space-y-8">
                                <div className="flex items-center gap-4">
                                    <motion.button
                                        whileHover={{ scale: 1.1, backgroundColor: 'rgba(0,0,0,0.05)' }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => { reset(); setMode('home'); }}
                                        className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors border border-slate-100 bg-white/50 shadow-sm"
                                    >
                                        <ArrowLeft className="w-5 h-5" />
                                    </motion.button>
                                    <div className="space-y-0.5">
                                        <h2 className="text-xl font-black text-slate-900 uppercase italic">
                                            Acceso <span className="text-blue-600">Miembro</span>
                                        </h2>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">App móvil del club</p>
                                    </div>
                                </div>

                                <AnimatePresence mode="wait">
                                    {error && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="bg-rose-50 border border-rose-100 text-rose-600 p-4 rounded-2xl flex items-center gap-3 text-xs font-bold uppercase tracking-tight"
                                        >
                                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                            <p>{error}</p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <form onSubmit={handleSubmit} className="space-y-5">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Teléfono WhatsApp</label>
                                            <Input
                                                type="tel"
                                                value={phone}
                                                onChange={(e) => setPhone(e.target.value)}
                                                placeholder="Ej: +34600000000"
                                                required
                                                className="h-14 rounded-2xl bg-white/80 border-slate-100 focus:ring-blue-500 shadow-sm"
                                                icon={<Smartphone className="w-5 h-5 text-slate-300" />}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Contraseña</label>
                                            <Input
                                                type={showPassword ? 'text' : 'password'}
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                placeholder="••••••••"
                                                required
                                                className="h-14 rounded-2xl bg-white/80 border-slate-100 focus:ring-blue-500 shadow-sm"
                                                icon={<Lock className="w-5 h-5 text-slate-300" />}
                                                rightElement={
                                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="focus:outline-none hover:text-blue-600 transition-colors p-2">
                                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                                    </button>
                                                }
                                            />
                                        </div>
                                    </div>
                                    <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} className="pt-2">
                                        <Button
                                            type="submit"
                                            loading={loading}
                                            className="w-full py-7 text-xs font-black tracking-[0.2em] rounded-2xl shadow-xl shadow-blue-500/20 bg-blue-600 hover:bg-blue-700 transition-all uppercase"
                                        >
                                            ENTRAR A MI APP
                                        </Button>
                                    </motion.div>
                                    <div className="flex items-center justify-center gap-4 text-slate-300 pt-4">
                                        <div className="h-[1px] flex-1 bg-slate-100" />
                                        <span className="text-[8px] font-black uppercase tracking-[0.3em]">Secure Connection</span>
                                        <div className="h-[1px] flex-1 bg-slate-100" />
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    )}

                    {(mode === 'login' || mode === 'register') && (
                        <motion.div
                            key="form"
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                        >
                            <div className="glass p-10 rounded-[2.5rem] shadow-premium border-white/40 space-y-8">
                                <div className="flex items-center gap-4">
                                    <motion.button 
                                        whileHover={{ scale: 1.1, backgroundColor: 'rgba(0,0,0,0.05)' }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => setMode('home')} 
                                        className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors border border-slate-100 bg-white/50 shadow-sm"
                                    >
                                        <ArrowLeft className="w-5 h-5" />
                                    </motion.button>
                                    <div className="space-y-0.5">
                                        <h2 className="text-xl font-black text-slate-900 uppercase italic">
                                            {mode === 'login' ? 'Entrar' : 'Registrar'} <span className="text-primary-600">Club</span>
                                        </h2>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{mode === 'login' ? 'Acceso administrativo' : 'Nueva cuenta corporativa'}</p>
                                    </div>
                                </div>

                                <AnimatePresence mode="wait">
                                    {error && (
                                        <motion.div 
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="bg-rose-50 border border-rose-100 text-rose-600 p-4 rounded-2xl flex items-center gap-3 text-xs font-bold uppercase tracking-tight"
                                        >
                                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                            <p>{error}</p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <form onSubmit={handleSubmit} className="space-y-5">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Email Corporativo</label>
                                            <Input
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                placeholder="ej: admin@clubmaster.pro"
                                                required
                                                className="h-14 rounded-2xl bg-white/80 border-slate-100 focus:ring-primary-500 shadow-sm"
                                                icon={<Mail className="w-5 h-5 text-slate-300" />}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Contraseña</label>
                                            <Input
                                                type={showPassword ? 'text' : 'password'}
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                placeholder="••••••••"
                                                required
                                                minLength={6}
                                                className="h-14 rounded-2xl bg-white/80 border-slate-100 focus:ring-primary-500 shadow-sm"
                                                icon={<Lock className="w-5 h-5 text-slate-300" />}
                                                rightElement={
                                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="focus:outline-none hover:text-primary-600 transition-colors p-2">
                                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                                    </button>
                                                }
                                            />
                                        </div>

                                        {mode === 'register' && (
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Código de Activación</label>
                                                <Input
                                                    type="password"
                                                    value={registerCode}
                                                    onChange={(e) => setRegisterCode(e.target.value)}
                                                    placeholder="••••••••"
                                                    required
                                                    className="h-14 rounded-2xl bg-white/80 border-slate-100 focus:ring-primary-500 shadow-sm"
                                                    icon={<KeyRound className="w-5 h-5 text-slate-300" />}
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <motion.div
                                        whileHover={{ scale: 1.01 }}
                                        whileTap={{ scale: 0.98 }}
                                        className="pt-2"
                                    >
                                        <Button 
                                            type="submit" 
                                            loading={loading} 
                                            className="w-full py-7 text-xs font-black tracking-[0.2em] rounded-2xl shadow-xl shadow-primary-500/20 bg-primary-600 hover:bg-primary-700 transition-all uppercase"
                                        >
                                            {mode === 'login' ? 'ACCEDER AHORA' : 'COMPLETAR REGISTRO'}
                                        </Button>
                                    </motion.div>
                                    
                                    <div className="flex items-center justify-center gap-4 text-slate-300 pt-4">
                                        <div className="h-[1px] flex-1 bg-slate-100" />
                                        <span className="text-[8px] font-black uppercase tracking-[0.3em]">Secure Connection</span>
                                        <div className="h-[1px] flex-1 bg-slate-100" />
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Footer Section */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="mt-12 text-center"
                >
                    <div className="flex items-center justify-center gap-6 mb-6">
                        <div className="flex flex-col items-center gap-1 opacity-40 hover:opacity-100 transition-opacity cursor-default">
                            <Trophy className="w-4 h-4 text-slate-900" />
                            <span className="text-[8px] font-black uppercase tracking-widest">Premium</span>
                        </div>
                        <div className="w-[1px] h-4 bg-slate-200" />
                        <div className="flex flex-col items-center gap-1 opacity-40 hover:opacity-100 transition-opacity cursor-default">
                            <Smartphone className="w-4 h-4 text-slate-900" />
                            <span className="text-[8px] font-black uppercase tracking-widest">PWA Ready</span>
                        </div>
                    </div>
                    <p className="text-slate-300 text-[10px] font-bold uppercase tracking-widest">
                        &copy; 2026 PadelClub System • v1.0.3
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
