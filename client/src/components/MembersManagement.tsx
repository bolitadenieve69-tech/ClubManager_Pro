import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { Users, UserPlus, Send, CheckCircle, Clock, Search, ShieldCheck } from 'lucide-react';
import { cn } from '../lib/utils';
import InvitationModal from './InvitationModal';

interface Member {
    id: string;
    full_name: string;
    whatsapp_phone: string;
    status: 'PENDING' | 'APPROVED' | 'BLOCKED';
}

export default function MembersManagement() {
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

    const fetchMembers = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:3000/members', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            setMembers(data.members || []);
        } catch (err) {
            console.error("Error fetching members:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMembers();
    }, []);

    const filteredMembers = members.filter(m =>
        m.full_name.toLowerCase().includes(search.toLowerCase()) ||
        m.whatsapp_phone.includes(search)
    );

    return (
        <Card className="p-8 border-none shadow-premium bg-white/80 backdrop-blur-xl">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-6">
                <div className="flex items-center gap-4">
                    <div className="p-4 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-500/20">
                        <Users className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Directorio</h2>
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-1 flex items-center gap-2">
                            <ShieldCheck className="w-3 h-3 text-emerald-500" />
                            Acceso Verificado
                        </p>
                    </div>
                </div>

                <Button
                    variant="primary"
                    size="sm"
                    icon={<UserPlus className="w-4 h-4" />}
                    onClick={() => setIsInviteModalOpen(true)}
                    title="Invitar nuevo miembro"
                >
                    INVITAR
                </Button>
            </div>

            <div className="relative mb-8 group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-primary-500">
                    <Search className="h-4 w-4 text-slate-300" />
                </div>
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar por nombre o ID..."
                    className="block w-full pl-11 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-xs font-black text-slate-700 placeholder:text-slate-300 focus:bg-white focus:border-primary-500/20 focus:ring-0 transition-all shadow-inner"
                    title="Buscar miembros"
                />
            </div>

            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                <AnimatePresence mode="popLayout">
                    {filteredMembers.map((member, i) => (
                        <motion.div
                            key={member.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ delay: i * 0.05 }}
                            className="flex items-center justify-between p-5 bg-white border border-slate-100 rounded-2xl hover:border-primary-100 hover:shadow-xl hover:shadow-primary-900/5 transition-all group"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center font-black text-slate-400 group-hover:bg-primary-50 group-hover:text-primary-600 transition-all group-hover:rotate-3">
                                    {member.full_name.charAt(0)}
                                </div>
                                <div>
                                    <h4 className="text-sm font-black text-slate-900 tracking-tight">{member.full_name}</h4>
                                    <p className="text-[10px] font-bold text-slate-400 font-mono mt-0.5 tracking-tighter">{member.whatsapp_phone}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <Badge variant={member.status === 'APPROVED' ? 'success' : 'neutral'} className="text-[9px] px-2.5 py-1">
                                    {member.status === 'APPROVED' ? (
                                        <span className="flex items-center gap-1.5 font-black"><CheckCircle className="w-3 h-3" /> ACTIVO</span>
                                    ) : (
                                        <span className="flex items-center gap-1.5 font-black"><Clock className="w-3 h-3" /> ESPERA</span>
                                    )}
                                </Badge>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-10 w-10 p-0 rounded-xl hover:bg-primary-50"
                                    title={`Enviar invitación a ${member.full_name}`}
                                >
                                    <Send className="w-4 h-4 text-slate-300 group-hover:text-primary-600 transition-colors" />
                                </Button>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            <InvitationModal
                isOpen={isInviteModalOpen}
                onClose={() => setIsInviteModalOpen(false)}
                onSuccess={() => fetchMembers()}
            />
        </Card>
    );
}
