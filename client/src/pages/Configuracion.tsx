import React, { useEffect, useRef, useState } from 'react';
import Layout from '../components/Layout';
import { apiFetch } from '../lib/api';
import { supabase } from '../lib/supabase';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Building2, Save, Upload, Image as ImageIcon, Phone, CreditCard, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Configuracion() {
    const [club, setClub] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState<'idle' | 'ok' | 'error'>('idle');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [formData, setFormData] = useState({
        display_name: '',
        logo_url: '',
        legal_name: '',
        tax_id: '',
        fiscal_address: '',
        phone_whatsapp: '',
        bizum_payee: '',
    });

    useEffect(() => {
        const fetchClub = async () => {
            try {
                const data = await apiFetch<any>('/club');
                setClub(data);
                setFormData({
                    display_name: data.display_name || '',
                    logo_url: data.logo_url || '',
                    legal_name: data.legal_name || '',
                    tax_id: data.tax_id || '',
                    fiscal_address: data.fiscal_address || '',
                    phone_whatsapp: data.phone_whatsapp || '',
                    bizum_payee: data.bizum_payee || '',
                });
            } catch (err) {
                console.error("Error fetching club data:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchClub();
    }, []);

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !supabase) { setUploadStatus('error'); return; }
        setUploading(true);
        setUploadStatus('idle');
        try {
            const ext = file.name.split('.').pop();
            const path = `logos/${club.id}.${ext}`;
            const { error } = await supabase.storage
                .from('club-logos')
                .upload(path, file, { upsert: true, contentType: file.type });
            if (error) throw error;
            const { data } = supabase.storage.from('club-logos').getPublicUrl(path);
            setFormData(f => ({ ...f, logo_url: data.publicUrl }));
            setUploadStatus('ok');
        } catch {
            setUploadStatus('error');
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const updated = await apiFetch<any>('/club', {
                method: 'PATCH',
                body: JSON.stringify(formData)
            });
            setClub(updated);
            alert("Configuración guardada correctamente");
        } catch (err) {
            console.error("Error updating club:", err);
            alert("Error al guardar la configuración");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <Layout>
                <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                    <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Cargando perfil...</p>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="max-w-4xl mx-auto space-y-8 pb-20">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-primary-500 mb-2">
                        <Building2 className="w-5 h-5" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em]">Perfil del Club</span>
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight italic uppercase">
                        Configuración <span className="text-primary-600">General</span>
                    </h1>
                    <p className="text-slate-500 font-medium">Personaliza la identidad visual de tu club en la App móvil y reportes.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Branding Section */}
                    <Card className="p-8 border-none shadow-premium bg-white rounded-[2rem]">
                        <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                            <ImageIcon className="w-5 h-5 text-primary-500" />
                            Identidad Visual
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <label className="block space-y-2">
                                    <span className="text-xs font-black uppercase tracking-widest text-slate-400">Nombre Comercial (App)</span>
                                    <input
                                        type="text"
                                        className="w-full bg-slate-50 border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                        placeholder="Ej: Padel Master Club"
                                        value={formData.display_name}
                                        onChange={e => setFormData({ ...formData, display_name: e.target.value })}
                                    />
                                </label>

                                <div className="space-y-3">
                                    <span className="text-xs font-black uppercase tracking-widest text-slate-400">Logotipo del Club</span>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        aria-label="Subir logotipo del club"
                                        title="Subir logotipo del club"
                                        className="hidden"
                                        onChange={handleLogoUpload}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={uploading}
                                        className="w-full flex items-center justify-center gap-2 bg-primary-50 hover:bg-primary-100 border-2 border-dashed border-primary-200 hover:border-primary-400 rounded-xl px-4 py-4 text-sm font-bold text-primary-600 transition-all disabled:opacity-50"
                                    >
                                        {uploading ? (
                                            <><Loader2 className="w-4 h-4 animate-spin" /> Subiendo...</>
                                        ) : (
                                            <><Upload className="w-4 h-4" /> Seleccionar archivo</>
                                        )}
                                    </button>
                                    {uploadStatus === 'ok' && (
                                        <p className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                                            <CheckCircle2 className="w-4 h-4" /> Logo subido correctamente
                                        </p>
                                    )}
                                    {uploadStatus === 'error' && (
                                        <p className="flex items-center gap-1 text-xs text-rose-600 font-medium">
                                            <XCircle className="w-4 h-4" /> Error al subir. Verifica el bucket en Supabase.
                                        </p>
                                    )}
                                    <p className="text-[10px] text-slate-400 italic">PNG, JPG o SVG. Máx. 2MB.</p>
                                </div>
                            </div>

                            <div className="flex flex-col items-center justify-center bg-slate-50 rounded-3xl p-8 border-2 border-dashed border-slate-200">
                                {formData.logo_url ? (
                                    <img
                                        src={formData.logo_url}
                                        alt="Vista previa logo"
                                        className="max-h-32 object-contain rounded-lg shadow-md mb-4"
                                        onError={(e: any) => e.target.src = 'https://placehold.co/200x200?text=Logo+Invalido'}
                                    />
                                ) : (
                                    <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                        <ImageIcon className="w-10 h-10 text-slate-300" />
                                    </div>
                                )}
                                <p className="font-bold text-slate-400 uppercase tracking-widest text-[10px]">Vista Previa Logotipo</p>
                            </div>
                        </div>
                    </Card>

                    {/* Contact & Bizum Section */}
                    <Card className="p-8 border-none shadow-premium bg-white rounded-[2rem]">
                        <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                            <Phone className="w-5 h-5 text-emerald-500" />
                            Contacto y Pagos
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <label className="block space-y-2">
                                <span className="text-xs font-black uppercase tracking-widest text-slate-400">WhatsApp del Club</span>
                                <input
                                    type="text"
                                    className="w-full bg-slate-50 border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                    placeholder="+34 600 000 000"
                                    value={formData.phone_whatsapp}
                                    onChange={e => setFormData({ ...formData, phone_whatsapp: e.target.value })}
                                />
                            </label>
                            <label className="block space-y-2">
                                <span className="text-xs font-black uppercase tracking-widest text-slate-400">Nombre Pago Bizum</span>
                                <input
                                    type="text"
                                    className="w-full bg-slate-50 border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                    placeholder="Ej: PADELMASTER"
                                    value={formData.bizum_payee}
                                    onChange={e => setFormData({ ...formData, bizum_payee: e.target.value })}
                                />
                            </label>
                        </div>
                    </Card>

                    {/* Fiscal Section */}
                    <Card className="p-8 border-none shadow-premium bg-white rounded-[2rem]">
                        <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                            <CreditCard className="w-5 h-5 text-slate-400" />
                            Datos Fiscales (Facturación)
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <label className="block space-y-2">
                                <span className="text-xs font-black uppercase tracking-widest text-slate-400">Razón Social</span>
                                <input
                                    type="text"
                                    className="w-full bg-slate-50 border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                    value={formData.legal_name}
                                    onChange={e => setFormData({ ...formData, legal_name: e.target.value })}
                                />
                            </label>
                            <label className="block space-y-2">
                                <span className="text-xs font-black uppercase tracking-widest text-slate-400">CIF / NIF</span>
                                <input
                                    type="text"
                                    className="w-full bg-slate-50 border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                    value={formData.tax_id}
                                    onChange={e => setFormData({ ...formData, tax_id: e.target.value })}
                                />
                            </label>
                            <label className="block space-y-2 md:col-span-2">
                                <span className="text-xs font-black uppercase tracking-widest text-slate-400">Dirección Fiscal</span>
                                <input
                                    type="text"
                                    className="w-full bg-slate-50 border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                    value={formData.fiscal_address}
                                    onChange={e => setFormData({ ...formData, fiscal_address: e.target.value })}
                                />
                            </label>
                        </div>
                    </Card>

                    <div className="flex justify-end">
                        <Button
                            size="lg"
                            className="px-12 py-6 rounded-2xl shadow-xl shadow-primary-500/20"
                            disabled={saving}
                            icon={saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        >
                            {saving ? "Guardando..." : "Guardar Cambios"}
                        </Button>
                    </div>
                </form>
            </div>
        </Layout>
    );
}
