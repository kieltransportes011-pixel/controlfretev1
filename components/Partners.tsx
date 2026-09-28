import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabase';
import { User, Partner, PartnerOffer, PartnerLead } from '../types';
import { Button } from './Button';
import { Card } from './Card';
import {
    Handshake, ArrowLeft, Loader2, Search, Copy, CheckCircle, Star,
    MessageCircle, Globe, MapPin, Wrench, Fuel, Utensils, Building2,
    FileText, Package, Disc, Tag, Sparkles
} from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

interface PartnersProps {
    user: User;
    onBack: () => void;
}

type PartnersView = 'LIST' | 'DETAIL';

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
    'Pneus': Disc,
    'Peças': Package,
    'Combustível': Fuel,
    'Alimentação': Utensils,
    'Hospedagem': Building2,
    'Oficina Mecânica': Wrench,
    'Documentação': FileText,
};

const getCategoryIcon = (category: string) => CATEGORY_ICONS[category] || Tag;

export const Partners: React.FC<PartnersProps> = ({ user, onBack }) => {
    const [view, setView] = useState<PartnersView>('LIST');
    const [partners, setPartners] = useState<Partner[]>([]);
    const [offers, setOffers] = useState<PartnerOffer[]>([]);
    const [myLeads, setMyLeads] = useState<PartnerLead[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
    const [sendingOfferId, setSendingOfferId] = useState<string | null>(null);
    const [codeCopied, setCodeCopied] = useState(false);
    const { error: showError, success: showSuccess } = useToast();

    useEffect(() => {
        fetchData();
    }, [user.id]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [partnersRes, offersRes, leadsRes] = await Promise.all([
                supabase.from('partners').select('*').order('is_featured', { ascending: false }).order('name'),
                supabase.from('partner_offers').select('*').order('created_at', { ascending: false }),
                supabase.from('partner_leads').select('*').eq('user_id', user.id),
            ]);
            if (partnersRes.error) throw partnersRes.error;
            setPartners(partnersRes.data || []);
            setOffers(offersRes.data || []);
            setMyLeads(leadsRes.data || []);
        } catch (error) {
            console.error('Error fetching partners:', error);
            showError('Não foi possível carregar os parceiros.');
        } finally {
            setLoading(false);
        }
    };

    const categories = useMemo(() => {
        const set = new Set(partners.map(p => p.category));
        return ['Todos', ...Array.from(set)];
    }, [partners]);

    const getPartnerOffers = (partnerId: string) => offers.filter(o => o.partner_id === partnerId && o.is_active);

    const filteredPartners = useMemo(() => {
        return partners.filter(p => {
            if (selectedCategory !== 'Todos' && p.category !== selectedCategory) return false;
            if (searchTerm && !p.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
            return true;
        });
    }, [partners, selectedCategory, searchTerm]);

    const hasLeadForOffer = (offerId: string) => myLeads.some(l => l.offer_id === offerId);

    const handleCopyCode = async () => {
        if (!user.partner_code) return;
        await navigator.clipboard.writeText(user.partner_code);
        setCodeCopied(true);
        setTimeout(() => setCodeCopied(false), 2000);
    };

    const handleSendInterest = async (partner: Partner, offer: PartnerOffer) => {
        setSendingOfferId(offer.id);
        try {
            const { error } = await supabase.from('partner_leads').insert([{
                user_id: user.id,
                partner_id: partner.id,
                offer_id: offer.id,
                user_name: user.name,
                user_partner_code: user.partner_code,
                status: 'novo',
            }]);
            if (error) throw error;
            setMyLeads(prev => [...prev, {
                id: 'temp', user_id: user.id, partner_id: partner.id, offer_id: offer.id,
                status: 'novo', created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
            }]);
            showSuccess('Seu interesse foi registrado.');
        } catch (error: any) {
            console.error('Error registering lead:', error);
            showError('Erro ao registrar interesse: ' + error.message);
        } finally {
            setSendingOfferId(null);
        }
    };

    const handleTalkToPartner = (partner: Partner) => {
        if (!partner.whatsapp_phone) return;
        const codeSuffix = user.partner_code ? ` (código ${user.partner_code})` : '';
        const message = `Olá! Sou usuário do Control Frete${codeSuffix} e gostaria de utilizar o benefício oferecido pelo Control Frete Parceiros.`;
        window.open(`https://wa.me/${partner.whatsapp_phone}?text=${encodeURIComponent(message)}`, '_blank');
    };

    return (
        <div className="space-y-6 pb-24">
            <header className="flex items-center gap-4">
                <Button variant="ghost" onClick={() => view === 'LIST' ? onBack() : setView('LIST')} className="p-2">
                    <ArrowLeft className="w-6 h-6" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-base-text dark:text-white">Control Frete Parceiros</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">
                        Benefícios e condições especiais para quem trabalha com transporte.
                    </p>
                </div>
            </header>

            {view === 'LIST' && (
                <div className="space-y-6">
                    {user.partner_code && (
                        <Card className="space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center shrink-0">
                                    <Handshake className="w-5 h-5 text-pink-500" />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Meu código Control Frete</p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Apresente ao parceiro quando solicitado</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 p-3 bg-[#F5F7FA] dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                                <span className="flex-1 text-lg text-slate-800 dark:text-white font-mono font-bold tracking-wider">
                                    {user.partner_code}
                                </span>
                                <button
                                    onClick={handleCopyCode}
                                    className="p-2 text-slate-400 hover:text-brand transition-colors shrink-0"
                                    title="Copiar código"
                                >
                                    {codeCopied ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                </button>
                            </div>
                        </Card>
                    )}

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Buscar parceiro..."
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:border-brand dark:text-white text-sm"
                        />
                    </div>

                    {categories.length > 1 && (
                        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide transition-colors ${selectedCategory === cat
                                        ? 'bg-brand text-white'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                                        }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    )}

                    {loading ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="w-8 h-8 animate-spin text-brand" />
                        </div>
                    ) : filteredPartners.length === 0 ? (
                        <div className="text-center py-12 bg-slate-50 dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                            <Handshake className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                            <p className="text-slate-500 font-medium">Nenhum parceiro encontrado.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {filteredPartners.map(partner => {
                                const partnerOffers = getPartnerOffers(partner.id);
                                const mainOffer = partnerOffers[0];
                                const CategoryIcon = getCategoryIcon(partner.category);
                                return (
                                    <Card
                                        key={partner.id}
                                        className="p-4 hover:shadow-md transition-shadow cursor-pointer border border-slate-200 dark:border-slate-800 relative"
                                        onClick={() => { setSelectedPartner(partner); setView('DETAIL'); }}
                                    >
                                        {partner.is_featured && (
                                            <span className="absolute top-3 right-3 text-[9px] font-bold uppercase tracking-wide bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 px-2 py-1 rounded-full flex items-center gap-1">
                                                <Star className="w-3 h-3 fill-current" /> Destaque
                                            </span>
                                        )}
                                        <div className="flex items-center gap-3 mb-3">
                                            {partner.logo_url ? (
                                                <img src={partner.logo_url} alt={partner.name} className="w-12 h-12 rounded-lg object-cover border border-slate-200 dark:border-slate-700" />
                                            ) : (
                                                <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                                    <CategoryIcon className="w-6 h-6 text-slate-400" />
                                                </div>
                                            )}
                                            <div className="min-w-0">
                                                <h4 className="font-bold text-base-text dark:text-white truncate">{partner.name}</h4>
                                                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wide">{partner.category}</span>
                                            </div>
                                        </div>
                                        {mainOffer && (
                                            <p className="text-sm text-slate-600 dark:text-slate-300 font-medium line-clamp-2 mb-2">{mainOffer.title}</p>
                                        )}
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-bold text-brand dark:text-brand-300 bg-brand/10 px-2 py-1 rounded-full flex items-center gap-1">
                                                <Sparkles className="w-3 h-3" /> Benefício Control Frete
                                            </span>
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {view === 'DETAIL' && selectedPartner && (
                <div className="space-y-6">
                    <Card className="p-6">
                        <div className="flex items-center gap-4 mb-4">
                            {selectedPartner.logo_url ? (
                                <img src={selectedPartner.logo_url} alt={selectedPartner.name} className="w-16 h-16 rounded-xl object-cover border border-slate-200 dark:border-slate-700" />
                            ) : (
                                <div className="w-16 h-16 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                    {React.createElement(getCategoryIcon(selectedPartner.category), { className: "w-8 h-8 text-slate-400" })}
                                </div>
                            )}
                            <div>
                                <h2 className="text-xl font-bold text-base-text dark:text-white">{selectedPartner.name}</h2>
                                <span className="text-xs text-slate-400 uppercase font-bold tracking-wide">{selectedPartner.category}</span>
                                {selectedPartner.is_featured && (
                                    <span className="ml-2 text-[9px] font-bold uppercase tracking-wide bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 px-2 py-1 rounded-full inline-flex items-center gap-1">
                                        <Star className="w-3 h-3 fill-current" /> Destaque
                                    </span>
                                )}
                            </div>
                        </div>

                        {selectedPartner.description && (
                            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4">{selectedPartner.description}</p>
                        )}

                        <div className="flex flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-400 mb-4">
                            {(selectedPartner.city || selectedPartner.state) && (
                                <span className="flex items-center gap-1">
                                    <MapPin className="w-3.5 h-3.5" />
                                    {[selectedPartner.city, selectedPartner.state].filter(Boolean).join(' - ')}
                                </span>
                            )}
                            {selectedPartner.website_url && (
                                <a href={selectedPartner.website_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-brand hover:underline">
                                    <Globe className="w-3.5 h-3.5" /> Site do parceiro
                                </a>
                            )}
                        </div>

                        {selectedPartner.whatsapp_phone && (
                            <Button fullWidth onClick={() => handleTalkToPartner(selectedPartner)} className="!py-2.5">
                                <MessageCircle className="w-4 h-4 mr-2" />
                                Falar com o Parceiro
                            </Button>
                        )}
                    </Card>

                    <div>
                        <h3 className="text-lg font-bold text-base-text dark:text-white mb-3">Benefícios</h3>
                        {getPartnerOffers(selectedPartner.id).length === 0 ? (
                            <div className="text-center py-8 bg-slate-50 dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                                <p className="text-slate-500 text-sm">Nenhum benefício ativo no momento.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {getPartnerOffers(selectedPartner.id).map(offer => {
                                    const alreadySent = hasLeadForOffer(offer.id);
                                    return (
                                        <Card key={offer.id} className="p-4 space-y-3">
                                            <div>
                                                <h4 className="font-bold text-base-text dark:text-white">{offer.title}</h4>
                                                {offer.description && (
                                                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{offer.description}</p>
                                                )}
                                                {offer.rules && (
                                                    <p className="text-xs text-slate-400 mt-2 whitespace-pre-wrap">{offer.rules}</p>
                                                )}
                                                {offer.valid_until && (
                                                    <p className="text-xs text-slate-400 mt-1">
                                                        Válido até {new Date(offer.valid_until + 'T00:00:00').toLocaleDateString('pt-BR')}
                                                    </p>
                                                )}
                                            </div>
                                            <Button
                                                fullWidth
                                                variant={alreadySent ? 'success' : 'primary'}
                                                disabled={alreadySent || sendingOfferId === offer.id}
                                                onClick={() => handleSendInterest(selectedPartner, offer)}
                                                className="!py-2.5"
                                            >
                                                {sendingOfferId === offer.id ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : alreadySent ? (
                                                    <><CheckCircle className="w-4 h-4 mr-2" /> Interesse já enviado</>
                                                ) : (
                                                    'Quero esse Benefício'
                                                )}
                                            </Button>
                                        </Card>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
