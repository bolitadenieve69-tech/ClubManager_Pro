import { useNavigate, Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { fetchMe, clearSession } from "../lib/auth";
import {
    LayoutDashboard,
    Building2,
    Table2,
    Ticket,
    CalendarCheck,
    FileText,
    BarChart3,
    TrendingUp,
    Users,
    Wallet,
    LogOut,
    ChevronRight,
    Trophy,
    Receipt,
    Calculator,
    Menu,
    X,
    Settings,
    ArrowLeft
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../lib/utils";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";

const navigationGroups = [
    {
        title: "Menú Principal",
        links: [
            { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
            { name: "Horario", path: "/schedule", icon: Table2 },
            { name: "Pistas", path: "/courts", icon: Table2 },
            { name: "Tarifas", path: "/rates", icon: Ticket },
            { name: "Reservas", path: "/reservations", icon: CalendarCheck },
            { name: "Americano", path: "/tournaments", icon: Trophy },
            { name: "Socios", path: "/members", icon: Users },
            { name: "Configuración", path: "/settings", icon: Settings },
        ]
    },
    {
        title: "Contabilidad General",
        links: [
            { name: "Contabilidad", path: "/accounting", icon: Calculator },
            { name: "Facturas", path: "/invoices", icon: FileText },
            { name: "Gastos", path: "/expenses", icon: Receipt },
            { name: "Caja", path: "/movements", icon: Wallet },
            { name: "Cierres", path: "/closeouts", icon: Wallet },
            { name: "Facturación", path: "/billing", icon: Users },
        ]
    },
    {
        title: "Reportes",
        links: [
            { name: "Analítica", path: "/analytics", icon: BarChart3 },
        ]
    }
];

export default function Layout({ children }: { children: React.ReactNode }) {
    const navigate = useNavigate();
    const location = useLocation();
    const [email, setEmail] = useState<string>("");
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        let cancelled = false;

        (async () => {
            try {
                const me = await fetchMe();
                if (cancelled) return;
                setEmail(me.user.email);
                localStorage.setItem("user_email", me.user.email);
            } catch {
                clearSession();
                navigate("/login", { replace: true });
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [navigate]);

    function logout() {
        clearSession();
        navigate("/login", { replace: true });
    }

    return (
        <div className="flex min-h-screen bg-[#f8fafc] text-slate-900 font-sans selection:bg-primary-500/30">
            {/* Sidebar Overlay */}
            <AnimatePresence>
                {isSidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsSidebarOpen(false)}
                        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[45] lg:hidden"
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <aside className={cn(
                "w-64 bg-slate-950 text-white flex flex-col fixed inset-y-0 left-0 z-50 transition-all duration-500 border-r border-white/5 shadow-2xl overflow-hidden translate-x-0",
                !isSidebarOpen && "max-lg:-translate-x-full"
            )}>
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-500 via-accent-500 to-primary-500 animate-pulse" />
                <div className="p-8 relative flex items-center justify-between">
                    <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-3">
                        <motion.div
                            whileHover={{ rotate: -12, scale: 1.1 }}
                            className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-lg shadow-primary-900/40"
                        >
                            <span className="text-xs font-black">CM</span>
                        </motion.div>
                        <div className="flex flex-col -gap-1">
                            <span className="leading-none text-white/90">ClubManager</span>
                            <span className="text-primary-400 text-[10px] tracking-[0.25em] font-black uppercase">Pro System</span>
                        </div>
                    </h2>
                    <button
                        onClick={() => setIsSidebarOpen(false)}
                        className="p-2 -mr-2 text-slate-500 lg:hidden"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <nav className="flex-1 px-4 py-4 space-y-8 overflow-y-auto custom-scrollbar relative">
                    {navigationGroups.map((group) => (
                        <div key={group.title} className="space-y-2">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-4 mb-3">{group.title}</p>
                            <div className="space-y-1">
                                {group.links.map((link) => {
                                    const isActive = location.pathname === link.path;
                                    const Icon = link.icon;
                                    return (
                                        <Link
                                            key={link.name}
                                            to={link.path}
                                            onClick={() => setIsSidebarOpen(false)}
                                            className={cn(
                                                "flex items-center gap-3 px-4 py-3 rounded-button text-sm font-bold transition-all duration-300 group relative overflow-hidden",
                                                isActive
                                                    ? "bg-primary-600 text-white shadow-xl shadow-primary-900/40"
                                                    : "text-slate-400 hover:text-white hover:bg-white/10"
                                            )}
                                        >
                                            <Icon className={cn("w-4 h-4 transition-transform group-hover:scale-110", isActive ? "text-white" : "text-slate-500 group-hover:text-primary-400")} />
                                            <span className="relative z-10">{link.name}</span>
                                            {isActive && (
                                                <motion.div
                                                    layoutId="activeNav"
                                                    className="absolute inset-0 bg-gradient-to-r from-primary-600 to-primary-500 shadow-xl"
                                                />
                                            )}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </nav>

                <div className="p-6 border-t border-white/5 bg-white/[0.02] backdrop-blur-3xl relative">
                    <div className="flex items-center gap-3 mb-6 px-1">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-slate-800 to-slate-700 flex items-center justify-center text-sm font-black ring-1 ring-white/10 shadow-inner overflow-hidden">
                            <div className="absolute inset-0 bg-primary-500/10" />
                            <span className="relative z-10">{email ? email[0].toUpperCase() : "?"}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-black truncate text-white tracking-tight">
                                {email || "Cargando..."}
                            </p>
                            <p className="text-[9px] text-primary-400 uppercase tracking-[0.2em] font-black mt-0.5">Global Admin</p>
                        </div>
                    </div>
                    <Button
                        variant="secondary"
                        onClick={logout}
                        className="w-full py-3.5 bg-white/5 border-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all duration-300 backdrop-blur-md"
                        icon={<LogOut className="w-4 h-4" />}
                    >
                        Salir
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 lg:ml-64 flex flex-col min-h-screen relative overflow-hidden">
                {/* Decorative background elements */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500/5 rounded-full blur-[120px] -mr-48 -mt-48" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent-500/5 rounded-full blur-[120px] -ml-48 -mb-48" />

                <header className="h-20 lg:h-20 bg-white/70 backdrop-blur-xl border-b border-slate-200/60 sticky top-0 z-40 px-6 lg:px-10 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="p-2 -ml-2 text-slate-500 lg:hidden hover:bg-slate-100 rounded-xl transition-colors"
                        >
                            <Menu className="w-6 h-6" />
                        </button>

                        {location.pathname !== "/dashboard" && (
                            <button
                                onClick={() => navigate(-1)}
                                className="flex items-center gap-2 p-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-all group"
                            >
                                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                                <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Volver</span>
                            </button>
                        )}

                        <div className="h-8 w-1.5 bg-gradient-to-b from-primary-600 to-primary-400 rounded-full shadow-sm shadow-primary-500/20" />

                        <Link to="/dashboard" className="group flex items-center gap-2">
                            <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-[0.25em] group-hover:text-primary-600 transition-colors">
                                {location.pathname.split('/').filter(Boolean).pop()?.replace('-', ' ') || "Overview"}
                            </h3>
                        </Link>
                    </div>
                </header>

                <motion.div
                    key={location.pathname}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="p-6 lg:p-10 flex-1 relative z-10"
                >
                    {children}
                </motion.div>
            </main>
        </div>
    );
}
