import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch, ApiError } from '../lib/api';
import { LogIn, UserPlus, Smartphone, Mail, Lock, KeyRound, AlertCircle, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';

type Mode = 'home' | 'login' | 'register';

export default function Login() {
    const navigate = useNavigate();
    const [mode, setMode] = useState<Mode>('home');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [registerCode, setRegisterCode] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    function reset() {
        setError('');
        setEmail('');
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
        else await login();
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 p-4 font-sans">
            <div className="w-full max-w-md animate-in fade-in zoom-in duration-300">

                {/* Logo/Brand */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-2xl shadow-xl shadow-primary-200 mb-4 transform -rotate-6">
                        <span className="text-white text-2xl font-black">CM</span>
                    </div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                        ClubManager <span className="text-primary-600">Pro</span>
                    </h1>
                    <p className="text-slate-500 mt-2 font-medium">Gestión inteligente para clubes deportivos</p>
                </div>

                {/* HOME: tres opciones */}
                {mode === 'home' && (
                    <Card className="border-slate-100 shadow-premium">
                        <Card.Header>
                            <h2 className="text-xl font-bold text-slate-800">¿Cómo quieres acceder?</h2>
                        </Card.Header>
                        <Card.Body className="flex flex-col gap-3">

                            {/* Opción 1: Usuario */}
                            <button
                                onClick={() => { reset(); setMode('login'); }}
                                className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 hover:border-primary-400 hover:bg-primary-50 transition-all text-left group"
                            >
                                <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0 group-hover:bg-primary-200 transition-colors">
                                    <LogIn className="w-5 h-5 text-primary-600" />
                                </div>
                                <div>
                                    <p className="font-bold text-slate-800">Iniciar sesión</p>
                                    <p className="text-xs text-slate-500">Ya tengo cuenta de administrador</p>
                                </div>
                            </button>

                            {/* Opción 2: Registro Express */}
                            <button
                                onClick={() => { reset(); setMode('register'); }}
                                className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 hover:border-green-400 hover:bg-green-50 transition-all text-left group"
                            >
                                <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0 group-hover:bg-green-200 transition-colors">
                                    <UserPlus className="w-5 h-5 text-green-600" />
                                </div>
                                <div>
                                    <p className="font-bold text-slate-800">Registro Express</p>
                                    <p className="text-xs text-slate-500">Crear un nuevo club en minutos</p>
                                </div>
                            </button>

                            {/* Opción 3: Miembro del club (móvil) */}
                            <button
                                onClick={() => navigate('/m/home')}
                                className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50 transition-all text-left group"
                            >
                                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-200 transition-colors">
                                    <Smartphone className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="font-bold text-slate-800">Soy miembro del club</p>
                                    <p className="text-xs text-slate-500">Reservar pista desde el móvil</p>
                                </div>
                            </button>

                        </Card.Body>
                    </Card>
                )}

                {/* LOGIN form */}
                {mode === 'login' && (
                    <Card className="border-slate-100 shadow-premium">
                        <Card.Header>
                            <div className="flex items-center gap-3">
                                <button type="button" aria-label="Volver" onClick={() => setMode('home')} className="text-slate-400 hover:text-slate-600 transition-colors">
                                    <ArrowLeft className="w-5 h-5" />
                                </button>
                                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                    <LogIn className="w-5 h-5 text-primary-500" /> Iniciar sesión
                                </h2>
                            </div>
                        </Card.Header>
                        <Card.Body>
                            {error && (
                                <div className="bg-rose-50 border border-rose-100 text-rose-600 p-4 rounded-xl mb-6 flex items-center gap-3 text-sm">
                                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                    <p className="font-medium">{error}</p>
                                </div>
                            )}
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <Input
                                    label="Email Profesional"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="ej: admin@tuclub.es"
                                    required
                                    icon={<Mail className="w-5 h-5 text-slate-300" />}
                                />
                                <Input
                                    label="Contraseña"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    minLength={6}
                                    icon={<Lock className="w-5 h-5 text-slate-300" />}
                                    rightElement={
                                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="focus:outline-none hover:text-primary-600 transition-colors p-1">
                                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    }
                                />
                                <Button type="submit" loading={loading} className="w-full py-4 text-sm tracking-widest mt-2">
                                    ENTRAR AL PANEL
                                </Button>
                            </form>
                        </Card.Body>
                    </Card>
                )}

                {/* REGISTER form */}
                {mode === 'register' && (
                    <Card className="border-slate-100 shadow-premium">
                        <Card.Header>
                            <div className="flex items-center gap-3">
                                <button type="button" aria-label="Volver" onClick={() => setMode('home')} className="text-slate-400 hover:text-slate-600 transition-colors">
                                    <ArrowLeft className="w-5 h-5" />
                                </button>
                                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                    <UserPlus className="w-5 h-5 text-green-500" /> Crear cuenta corporativa
                                </h2>
                            </div>
                        </Card.Header>
                        <Card.Body>
                            {error && (
                                <div className="bg-rose-50 border border-rose-100 text-rose-600 p-4 rounded-xl mb-6 flex items-center gap-3 text-sm">
                                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                    <p className="font-medium">{error}</p>
                                </div>
                            )}
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <Input
                                    label="Email Profesional"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="ej: admin@tuclub.es"
                                    required
                                    icon={<Mail className="w-5 h-5 text-slate-300" />}
                                />
                                <Input
                                    label="Contraseña"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    minLength={6}
                                    icon={<Lock className="w-5 h-5 text-slate-300" />}
                                    rightElement={
                                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="focus:outline-none hover:text-primary-600 transition-colors p-1">
                                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    }
                                />
                                <Input
                                    label="Código de acceso"
                                    type="password"
                                    value={registerCode}
                                    onChange={(e) => setRegisterCode(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    icon={<KeyRound className="w-5 h-5 text-slate-300" />}
                                />
                                <Button type="submit" loading={loading} className="w-full py-4 text-sm tracking-widest mt-2">
                                    REGISTRAR CLUB
                                </Button>
                            </form>
                        </Card.Body>
                    </Card>
                )}

                <p className="text-center text-slate-400 text-xs mt-8">
                    &copy; 2024 ClubManager Pro System. Todos los derechos reservados.
                </p>
            </div>
        </div>
    );
}
