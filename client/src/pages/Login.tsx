import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch, ApiError } from '../lib/api';
import { LogIn, UserPlus, Mail, Lock, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { cn } from '../lib/utils';

export default function Login() {
    const navigate = useNavigate();
    const [isRegister, setIsRegister] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    async function register() {
        setError('');
        setLoading(true);
        try {
            const data = await apiFetch<{ token: string; user: { email: string } }>('/auth/register', {
                method: 'POST',
                body: JSON.stringify({ email, password }),
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

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (isRegister) {
            await register();
        } else {
            await login();
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 p-4 font-sans">
            <div className="w-full max-w-md animate-in fade-in zoom-in duration-300">
                {/* Logo/Brand */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-2xl shadow-xl shadow-primary-200 mb-4 transform -rotate-6">
                        <span className="text-white text-2xl font-black">CM</span>
                    </div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">ClubManager <span className="text-primary-600">Pro</span></h1>
                    <p className="text-slate-500 mt-2 font-medium">Gestión inteligente para clubes deportivos</p>
                </div>

                <Card className="border-slate-100 shadow-premium transition-all duration-500">
                    <Card.Header>
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            {isRegister ? (
                                <><UserPlus className="w-5 h-5 text-primary-500" /> Crear cuenta corporativa</>
                            ) : (
                                <><LogIn className="w-5 h-5 text-primary-500" /> Iniciar sesión</>
                            )}
                        </h2>
                    </Card.Header>

                    <Card.Body>
                        {error && (
                            <div className="bg-rose-50 border border-rose-100 text-rose-600 p-4 rounded-xl mb-6 flex items-center gap-3 text-sm animate-in shake duration-500">
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
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                minLength={6}
                                icon={<Lock className="w-5 h-5 text-slate-300" />}
                            />

                            <Button
                                type="submit"
                                loading={loading}
                                className="w-full py-4 text-sm tracking-widest mt-2"
                            >
                                {isRegister ? "REGISTRAR CLUB" : "ENTRAR AL PANEL"}
                            </Button>
                        </form>
                    </Card.Body>

                    <Card.Footer className="flex flex-col gap-4">
                        <div className="relative w-full">
                            <div className="absolute inset-0 flex items-center text-slate-200">
                                <div className="w-full border-t border-slate-100"></div>
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-slate-50 px-2 text-slate-400 font-bold tracking-tighter">
                                    O elige otra opción
                                </span>
                            </div>
                        </div>

                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => {
                                setIsRegister(!isRegister);
                                setError('');
                            }}
                            className="w-full py-4"
                        >
                            {isRegister ? "¿Ya tienes cuenta? Login" : "¿Eres nuevo? Registro Express"}
                        </Button>
                    </Card.Footer>
                </Card>

                <p className="text-center text-slate-400 text-xs mt-8">
                    &copy; 2024 ClubManager Pro System. Todos los derechos reservados.
                </p>
            </div>
        </div>
    );
}
