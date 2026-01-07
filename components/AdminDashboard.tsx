import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { Loader2, Users, Shield, ArrowLeft, Search, Edit2, Ban, Lock, Save, X, MessageCircle, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { SupportTicket } from '../types';

interface AdminDashboardProps {
    onBack: () => void;
    currentUser: any;
}

interface AdminStats {
    totalUsers: number;
    activeProUsers: number;
    bannedUsers: number;
    openTickets: number;
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
}

type TabView = 'USERS' | 'SUPPORT';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBack, currentUser }) => {
    const [activeTab, setActiveTab] = useState<TabView>('USERS');
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<AdminStats>({ totalUsers: 0, activeProUsers: 0, bannedUsers: 0, openTickets: 0 });

    // User Management State
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
    const [isSavingUser, setIsSavingUser] = useState(false);

    // Support Management State
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [ticketSearch, setTicketSearch] = useState('');
    const [editingTicket, setEditingTicket] = useState<SupportTicket | null>(null);
    const [ticketReply, setTicketReply] = useState('');
    const [ticketStatus, setTicketStatus] = useState<string>('');
    const [isSavingTicket, setIsSavingTicket] = useState(false);

    useEffect(() => {
        fetchAdminData();
    }, []);

    const fetchAdminData = async () => {
        try {
            setLoading(true);

            // Fetch Users
            const { data: profiles, error: userError } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (userError) throw userError;

            // Fetch Tickets
            const { data: supportTickets, error: ticketError } = await supabase
                .from('support_tickets')
                .select('*')
                .order('created_at', { ascending: false });

            if (ticketError) throw ticketError;

            setUsers(profiles || []);
            setTickets(supportTickets || []);
            setStats({
                totalUsers: profiles?.length || 0,
                activeProUsers: profiles?.filter(p => p.plano === 'pro' || p.is_premium).length || 0,
                bannedUsers: profiles?.filter(p => p.account_status === 'banned').length || 0,
                openTickets: supportTickets?.filter(t => t.status === 'open' || t.status === 'in_progress').length || 0
            });
        } catch (error: any) {
            console.error("Admin Load Error:", error);
            alert("Acesso negado ou erro ao carregar dados.");
            onBack();
        } finally {
            setLoading(false);
        }
    };

    // --- User Logic ---
    const handleUpdateUser = async (updatedData: Partial<UserProfile>) => {
        if (!editingUser) return;
        setIsSavingUser(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update(updatedData)
                .eq('id', editingUser.id);

            if (error) throw error;

            await supabase.from('admin_logs').insert([{
                action: 'UPDATE_USER',
                target_user_id: editingUser.id,
                details: updatedData
            }]).select();

            await fetchAdminData();
            setEditingUser(null);
            alert("Usuário atualizado com sucesso!");
        } catch (err) {
            console.error(err);
            alert("Erro ao atualizar usuário.");
        } finally {
            setIsSavingUser(false);
        }
    };

    const filteredUsers = users.filter(u =>
        u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // --- Ticket Logic ---
    const handleUpdateTicket = async () => {
        if (!editingTicket) return;
        setIsSavingTicket(true);
        try {
            const { error } = await supabase
                .from('support_tickets')
                .update({
                    status: ticketStatus,
                    admin_reply: ticketReply,
                    updated_at: new Date().toISOString()
                })
                .eq('id', editingTicket.id);

            if (error) throw error;

            await fetchAdminData();
            setEditingTicket(null);
            alert("Ticket atualizado com sucesso!");
        } catch (err) {
            console.error(err);
            alert("Erro ao atualizar ticket.");
        } finally {
            setIsSavingTicket(false);
        }
    };

    const filteredTickets = tickets.filter(t =>
        t.title.toLowerCase().includes(ticketSearch.toLowerCase()) ||
        t.description.toLowerCase().includes(ticketSearch.toLowerCase()) ||
        t.id.includes(ticketSearch)
    );

    if (loading) {
        return (
            <div className="fixed inset-0 bg-white dark:bg-slate-950 flex flex-col items-center justify-center z-50">
                <Loader2 className="w-10 h-10 text-orange-600 animate-spin" />
                <p className="mt-4 text-slate-500 font-medium">Carregando Painel Admin...</p>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 bg-slate-50 dark:bg-slate-950 overflow-auto flex flex-col">
            {/* Header */}
            <div className="bg-slate-900 border-b border-slate-800 text-white px-6 py-4 flex justify-between items-center sticky top-0 z-10 shadow-md">
                <div className="flex items-center gap-3">
                    <div className="bg-orange-600 p-2 rounded-lg">
                        <Shield className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold">Administração</h1>
                        <p className="text-xs text-slate-400">Painel Geral</p>
                    </div>
                </div>
                <button onClick={onBack} className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm transition-colors border border-slate-700">
                    <ArrowLeft className="w-4 h-4" />
                    Voltar ao App
                </button>
            </div>

            <div className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8">
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <StatCard title="Total de Usuários" value={stats.totalUsers} icon={<Users className="w-6 h-6 text-blue-600" />} bg="bg-blue-50 dark:bg-blue-900/20" />
                    <StatCard title="Assinantes PRO" value={stats.activeProUsers} icon={<Shield className="w-6 h-6 text-green-600" />} bg="bg-green-50 dark:bg-green-900/20" subtext="Pagantes ativos" />
                    <StatCard title="Usuários Banidos" value={stats.bannedUsers} icon={<Ban className="w-6 h-6 text-red-600" />} bg="bg-red-50 dark:bg-red-900/20" />
                    <StatCard title="Tickets Abertos" value={stats.openTickets} icon={<MessageCircle className="w-6 h-6 text-orange-600" />} bg="bg-orange-50 dark:bg-orange-900/20" />
                </div>

                {/* Tabs */}
                <div className="flex gap-4 mb-6 border-b border-slate-200 dark:border-slate-800">
                    <button
                        onClick={() => setActiveTab('USERS')}
                        className={`pb-4 px-4 font-bold text-sm transition-all border-b-2 ${activeTab === 'USERS' ? 'border-orange-600 text-orange-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    >
                        Gerenciar Usuários
                    </button>
                    <button
                        onClick={() => setActiveTab('SUPPORT')}
                        className={`pb-4 px-4 font-bold text-sm transition-all border-b-2 ${activeTab === 'SUPPORT' ? 'border-orange-600 text-orange-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    >
                        Suporte ({tickets.filter(t => t.status === 'open').length})
                    </button>
                </div>

                {/* --- USERS TAB --- */}
                {activeTab === 'USERS' && (
                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col min-h-[500px]">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
                            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                <Users className="w-5 h-5 text-slate-500" />
                                Base de Usuários
                            </h2>
                            <div className="relative w-full md:w-96">
                                <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Buscar por nome, email ou ID..."
                                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-orange-500 outline-none text-sm"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div className="overflow-x-auto flex-1">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-medium">
                                    <tr>
                                        <th className="px-6 py-4">Usuário / Email</th>
                                        <th className="px-6 py-4 text-center">Plano</th>
                                        <th className="px-6 py-4 text-center">Status Conta</th>
                                        <th className="px-6 py-4 text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {filteredUsers.map((user) => (
                                        <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                                            <td className="px-6 py-4">
                                                <div className="font-semibold text-slate-900 dark:text-slate-100">{user.name || 'Sem nome'}</div>
                                                <div className="text-xs text-slate-500">{user.email}</div>
                                                <div className="text-[10px] text-slate-400 font-mono mt-0.5">{user.id}</div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-bold ${user.plano === 'pro' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                                    }`}>
                                                    {user.plano.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-bold ${user.account_status === 'banned' ? 'bg-red-100 text-red-700' :
                                                    user.account_status === 'suspended' ? 'bg-orange-100 text-orange-700' :
                                                        'bg-green-100 text-green-700'
                                                    }`}>
                                                    {user.account_status || 'active'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => setEditingUser(user)}
                                                    className="text-slate-400 hover:text-blue-600 transition-colors p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
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
                                                    <span className={`inline-flex px-2 py-1 rounded-full text-[10px] font-bold uppercase mb-1 ${ticket.status === 'open' ? 'bg-blue-100 text-blue-700' :
                                                            ticket.status === 'resolved' ? 'bg-green-100 text-green-700' :
                                                                'bg-slate-100 text-slate-600'
                                                        }`}>
                                                        {ticket.status === 'open' ? 'Aberto' : ticket.status === 'in_progress' ? 'Em Análise' : ticket.status}
                                                    </span>
                                                    <div className="text-[10px] text-slate-400">{new Date(ticket.created_at).toLocaleDateString()}</div>
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
            </div>

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

                        <div className="p-6 space-y-6">
                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Usuário</label>
                                <div className="text-slate-900 dark:text-slate-100 font-medium">{editingUser.name || 'Sem Nome'}</div>
                                <div className="text-sm text-slate-500">{editingUser.email}</div>
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

                            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700 text-xs text-slate-500">
                                <p className="flex items-center gap-2 mb-2 font-bold text-orange-600">
                                    <Lock className="w-3 h-3" />
                                    Ações Sensíveis
                                </p>
                                <p>Alterações manuais de plano não geram cobrança. Para banir, selecione "Banida" no status.</p>
                            </div>

                        </div>

                        <div className="p-4 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
                            <button
                                onClick={() => setEditingUser(null)}
                                className="px-4 py-2 text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => handleUpdateUser({
                                    plano: editingUser.plano,
                                    is_premium: editingUser.plano === 'pro',
                                    account_status: editingUser.account_status
                                })}
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
        </div>
    );
}

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
