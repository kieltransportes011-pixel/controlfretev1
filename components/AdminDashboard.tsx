import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { Loader2, Users, TrendingUp, DollarSign, Shield, ArrowLeft, Search, Calendar, ChevronRight } from 'lucide-react';

interface AdminDashboardProps {
    onBack: () => void;
    currentUser: any; // Passed to ensure we don't need to refetch if not needed, but RLS matters.
}

interface AdminStats {
    totalUsers: number;
    activeProUsers: number;
    totalFreightsRecorded: number;
    totalExpensesRecorded: number;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBack, currentUser }) => {
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'USERS' | 'FREIGHTS'>('OVERVIEW');
    const [stats, setStats] = useState<AdminStats>({
        totalUsers: 0,
        activeProUsers: 0,
        totalFreightsRecorded: 0,
        totalExpensesRecorded: 0
    });

    const [users, setUsers] = useState<any[]>([]);
    const [freights, setFreights] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchAdminData();
    }, []);

    const fetchAdminData = async () => {
        try {
            setLoading(true);

            // 1. Fetch Users
            const { data: profiles, error: errProfiles } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (errProfiles) {
                console.error('Error fetching profiles:', errProfiles);
                // If RLS fails (user not admin), this will error.
                throw new Error("Acesso negado. Você não é administrador.");
            }

            // 2. Fetch Freights (Limit for performance)
            const { data: freightsList, error: errFreights } = await supabase
                .from('freights')
                .select('*')
                .order('date', { ascending: false })
                .limit(100);

            if (errFreights) console.warn('Error fetching freights:', errFreights);

            // 3. Get total counts (approximate for now or separate count queries)
            const { count: countFreights } = await supabase.from('freights').select('*', { count: 'exact', head: true });
            const { count: countExpenses } = await supabase.from('expenses').select('*', { count: 'exact', head: true });


            setUsers(profiles || []);
            setFreights(freightsList || []);
            setStats({
                totalUsers: profiles?.length || 0,
                activeProUsers: profiles?.filter(p => p.plano === 'pro' || p.is_premium).length || 0,
                totalFreightsRecorded: countFreights || 0,
                totalExpensesRecorded: countExpenses || 0
            });

        } catch (error: any) {
            console.error("Admin Load Error:", error);
            alert(error.message || "Erro ao carregar dados admin.");
            onBack(); // Kick out if error
        } finally {
            setLoading(false);
        }
    };

    const filteredUsers = users.filter(u =>
        u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="fixed inset-0 bg-white dark:bg-slate-950 flex flex-col items-center justify-center z-50">
                <Loader2 className="w-10 h-10 text-orange-600 animate-spin" />
                <p className="mt-4 text-slate-500 font-medium">Carregando Painel Administrativo...</p>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 bg-slate-50 dark:bg-slate-950 overflow-auto flex flex-col">
            {/* Top Navigation */}
            <div className="bg-slate-900 border-b border-slate-800 text-white px-6 py-4 flex justify-between items-center sticky top-0 z-10 shadow-md">
                <div className="flex items-center gap-3">
                    <div className="bg-orange-600 p-2 rounded-lg">
                        <Shield className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold">Painel Administrativo</h1>
                        <p className="text-xs text-slate-400">Acesso Restrito: {currentUser?.email}</p>
                    </div>
                </div>
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm transition-colors border border-slate-700"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Voltar ao App
                </button>
            </div>

            <div className="flex-1 max-w-7xl w-full mx-auto p-6">

                {/* Tabs */}
                <div className="flex flex-wrap gap-4 mb-8">
                    <TabButton
                        active={activeTab === 'OVERVIEW'}
                        onClick={() => setActiveTab('OVERVIEW')}
                        label="Dashboard Geral"
                        icon={TrendingUp}
                    />
                    <TabButton
                        active={activeTab === 'USERS'}
                        onClick={() => setActiveTab('USERS')}
                        label="Gestão de Usuários"
                        icon={Users}
                        badge={users.length}
                    />
                    <TabButton
                        active={activeTab === 'FREIGHTS'}
                        onClick={() => setActiveTab('FREIGHTS')}
                        label="Registros de Fretes"
                        icon={DollarSign}
                    />
                </div>

                {/* CONTRAST WARNING: Use dark text for light mode */}

                {activeTab === 'OVERVIEW' && (
                    <div className="space-y-6">
                        {/* KPIs */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <StatCard
                                title="Total de Usuários"
                                value={stats.totalUsers}
                                icon={<Users className="w-6 h-6 text-blue-600" />}
                                bg="bg-blue-50 dark:bg-blue-900/20"
                            />
                            <StatCard
                                title="Assinantes PRO"
                                value={stats.activeProUsers}
                                icon={<Shield className="w-6 h-6 text-purple-600" />}
                                bg="bg-purple-50 dark:bg-purple-900/20"
                                subtext="Pagantes ativos"
                            />
                            <StatCard
                                title="Total de Fretes"
                                value={stats.totalFreightsRecorded}
                                icon={<DollarSign className="w-6 h-6 text-green-600" />}
                                bg="bg-green-50 dark:bg-green-900/20"
                            />
                            <StatCard
                                title="Total de Despesas"
                                value={stats.totalExpensesRecorded}
                                icon={<TrendingUp className="w-6 h-6 text-red-600" />}
                                bg="bg-red-50 dark:bg-red-900/20"
                            />
                        </div>

                        {/* Recent Activity (Freights) */}
                        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">Atividade Recente (Últimos Fretes)</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-800/50">
                                        <tr>
                                            <th className="px-4 py-3">Data</th>
                                            <th className="px-4 py-3">Usuário (ID)</th>
                                            <th className="px-4 py-3">Cliente</th>
                                            <th className="px-4 py-3 text-right">Valor</th>
                                            <th className="px-4 py-3 text-center">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {freights.slice(0, 10).map((f) => (
                                            <tr key={f.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/30">
                                                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                                                    {new Date(f.date).toLocaleDateString()}
                                                </td>
                                                <td className="px-4 py-3 font-mono text-xs text-slate-400">
                                                    {f.user_id?.substring(0, 8)}...
                                                </td>
                                                <td className="px-4 py-3 text-slate-800 dark:text-slate-100 font-medium">
                                                    {f.client}
                                                </td>
                                                <td className="px-4 py-3 text-right font-medium text-slate-800 dark:text-slate-100">
                                                    R$ {f.total_value?.toFixed(2)}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${f.status === 'PAID' ? 'bg-green-100 text-green-700' :
                                                        f.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : 'bg-slate-100 text-slate-600'
                                                        }`}>
                                                        {f.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'USERS' && (
                    <div className="space-y-6">
                        <div className="flex gap-4 mb-4">
                            <div className="relative flex-1 max-w-md">
                                <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Buscar por nome ou email..."
                                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-orange-500 outline-none transition-all text-slate-900 dark:text-slate-100"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-medium border-b border-slate-200 dark:border-slate-700">
                                        <tr>
                                            <th className="px-6 py-4">Usuário</th>
                                            <th className="px-6 py-4">Email</th>
                                            <th className="px-6 py-4 text-center">Plano</th>
                                            <th className="px-6 py-4 text-center">Status</th>
                                            <th className="px-6 py-4 text-right">Data Cadastro</th>
                                            <th className="px-6 py-4 text-center">Admin?</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {filteredUsers.map((user) => (
                                            <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="font-semibold text-slate-900 dark:text-slate-100">{user.name || 'Sem nome'}</div>
                                                    <div className="text-xs text-slate-400 font-mono">{user.id}</div>
                                                </td>
                                                <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                                                    {user.email}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.plano === 'pro' || user.is_premium
                                                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                                                        : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                                                        }`}>
                                                        {user.plano === 'pro' || user.is_premium ? 'PRO' : 'FREE'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.status_assinatura === 'ativa'
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-red-100 text-red-800'
                                                        }`}>
                                                        {user.status_assinatura || '-'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right text-slate-500">
                                                    {new Date(user.created_at).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    {user.role === 'admin' ? (
                                                        <span className="text-orange-600 font-bold text-xs">ADMIN</span>
                                                    ) : (
                                                        <span className="text-slate-300">-</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'FREIGHTS' && (
                    <div className="space-y-4">
                        <div className="relative max-w-md">
                            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Filtrar por Cliente ou ID do Usuário..."
                                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-orange-500 outline-none transition-all text-slate-900 dark:text-slate-100"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                            <p className="text-slate-500 mb-4">Listando os últimos 100 fretes de toda a plataforma.</p>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-800/50">
                                        <tr>
                                            <th className="px-4 py-3">ID Frete</th>
                                            <th className="px-4 py-3">Data</th>
                                            <th className="px-4 py-3">Usuário/ID</th>
                                            <th className="px-4 py-3">Cliente</th>
                                            <th className="px-4 py-3 text-right">Valor Total</th>
                                            <th className="px-4 py-3 text-right">Valor Motorista</th>
                                            <th className="px-4 py-3 text-center">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {freights
                                            .filter(f =>
                                                f.client?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                                f.user_id?.toLowerCase().includes(searchTerm.toLowerCase())
                                            )
                                            .map((f) => (
                                                <tr key={f.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/20">
                                                    <td className="px-4 py-3 font-mono text-xs text-slate-400">
                                                        {f.id.split('-')[0]}
                                                    </td>
                                                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                                                        {new Date(f.date).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="text-xs font-mono text-slate-500" title={f.user_id}>
                                                            {f.user_id?.substring(0, 8)}...
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-slate-800 dark:text-slate-100 font-medium">
                                                        {f.client}
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-bold text-slate-800 dark:text-slate-100">
                                                        R$ {f.total_value?.toFixed(2)}
                                                    </td>
                                                    <td className="px-4 py-3 text-right text-slate-600">
                                                        R$ {f.driver_value?.toFixed(2)}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${f.status === 'PAID' ? 'bg-green-100 text-green-700' :
                                                                f.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : 'bg-slate-100 text-slate-600'
                                                            }`}>
                                                            {f.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}

// Subcomponents
const StatCard = ({ title, value, icon, bg, subtext }: any) => (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-start justify-between">
        <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{value}</h3>
            {subtext && <p className="text-xs text-slate-400 mt-1">{subtext}</p>}
        </div>
        <div className={`p-3 rounded-lg ${bg}`}>
            {icon}
        </div>
    </div>
);

const TabButton = ({ active, onClick, label, icon: Icon, badge }: any) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-medium transition-all ${active
            ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20 dark:bg-orange-600 dark:shadow-orange-900/20'
            : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
            }`}
    >
        <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-slate-400'}`} />
        {label}
        {badge !== undefined && (
            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-700'
                }`}>
                {badge}
            </span>
        )}
    </button>
);
