import { useNavigate, useLocation, Link } from "react-router-dom";
import { fetchMe } from "../lib/auth";
import { Home, Calendar, User, Search, ChevronLeft } from 'lucide-react';
import { apiFetch } from "../lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../lib/utils";
import { useEffect, useState } from "react";

interface MobileLayoutProps {
    children: React.ReactNode;
    title?: string;
    showBackButton?: boolean;
}

export default function MobileLayout({ children, title, showBackButton = true }: MobileLayoutProps) {
    const location = useLocation();
    const navigate = useNavigate();
    const [club, setClub] = useState<any>(null);

    useEffect(() => {
        const fetchClubData = async () => {
            try {
                const data = await apiFetch<any>('/club');
                setClub(data);
            } catch (err) {
                console.error("Error fetching club data for mobile layout:", err);
            }
        };
        fetchClubData();
    }, []);

    const navItems = [
        { icon: Home, label: 'Inicio', path: '/m' },
        { icon: Search, label: 'Reservar', path: '/m/book' },
        { icon: Calendar, label: 'Mis Citas', path: '/m/my-bookings' },
        { icon: User, label: 'Perfil', path: '/m/profile' },
    ];

    const isRootMobile = location.pathname === '/m';

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col max-w-md mx-auto shadow-2xl relative border-x border-slate-200 overflow-hidden">
            {/* Header with glassmorphism */}
            <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-slate-100 p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    {showBackButton && !isRootMobile && (
                        <button
                            onClick={() => navigate(-1)}
                            className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors"
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                    )}
                    <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-2"
                    >
                        <div className="w-2 h-6 bg-primary-500 rounded-full" />
                        <h1 className="text-xl font-black text-slate-900 tracking-tighter italic uppercase">
                            {club?.display_name || title || "ClubManager"} {!club?.display_name && <span className="text-primary-600">Pro</span>}
                        </h1>
                    </motion.div>
                </div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-10 h-10 rounded-2xl bg-white border border-slate-100 p-1 shadow-lg overflow-hidden"
                >
                    {club?.logo_url ? (
                        <img src={club.logo_url} alt="Logo" className="w-full h-full object-contain" />
                    ) : (
                        <div className="w-full h-full rounded-[12px] bg-slate-900 flex items-center justify-center text-white font-black text-[10px] tracking-widest">
                            {club?.display_name ? club.display_name[0].toUpperCase() : "CM"}
                        </div>
                    )}
                </motion.div>
            </header>

            {/* Main Content Area with entrance animation */}
            <main className="flex-1 pb-32 overflow-y-auto px-6 py-10 relative z-10">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={location.pathname}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                    >
                        {children}
                    </motion.div>
                </AnimatePresence>
            </main>

            {/* Floating Bottom Nav */}
            <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto p-4 z-50 pointer-events-none">
                <nav className="bg-slate-900/90 backdrop-blur-2xl border border-white/10 px-8 py-5 flex items-center justify-between shadow-2xl rounded-[3rem] pointer-events-auto">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={cn(
                                    "flex flex-col items-center gap-1.5 transition-all relative",
                                    isActive ? "text-primary-400" : "text-slate-500"
                                )}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="nav-active"
                                        className="absolute -top-3 w-8 h-1 bg-primary-500 rounded-full shadow-[0_0_15px_rgba(var(--primary-500-rgb),0.5)]"
                                    />
                                )}
                                <item.icon className={cn("w-5 h-5", isActive ? "stroke-[3px]" : "stroke-[2.5px]")} />
                                <span className="text-[8px] font-black uppercase tracking-[0.2em]">{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>
            </div>
        </div>
    );
}
