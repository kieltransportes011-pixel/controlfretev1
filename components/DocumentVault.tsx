import React, { useState, useRef } from 'react';
import { Document, Vehicle, DocumentType } from '../types';
import { Card } from './Card';
import { Button } from './Button';
import { formatDate } from '../utils';
import { Cloud, Plus, X, Calendar, FileText, Trash2, ShieldAlert, Camera, ExternalLink, Filter, User as UserIcon, Truck, Loader2 } from 'lucide-react';
import { supabase } from '../supabase';

interface DocumentVaultProps {
    documents: Document[];
    vehicles: Vehicle[];
    user: any;
    onAddDocument: (doc: Omit<Document, 'id' | 'user_id' | 'created_at' | 'notified'>) => Promise<void>;
    onDeleteDocument: (id: string) => Promise<void>;
    onBack: () => void;
}

const DOC_TYPES: Record<DocumentType, string> = {
    CNH: 'CNH (Habilitação)',
    ANTT: 'ANTT (Registro)',
    CRLV: 'CRLV (Veículo)',
    EXAMINATION: 'Exame Toxicológico',
    INSURANCE: 'Seguro / Apólice',
    OTHER: 'Outros Documentos'
};

export const DocumentVault: React.FC<DocumentVaultProps> = ({ documents, vehicles, user, onAddDocument, onDeleteDocument, onBack }) => {
    const [showForm, setShowForm] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Form State
    const [type, setType] = useState<DocumentType>('CNH');
    const [vehicleId, setVehicleId] = useState<string>('');
    const [docNumber, setDocNumber] = useState('');
    const [expiryDate, setExpiryDate] = useState('');
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedFile && !docNumber) {
            alert('Selecione um arquivo ou informe o número do documento.');
            return;
        }

        try {
            setUploading(true);
            let imageUrl = '';

            if (selectedFile) {
                const fileExt = selectedFile.name.split('.').pop();
                const fileName = `${user.id}/${Date.now()}.${fileExt}`;
                const filePath = fileName;

                const { error: uploadError } = await supabase.storage
                    .from('documents')
                    .upload(filePath, selectedFile);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(filePath);
                imageUrl = publicUrl;
            }

            await onAddDocument({
                type,
                vehicle_id: vehicleId || undefined,
                doc_number: docNumber,
                expiry_date: expiryDate || undefined,
                image_url: imageUrl || undefined
            });

            setShowForm(false);
            resetForm();
        } catch (error) {
            console.error(error);
            alert('Erro ao salvar documento');
        } finally {
            setUploading(false);
        }
    };

    const resetForm = () => {
        setType('CNH');
        setVehicleId('');
        setDocNumber('');
        setExpiryDate('');
        setPreviewUrl(null);
        setSelectedFile(null);
    };

    const isExpiringSoon = (dateStr?: string) => {
        if (!dateStr) return false;
        const expiry = new Date(dateStr);
        const today = new Date();
        const diffDays = (expiry.getTime() - today.getTime()) / (1000 * 3600 * 24);
        return diffDays >= 0 && diffDays <= 30;
    };

    const isExpired = (dateStr?: string) => {
        if (!dateStr) return false;
        const expiry = new Date(dateStr);
        const today = new Date();
        return expiry < today;
    };

    return (
        <div className="pb-24 space-y-6 animate-fadeIn">
            <header className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 -m-4 mb-2 sticky top-0 z-10 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="p-2 -ml-2 text-slate-400 hover:text-brand transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                    <div>
                        <h1 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Cofre de Documentos</h1>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{documents.length} Arquivos Salvos</p>
                    </div>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="bg-blue-600 text-white p-2.5 rounded-xl shadow-lg shadow-blue-600/20 hover:scale-105 transition-transform"
                >
                    <Plus className="w-5 h-5" />
                </button>
            </header>

            {/* Expiry Alerts */}
            {documents.some(d => isExpired(d.expiry_date) || isExpiringSoon(d.expiry_date)) && (
                <Card className="bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30 p-4 flex flex-col gap-3">
                    <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                        <ShieldAlert className="w-4 h-4" />
                        <h3 className="text-xs font-black uppercase tracking-tight">Alertas de Vencimento</h3>
                    </div>
                    <div className="space-y-2">
                        {documents.filter(d => isExpired(d.expiry_date) || isExpiringSoon(d.expiry_date)).map(d => (
                            <div key={d.id} className="flex items-center justify-between bg-white/50 dark:bg-black/20 p-2 rounded-lg border border-red-50 dark:border-red-900/20 text-[10px] font-bold">
                                <span className="text-slate-700 dark:text-slate-300 uppercase">{DOC_TYPES[d.type]}</span>
                                <span className={isExpired(d.expiry_date) ? 'text-red-600' : 'text-orange-500'}>
                                    {isExpired(d.expiry_date) ? 'VENCIDO' : `VENCE EM ${new Date(d.expiry_date!).toLocaleDateString('pt-BR')}`}
                                </span>
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            {/* Document Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {documents.map((doc) => {
                    const v = vehicles.find(veh => veh.id === doc.vehicle_id);
                    const expiringSoon = isExpiringSoon(doc.expiry_date);
                    const expired = isExpired(doc.expiry_date);

                    return (
                        <Card key={doc.id} className={`p-4 group relative overflow-hidden transition-all hover:border-blue-400/50 ${expired ? 'border-red-200 bg-red-50/10' : ''}`}>
                            <div className="flex items-start gap-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${doc.image_url ? 'bg-slate-100 dark:bg-slate-800' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-500'}`}>
                                    {doc.image_url ? (
                                        <img src={doc.image_url} alt="Doc" className="w-full h-full object-cover rounded-xl" />
                                    ) : (
                                        <FileText className="w-6 h-6" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase truncate tracking-tight">
                                        {DOC_TYPES[doc.type]}
                                    </h3>
                                    <div className="flex flex-col gap-1 mt-1">
                                        {doc.doc_number && (
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{doc.doc_number}</p>
                                        )}
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center gap-1 text-[9px] font-black text-slate-400 uppercase">
                                                {v ? <><Truck className="w-3 h-3" /> {v.plate}</> : <><UserIcon className="w-3 h-3" /> Pessoal</>}
                                            </div>
                                            {doc.expiry_date && (
                                                <div className={`flex items-center gap-1 text-[9px] font-black uppercase ${expired ? 'text-red-500' : (expiringSoon ? 'text-orange-500' : 'text-slate-400')}`}>
                                                    <Calendar className="w-3 h-3" />
                                                    {formatDate(doc.expiry_date)}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 flex gap-2">
                                {doc.image_url && (
                                    <button
                                        onClick={() => window.open(doc.image_url, '_blank')}
                                        className="flex-1 flex items-center justify-center gap-2 py-2 bg-slate-50 dark:bg-slate-800 hover:bg-blue-600 hover:text-white rounded-lg text-[9px] font-black uppercase transition-all"
                                    >
                                        <ExternalLink className="w-3 b-3" /> Ver Arquivo
                                    </button>
                                )}
                                <button
                                    onClick={() => { if (confirm('Excluir documento permanentemente?')) onDeleteDocument(doc.id); }}
                                    className="p-2 text-slate-300 hover:text-accent-error transition-all"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </Card>
                    );
                })}

                {documents.length === 0 && (
                    <div className="col-span-full text-center py-20 opacity-30">
                        <Cloud className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                        <h3 className="text-sm font-black uppercase tracking-widest">Sua nuvem está vazia</h3>
                        <p className="text-xs mt-1">Trabalhe tranquilo com seus documentos salvos com segurança.</p>
                    </div>
                )}
            </div>

            {showForm && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <Card className="w-full max-w-lg space-y-4 animate-slideUp">
                        <div className="flex justify-between items-center">
                            <h2 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">Adicionar Documento</h2>
                            <button
                                onClick={() => { setShowForm(false); resetForm(); }}
                                className="text-slate-400 p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
                                disabled={uploading}
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Tipo de Documento *</label>
                                    <select
                                        value={type}
                                        onChange={(e) => setType(e.target.value as any)}
                                        className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl outline-none focus:border-blue-500 font-bold"
                                    >
                                        {Object.entries(DOC_TYPES).map(([key, label]) => (
                                            <option key={key} value={key}>{label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Vincular Veículo</label>
                                    <select
                                        value={vehicleId}
                                        onChange={(e) => setVehicleId(e.target.value)}
                                        className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl outline-none focus:border-blue-500 font-bold"
                                    >
                                        <option value="">Documento Pessoal (Geral)</option>
                                        {vehicles.map(v => (
                                            <option key={v.id} value={v.id}>{v.plate} ({v.model})</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Número do Doc.</label>
                                    <input
                                        type="text"
                                        value={docNumber}
                                        onChange={(e) => setDocNumber(e.target.value)}
                                        placeholder="Ex: 12345678"
                                        className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl outline-none focus:border-blue-500 font-bold"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Data de Vencimento</label>
                                    <input
                                        type="date"
                                        value={expiryDate}
                                        onChange={(e) => setExpiryDate(e.target.value)}
                                        className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl outline-none focus:border-blue-500 font-bold"
                                    />
                                </div>
                            </div>

                            {/* Upload Area */}
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className={`relative h-40 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${previewUrl ? 'border-blue-400 bg-blue-50/50' : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                            >
                                {previewUrl ? (
                                    <>
                                        <img src={previewUrl} alt="Preview" className="h-full w-full object-contain p-2" />
                                        <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); setPreviewUrl(null); setSelectedFile(null); }}
                                            className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full shadow-lg"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-600">
                                            <Camera className="w-6 h-6" />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-tight">Anexar Foto do Documento</p>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">JPG ou PNG</p>
                                        </div>
                                    </>
                                )}
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileSelect}
                                    accept="image/*"
                                    className="hidden"
                                />
                            </div>

                            <Button
                                fullWidth
                                type="submit"
                                className="h-14 bg-blue-600 hover:bg-blue-700"
                                disabled={uploading}
                            >
                                {uploading ? <><Loader2 className="w-5 h-5 animate-spin" /> SALVANDO NO COFRE...</> : 'SALVAR DOCUMENTO'}
                            </Button>
                        </form>
                    </Card>
                </div>
            )}
        </div>
    );
};
