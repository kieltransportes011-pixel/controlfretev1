import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { Loader2, Users, Shield, ArrowLeft, Search, Edit2, Ban, Lock, Save, X, MessageCircle, CheckCircle, Clock, AlertTriangle, FileText, Activity, Bell, Trash2, Tag, Eye, Megaphone, Plus, DollarSign, Calendar, Zap, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import { SupportTicket, AdminLog, PlatformNotice } from '../types';

interface AdminDashboardProps {
    onBack: () => void;
    currentUser: any;
}

interface AdminStats {
    totalUsers: number;
    newUsersToday: number;
    newUsersWeek: number;
    newUsersMonth: number;
    activeProUsers: number;
    bannedUsers: number;
    openTickets: number;
    activeNotices: number;
    sessionNewUsers: number;
}

interface UserProfile {
    id: string;
    email: string;
    name: string;
    plano: 'free' | 'pro';
    is_premium: boolean;
    status_assinatura: string;
    account_status: 'active' | 'suspended' | 'banned';
    created_at: string;
    role: string;
    admin_notes?: string;
    // Computed telemetry (joined)
    total_freights?: number;
    last_activity?: string;
}

type TabView = 'USERS' | 'SUPPORT' | 'LOGS' | 'NOTICES' | 'REFERRALS' | 'REVENUE';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBack, currentUser }) => {
    // ... (state definitions remain the same)

    // ... (useEffect remains the same)

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            // 1. Fetch Users
            const { data: usersData, error: usersError } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (usersError) throw usersError;

            // 1.1 Enrich Users with Stats (Activity Only)
            const enrichedUsers = await Promise.all((usersData || []).map(async (u) => {
                const { count: freightsCount } = await supabase
                    .from('freights')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', u.id);

                return {
                    ...u,
                    total_freights: freightsCount || 0
                };
            }));

            setUsers(enrichedUsers);

            // 2. Fetch Tickets
            const { data: ticketsData } = await supabase
                .from('support_tickets')
                .select('*')
                .order('created_at', { ascending: false });
            setTickets(ticketsData || []);

            // 3. Fetch Logs
            const { data: logsData } = await supabase
                .from('admin_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(100);
            setLogs(logsData || []);

            // 4. Fetch Notices
            const { data: noticesData } = await supabase
                .from('platform_notices')
                .select('*')
                .order('created_at', { ascending: false });
            setNotices(noticesData || []);

            // 5. Fetch Commissions
            const { data: commsData } = await supabase
                .from('commissions')
                .select(`
                    *,
                    referrer:referrer_id(name, email),
                    referred:referred_id(name, email)
                `)
                .order('created_at', { ascending: false });
            setCommissions(commsData || []);

            // 6. Calculate Stats
            const now = new Date();
            const startOfDay = new Date(now.setHours(0, 0, 0, 0)).toISOString();
            const startOfWeek = new Date(now.setDate(now.getDate() - 7)).toISOString();
            const startOfMonth = new Date(now.setDate(now.getDate() - 30)).toISOString();

            setStats({
                totalUsers: usersData?.length || 0,
                newUsersToday: usersData?.filter(u => u.created_at >= startOfDay).length || 0,
                newUsersWeek: usersData?.filter(u => u.created_at >= startOfWeek).length || 0,
                newUsersMonth: usersData?.filter(u => u.created_at >= startOfMonth).length || 0,
                activeProUsers: usersData?.filter(u => u.plano === 'pro' && u.status_assinatura === 'active').length || 0,
                bannedUsers: usersData?.filter(u => u.account_status === 'banned').length || 0,
                openTickets: ticketsData?.filter(t => t.status === 'open').length || 0,
                activeNotices: noticesData?.filter(n => n.is_active).length || 0,
                sessionNewUsers: 0
            });

            // 7. Revenue Stats
            const revenue = (commsData || []).reduce((acc: any, curr: any) => acc + Number(curr.amount), 0); // Mock logic for demo
            setRevenueStats({
                mrr: enrichedUsers.filter(u => u.plano === 'pro').length * 29.90, // Example MRR
                active_pro: enrichedUsers.filter(u => u.plano === 'pro').length,
                period_revenue: revenue,
                period_new_subs: enrichedUsers.filter(u => u.plano === 'pro' && u.created_at >= startOfMonth).length,
                period_cancellations: 0
            });

        } catch (error) {
            console.error('Error fetching admin data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Actions
    const handleSaveNotice = async () => {
        if (!editingNotice || !editingNotice.title || !editingNotice.content) return;
        setIsSavingNotice(true);
        try {
            if (editingNotice.id) {
                await supabase.from('platform_notices').update({
                    title: editingNotice.title,
                    content: editingNotice.content,
                    level: editingNotice.level,
                    is_active: editingNotice.is_active,
                    is_mandatory: editingNotice.is_mandatory,
                    summary: editingNotice.summary
                }).eq('id', editingNotice.id);
            } else {
                await supabase.from('platform_notices').insert([{
                    title: editingNotice.title,
                    content: editingNotice.content,
                    level: editingNotice.level || 'info',
                    is_active: editingNotice.is_active || true,
                    is_mandatory: editingNotice.is_mandatory || false,
                    summary: editingNotice.summary,
                    created_by: currentUser.id
                }]);
            }
            fetchDashboardData();
            setEditingNotice(null);
        } catch (e) {
            console.error(e);
        } finally {
            setIsSavingNotice(false);
        }
    };

    const handleDeleteNotice = async (id: string, title: string) => {
        if (!confirm(`Tem certeza que deseja excluir o aviso "${title}"?`)) return;
        await supabase.from('platform_notices').delete().eq('id', id);
        fetchDashboardData();
    };


    const handleUpdateCommission = async (id: string, status: string) => {
        await supabase.from('commissions').update({ status }).eq('id', id);
        fetchDashboardData();
    };

    const [isSavingUser, setIsSavingUser] = useState(false);
    const [isSavingTicket, setIsSavingTicket] = useState(false);
    const [recoveryLoading, setRecoveryLoading] = useState(false);
    const [newEmail, setNewEmail] = useState('');

    const handleUpdateUser = async () => {
        if (!editingUser) return;
        setIsSavingUser(true);
        try {
            await supabase.from('profiles').update({
                plano: editingUser.plano,
                account_status: editingUser.account_status,
                is_premium: editingUser.plano === 'pro',
                admin_notes: editingUser.admin_notes
            }).eq('id', editingUser.id);
            fetchDashboardData();
            setEditingUser(null);
        } catch (e) {
            console.error(e);
        } finally {
            setIsSavingUser(false);
        }
    };

    const handleUpdateTicket = async () => {
        if (!editingTicket) return;
        setIsSavingTicket(true);
        try {
            await supabase.from('support_tickets').update({
                status: ticketStatus,
                admin_reply: ticketReply,
                updated_at: new Date().toISOString()
            }).eq('id', editingTicket.id);
            fetchDashboardData();
            setEditingTicket(null);
        } catch (e) {
            console.error(e);
        } finally {
            setIsSavingTicket(false);
        }
    };

    const handleRecoveryAction = async (userId: string, action: 'reset_password' | 'force_logout' | 'update_email') => {
        setRecoveryLoading(true);
        try {
            if (action === 'reset_password') {
                // Trigger password reset email
                const { data: userProfile } = await supabase.from('profiles').select('email').eq('id', userId).single();
                if (userProfile?.email) {
                    await supabase.auth.resetPasswordForEmail(userProfile.email);
                    alert('Email de redefinição enviado com sucesso.');
                }
            } else if (action === 'force_logout') {
                // In Supabase, we can't easily force logout without server-side admin API, 
                // but we can invalidate sessions if we had a table for it or RLS policies checking a 'last_logout_at'
                // For now, we'll just update a metadata field to trigger client-side logout if implemented
                await supabase.from('profiles').update({
                    account_status: 'suspended' // Temporary suspension as a crude force logout
                }).eq('id', userId);
                alert('Usuário suspenso temporariamente (logout forçado indireto).');
            } else if (action === 'update_email') {
                if (!newEmail) return alert("Digite o novo email");
                // Updating email requires admin privs on backend usually, or we update profile and let user change auth
                await supabase.from('profiles').update({ email: newEmail }).eq('id', userId);
                alert('Email no perfil atualizado. O usuário deve atualizar no Auth.');
            }
            fetchDashboardData();
        } catch (e) {
            console.error(e);
            alert('Erro ao executar ação.');
        } finally {
            setRecoveryLoading(false);
        }
    }

    // Computed
    const filteredUsers = users.filter(u =>
        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredTickets = tickets.filter(t =>
        t.title.toLowerCase().includes(ticketSearch.toLowerCase()) ||
        t.id.toLowerCase().includes(ticketSearch.toLowerCase())
    );

    const filteredLogs = logs.filter(l =>
        l.description.toLowerCase().includes(logSearch.toLowerCase()) ||
        l.action.toLowerCase().includes(logSearch.toLowerCase())
    );

    const filteredCommissions = commissions.filter(c =>
        c.referrer?.name?.toLowerCase().includes(referralSearch.toLowerCase()) ||
        c.referred?.name?.toLowerCase().includes(referralSearch.toLowerCase())
    );

    const globalStats = {
        totalRevenue: users.reduce((acc, curr) => acc + (curr.total_revenue || 0), 0),
        totalFreights: users.reduce((acc, curr) => acc + (curr.total_freights || 0), 0),
        avgFreights: Math.round(users.reduce((acc, curr) => acc + (curr.total_freights || 0), 0) / (users.length || 1)),
        activeRate: Math.round((stats.newUsersMonth / (stats.totalUsers || 1)) * 100)
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-[#050505] flex flex-col items-center justify-center z-50">
                <Loader2 className="w-10 h-10 text-[var(--precision-accent)] animate-spin" />
                <div className="mt-4 flex items-center gap-3 border border-[var(--industrial-border)] bg-[#0a0a0a] px-4 py-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                    <span className="text-[10px] uppercase tracking-[0.3em] text-gray-400 font-mono">
                        System Initializing...
                    </span>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 bg-[#050505] overflow-hidden flex font-sans text-gray-300">
            {/* Sidebar - Industrial */}
            <aside className="w-64 bg-[#080808] border-r border-[var(--industrial-border)] flex flex-col shrink-0 z-20">
                <div className="p-6 border-b border-[var(--industrial-border)] flex items-center gap-3">
                    <div className="bg-[var(--precision-accent)] w-8 h-8 flex items-center justify-center">
                        <Shield className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-sm font-black text-white uppercase tracking-tighter leading-none">Control</h1>
                        <p className="text-[10px] text-[var(--precision-accent)] font-bold uppercase tracking-[0.3em] leading-none">Admin V1</p>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-1 overflow-y-auto no-scrollbar">
                    <p className="text-[9px] font-mono text-gray-600 uppercase tracking-widest px-4 mb-4 mt-2">// MODULES</p>

                    {[
                        { id: 'USERS', label: 'Usuários', icon: <Users className="w-4 h-4" /> },
                        { id: 'REVENUE', label: 'Financeiro (BI)', icon: <BarChart3 className="w-4 h-4" /> },
                        { id: 'SUPPORT', label: 'Suporte', icon: <MessageCircle className="w-4 h-4" />, badge: tickets.filter(t => t.status === 'open').length },
                        { id: 'REFERRALS', label: 'Indicações', icon: <DollarSign className="w-4 h-4" />, badge: commissions.filter(c => c.status === 'pending').length },
                        { id: 'NOTICES', label: 'Comunicados', icon: <Megaphone className="w-4 h-4" /> },
                        { id: 'LOGS', label: 'Monitoramento', icon: <Activity className="w-4 h-4" /> },
                    ].map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id as TabView)}
                            className={`w-full flex items-center justify-between px-4 py-3 border-l-2 transition-all duration-200 group ${activeTab === item.id
                                ? 'border-[var(--precision-accent)] bg-white/5 text-white'
                                : 'border-transparent text-gray-500 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <span className={activeTab === item.id ? 'text-[var(--precision-accent)]' : 'text-gray-600 group-hover:text-gray-400'}>
                                    {item.icon}
                                </span>
                                <span className="text-xs font-bold uppercase tracking-wider">{item.label}</span>
                            </div>
                            {item.badge ? (
                                <span className={`text-[9px] font-mono px-1.5 py-0.5 border ${activeTab === item.id ? 'border-orange-500/50 text-orange-400 bg-orange-900/20' : 'border-gray-800 text-gray-600'
                                    }`}>
                                    {item.badge}
                                </span>
                            ) : null}
                        </button>
                    ))}
                </nav>

                <div className="p-4 border-t border-[var(--industrial-border)]">
                    <button
                        onClick={onBack}
                        className="w-full flex items-center gap-3 px-4 py-3 text-gray-500 hover:text-white hover:bg-red-900/10 border border-transparent hover:border-red-900/30 transition-all group"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        <span className="text-xs font-bold uppercase tracking-widest">Sair do Sistema</span>
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 overflow-auto flex flex-col relative bg-[#050505]">
                {/* Internal Header - Industrial */}
                <header className="h-20 bg-[#080808]/90 backdrop-blur-sm border-b border-[var(--industrial-border)] flex items-center justify-between px-8 sticky top-0 z-10 font-mono">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <span className="bg-red-900/20 text-red-500 border border-red-900/50 text-[10px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-sm">
                                SYSTEM OVERSEER // ROOT
                            </span>
                        </div>
                        <h2 className="text-lg font-black text-white uppercase tracking-tighter">
                            {activeTab === 'USERS' && 'Gerenciamento de Usuários'}
                            {activeTab === 'REVENUE' && 'Análise de Receita & BI'}
                            {activeTab === 'SUPPORT' && 'Central de Atendimento'}
                            {activeTab === 'LOGS' && 'Logs de Auditoria'}
                            {activeTab === 'NOTICES' && 'Comunicados da Plataforma'}
                            {activeTab === 'REFERRALS' && 'Programa de Afiliados'}
                        </h2>
                        <div className="flex items-center gap-2 text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                            Live Data Connection
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex -space-x-2">
                            {users.slice(0, 5).map(u => (
                                <div key={u.id} className="w-8 h-8 border border-[var(--industrial-border)] bg-[#111] flex items-center justify-center text-[10px] font-bold text-white uppercase">
                                    {u.name?.[0] || 'U'}
                                </div>
                            ))}
                            {users.length > 5 && (
                                <div className="w-8 h-8 border border-[var(--industrial-border)] bg-[#222] flex items-center justify-center text-[10px] font-bold text-white">
                                    +{users.length - 5}
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <div className="p-8 max-w-7xl w-full mx-auto">
                    {/* Realtime Alert Toast - Industrial */}
                    {realtimeAlert && (
                        <div className="fixed bottom-10 right-10 z-[100] bg-[#0a0a0a] text-white p-5 shadow-2xl border border-l-4 border-[var(--industrial-border)] animate-in slide-in-from-right duration-500 flex items-center gap-4 border-l-orange-500">
                            <div className={`p-3 bg-orange-900/10 border border-orange-500/20`}>
                                {realtimeAlert.type === 'commission' ? <DollarSign className="w-5 h-5 text-orange-500" /> : <Zap className="w-5 h-5 text-orange-500" />}
                            </div>
                            <div>
                                <p className={`text-[9px] font-mono uppercase tracking-widest text-orange-500`}>
                                    {realtimeAlert.type === 'commission' ? 'Nova Comissão Gerada' : 'Novo Cadastro Detectado'}
                                </p>
                                <p className="text-sm font-black uppercase text-white mt-1">{realtimeAlert.name}</p>
                                <p className="text-xs text-gray-500 font-mono">{realtimeAlert.email}</p>
                            </div>
                        </div>
                    )}

                    {/* Stats Summary Section */}
                    {(activeTab === 'USERS' || activeTab === 'REVENUE') && (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                            <AdminStatCard title="Usuários Totais" value={stats.totalUsers} icon={<Users className="w-5 h-5 text-gray-400" />} />
                            <AdminStatCard title="Novos Hoje" value={stats.newUsersToday} icon={<Zap className="w-5 h-5 text-[var(--precision-accent)]" />} highlight={stats.newUsersToday > 0} />
                            <AdminStatCard title="Assinantes PRO" value={stats.activeProUsers} icon={<Shield className="w-5 h-5 text-green-500" />} />
                            <AdminStatCard title="Conversão" value={`${Math.round((stats.activeProUsers / (stats.totalUsers || 1)) * 100)}%`} icon={<Activity className="w-5 h-5 text-gray-400" />} />
                        </div>
                    )}

                    {/* --- USERS TAB --- */}
                    {activeTab === 'USERS' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                            {/* Platform Snapshot */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="bg-[#0a0a0a] p-4 border border-[var(--industrial-border)] relative overflow-hidden group">
                                    <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <DollarSign className="w-12 h-12 text-green-500" />
                                    </div>
                                    <p className="text-[9px] font-mono text-gray-500 uppercase tracking-widest mb-1">MRR (Recorrente)</p>
                                    <p className="text-xl font-black text-green-500">
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(globalStats.platformMRR)}
                                    </p>
                                </div>
                                <div className="bg-[#0a0a0a] p-4 border border-[var(--industrial-border)]">
                                    <p className="text-[9px] font-mono text-gray-500 uppercase tracking-widest mb-1">Total de Operações</p>
                                    <p className="text-xl font-black text-white">{globalStats.totalFreights} <span className="text-xs font-bold text-gray-600">fretes</span></p>
                                </div>
                                <div className="bg-[#0a0a0a] p-4 border border-[var(--industrial-border)]">
                                    <p className="text-[9px] font-mono text-gray-500 uppercase tracking-widest mb-1">Média p/ Usuário</p>
                                    <p className="text-xl font-black text-white">{globalStats.avgFreights} <span className="text-xs font-bold text-gray-600">un.</span></p>
                                </div>
                                <div className="bg-[#0a0a0a] p-4 border border-[var(--industrial-border)]">
                                    <p className="text-[9px] font-mono text-gray-500 uppercase tracking-widest mb-1">Taxa de Atividade</p>
                                    <div className="flex items-center gap-2">
                                        <p className="text-xl font-black text-white">{globalStats.activeRate}%</p>
                                        <div className="h-1.5 w-12 bg-[#222] overflow-hidden">
                                            <div className="h-full bg-green-900" style={{ width: `${globalStats.activeRate}%` }} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-[#0a0a0a] border border-[var(--industrial-border)] overflow-hidden flex flex-col min-h-[500px]">
                                <div className="p-6 border-b border-[var(--industrial-border)] flex flex-col md:flex-row gap-4 justify-between items-center bg-[#111]">
                                    <h2 className="text-md font-bold text-white flex items-center gap-2 font-mono uppercase">
                                        <Users className="w-4 h-4 text-[var(--precision-accent)]" />
                                        :: Base de Dados
                                    </h2>
                                    <div className="relative w-full md:w-96">
                                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                                        <input
                                            type="text"
                                            placeholder="SEARCH_QUERY..."
                                            className="w-full pl-10 pr-4 py-2 bg-[#050505] border border-[var(--industrial-border)] text-gray-300 focus:border-[var(--precision-accent)] outline-none text-xs font-mono"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            autoFocus
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <select
                                            className="bg-[#050505] border border-[var(--industrial-border)] px-3 py-2 text-xs font-mono text-gray-400 outline-none focus:border-[var(--precision-accent)]"
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        >
                                            <option value="">TODOS</option>
                                            <option value="SEG_PRO">PRO USERS</option>
                                            <option value="SEG_HIGH_VOL">HIGH VOL</option>
                                            <option value="SEG_INACTIVE">INACTIVE</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="overflow-x-auto flex-1">
                                    <table className="w-full text-xs text-left font-mono">
                                        <thead className="bg-[#0f0f0f] text-gray-500 font-bold uppercase tracking-wider">
                                            <tr>
                                                <th className="px-6 py-4">Usuário / ID</th>
                                                <th className="px-6 py-4 text-center">Atividade</th>
                                                <th className="px-6 py-4 text-center">Plano</th>
                                                <th className="px-6 py-4 text-center">Status</th>
                                                <th className="px-6 py-4 text-right">CMD</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[#1a1a1a]">
                                            {filteredUsers.map((user) => (
                                                <tr key={user.id} className="hover:bg-[#111] transition-colors group">
                                                    <td className="px-6 py-4">
                                                        <div className="font-bold text-white uppercase">{user.name || 'UNKNOWN'}</div>
                                                        <div className="text-gray-500">{user.email}</div>
                                                        <div className="text-[9px] text-gray-700 mt-1">{user.id}</div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="text-center">
                                                            <div className="font-bold text-gray-300">
                                                                {user.total_freights} <span className="text-gray-600">INPUTS</span>
                                                            </div>
                                                            <div className="text-[9px] text-gray-600 mt-1">
                                                                LAST ACTIVITY: {user.last_activity ? new Date(user.last_activity).toLocaleDateString() : 'N/A'}
                                                            </div>
                                                        </div>
                                                    </td>

                                                    <td className="px-6 py-4 text-center">
                                                        <span className={`inline-flex px-2 py-0.5 border text-[9px] font-bold uppercase tracking-wider ${user.plano === 'pro'
                                                            ? 'border-green-900/50 bg-green-900/10 text-green-500'
                                                            : 'border-gray-800 bg-[#111] text-gray-500'
                                                            }`}>
                                                            {user.plano || 'FREE'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className={`inline-flex px-2 py-0.5 border text-[9px] font-bold uppercase tracking-wider ${user.account_status === 'banned' ? 'border-red-900/50 text-red-500' :
                                                            user.account_status === 'suspended' ? 'border-orange-900/50 text-orange-500' :
                                                                'border-emerald-900/50 text-emerald-500'
                                                            }`}>
                                                            {user.account_status === 'active' ? 'ACTIVE' :
                                                                user.account_status === 'suspended' ? 'SUSPENDED' :
                                                                    user.account_status === 'banned' ? 'BANNED' : 'ACTIVE'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <button
                                                            onClick={() => setEditingUser(user)}
                                                            className="text-gray-500 hover:text-white transition-colors p-2 hover:bg-[#222]"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- SUPPORT TAB --- */}
                    {activeTab === 'SUPPORT' && (
                        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col min-h-[500px]">
                            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
                                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                    <MessageCircle className="w-5 h-5 text-slate-500" />
                                    Chamados de Suporte
                                </h2>
                                <div className="relative w-full md:w-96">
                                    <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Buscar por título, ID..."
                                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-orange-500 outline-none text-sm"
                                        value={ticketSearch}
                                        onChange={(e) => setTicketSearch(e.target.value)}
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <div className="overflow-x-auto flex-1">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-medium">
                                        <tr>
                                            <th className="px-6 py-4">Data / Status</th>
                                            <th className="px-6 py-4">Usuário</th>
                                            <th className="px-6 py-4">Título / Detalhe</th>
                                            <th className="px-6 py-4 text-center">Prioridade</th>
                                            <th className="px-6 py-4 text-right">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {filteredTickets.map((ticket) => {
                                            const ticketUser = users.find(u => u.id === ticket.user_id);
                                            return (
                                                <tr key={ticket.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                                                    <td className="px-6 py-4">
                                                        <span className={`inline-flex px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider mb-1 ${ticket.status === 'open' ? 'bg-blue-500/10 text-blue-600' :
                                                            ticket.status === 'in_progress' ? 'bg-orange-500/10 text-orange-600' :
                                                                ticket.status === 'resolved' ? 'bg-emerald-500/10 text-emerald-600' :
                                                                    'bg-slate-500/10 text-slate-600'
                                                            }`}>
                                                            {ticket.status === 'open' ? 'Aberto' :
                                                                ticket.status === 'in_progress' ? 'Em Análise' :
                                                                    ticket.status === 'resolved' ? 'Resolvido' :
                                                                        ticket.status === 'closed' ? 'Encerrado' : ticket.status}
                                                        </span>
                                                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{new Date(ticket.created_at).toLocaleDateString()}</div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="font-medium text-slate-800 dark:text-white">{ticketUser?.name || '...'}</div>
                                                        <div className="text-xs text-slate-500">{ticketUser?.email}</div>
                                                    </td>
                                                    <td className="px-6 py-4 max-w-xs">
                                                        <div className="font-bold text-slate-800 dark:text-white truncate">{ticket.title}</div>
                                                        <div className="text-xs text-slate-500 truncate">{ticket.category}</div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className={`text-xs font-bold ${ticket.priority === 'high' ? 'text-red-500' : 'text-slate-400'
                                                            }`}>
                                                            {ticket.priority.toUpperCase()}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <button
                                                            onClick={() => {
                                                                setEditingTicket(ticket);
                                                                setTicketReply(ticket.admin_reply || '');
                                                                setTicketStatus(ticket.status);
                                                            }}
                                                            className="text-blue-500 hover:text-blue-700 transition-colors bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                                {filteredTickets.length === 0 && (
                                    <div className="p-8 text-center text-slate-500">
                                        Nenhum ticket encontrado.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* --- LOGS TAB --- */}
                    {activeTab === 'LOGS' && (
                        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col min-h-[500px]">
                            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
                                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                    <Activity className="w-5 h-5 text-slate-500" />
                                    Logs de Auditoria
                                </h2>
                                <div className="relative w-full md:w-96">
                                    <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Buscar logs..."
                                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-orange-500 outline-none text-sm"
                                        value={logSearch}
                                        onChange={(e) => setLogSearch(e.target.value)}
                                        autoFocus
                                    />
                                </div>
                            </div>
                            <div className="overflow-x-auto flex-1">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-medium">
                                        <tr>
                                            <th className="px-6 py-4">Data / Hora</th>
                                            <th className="px-6 py-4">Admin</th>
                                            <th className="px-6 py-4">Ação</th>
                                            <th className="px-6 py-4">Detalhes</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {filteredLogs.map((log) => {
                                            const adminUser = users.find(u => u.id === log.admin_id);
                                            return (
                                                <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                                                    <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                                                        {new Date(log.created_at).toLocaleString()}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="font-medium text-slate-800 dark:text-white">{adminUser?.name || 'Admin'}</div>
                                                        <div className="text-[10px] text-slate-400 font-mono">{log.admin_id.slice(0, 8)}...</div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`inline-flex px-2 py-1 rounded-full text-[10px] font-bold uppercase ${log.action.includes('UPDATE') ? 'bg-orange-100 text-orange-700' :
                                                            log.action.includes('DELETE') ? 'bg-red-100 text-red-700' :
                                                                'bg-blue-100 text-blue-700'
                                                            }`}>
                                                            {log.action}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300 max-w-md truncate" title={log.description}>
                                                        {log.description}
                                                        {log.target_id && <span className="block text-[10px] text-slate-400 font-mono mt-0.5">Target: {log.target_id}</span>}
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                                {filteredLogs.length === 0 && (
                                    <div className="p-8 text-center text-slate-500">
                                        Nenhum log encontrado.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* --- NOTICES TAB --- */}
                    {activeTab === 'NOTICES' && (
                        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col min-h-[500px]">
                            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
                                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                    <Megaphone className="w-5 h-5 text-slate-500" />
                                    Gestão de Comunicados
                                </h2>
                                <button
                                    onClick={() => setEditingNotice({ content: '', title: '', level: 'info', is_active: true })}
                                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                                >
                                    <Plus className="w-4 h-4" />
                                    Novo Aviso
                                </button>
                            </div>
                            <div className="overflow-x-auto flex-1 p-6">
                                <div className="grid gap-4">
                                    {notices.map((notice) => (
                                        <div key={notice.id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-white dark:bg-slate-900 hover:shadow-md transition-shadow">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${notice.level === 'critical' ? 'bg-red-50 text-red-600 border-red-200' :
                                                        notice.level === 'important' ? 'bg-orange-50 text-orange-600 border-orange-200' :
                                                            'bg-blue-50 text-blue-600 border-blue-200'
                                                        }`}>
                                                        {notice.level}
                                                    </span>
                                                    {notice.is_mandatory && (
                                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-600 border border-slate-200">
                                                            Obrigatório
                                                        </span>
                                                    )}
                                                    {!notice.is_active && (
                                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-400 border border-slate-200">
                                                            Rascunho
                                                        </span>
                                                    )}
                                                    <span className="text-xs text-slate-400 flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        {new Date(notice.created_at).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">{notice.title}</h3>
                                                <p className="text-sm text-slate-500 mt-1 line-clamp-1">{notice.summary || notice.content}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => setEditingNotice(notice)}
                                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                                    title="Editar"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteNotice(notice.id, notice.title)}
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                    title="Excluir"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    {notices.length === 0 && (
                                        <div className="text-center py-12 text-slate-400">
                                            Nenhum aviso cadastrado.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- REFERRALS TAB --- */}
                    {activeTab === 'REFERRALS' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                            {/* Referral Stats Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg text-blue-600">
                                            <Users className="w-5 h-5" />
                                        </div>
                                        <span className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Total de Indicações</span>
                                    </div>
                                    <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                                        {users.filter(u => u.referrer_id).length}
                                    </h2>
                                    <p className="text-[10px] text-slate-400 mt-1">Usuários que usaram link ref</p>
                                </div>

                                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-lg text-purple-600">
                                            <Zap className="w-5 h-5" />
                                        </div>
                                        <span className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Conversões em PRO</span>
                                    </div>
                                    <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                                        {new Set(commissions.map(c => c.referred_id)).size}
                                    </h2>
                                    <p className="text-[10px] text-slate-400 mt-1">Indicados que ativaram PRO</p>
                                </div>

                                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="bg-orange-100 dark:bg-orange-900/30 p-2 rounded-lg text-orange-600">
                                            <DollarSign className="w-5 h-5" />
                                        </div>
                                        <span className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Comissão Gerada</span>
                                    </div>
                                    <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                                            commissions.filter(c => c.status !== 'cancelled').reduce((sum, c) => sum + Number(c.amount), 0)
                                        )}
                                    </h2>
                                    <p className="text-[10px] text-slate-400 mt-1">Total acumulado (Pendente/Pago)</p>
                                </div>

                                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-lg text-green-600">
                                            <CheckCircle className="w-5 h-5" />
                                        </div>
                                        <span className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Comissão Paga</span>
                                    </div>
                                    <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                                            commissions.filter(c => c.status === 'paid').reduce((sum, c) => sum + Number(c.amount), 0)
                                        )}
                                    </h2>
                                    <p className="text-[10px] text-slate-400 mt-1">Valores já liquidados</p>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col min-h-[500px]">
                                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
                                    <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                        <DollarSign className="w-5 h-5 text-slate-500" />
                                        Gestão de Indicações ({filteredCommissions.length})
                                    </h2>
                                    <div className="relative w-full md:w-96">
                                        <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                        <input
                                            type="text"
                                            placeholder="Buscar por indicador ou indicado..."
                                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-orange-500 outline-none text-sm"
                                            value={referralSearch}
                                            onChange={(e) => setReferralSearch(e.target.value)}
                                            autoFocus
                                        />
                                    </div>
                                </div>
                                <div className="overflow-x-auto flex-1">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-medium">
                                            <tr>
                                                <th className="px-6 py-4">Data</th>
                                                <th className="px-6 py-4">Indicador</th>
                                                <th className="px-6 py-4">Indicado</th>
                                                <th className="px-6 py-4 text-right">Comissão</th>
                                                <th className="px-6 py-4 text-center">Status</th>
                                                <th className="px-6 py-4 text-right">Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                            {filteredCommissions.map((comm) => (
                                                <tr key={comm.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                                                    <td className="px-6 py-4">
                                                        <div className="text-slate-900 dark:text-white font-medium">
                                                            {new Date(comm.created_at).toLocaleDateString()}
                                                        </div>
                                                        <div className="text-xs text-slate-400">
                                                            {new Date(comm.created_at).toLocaleTimeString()}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="font-bold text-blue-600 dark:text-blue-400">
                                                            {comm.referrer?.name || 'Desconhecido'}
                                                        </div>
                                                        <div className="text-xs text-slate-500">{comm.referrer?.email}</div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="font-medium text-slate-800 dark:text-white">
                                                            {comm.referred?.name || 'Desconhecido'}
                                                        </div>
                                                        <div className="text-xs text-slate-500">{comm.referred?.email}</div>
                                                        <div className="text-[10px] text-green-600 mt-1">
                                                            Plano: {comm.subscription_id || 'PRO'} (R$ {comm.base_amount})
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="font-bold text-lg text-slate-900 dark:text-white">
                                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(comm.amount)}
                                                        </div>
                                                        <div className="text-[10px] text-slate-400 uppercase font-bold">{comm.commission_percentage}% de comissão</div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className={`inline-flex px-2 py-1 rounded-full text-[10px] font-bold uppercase ${comm.status === 'paid' ? 'bg-green-100 text-green-700' :
                                                            comm.status === 'approved' ? 'bg-blue-100 text-blue-700' :
                                                                comm.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                                                    'bg-orange-100 text-orange-700'
                                                            }`}>
                                                            {comm.status === 'paid' ? 'Liquidado' :
                                                                comm.status === 'approved' ? 'Aprovado' :
                                                                    comm.status === 'cancelled' ? 'Cancelado' : 'Pendente'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex justify-end gap-2">
                                                            {comm.status === 'pending' && (
                                                                <button
                                                                    onClick={() => handleUpdateCommission(comm.id, 'approved')}
                                                                    className="p-1.5 bg-blue-100 text-blue-700 rounded hover:bg-blue-200" title="Aprovar">
                                                                    <CheckCircle className="w-4 h-4" />
                                                                </button>
                                                            )}
                                                            {(comm.status === 'approved' || comm.status === 'pending') && (
                                                                <button
                                                                    onClick={() => handleUpdateCommission(comm.id, 'paid')}
                                                                    className="p-1.5 bg-green-100 text-green-700 rounded hover:bg-green-200" title="Marcar como Pago">
                                                                    <DollarSign className="w-4 h-4" />
                                                                </button>
                                                            )}
                                                            {comm.status !== 'cancelled' && comm.status !== 'paid' && (
                                                                <button
                                                                    onClick={() => handleUpdateCommission(comm.id, 'cancelled')}
                                                                    className="p-1.5 bg-red-100 text-red-700 rounded hover:bg-red-200" title="Cancelar">
                                                                    <X className="w-4 h-4" />
                                                                </button>
                                                            )}
                                                            {comm.status === 'paid' && (
                                                                <span className="text-[10px] text-green-600 font-bold flex items-center justify-end gap-1">
                                                                    <CheckCircle className="w-3 h-3" /> Concluído
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    {filteredCommissions.length === 0 && (
                                        <div className="p-12 text-center text-slate-400">
                                            Nenhuma indicação encontrada.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- REVENUE TAB --- */}
                    {activeTab === 'REVENUE' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                            {/* Current/Hero Metrics */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-2xl shadow-xl border border-slate-700 relative overflow-hidden group">
                                    <div className="absolute -right-4 -top-4 bg-orange-600/10 w-32 h-32 rounded-full blur-3xl group-hover:bg-orange-600/20 transition-colors" />
                                    <div className="relative z-10">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="bg-orange-600 p-2 rounded-lg">
                                                <TrendingUp className="w-5 h-5 text-white" />
                                            </div>
                                            <span className="text-slate-400 text-sm font-bold uppercase tracking-wider">MRR — Receita Mensal Recorrente</span>
                                        </div>
                                        <h2 className="text-4xl font-black text-white">
                                            {revenueLoading ? (
                                                <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                                            ) : (
                                                new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(revenueStats?.mrr || 0)
                                            )}
                                        </h2>
                                        <p className="text-slate-500 text-sm mt-2">Soma de todas as assinaturas PRO ativas</p>
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800 flex items-center justify-between group">
                                    <div>
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-lg text-purple-600">
                                                <Shield className="w-5 h-5" />
                                            </div>
                                            <span className="text-slate-500 dark:text-slate-400 text-sm font-bold uppercase tracking-wider">Assinaturas PRO Ativas</span>
                                        </div>
                                        <h2 className="text-4xl font-black text-slate-900 dark:text-white">
                                            {revenueLoading ? (
                                                <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                                            ) : (
                                                revenueStats?.active_pro || 0
                                            )}
                                        </h2>
                                        <p className="text-slate-400 text-sm mt-2">Métrica base para o MRR</p>
                                    </div>
                                    <div className="h-16 w-1 bottom-0 right-0 bg-purple-600 rounded-full group-hover:h-24 transition-all" />
                                </div>
                            </div>

                            {/* Period Metrics */}
                            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
                                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Desempenho por Período</h3>
                                        <p className="text-xs text-slate-500">Métricas baseadas em transações aprovadas e logs de sistema</p>
                                    </div>
                                    <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-xl">
                                        <button
                                            onClick={() => setRevenuePeriod(7)}
                                            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${revenuePeriod === 7 ? 'bg-white dark:bg-slate-700 text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                        >
                                            7 Dias
                                        </button>
                                        <button
                                            onClick={() => setRevenuePeriod(30)}
                                            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${revenuePeriod === 30 ? 'bg-white dark:bg-slate-700 text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                        >
                                            30 Dias
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-slate-800">
                                    <div className="p-8 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Receita no Período</p>
                                        <div className="flex items-baseline gap-2">
                                            <h4 className="text-2xl font-black text-slate-900 dark:text-white">
                                                {revenueLoading ? (
                                                    <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                                                ) : (
                                                    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(revenueStats?.period_revenue || 0)
                                                )}
                                            </h4>
                                        </div>
                                        <div className="mt-4 flex items-center gap-2 text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded w-fit">
                                            <TrendingUp className="w-3 h-3" />
                                            <span className="text-[10px] font-bold">Total Faturado</span>
                                        </div>
                                    </div>

                                    <div className="p-8 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Novas Assinaturas PRO</p>
                                        <h4 className="text-2xl font-black text-slate-900 dark:text-white">
                                            {revenueLoading ? (
                                                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                                            ) : (
                                                revenueStats?.period_new_subs || 0
                                            )}
                                        </h4>
                                        <div className="mt-4 flex items-center gap-2 text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded w-fit">
                                            <Plus className="w-3 h-3" />
                                            <span className="text-[10px] font-bold">Ativações</span>
                                        </div>
                                    </div>

                                    <div className="p-8 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Cancelamentos</p>
                                        <h4 className="text-2xl font-black text-slate-900 dark:text-white">
                                            {revenueLoading ? (
                                                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                                            ) : (
                                                revenueStats?.period_cancellations || 0
                                            )}
                                        </h4>
                                        <div className="mt-4 flex items-center gap-2 text-red-600 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded w-fit">
                                            <TrendingDown className="w-3 h-3" />
                                            <span className="text-[10px] font-bold">Perdas</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Info Note */}
                            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800 flex items-start gap-3">
                                <AlertTriangle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                                <div className="text-xs text-blue-800 dark:text-blue-300">
                                    <p className="font-bold mb-1">Nota sobre os dados:</p>
                                    <p>O MRR é calculado ponderando assinaturas anuais (Valor/12) e mensais. As métricas de período consideram todas as transações com status "approved" e alterações de plano registradas nos logs de auditoria.</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* --- NOTICE EDIT MODAL --- */}
                {editingNotice && (
                    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in duration-200">
                            <div className="bg-slate-50 dark:bg-slate-800 p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                                <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                                    <Megaphone className="w-5 h-5 text-purple-600" />
                                    {editingNotice.id ? 'Editar Aviso' : 'Novo Aviso'}
                                </h3>
                                <button onClick={() => setEditingNotice(null)} className="text-slate-400 hover:text-red-500">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Título</label>
                                    <input
                                        type="text"
                                        className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                        value={editingNotice.title || ''}
                                        onChange={(e) => setEditingNotice({ ...editingNotice, title: e.target.value })}
                                        placeholder="Ex: Manutenção Programada"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Nível</label>
                                        <select
                                            className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                            value={editingNotice.level || 'info'}
                                            onChange={(e) => setEditingNotice({ ...editingNotice, level: e.target.value as any })}
                                        >
                                            <option value="info">Informativo</option>
                                            <option value="important">Importante</option>
                                            <option value="critical">Crítico</option>
                                        </select>
                                    </div>
                                    <div className="flex flex-col gap-2 pt-5">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={editingNotice.is_active || false}
                                                onChange={(e) => setEditingNotice({ ...editingNotice, is_active: e.target.checked })}
                                                className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                                            />
                                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Publicado</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={editingNotice.is_mandatory || false}
                                                onChange={(e) => setEditingNotice({ ...editingNotice, is_mandatory: e.target.checked })}
                                                className="w-4 h-4 text-red-600 rounded border-gray-300 focus:ring-red-500"
                                            />
                                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Obrigatório (Modal)</span>
                                        </label>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Resumo Curto (Opcional)</label>
                                    <input
                                        type="text"
                                        className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                        value={editingNotice.summary || ''}
                                        onChange={(e) => setEditingNotice({ ...editingNotice, summary: e.target.value })}
                                        placeholder="Ex: Sistema ficará instável domingo à noite..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Conteúdo Completo</label>
                                    <textarea
                                        className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white min-h-[150px]"
                                        value={editingNotice.content || ''}
                                        onChange={(e) => setEditingNotice({ ...editingNotice, content: e.target.value })}
                                        placeholder="Descreva todos os detalhes aqui..."
                                    />
                                </div>
                            </div>

                            <div className="p-4 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
                                <button
                                    onClick={() => setEditingNotice(null)}
                                    className="px-4 py-2 text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSaveNotice}
                                    disabled={isSavingNotice}
                                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                                >
                                    {isSavingNotice ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    Salvar Aviso
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- USER EDIT MODAL --- */}
                {editingUser && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in duration-200">
                            <div className="bg-slate-50 dark:bg-slate-800 p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                                <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                                    <Edit2 className="w-4 h-4" />
                                    Gerenciar Usuário
                                </h3>
                                <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-red-500">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                                {['DADOS', 'FINANCEIRO', 'SUPORTE', 'SEGURANCA'].map((tab: any) => (
                                    <button
                                        key={tab}
                                        onClick={() => setModalTab(tab)}
                                        className={`px-4 py-3 text-[10px] font-black tracking-widest uppercase transition-all border-b-2 ${modalTab === tab
                                            ? 'border-orange-500 text-orange-600 bg-white dark:bg-slate-900'
                                            : 'border-transparent text-slate-400 hover:text-slate-600'
                                            }`}
                                    >
                                        {tab === 'SEGURANCA' ? 'SEGURANÇA' : tab}
                                    </button>
                                ))}
                            </div>

                            <div className="p-6 space-y-6 overflow-y-auto max-h-[60vh] custom-scrollbar">
                                {modalTab === 'DADOS' && (
                                    <div className="space-y-6 animate-in fade-in slide-in-from-left-2 duration-300">
                                        <div>
                                            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Perfil do Usuário</label>
                                            <div className="text-slate-900 dark:text-slate-100 font-medium">{editingUser.name || 'Sem Nome'}</div>
                                            <div className="text-sm text-slate-500">{editingUser.email}</div>
                                            <div className="text-[10px] text-slate-400 font-mono mt-1">ID: {editingUser.id}</div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Plano de Acesso</label>
                                                <select
                                                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                                    value={editingUser.plano}
                                                    onChange={(e) => setEditingUser({ ...editingUser, plano: e.target.value as 'free' | 'pro', is_premium: e.target.value === 'pro' })}
                                                >
                                                    <option value="free">Free</option>
                                                    <option value="pro">Pro (Manual)</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Status da Conta</label>
                                                <select
                                                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                                    value={editingUser.account_status || 'active'}
                                                    onChange={(e) => setEditingUser({ ...editingUser, account_status: e.target.value as any })}
                                                >
                                                    <option value="active">Ativa</option>
                                                    <option value="suspended">Suspensa</option>
                                                    <option value="banned">Banida</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Notas Internas (Apenas Admin)</label>
                                            <textarea
                                                className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                                                rows={4}
                                                placeholder="Observações internas sobre o usuário, comportamentos ou negociações..."
                                                value={editingUser.admin_notes || ''}
                                                onChange={(e) => setEditingUser({ ...editingUser, admin_notes: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                )}

                                {modalTab === 'FINANCEIRO' && (
                                    <div className="space-y-6 animate-in fade-in slide-in-from-left-2 duration-300">

                                        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                                            <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                                <Activity className="w-3 h-3" />
                                                Atividade na Plataforma
                                            </h4>
                                            <p className="text-sm text-slate-400">
                                                Este usuário registrou um total de <strong className="text-white">{editingUser.total_freights}</strong> operações no sistema.
                                            </p>
                                        </div>

                                        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                                            <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                                <DollarSign className="w-3 h-3" />
                                                Comissões de Afiliado (Plataforma)
                                            </h4>
                                            {commissions.filter(c => c.referrer_id === editingUser.id).length > 0 ? (
                                                <div className="space-y-2">
                                                    {commissions.filter(c => c.referrer_id === editingUser.id).map(c => (
                                                        <div key={c.id} className="flex justify-between items-center text-xs p-2 bg-white dark:bg-slate-900 rounded-lg shadow-sm">
                                                            <span className="text-slate-500">{new Date(c.created_at).toLocaleDateString()}</span>
                                                            <span className="font-bold text-slate-800 dark:text-white">R$ {c.amount}</span>
                                                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${c.status === 'paid' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-orange-500/10 text-orange-600'
                                                                }`}>{c.status}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-[10px] text-slate-400 text-center py-4 italic">Nenhuma comissão registrada para este usuário.</p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {modalTab === 'SUPORTE' && (
                                    <div className="space-y-6 animate-in fade-in slide-in-from-left-2 duration-300">
                                        <h4 className="text-xs font-black text-slate-500 uppercase font-mono tracking-widest mb-4 flex items-center gap-2">
                                            <MessageCircle className="w-4 h-4" />
                                            Histórico de Chamados ({tickets.filter(t => t.user_id === editingUser.id).length})
                                        </h4>
                                        <div className="space-y-3">
                                            {tickets.filter(t => t.user_id === editingUser.id).map(ticket => (
                                                <div
                                                    key={ticket.id}
                                                    onClick={() => {
                                                        setEditingTicket(ticket);
                                                        setEditingUser(null);
                                                    }}
                                                    className="p-3 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors group"
                                                >
                                                    <div className="flex justify-between items-start mb-2">
                                                        <span className="text-xs font-bold text-slate-800 dark:text-white group-hover:text-orange-500 transition-colors">{ticket.title}</span>
                                                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${ticket.status === 'open' ? 'bg-blue-500/10 text-blue-600' : 'bg-emerald-500/10 text-emerald-600'
                                                            }`}>{ticket.status}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase">
                                                        <span>{ticket.category}</span>
                                                        <span>{new Date(ticket.created_at).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                            ))}
                                            {tickets.filter(t => t.user_id === editingUser.id).length === 0 && (
                                                <div className="text-center py-12">
                                                    <MessageCircle className="w-8 h-8 text-slate-200 dark:text-slate-800 mx-auto mb-2" />
                                                    <p className="text-xs text-slate-400 italic">Este usuário nunca abriu um chamado.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {modalTab === 'SEGURANCA' && (
                                    <div className="space-y-6 animate-in fade-in slide-in-from-left-2 duration-300">
                                        <div className="bg-red-500/5 p-4 rounded-xl border border-red-500/10">
                                            <p className="text-xs font-bold text-red-600 flex items-center gap-2 mb-2">
                                                <AlertTriangle className="w-4 h-4" />
                                                Zona Crítica de Acesso
                                            </p>
                                            <p className="text-[10px] text-red-500 mb-4 opacity-80">Estas ações afetam diretamente a autorização do usuário e devem ser usadas apenas em casos de suporte crítico ou violação de termos.</p>

                                            <div className="space-y-3">
                                                <button
                                                    onClick={() => handleRecoveryAction(editingUser.id, 'reset_password')}
                                                    disabled={recoveryLoading}
                                                    className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left"
                                                >
                                                    <Lock className="w-4 h-4 text-blue-500" />
                                                    <div>
                                                        <span className="block text-xs font-bold text-slate-700 dark:text-slate-200">Reset de Senha Forçado</span>
                                                        <span className="block text-[10px] text-slate-500">Envia link de redefinição para o email cadastrado</span>
                                                    </div>
                                                </button>

                                                <button
                                                    onClick={() => handleRecoveryAction(editingUser.id, 'force_logout')}
                                                    disabled={recoveryLoading}
                                                    className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left"
                                                >
                                                    <Ban className="w-4 h-4 text-orange-500" />
                                                    <div>
                                                        <span className="block text-xs font-bold text-slate-700 dark:text-slate-200">Revogar Sessões (Logout)</span>
                                                        <span className="block text-[10px] text-slate-500">Desconecta o usuário de todos os dispositivos imediatamente</span>
                                                    </div>
                                                </button>
                                            </div>
                                        </div>

                                        <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                                            <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Correção de Email Principal</label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="email"
                                                    placeholder="Novo endereço@email.com"
                                                    className="flex-1 p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs outline-none focus:ring-2 focus:ring-orange-500"
                                                    value={newEmail}
                                                    onChange={(e) => setNewEmail(e.target.value)}
                                                />
                                                <button
                                                    onClick={() => handleRecoveryAction(editingUser.id, 'update_email')}
                                                    disabled={!newEmail || recoveryLoading}
                                                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-[10px] font-black uppercase disabled:opacity-50"
                                                >
                                                    Alterar
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="p-4 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
                                <button
                                    onClick={() => setEditingUser(null)}
                                    className="px-4 py-2 text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={() => handleUpdateUser()}
                                    disabled={isSavingUser}
                                    className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                                >
                                    {isSavingUser ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    Salvar Alterações
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- TICKET EDIT MODAL --- */}
                {editingTicket && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
                            <div className="bg-slate-50 dark:bg-slate-800 p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                                <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                                    <MessageCircle className="w-5 h-5 text-blue-600" />
                                    Responder Chamado
                                </h3>
                                <button onClick={() => setEditingTicket(null)} className="text-slate-400 hover:text-red-500">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-6 space-y-6 overflow-y-auto">
                                {/* Original Ticket */}
                                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                                    <h4 className="font-bold text-slate-800 dark:text-white mb-1">{editingTicket.title}</h4>
                                    <div className="text-xs text-slate-500 mb-3 flex gap-4">
                                        <span>{new Date(editingTicket.created_at).toLocaleString()}</span>
                                        <span>{editingTicket.category}</span>
                                    </div>
                                    <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                                        {editingTicket.description}
                                    </p>
                                </div>

                                {/* Response Form */}
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Sua Resposta</label>
                                        <textarea
                                            value={ticketReply}
                                            onChange={(e) => setTicketReply(e.target.value)}
                                            rows={6}
                                            className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                            placeholder="Digite a solução ou resposta ao cliente..."
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Status do Ticket</label>
                                        <div className="flex gap-2">
                                            {(['open', 'in_progress', 'resolved', 'closed'] as const).map(s => (
                                                <button
                                                    key={s}
                                                    onClick={() => setTicketStatus(s)}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all border ${ticketStatus === s
                                                        ? 'bg-blue-600 text-white border-blue-600'
                                                        : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-blue-400'
                                                        }`}
                                                >
                                                    {s}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
                                <button
                                    onClick={() => setEditingTicket(null)}
                                    className="px-4 py-2 text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleUpdateTicket}
                                    disabled={isSavingTicket}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                                >
                                    {isSavingTicket ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    Salvar & Enviar
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};
