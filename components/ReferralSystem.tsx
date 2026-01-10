import React, { useEffect, useState } from 'react';
import { User } from '../types';
import { supabase } from '../supabase';
import { Card } from './Card';
import { Button } from './Button';
import { Copy, Users, DollarSign, CheckCircle, Clock, XCircle, Share2, ChevronLeft, Gift, ArrowRight, Wallet, BadgeCheck } from 'lucide-react';

interface ReferralSystemProps {
    user: User;
    onBack?: () => void; // Made optional since it's now a main tab
}

export const ReferralSystem: React.FC<ReferralSystemProps> = ({ user, onBack }) => {
    const [referralLink, setReferralLink] = useState('');
    const [stats, setStats] = useState({
        totalClick: 0,
        totalReferrals: 0,
        totalConverted: 0,
        totalCommission: 0,
        pendingCommission: 0
    });
    const [commissions, setCommissions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCopying, setIsCopying] = useState(false);

    useEffect(() => {
        // Generate Link
        const link = `${window.location.origin}/?ref=${user.id}`;
        setReferralLink(link);
        fetchData();
    }, [user.id]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch Referrals Count (Profiles referrer_id)
            const { count: referralCount } = await supabase
                .from('profiles')
                .select('id', { count: 'exact', head: true })
                .eq('referrer_id', user.id);

            // Fetch Commissions
            const { data: comms } = await supabase
                .from('commissions')
                .select('*, referred:profiles!referred_id(name, email)')
                .eq('referrer_id', user.id)
                .order('created_at', { ascending: false });

            const commsList = comms || [];

            const totalComm = commsList
                .filter(c => c.status === 'approved' || c.status === 'paid')
                .reduce((sum, c) => sum + Number(c.amount), 0);

            const pendingComm = commsList
                .filter(c => c.status === 'pending')
                .reduce((sum, c) => sum + Number(c.amount), 0);

            // Converted count is essentially the number of commissions (since commission = pro activation)
            const convertedCount = new Set(commsList.map(c => c.referred_id)).size;

            setStats({
                totalClick: 0,
                totalReferrals: referralCount || 0,
                totalConverted: convertedCount,
                totalCommission: totalComm,
                pendingCommission: pendingComm
            });
            setCommissions(commsList);

        } catch (error) {
            console.error('Error fetching referral data:', error);
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(referralLink);
        setIsCopying(true);
        setTimeout(() => setIsCopying(false), 2000);
    };

    const handleWithdraw = () => {
        if (stats.totalCommission < 50) {
            alert("O saldo mínimo para saque é de R$ 50,00.");
            return;
        }
        alert("Sua solicitação de saque foi enviada para análise. Entraremos em contato via e-mail em até 48 horas.");
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6 pb-28 animate-fadeIn">
            <header className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    {onBack && (
                        <button onClick={onBack} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors mr-1">
                            <ChevronLeft className="w-6 h-6 text-slate-600 dark:text-slate-300" />
                        </button>
                    )}
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Indique e Ganhe</h1>
                        <p className="text-[10px] font-roboto font-bold text-brand uppercase tracking-widest flex items-center gap-1.5">
                            <Gift className="w-3 h-3" />
                            Programa de Afiliados Control Frete
                        </p>
                    </div>
                </div>
                <div className="hidden sm:flex items-center gap-2 bg-brand/10 px-3 py-1.5 rounded-full border border-brand/20">
                    <BadgeCheck className="w-4 h-4 text-brand" />
                    <span className="text-[10px] font-black text-brand uppercase">Parceiro Verificado</span>
                </div>
            </header>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800">
                    <div className="w-12 h-12 border-4 border-brand/20 border-t-brand rounded-full animate-spin mb-4" />
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Carregando seus ganhos...</p>
                </div>
            ) : (
                <>
                    {/* Hero Card */}
                    <Card className="p-0 border-none bg-slate-900 dark:bg-black overflow-hidden relative shadow-2xl">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-brand/20 rounded-full blur-3xl -mr-20 -mt-20 opacity-50" />
                        <div className="p-8 relative z-10">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div className="space-y-2">
                                    <h2 className="text-3xl font-black text-white leading-none">
                                        Ganhe <span className="text-brand">20%</span> de Comissão
                                    </h2>
                                    <p className="text-slate-400 text-sm max-w-sm">
                                        Compartilhe o Control Frete com seus amigos caminhoneiros e fature com cada assinatura PRO.
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Saldo Disponível</p>
                                    <p className="text-4xl font-black text-white tabular-nums">
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.totalCommission)}
                                    </p>
                                    <button
                                        onClick={handleWithdraw}
                                        className="mt-3 bg-brand hover:bg-brand-hover text-white px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-brand/20 flex items-center justify-center gap-2 ml-auto"
                                    >
                                        <Wallet className="w-4 h-4" />
                                        Solicitar Saque
                                    </button>
                                </div>
                            </div>

                            <div className="mt-8 pt-8 border-t border-white/10">
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Seu Link Exclusivo</p>
                                <div className="flex items-center bg-white/5 rounded-2xl p-2 border border-white/10 backdrop-blur-sm group hover:border-brand/50 transition-colors">
                                    <div className="flex-1 px-4 overflow-hidden">
                                        <span className="text-white/80 font-mono text-sm truncate block">{referralLink}</span>
                                    </div>
                                    <button
                                        onClick={copyToClipboard}
                                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${isCopying ? 'bg-green-500 text-white' : 'bg-white text-slate-900 hover:bg-slate-100'}`}
                                    >
                                        {isCopying ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                        {isCopying ? 'Copiado!' : 'Copiar'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { label: 'Indicados', value: stats.totalReferrals, icon: Users, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/10' },
                            { label: 'Viram PRO', value: stats.totalConverted, icon: Crown, color: 'text-brand', bg: 'bg-brand/10' },
                            { label: 'Pendente', value: formatBRL(stats.pendingCommission), icon: Clock, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/10' },
                            { label: 'Cliques', value: '0', icon: Share2, color: 'text-slate-400', bg: 'bg-slate-50 dark:bg-slate-800' }
                        ].map((stat, i) => (
                            <Card key={i} className="p-4 border-slate-100 dark:border-slate-800">
                                <div className={`w-8 h-8 ${stat.bg} ${stat.color} rounded-lg flex items-center justify-center mb-3`}>
                                    <stat.icon className="w-4 h-4" />
                                </div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
                                <p className="text-xl font-black text-slate-800 dark:text-white mt-1 tabular-nums">{stat.value}</p>
                            </Card>
                        ))}
                    </div>

                    {/* How it works */}
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800">
                        <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight mb-6 flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-brand" />
                            Como funciona?
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {[
                                { step: '01', title: 'Compartilhe', desc: 'Envie seu link para colegas de estrada.' },
                                { step: '02', title: 'Cadastro', desc: 'Eles se cadastram gratuitamente.' },
                                { step: '03', title: 'Receba', desc: 'Quando virarem PRO, você ganha 20% do valor.' }
                            ].map((s, i) => (
                                <div key={i} className="relative">
                                    <span className="text-4xl font-black text-slate-100 dark:text-slate-800 absolute -top-4 -left-2 z-0">{s.step}</span>
                                    <div className="relative z-10">
                                        <h4 className="font-bold text-slate-800 dark:text-white text-sm mb-1">{s.title}</h4>
                                        <p className="text-xs text-slate-500 leading-relaxed">{s.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Commissions List */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-1">
                            <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">Histórico Recente</h3>
                            <button onClick={fetchData} className="text-[10px] font-bold text-brand uppercase hover:underline">Atualizar</button>
                        </div>

                        {commissions.length === 0 ? (
                            <div className="py-12 bg-slate-50 dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 text-center">
                                <Gift className="w-10 h-10 text-slate-300 mx-auto mb-3 opacity-50" />
                                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Nenhuma comissão ainda</p>
                                <p className="text-xs text-slate-500 mt-1">Seus ganhos aparecerão aqui!</p>
                            </div>
                        ) : (
                            commissions.map(comm => (
                                <Card key={comm.id} className="p-4 flex items-center justify-between hover:border-brand/30 transition-all group">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${comm.status === 'approved' ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                                            <Users className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-800 dark:text-white text-sm group-hover:text-brand transition-colors">
                                                {comm.referred?.name || 'Novo Parceiro PRO'}
                                            </p>
                                            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mt-0.5">
                                                {new Date(comm.created_at).toLocaleDateString()} • {comm.referred?.email?.split('@')[0]}...
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-black text-slate-800 dark:text-white tabular-nums">
                                            + {formatBRL(comm.amount)}
                                        </p>
                                        <div className="flex items-center gap-1.5 justify-end mt-1">
                                            <div className={`w-1.5 h-1.5 rounded-full ${comm.status === 'approved' ? 'bg-green-500' : comm.status === 'cancelled' ? 'bg-red-500' : 'bg-orange-500'}`} />
                                            <span className={`text-[9px] font-black uppercase tracking-widest ${comm.status === 'approved' ? 'text-green-600' : comm.status === 'cancelled' ? 'text-red-600' : 'text-orange-600'}`}>
                                                {comm.status === 'approved' ? 'Aprovado' : comm.status === 'cancelled' ? 'Cancelado' : 'Pendente'}
                                            </span>
                                        </div>
                                    </div>
                                </Card>
                            ))
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

// Helper for currency
const formatBRL = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

// Pre-define Crown and Sparkles if missing from lucide-react (handling potential types/version issues)
const Crown = (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-crown"><path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7Z" /><path d="M12 17v7" /><path d="M5 21h14" /></svg>;
const Sparkles = (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-sparkles"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" /><path d="M5 3v4" /><path d="M19 17v4" /><path d="M3 5h4" /><path d="M17 19h4" /><path d="M11.7 1.7l.3.3" /><path d="M.3 11.7l.3.3" /><path d="M22 12l-.3-.3" /><path d="M12 22l-.3-.3" /></svg>;
