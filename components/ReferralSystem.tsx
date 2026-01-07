import React, { useEffect, useState } from 'react';
import { User } from '../types';
import { supabase } from '../supabase';
import { Card } from './Card';
import { Button } from './Button';
import { Copy, Users, DollarSign, CheckCircle, Clock, XCircle, Share2, ChevronLeft } from 'lucide-react';

interface ReferralSystemProps {
    user: User;
    onBack: () => void;
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

    useEffect(() => {
        // Generate Link
        const link = `${window.location.origin}/?ref=${user.id}`; // Changed to root, logic in Auth or App handles query params
        // Note: Ideally, if user lands at root with ref, Auth component needs to validade it if not logged in.
        // Or if they click "Register"
        // Let's stick to /?ref= or /cadastro?ref= if routing supports it.
        // Assuming Auth.tsx handles it when form is submitted.
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
        alert('Link copiado!');
    };

    return (
        <div className="space-y-6 pb-20 animate-fadeIn">
            <header className="flex items-center gap-4">
                <button onClick={onBack} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                    <ChevronLeft className="w-6 h-6 text-slate-600 dark:text-slate-300" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Indique e Ganhe</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Ganhe 20% de comissão por cada amigo que virar PRO</p>
                </div>
            </header>

            {loading ? (
                <div className="text-center py-10 text-slate-500">
                    <Clock className="w-8 h-8 animate-spin mx-auto mb-2 opacity-50" />
                    Carregando dados...
                </div>
            ) : (
                <>
                    {/* Link Section */}
                    <Card className="p-6 bg-gradient-to-r from-brand to-brand-secondary text-white border-none shadow-lg">
                        <div className="flex items-center gap-3 mb-4">
                            <Share2 className="w-6 h-6 text-white/90" />
                            <h2 className="font-bold text-lg text-white">Seu Link de Indicação</h2>
                        </div>
                        <p className="text-brand-100 text-sm mb-4">
                            Compartilhe este link. Quando alguém se cadastrar e virar PRO, você ganha.
                        </p>
                        <div className="flex items-center bg-white/10 rounded-xl p-1 pl-4 backdrop-blur-sm border border-white/20">
                            <span className="flex-1 truncate text-xs sm:text-sm font-mono text-white/90">{referralLink}</span>
                            <button
                                onClick={copyToClipboard}
                                className="bg-white text-brand px-4 py-2 rounded-lg font-bold text-xs sm:text-sm hover:bg-brand-50 transition-colors flex items-center gap-2 shadow-sm"
                            >
                                <Copy className="w-4 h-4" />
                                Copiar
                            </button>
                        </div>
                    </Card>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <Card className="p-4 border-slate-200 dark:border-slate-800">
                            <div className="flex items-center gap-2 mb-2 text-slate-500">
                                <Users className="w-4 h-4" />
                                <span className="text-[10px] sm:text-xs uppercase font-bold">Total Indicados</span>
                            </div>
                            <p className="text-2xl font-black text-slate-900 dark:text-white">{stats.totalReferrals}</p>
                        </Card>
                        <Card className="p-4 border-slate-200 dark:border-slate-800">
                            <div className="flex items-center gap-2 mb-2 text-brand">
                                <CheckCircle className="w-4 h-4" />
                                <span className="text-[10px] sm:text-xs uppercase font-bold">Viram PRO</span>
                            </div>
                            <p className="text-2xl font-black text-brand">{stats.totalConverted}</p>
                        </Card>
                        <Card className="p-4 bg-green-50 dark:bg-green-900/10 border-green-100 dark:border-green-900/30">
                            <div className="flex items-center gap-2 mb-2 text-green-600">
                                <DollarSign className="w-4 h-4" />
                                <span className="text-[10px] sm:text-xs uppercase font-bold">Saldo Aprovado</span>
                            </div>
                            <p className="text-xl sm:text-2xl font-black text-green-600 truncate">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.totalCommission)}
                            </p>
                        </Card>
                        <Card className="p-4 bg-orange-50 dark:bg-orange-900/10 border-orange-100 dark:border-orange-900/30">
                            <div className="flex items-center gap-2 mb-2 text-orange-600">
                                <Clock className="w-4 h-4" />
                                <span className="text-[10px] sm:text-xs uppercase font-bold">Saldo Pendente</span>
                            </div>
                            <p className="text-xl sm:text-2xl font-black text-orange-600 truncate">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.pendingCommission)}
                            </p>
                        </Card>
                    </div>

                    {/* List */}
                    <div className="space-y-4">
                        <h3 className="font-bold text-lg text-slate-800 dark:text-white">Histórico de Comissões</h3>
                        {commissions.length === 0 ? (
                            <div className="text-center py-10 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                                <p className="text-slate-400 text-sm">Nenhuma comissão gerada ainda.</p>
                                <p className="text-slate-500 font-medium text-sm mt-1">Comece a indicar hoje mesmo!</p>
                            </div>
                        ) : (
                            commissions.map(comm => (
                                <Card key={comm.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <div>
                                        <p className="font-bold text-slate-800 dark:text-white text-sm">
                                            {comm.referred?.name || 'Novo Usuário PRO'}
                                        </p>
                                        <p className="text-xs text-slate-500 mt-1">
                                            {new Date(comm.created_at).toLocaleDateString()} • {new Date(comm.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-slate-800 dark:text-white">
                                            + {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(comm.amount)}
                                        </p>
                                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full inline-block mt-1 ${comm.status === 'approved' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                comm.status === 'cancelled' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                                    'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                                            }`}>
                                            {comm.status === 'approved' ? 'Aprovado' : comm.status === 'cancelled' ? 'Cancelado' : 'Pendente'}
                                        </span>
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
