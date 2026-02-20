import { useEffect, useState } from "react";
import Layout from "../components/Layout";
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
import { Button } from "../components/ui/Button";
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


interface ScoreInputProps {
    value: number | null;
    onSave: (val: number) => void;
    className?: string;
}

const ScoreInput = ({ value, onSave, className }: ScoreInputProps) => {
    const [localValue, setLocalValue] = useState(value?.toString() ?? "");

    useEffect(() => {
        setLocalValue(value?.toString() ?? "");
    }, [value]);

    const handleBlur = () => {
        if (localValue !== "" && Number(localValue) !== value) {
            onSave(Number(localValue));
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            (e.currentTarget as HTMLInputElement).blur(); // Triggers handleBlur
        }
    };

    return (
        <input
            type="number"
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className={className}
            placeholder="-"
        />
    );
};

export default function Americano() {
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [selected, setSelected] = useState<string | null>(null);
    const [detail, setDetail] = useState<{ tournament: Tournament; participants: Participant[]; matches: Match[] } | null>(null);
    const [loading, setLoading] = useState(true);
    const [isActionLoading, setIsActionLoading] = useState(false);
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
            const { participants, matches, ...tournament } = data.tournament;
            setDetail({
                tournament,
                participants: participants || [],
                matches: matches || []
            });
        } catch (e: any) {
            setError(e.message);
        }
    };

    const handleCreate = async () => {
        if (!newTorneoName.trim()) {
            setError("Por favor, introduce un nombre para el torneo.");
            return;
        }
        setError("");
        setIsActionLoading(true);
        try {
            const res = await apiFetch<{ tournament: Tournament }>("/tournaments", {
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

            // Reload list and select the new one
            await loadList();
            setSelected(res.tournament.id);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleGenerateRounds = async () => {
        if (!selected) return;
        setIsActionLoading(true);
        try {
            await apiFetch(`/tournaments/${selected}/generate-rounds`, { method: "POST" });
            loadDetail(selected);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleAddMe = async () => {
        if (!selected) return;
        setIsActionLoading(true);
        try {
            const me = await apiFetch<{ user: { id: string } }>("/auth/me");
            await apiFetch(`/tournaments/${selected}/participants`, {
                method: "POST",
                body: JSON.stringify({ user_id: me.user.id })
            });
            loadDetail(selected);
        } catch (e: any) {
            setError("Error al inscribir: Probablemente ya estés inscrito");
        } finally {
            setIsActionLoading(false); // Changed from true to false based on common pattern for finally blocks
        }
    };

    const handleAddParticipantByName = async () => {
        if (!selected || !newJugadorName.trim()) return;
        setIsActionLoading(true);
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
        } finally {
            setIsActionLoading(false);
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
        <Layout>
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
                            <Button
                                variant="primary"
                                onClick={handleCreate}
                                title="Confirmar creación de torneo"
                                loading={isActionLoading}
                                size="sm"
                            >
                                <CheckCircle2 className="w-5 h-5" />
                            </Button>
                            <Button
                                variant="secondary"
                                onClick={() => setIsCreatingTorneo(false)}
                                title="Cancelar creación de torneo"
                                disabled={isActionLoading}
                                size="sm"
                                className="bg-slate-100 text-slate-500"
                            >
                                <XCircle className="w-5 h-5" />
                            </Button>
                        </div>
                    ) : (
                        <Button
                            variant="primary"
                            onClick={() => setIsCreatingTorneo(true)}
                            className="font-bold py-3 px-6 rounded-2xl shadow-lg shadow-indigo-200"
                            icon={<Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />}
                        >
                            Nuevo Torneo
                        </Button>
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
                                                                    href={((import.meta as any).env.VITE_API_BASE_URL || "") + `/tournaments/${selected}/diploma`}
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

                                {/* Global Results Table */}
                                {detail && detail.participants.length > 0 && (
                                    <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
                                        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                                            <div className="w-8 h-8 bg-indigo-100 rounded-xl flex items-center justify-center">
                                                <Target className="w-4 h-4 text-indigo-600" />
                                            </div>
                                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Clasificación Global</h3>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="border-b border-slate-100">
                                                        <th className="text-left px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Pos</th>
                                                        <th className="text-left px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Jugador</th>
                                                        {/* Per-round columns */}
                                                        {(() => {
                                                            const rounds = [...new Set(detail.matches.map(m => m.round))].sort((a, b) => a - b);
                                                            return rounds.map(r => (
                                                                <th key={r} className="text-center px-3 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">R{r}</th>
                                                            ));
                                                        })()}
                                                        <th className="text-right px-6 py-3 text-[10px] font-black text-indigo-500 uppercase tracking-widest">Total</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {detail.participants
                                                        .sort((a, b) => b.total_points - a.total_points)
                                                        .map((p, i) => {
                                                            const rounds = [...new Set(detail.matches.map(m => m.round))].sort((a, b) => a - b);
                                                            const pointsByRound = rounds.map(r => {
                                                                const roundMatches = detail.matches.filter(m => m.round === r);
                                                                let pts = 0;
                                                                roundMatches.forEach(m => {
                                                                    if (m.player1_id === p.id || m.player2_id === p.id) pts += m.score_12 || 0;
                                                                    if (m.player3_id === p.id || m.player4_id === p.id) pts += m.score_34 || 0;
                                                                });
                                                                return pts;
                                                            });
                                                            const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}`;
                                                            return (
                                                                <tr key={p.id} className={cn(
                                                                    "border-b border-slate-50 transition-colors",
                                                                    i === 0 ? "bg-yellow-50/50" : i === 1 ? "bg-slate-50/50" : i === 2 ? "bg-amber-50/30" : "hover:bg-slate-50"
                                                                )}>
                                                                    <td className="px-6 py-3 text-lg">{medal}</td>
                                                                    <td className="px-4 py-3 font-bold text-slate-900">
                                                                        {p.name || (p.user?.full_name || p.user?.email.split('@')[0] || "Jugador")}
                                                                    </td>
                                                                    {pointsByRound.map((pts, ri) => (
                                                                        <td key={ri} className="text-center px-3 py-3 text-slate-500 font-medium">{pts || "—"}</td>
                                                                    ))}
                                                                    <td className="text-right px-6 py-3 font-black text-indigo-600 text-lg">{p.total_points}</td>
                                                                </tr>
                                                            );
                                                        })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {/* Rounds & Matches */}
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between px-2">
                                        <div className="flex items-center gap-4 flex-wrap">
                                            <h3 className="text-lg font-black text-slate-900 italic uppercase">Gestión de Rondas</h3>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={handleAddMe}
                                                loading={isActionLoading}
                                                className="text-indigo-600 text-[10px] font-black uppercase tracking-widest border border-indigo-100 rounded-full"
                                                title="Inscribirme en el torneo"
                                            >
                                                Inscribirme
                                            </Button>
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
                                                    <button
                                                        onClick={handleAddParticipantByName}
                                                        title="Confirmar añadir jugador"
                                                        aria-label="Confirmar añadir jugador"
                                                        className="text-emerald-500 hover:scale-110"
                                                    >
                                                        <CheckCircle2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => setIsAddingJugador(false)}
                                                        title="Cancelar añadir jugador"
                                                        aria-label="Cancelar añadir jugador"
                                                        className="text-rose-500 hover:scale-110"
                                                    >
                                                        <XCircle className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setIsAddingJugador(true)}
                                                    disabled={isActionLoading}
                                                    className="text-indigo-600 text-[10px] font-black uppercase tracking-widest border border-indigo-100 rounded-full"
                                                    icon={<Plus className="w-3 h-3" />}
                                                    title="Añadir jugador invitado"
                                                >
                                                    Añadir Jugador
                                                </Button>
                                            )}
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleGenerateRounds}
                                            loading={isActionLoading}
                                            className="text-indigo-600 hover:text-indigo-700 text-xs font-black uppercase tracking-widest flex items-center gap-1.5"
                                            title="Generar Rondas de partidos"
                                        >
                                            <Play className="w-3.5 h-3.5" /> Generar Rondas
                                        </Button>
                                    </div>

                                    {/* Matches grouped by round */}
                                    {(() => {
                                        const rounds = [...new Set(detail?.matches.map(m => m.round) || [])].sort((a, b) => a - b);
                                        return rounds.map(roundNum => {
                                            const roundMatches = detail?.matches.filter(m => m.round === roundNum) || [];
                                            return (
                                                <div key={roundNum} className="space-y-3">
                                                    <div className="flex items-center gap-3 px-2">
                                                        <div className="w-7 h-7 bg-indigo-100 rounded-lg flex items-center justify-center">
                                                            <span className="text-xs font-black text-indigo-600">{roundNum}</span>
                                                        </div>
                                                        <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">Ronda {roundNum}</h4>
                                                        <div className="flex-1 h-[1px] bg-slate-100" />
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        {roundMatches.map((m) => {
                                                            const s12 = m.score_12 ?? null;
                                                            const s34 = m.score_34 ?? null;
                                                            const hasScore = s12 !== null && s34 !== null;
                                                            const pairAWins = hasScore && s12! > s34!;
                                                            const pairBWins = hasScore && s34! > s12!;

                                                            return (
                                                                <div key={m.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
                                                                    {/* Header */}
                                                                    <div className="flex items-center justify-between mb-3">
                                                                        <span className="text-[8px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full uppercase tracking-widest">
                                                                            Ronda {m.round}
                                                                        </span>
                                                                        {hasScore && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                                                                    </div>

                                                                    {/* Scoreboard */}
                                                                    <div className="flex items-center gap-2">
                                                                        {/* Pareja A */}
                                                                        <div className={cn(
                                                                            "flex-1 rounded-xl p-3 text-center transition-colors",
                                                                            pairAWins ? "bg-emerald-50 border border-emerald-200" : "bg-slate-50 border border-slate-100"
                                                                        )}>
                                                                            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Pareja A</div>
                                                                            <div className="text-[11px] font-bold text-slate-700 mb-2 leading-tight">
                                                                                {getParticipantName(m.player1_id)}
                                                                                <span className="text-slate-300 mx-1">&</span>
                                                                                {getParticipantName(m.player2_id)}
                                                                            </div>
                                                                            <ScoreInput
                                                                                value={m.score_12}
                                                                                onSave={(val) => handleCreateMatchScore(m.id, val, m.score_34 || 0)}
                                                                                className={cn(
                                                                                    "w-16 mx-auto bg-white border rounded-xl px-3 py-2 text-center text-xl font-black outline-none focus:ring-2",
                                                                                    pairAWins
                                                                                        ? "border-emerald-300 text-emerald-600 focus:ring-emerald-400"
                                                                                        : "border-slate-200 text-indigo-600 focus:ring-indigo-400"
                                                                                )}
                                                                            />
                                                                        </div>

                                                                        {/* VS divider */}
                                                                        <div className="flex flex-col items-center gap-1">
                                                                            <div className="w-[1px] h-4 bg-slate-200" />
                                                                            <span className="text-[10px] font-black text-slate-300 italic">VS</span>
                                                                            <div className="w-[1px] h-4 bg-slate-200" />
                                                                        </div>

                                                                        {/* Pareja B */}
                                                                        <div className={cn(
                                                                            "flex-1 rounded-xl p-3 text-center transition-colors",
                                                                            pairBWins ? "bg-emerald-50 border border-emerald-200" : "bg-slate-50 border border-slate-100"
                                                                        )}>
                                                                            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Pareja B</div>
                                                                            <div className="text-[11px] font-bold text-slate-700 mb-2 leading-tight">
                                                                                {getParticipantName(m.player3_id)}
                                                                                <span className="text-slate-300 mx-1">&</span>
                                                                                {getParticipantName(m.player4_id)}
                                                                            </div>
                                                                            <ScoreInput
                                                                                value={m.score_34}
                                                                                onSave={(val) => handleCreateMatchScore(m.id, m.score_12 || 0, val)}
                                                                                className={cn(
                                                                                    "w-16 mx-auto bg-white border rounded-xl px-3 py-2 text-center text-xl font-black outline-none focus:ring-2",
                                                                                    pairBWins
                                                                                        ? "border-emerald-300 text-emerald-600 focus:ring-emerald-400"
                                                                                        : "border-slate-200 text-slate-900 focus:ring-slate-400"
                                                                                )}
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        });
                                    })()}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
}
