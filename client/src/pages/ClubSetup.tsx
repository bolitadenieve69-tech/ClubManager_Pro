import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../lib/api';
import { Button } from '../components/ui/Button';
import { motion } from 'framer-motion';
import {
    Building2, FileText, CreditCard, ChevronRight, CheckCircle2,
    Loader2, Globe, Phone, Receipt, Percent, ImageIcon, Landmark
} from 'lucide-react';
import { PadelLogo } from '../components/PadelLogo';

const STEPS = [
    { id: 1, label: 'Tu Club',       icon: Building2,  description: 'Nombre y logo' },
    { id: 2, label: 'Datos Fiscales', icon: Landmark,   description: 'NIF y dirección' },
    { id: 3, label: 'Pagos',          icon: CreditCard, description: 'Bizum y contacto' },
];

const inputClass = "w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all placeholder:text-slate-300";
const labelClass = "text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1";

export default function ClubSetup() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const [form, setForm] = useState({
        display_name: '',
        legal_name: '',
        logo_url: '',
        tax_id: '',
        fiscal_address: '',
        default_vat: '21',
        currency: 'EUR',
        invoice_prefix: 'F-',
        phone_whatsapp: '',
        bizum_payee: '',
    });

    const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
        setForm(f => ({ ...f, [k]: e.target.value }));

    const handleFinish = async () => {
        if (!form.display_name.trim()) {
            setError('El nombre del club es obligatorio.');
            return;
        }
        setSaving(true);
        setError('');
        try {
            await apiFetch('/club', {
                method: 'PATCH',
                body: JSON.stringify({
                    display_name: form.display_name || null,
                    legal_name: form.legal_name || null,
                    logo_url: form.logo_url || null,
                    tax_id: form.tax_id || null,
                    fiscal_address: form.fiscal_address || null,
                    default_vat: form.default_vat ? parseFloat(form.default_vat) : null,
                    currency: form.currency || 'EUR',
                    invoice_prefix: form.invoice_prefix || null,
                    phone_whatsapp: form.phone_whatsapp || null,
                    bizum_payee: form.bizum_payee || null,
                })
            });
            navigate('/dashboard');
        } catch (err: any) {
            setError(err.message || 'Error al guardar. Inténtalo de nuevo.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
            {/* Background */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-500/5 rounded-full blur-[120px] -mr-64 -mt-64" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-[100px] -ml-48 -mb-48" />

            <div className="w-full max-w-lg relative z-10">
                {/* Brand */}
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-500/10 border border-primary-500/20 rounded-[1.5rem] mb-4">
                        <PadelLogo className="w-9 h-9 text-primary-400" />
                    </div>
                    <h1 className="text-3xl font-black text-white tracking-tighter italic uppercase">
                        Configura tu Club
                    </h1>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-2">
                        Completa los datos para empezar a gestionar
                    </p>
                </motion.div>

                {/* Step indicators */}
                <div className="flex items-center justify-center gap-2 mb-8">
                    {STEPS.map((s, i) => (
                        <React.Fragment key={s.id}>
                            <div
                                className={`flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                                    step === s.id
                                        ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30'
                                        : step > s.id
                                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20'
                                        : 'bg-white/5 text-slate-500 border border-white/5'
                                }`}
                            >
                                {step > s.id ? <CheckCircle2 className="w-3 h-3" /> : <s.icon className="w-3 h-3" />}
                                {s.label}
                            </div>
                            {i < STEPS.length - 1 && <div className="w-4 h-px bg-white/10" />}
                        </React.Fragment>
                    ))}
                </div>

                {/* Card */}
                <motion.div
                    key={step}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                    className="bg-white rounded-[2.5rem] p-10 shadow-2xl"
                >
                    {error && (
                        <div className="mb-6 bg-rose-50 border border-rose-100 text-rose-600 p-4 rounded-2xl text-xs font-bold">
                            {error}
                        </div>
                    )}

                    {step === 1 && (
                        <div className="space-y-6">
                            <div className="space-y-1 mb-6">
                                <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">Tu Club</h2>
                                <p className="text-xs font-bold text-slate-400">Cómo aparecerá tu club en la app y facturas</p>
                            </div>
                            <div className="space-y-2">
                                <label className={labelClass}>Nombre del Club *</label>
                                <input className={inputClass} placeholder="Ej: Padel Club Marbella" value={form.display_name} onChange={set('display_name')} />
                            </div>
                            <div className="space-y-2">
                                <label className={labelClass}>Nombre Legal / Razón Social</label>
                                <input className={inputClass} placeholder="Ej: Padel Marbella S.L." value={form.legal_name} onChange={set('legal_name')} />
                            </div>
                            <div className="space-y-2">
                                <label className={labelClass}>URL del Logotipo (opcional)</label>
                                <div className="flex gap-3">
                                    <input className={inputClass} placeholder="https://tuclub.com/logo.png" value={form.logo_url} onChange={set('logo_url')} />
                                    {form.logo_url && (
                                        <img src={form.logo_url} alt="logo preview" className="w-12 h-12 rounded-xl object-contain border border-slate-100 bg-slate-50 flex-shrink-0"
                                            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6">
                            <div className="space-y-1 mb-6">
                                <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">Datos Fiscales</h2>
                                <p className="text-xs font-bold text-slate-400">Aparecerán en las facturas que emitas</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className={labelClass}>NIF / CIF</label>
                                    <input className={inputClass} placeholder="B12345678" value={form.tax_id} onChange={set('tax_id')} />
                                </div>
                                <div className="space-y-2">
                                    <label className={labelClass}>IVA por defecto (%)</label>
                                    <input className={inputClass} type="number" min="0" max="100" placeholder="21" value={form.default_vat} onChange={set('default_vat')} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className={labelClass}>Dirección Fiscal</label>
                                <input className={inputClass} placeholder="Calle Ejemplo 1, 29600 Marbella, Málaga" value={form.fiscal_address} onChange={set('fiscal_address')} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className={labelClass}>Moneda</label>
                                    <select className={inputClass} value={form.currency} onChange={set('currency')}>
                                        <option value="EUR">EUR — Euro</option>
                                        <option value="USD">USD — Dólar</option>
                                        <option value="GBP">GBP — Libra</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className={labelClass}>Prefijo Factura</label>
                                    <input className={inputClass} placeholder="F-" value={form.invoice_prefix} onChange={set('invoice_prefix')} />
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-6">
                            <div className="space-y-1 mb-6">
                                <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">Pagos y Contacto</h2>
                                <p className="text-xs font-bold text-slate-400">Para que los socios puedan contactarte y pagar</p>
                            </div>
                            <div className="space-y-2">
                                <label className={labelClass}>Número WhatsApp del Club</label>
                                <input className={inputClass} placeholder="+34 600 000 000" value={form.phone_whatsapp} onChange={set('phone_whatsapp')} />
                                <p className="text-[10px] text-slate-400 pl-1">Los socios enviarán confirmaciones de pago a este número</p>
                            </div>
                            <div className="space-y-2">
                                <label className={labelClass}>Número Bizum (receptor de pagos)</label>
                                <input className={inputClass} placeholder="+34 600 000 000" value={form.bizum_payee} onChange={set('bizum_payee')} />
                                <p className="text-[10px] text-slate-400 pl-1">Aparecerá en la app móvil como destino de pago Bizum</p>
                            </div>

                            {/* Summary */}
                            <div className="bg-slate-50 rounded-2xl p-5 space-y-2 border border-slate-100">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Resumen</p>
                                <div className="flex items-center gap-2 text-sm">
                                    <Building2 className="w-3.5 h-3.5 text-primary-500 flex-shrink-0" />
                                    <span className="font-bold text-slate-900 truncate">{form.display_name || '—'}</span>
                                </div>
                                {form.tax_id && <div className="flex items-center gap-2 text-xs text-slate-500"><Landmark className="w-3 h-3" />{form.tax_id}</div>}
                                {form.phone_whatsapp && <div className="flex items-center gap-2 text-xs text-slate-500"><Phone className="w-3 h-3" />{form.phone_whatsapp}</div>}
                            </div>
                        </div>
                    )}

                    {/* Navigation */}
                    <div className="flex gap-3 mt-8">
                        {step > 1 && (
                            <Button variant="secondary" className="flex-1 py-5 rounded-2xl" onClick={() => { setError(''); setStep(s => s - 1); }}>
                                ATRÁS
                            </Button>
                        )}
                        {step < 3 ? (
                            <Button
                                variant="primary"
                                className="flex-[2] py-5 rounded-2xl shadow-lg shadow-primary-500/20"
                                onClick={() => {
                                    if (step === 1 && !form.display_name.trim()) {
                                        setError('El nombre del club es obligatorio.');
                                        return;
                                    }
                                    setError('');
                                    setStep(s => s + 1);
                                }}
                                icon={<ChevronRight className="w-4 h-4" />}
                            >
                                CONTINUAR
                            </Button>
                        ) : (
                            <Button
                                variant="primary"
                                className="flex-[2] py-5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/20"
                                onClick={handleFinish}
                                loading={saving}
                                icon={<CheckCircle2 className="w-4 h-4" />}
                            >
                                ACTIVAR MI CLUB
                            </Button>
                        )}
                    </div>

                    <p
                        className="text-center text-[10px] font-bold text-slate-300 mt-4 cursor-pointer hover:text-slate-500 transition-colors"
                        onClick={() => navigate('/dashboard')}
                    >
                        Completar más tarde
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
