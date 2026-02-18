import { useEffect, useState } from "react";
import { apiFetch, ApiError } from "../lib/api";
import {
    Plus,
    Trophy,
    Users,
    Clock,
    ChevronRight,
    Play,
    CheckCircle2,
    Calendar,
    Target,
    Settings,
    Loader2,
    FileText,
    XCircle
} from "lucide-react";
import { Badge } from "../components/ui/Badge";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

type Tournament = {
    id: string;
    name: string;
    date: string;
    status: 'OPEN' | 'ONGOING' | 'COMPLETED';
    points_per_match: number;
    duration_minutes: number;
    match_duration_minutes: number;
    _count: { participants: number };
};

type Participant = {
    id: string;
    total_points: number;
    name: string | null;
    user: { email: string, full_name: string | null } | null;
};

type Match = {
    id: string;
    round: number;
    player1_id: string;
    player2_id: string;
    player3_id: string;
    player4_id: string;
    score_12: number | null;
    score_34: number | null;
};

export default function Americano() {
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [selected, setSelected] = useState<string | null>(null);
    const [detail, setDetail] = useState<{ tournament: Tournament; participants: Participant[]; matches: Match[] } | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [isCreatingTorneo, setIsCreatingTorneo] = useState(false);
    const [newTorneoName, setNewTorneoName] = useState("");
    const [isAddingJugador, setIsAddingJugador] = useState(false);
    const [newJugadorName, setNewJugadorName] = useState("");

    const loadList = async () => {
        setLoading(true);
        try {
            const data = await apiFetch<{ tournaments: Tournament[] }>("/tournaments");
            setTournaments(data.tournaments);
            if (data.tournaments.length > 0 && !selected) {
                // Keep selected if exists
            }
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    const loadDetail = async (id: string) => {
        try {
            const data = await apiFetch<{ tournament: any }>("/tournaments/" + id);
            setDetail(data.tournament);
        } catch (e: any) {
            setError(e.message);
        }
    };

    const handleCreate = async () => {
        if (!newTorneoName.trim()) {
            setError("Por favor, introduce un nombre para el torneo.");
            return;
        }
        try {
            await apiFetch("/tournaments", {
                method: "POST",
                body: JSON.stringify({
                    name: newTorneoName,
                    date: new Date().toISOString(),
                    points_per_match: 24,
                    duration_minutes: 180,
                    match_duration_minutes: 21,
                    price_per_person: 1500
                })
            });
            setNewTorneoName("");
            setIsCreatingTorneo(false);
            loadList();
        } catch (e: any) {
            setError(e.message);
        }
    };

    const handleGenerateRounds = async () => {
        if (!selected) return;
        try {
            await apiFetch(`/tournaments/${selected}/generate-rounds`, { method: "POST" });
            loadDetail(selected);
        } catch (e: any) {
            setError(e.message);
        }
    };

    const handleAddMe = async () => {
        if (!selected) return;
        try {
            const me = await apiFetch<{ user: { id: string } }>("/auth/me");
            await apiFetch(`/tournaments/${selected}/participants`, {
                method: "POST",
                body: JSON.stringify({ user_id: me.user.id })
            });
            loadDetail(selected);
        } catch (e: any) {
            setError("Error al inscribir: Probablemente ya estés inscrito");
        }
    };

    const handleAddParticipantByName = async () => {
        if (!selected || !newJugadorName.trim()) return;
        try {
            await apiFetch(`/tournaments/${selected}/participants`, {
                method: "POST",
                body: JSON.stringify({ name: newJugadorName })
            });
            setNewJugadorName("");
            setIsAddingJugador(false);
            loadDetail(selected);
        } catch (e: any) {
            setError(e.message);
        }
    };

    useEffect(() => { loadList(); }, []);
    useEffect(() => { if (selected) loadDetail(selected); }, [selected]);

    const handleCreateMatchScore = async (matchId: string, s12: number, s34: number) => {
        try {
            await apiFetch(`/tournaments/${selected}/matches/${matchId}`, {
                method: "PATCH",
                body: JSON.stringify({ score_12: s12, score_34: s34 })
            });
            if (selected) loadDetail(selected);
        } catch (e: any) {
            setError(e.message);
        }
    };

    const getParticipantName = (id: string) => {
        const p = detail?.participants.find(part => part.id === id);
        if (!p) return "S/N";
        return p.name || (p.user?.full_name || p.user?.email.split('@')[0] || "Jugador");
    };

    if (loading && tournaments.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-20 gap-4">
                <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
                <p className="text-slate-500 font-medium italic">Sincronizando torneos...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Torneo Americano</h1>
                    <p className="text-slate-500">Gestión individual, rotación de parejas y ranking en vivo.</p>
                </div>

                {error && (
                    <div className="bg-rose-50 border border-rose-100 text-rose-600 p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                        <Badge variant="error" className="bg-rose-500 text-white">ERROR</Badge>
                        <p className="font-bold text-sm">{error}</p>
                        <button onClick={() => setError("")} className="ml-auto text-rose-400 hover:text-rose-600">✕</button>
                    </div>
                )}
                {isCreatingTorneo ? (
                    <div className="flex items-center gap-2 animate-in slide-in-from-right-2">
                        <input
                            autoFocus
                            placeholder="Nombre del torneo..."
                            value={newTorneoName}
                            onChange={(e) => setNewTorneoName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                            className="bg-white border-2 border-indigo-100 rounded-xl px-4 py-2 text-sm focus:border-indigo-500 outline-none w-64"
                        />
                        <button
                            onClick={handleCreate}
                            className="bg-indigo-600 text-white p-2 rounded-xl hover:bg-indigo-700 transition-colors"
                        >
                            <CheckCircle2 className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setIsCreatingTorneo(false)}
                            className="bg-slate-100 text-slate-500 p-2 rounded-xl hover:bg-slate-200 transition-colors"
                        >
                            <XCircle className="w-5 h-5" />
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => setIsCreatingTorneo(true)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-2xl transition-all shadow-lg shadow-indigo-200 flex items-center gap-2 group"
                    >
                        <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                        Nuevo Torneo
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* List Sidebar */}
                <div className="lg:col-span-1 space-y-4">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-2">Torneos Activos</h3>
                    {tournaments.map(t => (
                        <button
                            key={t.id}
                            onClick={() => setSelected(t.id)}
                            className={cn(
                                "w-full text-left p-4 rounded-3xl border transition-all relative overflow-hidden group",
                                selected === t.id
                                    ? "bg-indigo-600 border-indigo-600 shadow-xl shadow-indigo-100"
                                    : "bg-white border-slate-200 hover:border-indigo-300 hover:bg-slate-50"
                            )}
                        >
                            <div className="relative z-10 flex flex-col gap-1">
                                <span className={cn("text-[10px] font-black uppercase tracking-widest", selected === t.id ? "text-indigo-200" : "text-slate-400")}>
                                    {new Date(t.date).toLocaleDateString()}
                                </span>
                                <span className={cn("font-bold truncate", selected === t.id ? "text-white" : "text-slate-900")}>
                                    {t.name}
                                </span>
                                <div className="flex items-center justify-between mt-2">
                                    <span className={cn("flex items-center gap-1.5 text-xs font-bold", selected === t.id ? "text-indigo-100" : "text-indigo-600")}>
                                        <Users className="w-3 h-3" />
                                        {t._count.participants} Inscritos
                                    </span>
                                    <span className={cn(
                                        "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest",
                                        t.status === 'OPEN' ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-500/20 text-slate-400"
                                    )}>
                                        {t.status}
                                    </span>
                                </div>
                            </div>
                            {selected === t.id && (
                                <div className="absolute top-0 right-0 -mr-4 -mt-4 w-16 h-16 bg-white/10 rounded-full blur-xl" />
                            )}
                        </button>
                    ))}
                </div>

                {/* Main Content Area */}
                <div className="lg:col-span-3 space-y-8">
                    {!selected ? (
                        <div className="bg-white rounded-[2.5rem] border border-dashed border-slate-300 p-20 text-center space-y-4">
                            <div className="w-20 h-20 bg-slate-100 rounded-[2rem] flex items-center justify-center mx-auto">
                                <Trophy className="w-10 h-10 text-slate-300" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-xl font-bold text-slate-900">Selecciona un torneo</h3>
                                <p className="text-slate-500 max-w-xs mx-auto">Elige uno de la lista lateral para gestionar los partidos y ver el ranking.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                            {/* Ranking Card */}
                            <div className="bg-slate-950 rounded-[2.5rem] shadow-2xl p-8 text-white relative overflow-hidden">
                                <div className="absolute top-0 right-0 -m-10 w-64 h-64 bg-indigo-600/20 rounded-full blur-[100px]" />
                                <div className="relative z-10 space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <h2 className="text-2xl font-black italic tracking-tight">{detail?.tournament.name}</h2>
                                            <div className="flex items-center gap-4 text-slate-400 font-bold text-xs uppercase tracking-widest">
                                                <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {new Date(detail?.tournament.date || "").toLocaleDateString()}</span>
                                                <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {detail?.tournament.duration_minutes}m ({detail?.tournament.match_duration_minutes}m/partido)</span>
                                                <span className="flex items-center gap-1.5"><Target className="w-3.5 h-3.5" /> A {detail?.tournament.points_per_match} Ptos</span>
                                            </div>
                                        </div>
                                        <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/40">
                                            <Trophy className="w-6 h-6" />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest pl-1">Ranking Individual Pro</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {detail?.participants.slice(0, 4).map((p, i) => (
                                                <div key={p.id} className="flex items-center justify-between bg-white/5 border border-white/10 p-4 rounded-2xl hover:bg-white/10 transition-colors">
                                                    <div className="flex items-center gap-3">
                                                        <span className="w-6 h-6 rounded-lg bg-indigo-600 text-[10px] font-black flex items-center justify-center">#{i + 1}</span>
                                                        <div className="flex flex-col">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-bold text-sm truncate max-w-[120px]">
                                                                    {p.name || (p.user?.full_name || p.user?.email.split('@')[0] || "Jugador")}
                                                                </span>
                                                                {i === 0 && <Badge variant="neutral" className="bg-yellow-500/20 text-yellow-400 text-[8px] font-black border-yellow-500/20">CAMPEÓN</Badge>}
                                                                {i === 1 && <Badge variant="neutral" className="bg-slate-300/20 text-slate-300 text-[8px] font-black border-slate-300/20">SUBCAMPEÓN</Badge>}
                                                            </div>
                                                            <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">
                                                                {p.user ? `Login: ${p.user.email}` : "Invitado"}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <div className="text-right">
                                                            <span className="text-xl font-black text-white">{p.total_points}</span>
                                                            <span className="ml-1 text-[10px] font-bold text-indigo-300">pts</span>
                                                        </div>
                                                        {i === 0 && (
                                                            <a
                                                                href={((import.meta as any).env.VITE_API_URL || "") + `/tournaments/${selected}/diploma`}
                                                                target="_blank"
                                                                className="p-2 bg-indigo-500/20 hover:bg-indigo-500/40 rounded-xl transition-colors"
                                                                title="Descargar Diploma"
                                                            >
                                                                <FileText className="w-4 h-4 text-indigo-300" />
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Rounds & Matches */}
                            <div className="space-y-6">
                                <div className="flex items-center justify-between px-2">
                                    <div className="flex items-center gap-4">
                                        <h3 className="text-lg font-black text-slate-900 italic uppercase">Gestión de Rondas</h3>
                                        <button
                                            onClick={handleAddMe}
                                            className="text-indigo-600 text-[10px] font-black uppercase tracking-widest border border-indigo-100 px-3 py-1 rounded-full hover:bg-indigo-50"
                                        >
                                            Inscribirme
                                        </button>
                                        {isAddingJugador ? (
                                            <div className="flex items-center gap-2 animate-in fade-in">
                                                <input
                                                    autoFocus
                                                    placeholder="Nombre..."
                                                    value={newJugadorName}
                                                    onChange={(e) => setNewJugadorName(e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleAddParticipantByName()}
                                                    className="border border-indigo-100 rounded-full px-3 py-1 text-[10px] uppercase font-black tracking-widest outline-none focus:border-indigo-500"
                                                />
                                                <button onClick={handleAddParticipantByName} className="text-emerald-500 hover:scale-110"><CheckCircle2 className="w-4 h-4" /></button>
                                                <button onClick={() => setIsAddingJugador(false)} className="text-rose-500 hover:scale-110"><XCircle className="w-4 h-4" /></button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => setIsAddingJugador(true)}
                                                className="text-indigo-600 text-[10px] font-black uppercase tracking-widest border border-indigo-100 px-3 py-1 rounded-full hover:bg-indigo-50 flex items-center gap-1"
                                            >
                                                <Plus className="w-3 h-3" /> Añadir Jugador
                                            </button>
                                        )}
                                    </div>
                                    <button
                                        onClick={handleGenerateRounds}
                                        className="text-indigo-600 hover:text-indigo-700 text-xs font-black uppercase tracking-widest flex items-center gap-1.5"
                                    >
                                        <Play className="w-3.5 h-3.5" /> Generar Rondas
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {detail?.matches.map((m, i) => (
                                        <div key={m.id} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all">
                                            <div className="flex items-center justify-between mb-4">
                                                <span className="text-[8px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full uppercase tracking-widest">Partido {i + 1} • Ronda {m.round}</span>
                                                {m.score_12 !== null && (
                                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                                )}
                                            </div>

                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between gap-4">
                                                    <div className="flex flex-col gap-1 flex-1">
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pareja A</span>
                                                        <div className="text-xs font-bold text-slate-900 border-l-2 border-indigo-500 pl-2">
                                                            {getParticipantName(m.player1_id)} + {getParticipantName(m.player2_id)}
                                                        </div>
                                                    </div>
                                                    <input
                                                        type="number"
                                                        value={m.score_12 ?? ""}
                                                        onChange={(e) => handleCreateMatchScore(m.id, Number(e.target.value), m.score_34 || 0)}
                                                        className="w-14 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-center font-black text-indigo-600 focus:ring-2 focus:ring-indigo-500 outline-none"
                                                        placeholder="0"
                                                    />
                                                </div>

                                                <div className="flex items-center gap-4 py-2">
                                                    <div className="flex-1 h-[1px] bg-slate-100" />
                                                    <span className="text-[8px] font-black text-slate-300 uppercase italic">VS</span>
                                                    <div className="flex-1 h-[1px] bg-slate-100" />
                                                </div>

                                                <div className="flex items-center justify-between gap-4">
                                                    <div className="flex flex-col gap-1 flex-1">
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pareja B</span>
                                                        <div className="text-xs font-bold text-slate-900 border-l-2 border-slate-300 pl-2">
                                                            {getParticipantName(m.player3_id)} + {getParticipantName(m.player4_id)}
                                                        </div>
                                                    </div>
                                                    <input
                                                        type="number"
                                                        value={m.score_34 ?? ""}
                                                        onChange={(e) => handleCreateMatchScore(m.id, m.score_12 || 0, Number(e.target.value))}
                                                        className="w-14 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-center font-black text-slate-900 focus:ring-2 focus:ring-slate-400 outline-none"
                                                        placeholder="0"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
