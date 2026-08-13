import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import {
    Loader2, Users, Shield, ArrowLeft, Search, Edit2, Ban,
    Lock, Save, X, MessageCircle, CheckCircle, Clock,
    AlertTriangle, FileText, Activity, Bell, Trash2, Tag,
    Eye, Megaphone, Plus, DollarSign, Calendar, Zap,
    TrendingUp, TrendingDown, BarChart3, Terminal, Cpu,
    Crosshair, Signal
} from 'lucide-react';
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

type TabView = 'USERS' | 'SUPPORT' | 'LOGS' | 'NOTICES' | 'REFERRALS' | 'REVENUE';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBack, currentUser }) => {
    const [activeTab, setActiveTab] = useState<TabView>('USERS');
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState<any[]>([]);
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [logs, setLogs] = useState<AdminLog[]>([]);
    const [notices, setNotices] = useState<PlatformNotice[]>([]);
    const [commissions, setCommissions] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    // Edit States
    const [editingUser, setEditingUser] = useState<any | null>(null);
    const [editingTicket, setEditingTicket] = useState<SupportTicket | null>(null);
    const [ticketReply, setTicketReply] = useState('');
    const [ticketStatus, setTicketStatus] = useState<string>('open');
    const [editingNotice, setEditingNotice] = useState<Partial<PlatformNotice> | null>(null);
    const [isSavingNotice, setIsSavingNotice] = useState(false);
    const [isSavingTicket, setIsSavingTicket] = useState(false);

    const handleSaveTicketResponse = async () => {
        if (!editingTicket) {
            console.error("No editingTicket found!");
            return;
        }

        setIsSavingTicket(true);
        try {
            const { error } = await supabase
                .from('support_tickets')
                .update({
                    admin_reply: ticketReply,
                    status: ticketStatus,
                    updated_at: new Date().toISOString()
                })
                .eq('id', editingTicket.id)
                .select();

            if (error) {
                console.error("Supabase Error:", error);
                throw error;
            }

            await fetchDashboardData();
            setEditingTicket(null);
            alert("Resposta enviada com sucesso!");
        } catch (error: any) {
            console.error('Error updating ticket logic:', error);
            alert(`Erro ao responder ticket: ${error.message || 'Erro desconhecido'}`);
        } finally {
            setIsSavingTicket(false);
        }
    };

    const [stats, setStats] = useState<AdminStats>({
        totalUsers: 0,
        newUsersToday: 0,
        newUsersWeek: 0,
        newUsersMonth: 0,
        activeProUsers: 0,
        bannedUsers: 0,
        openTickets: 0,
        activeNotices: 0,
        sessionNewUsers: 0
    });

    useEffect(() => {
        fetchDashboardData();
        // Setup Realtime Subscription
        const channel = supabase
            .channel('admin_dashboard')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
                fetchDashboardData();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'support_tickets' }, () => {
                fetchDashboardData();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            // 1. Fetch Users
            const { data: usersData, error: usersError } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (usersError) throw usersError;

            // 1.1 Enrich Users (Mocked for speed, ideally proper join or RPC)
            const enrichedUsers = await Promise.all((usersData || []).map(async (u) => {
                // Optimization: separate query for counts might be heavy for many users, 
                // but acceptable for v1 admin dashboard
                const { count } = await supabase
                    .from('freights')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', u.id);

                return {
                    ...u,
                    total_freights: count || 0
                };
            }));

            setUsers(enrichedUsers);

            // 2. Fetch Tickets
            const { data: ticketsData } = await supabase
                .from('support_tickets')
                .select('*')
                .order('created_at', { ascending: false });
            setTickets(ticketsData || []);

            // 3. Fetch Notices
            const { data: noticesData } = await supabase
                .from('platform_notices')
                .select('*')
                .order('created_at', { ascending: false });
            setNotices(noticesData || []);

            // 3.1 Fetch Admin Logs
            const { data: logsData } = await supabase
                .from('admin_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(100);
            setLogs(logsData || []);

            // 4. Calculate Stats
            const now = new Date();
            const startOfDay = new Date(now.setHours(0, 0, 0, 0)).toISOString();

            setStats({
                totalUsers: usersData?.length || 0,
                newUsersToday: usersData?.filter(u => u.created_at >= startOfDay).length || 0,
                newUsersWeek: 0, // Todo
                newUsersMonth: 0, // Todo
                activeProUsers: usersData?.filter(u => u.is_premium).length || 0,
                bannedUsers: usersData?.filter(u => u.account_status === 'banned').length || 0,
                openTickets: ticketsData?.filter(t => t.status === 'open').length || 0,
                activeNotices: noticesData?.filter(n => n.is_active).length || 0,
                sessionNewUsers: 0
            });

        } catch (error) {
            console.error('Error fetching admin data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveNotice = async () => {
        if (!editingNotice || !editingNotice.title || !editingNotice.content) return;
        setIsSavingNotice(true);
        try {
            if (editingNotice.id) {
                const { error } = await supabase.from('platform_notices').update({
                    title: editingNotice.title,
                    content: editingNotice.content,
                    level: editingNotice.level,
                    is_active: editingNotice.is_active,
                    is_mandatory: editingNotice.is_mandatory,
                    summary: editingNotice.summary
                }).eq('id', editingNotice.id);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('platform_notices').insert([{
                    title: editingNotice.title,
                    content: editingNotice.content,
                    level: editingNotice.level || 'info',
                    is_active: editingNotice.is_active ?? true,
                    is_mandatory: editingNotice.is_mandatory ?? false,
                    summary: editingNotice.summary,
                    created_by: currentUser.id
                }]);
                if (error) throw error;
            }
            await fetchDashboardData();
            setEditingNotice(null);
        } catch (e: any) {
            console.error(e);
            alert(`Erro ao salvar aviso: ${e.message}`);
        } finally {
            setIsSavingNotice(false);
        }
    };

    const handleDeleteNotice = async (id: string) => {
        if (!confirm("Deletar aviso?")) return;
        await supabase.from('platform_notices').delete().eq('id', id);
        fetchDashboardData();
    };

    const filteredUsers = users.filter(u =>
        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="fixed inset-0 bg-[#050505] flex flex-col items-center justify-center z-50 text-white font-mono">
                <Loader2 className="w-12 h-12 text-orange-500 animate-spin mb-4" />
                <p className="animate-pulse tracking-widest text-xs">SYSTEM_INITIALIZING...</p>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 bg-[#050505] text-gray-300 font-mono flex overflow-hidden selection:bg-orange-500/30">
            {/* --- SIDEBAR --- */}
            <aside className="w-64 border-r border-white/10 bg-[#080808] flex flex-col">
                <div className="h-16 flex items-center px-6 border-b border-white/10 gap-3">
                    <div className="w-8 h-8 bg-orange-600 flex items-center justify-center rounded-sm">
                        <Terminal className="w-5 h-5 text-black" />
                    </div>
                    <div>
                        <h1 className="text-sm font-bold text-white tracking-widest leading-none">CONTROL</h1>
                        <span className="text-[10px] text-orange-500 tracking-[0.2em] leading-none">OVERSEER</span>
                    </div>
                </div>

                <nav className="p-4 space-y-1 flex-1 overflow-y-auto">
                    <div className="px-4 py-2 text-[10px] text-gray-600 font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                        <Cpu className="w-3 h-3" /> Modules
                    </div>
                    {[
                        { id: 'USERS', label: 'Operadores', icon: Users },
                        { id: 'SUPPORT', label: 'Comunicação', icon: MessageCircle, badge: stats.openTickets > 0 ? stats.openTickets : null },
                        { id: 'NOTICES', label: 'Broadcast', icon: Megaphone },
                        { id: 'LOGS', label: 'System Logs', icon: Activity },
                    ].map(item => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id as TabView)}
                            className={`w-full flex items-center justify-between px-4 py-3 rounded-sm transition-all border-l-2 ${activeTab === item.id
                                ? 'bg-white/5 border-orange-500 text-white shadow-[inset_10px_0_20px_-10px_rgba(255,69,0,0.1)]'
                                : 'border-transparent text-gray-500 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <item.icon className={`w-4 h-4 ${activeTab === item.id ? 'text-orange-500' : ''}`} />
                                <span className="text-xs font-bold uppercase tracking-wider">{item.label}</span>
                            </div>
                            {item.badge && (
                                <span className="bg-red-500/20 text-red-400 text-[9px] px-1.5 py-0.5 border border-red-500/30 rounded-sm">
                                    {item.badge}
                                </span>
                            )}
                        </button>
                    ))}
                </nav>

                <div className="p-4 border-t border-white/10">
                    <button onClick={onBack} className="w-full flex items-center gap-2 px-4 py-3 text-red-500 hover:bg-red-950/20 transition-all border border-transparent hover:border-red-900/30 rounded-sm group">
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        <span className="text-xs font-bold uppercase tracking-widest">Desconectar</span>
                    </button>
                </div>
            </aside>

            {/* --- MAIN CONTENT --- */}
            <main className="flex-1 flex flex-col relative bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-100">

                {/* Header */}
                <header className="h-16 border-b border-white/10 bg-[#080808]/90 backdrop-blur flex items-center justify-between px-8">
                    <div className="flex items-center gap-4">
                        <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                            System Status: <span className="text-white">ONLINE</span>
                        </span>
                    </div>
                </header>

                <div className="flex-1 overflow-auto p-8">

                    {/* KPI GRID */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                        <StatBox label="Total Users" value={stats.totalUsers} icon={Users} trend="+12%" />
                        <StatBox label="Active Pro" value={stats.activeProUsers} icon={Shield} color="text-orange-500" />
                        <StatBox label="Tickets Open" value={stats.openTickets} icon={MessageCircle} color={stats.openTickets > 0 ? "text-red-500" : "text-gray-500"} />
                        <StatBox label="New Today" value={stats.newUsersToday} icon={Zap} unit="USERS" />
                    </div>

                    {/* --- TAB CONTENT: USERS --- */}
                    {activeTab === 'USERS' && (
                        <div className="space-y-4 animate-in slide-in-from-bottom-5 duration-300">
                            <div className="flex justify-between items-center bg-[#0a0a0a] p-4 border border-white/10 rounded-sm">
                                <div className="flex items-center gap-2 text-orange-500">
                                    <Crosshair className="w-5 h-5" />
                                    <h2 className="text-sm font-bold uppercase tracking-widest text-white">Database Registry</h2>
                                </div>
                                <div className="relative">
                                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-600" />
                                    <input
                                        type="text"
                                        placeholder="SEARCH_QUERY..."
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                        className="bg-black border border-white/10 pl-10 pr-4 py-2 w-64 text-xs text-white focus:border-orange-500 focus:ring-0 outline-none transition-colors"
                                    />
                                </div>
                            </div>

                            <div className="border border-white/10 rounded-sm overflow-hidden bg-[#0A0A0A]">
                                <table className="w-full text-xs text-left">
                                    <thead className="bg-black text-gray-500 uppercase font-bold border-b border-white/10">
                                        <tr>
                                            <th className="px-6 py-4">Identity</th>
                                            <th className="px-6 py-4">Access Level</th>
                                            <th className="px-6 py-4">Status</th>
                                            <th className="px-6 py-4 text-right">Activity</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {filteredUsers.map(user => (
                                            <tr key={user.id} className="hover:bg-white/5 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 bg-white/10 flex items-center justify-center text-white font-bold border border-white/10 group-hover:border-orange-500/50 transition-colors">
                                                            {user.name?.[0]}
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-white uppercase">{user.name}</div>
                                                            <div className="text-[10px] text-gray-600">{user.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {user.is_premium ? (
                                                        <span className="text-[10px] font-bold bg-orange-500/10 text-orange-500 px-2 py-1 border border-orange-500/20">PRO_LICENSE</span>
                                                    ) : (
                                                        <span className="text-[10px] font-bold text-gray-500">STANDARD</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`text-[10px] font-bold px-2 py-1 border ${user.account_status === 'banned' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                                        'bg-green-500/10 text-green-500 border-green-500/20'
                                                        }`}>
                                                        {user.account_status?.toUpperCase() || 'ACTIVE'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right font-mono text-gray-500">
                                                    {user.total_freights} <span className="text-[9px]">OPS</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* --- TAB CONTENT: SUPPORT --- */}
                    {activeTab === 'SUPPORT' && (
                        <div className="space-y-4 animate-in slide-in-from-bottom-5 duration-300">
                            <div className="flex justify-between items-center bg-[#0a0a0a] p-4 border border-white/10 rounded-sm">
                                <div className="flex items-center gap-2 text-blue-500">
                                    <Signal className="w-5 h-5" />
                                    <h2 className="text-sm font-bold uppercase tracking-widest text-white">Incoming Transmissions</h2>
                                </div>
                            </div>
                            <div className="grid gap-2">
                                {tickets.map(ticket => (
                                    <div key={ticket.id} className="bg-[#0A0A0A] border border-white/10 p-4 flex justify-between items-center hover:border-blue-500/50 transition-colors cursor-pointer group" onClick={() => { setEditingTicket(ticket); setTicketReply(ticket.admin_reply || ''); setTicketStatus(ticket.status); }}>
                                        <div className="flex gap-4 items-center">
                                            <div className={`w-2 h-2 rounded-full ${ticket.status === 'open' ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`} />
                                            <div>
                                                <div className="text-white font-bold text-sm uppercase group-hover:text-blue-400 transition-colors">{ticket.title}</div>
                                                <div className="text-[10px] text-gray-500 font-mono">{ticket.category} • ID: {ticket.id.slice(0, 8)}</div>
                                            </div>
                                        </div>
                                        <div className="text-[10px] bg-white/5 px-2 py-1 rounded-sm border border-white/10 text-gray-400">
                                            {formatDate(ticket.created_at)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* --- TAB CONTENT: NOTICES --- */}
                    {activeTab === 'NOTICES' && (
                        <div className="space-y-4 animate-in slide-in-from-bottom-5 duration-300">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-lg font-bold text-white uppercase tracking-tighter">System Broadcasts</h2>
                                <button
                                    onClick={() => setEditingNotice({ is_active: true, level: 'info' })}
                                    className="bg-orange-600 text-black px-4 py-2 text-xs font-bold uppercase hover:bg-orange-500 transition-colors"
                                >
                                    + New Broadcast
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {notices.map(notice => (
                                    <div key={notice.id} className="bg-[#0A0A0A] border border-white/10 p-6 relative group hover:border-orange-500/30 transition-all">
                                        <div className="absolute top-4 right-4 flex gap-2">
                                            <button onClick={() => setEditingNotice(notice)} className="text-gray-600 hover:text-white"><Edit2 className="w-3 h-3" /></button>
                                            <button onClick={() => handleDeleteNotice(notice.id)} className="text-gray-600 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
                                        </div>
                                        <div className={`inline-block px-2 py-0.5 text-[9px] font-bold uppercase mb-3 border ${notice.level === 'critical' ? 'border-red-500/30 text-red-500' : 'border-blue-500/30 text-blue-500'
                                            }`}>
                                            {notice.level}
                                        </div>
                                        <h3 className="text-white font-bold text-sm uppercase mb-2">{notice.title}</h3>
                                        <p className="text-gray-500 text-xs leading-relaxed">{notice.content}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* --- TAB CONTENT: LOGS --- */}
                    {activeTab === 'LOGS' && (
                        <div className="space-y-4 animate-in slide-in-from-bottom-5 duration-300">
                            <div className="flex justify-between items-center bg-[#0a0a0a] p-4 border border-white/10 rounded-sm">
                                <div className="flex items-center gap-2 text-orange-500">
                                    <Activity className="w-5 h-5" />
                                    <h2 className="text-sm font-bold uppercase tracking-widest text-white">Audit Trail</h2>
                                </div>
                                <span className="text-[10px] text-gray-600 font-mono">{logs.length} ENTRIES</span>
                            </div>

                            <div className="border border-white/10 rounded-sm overflow-hidden bg-[#0A0A0A] divide-y divide-white/5">
                                {logs.map(log => (
                                    <div key={log.id} className="px-6 py-4 flex items-start gap-4 hover:bg-white/5 transition-colors">
                                        <span className={`shrink-0 mt-0.5 text-[9px] font-bold px-2 py-1 border uppercase ${log.target_type === 'user' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' :
                                            log.target_type === 'support_ticket' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                                                'bg-white/5 text-gray-400 border-white/10'
                                            }`}>
                                            {log.target_type}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-white text-xs font-bold uppercase">{log.action}</div>
                                            <div className="text-[10px] text-gray-500 font-mono mt-0.5">{log.description}</div>
                                        </div>
                                        <span className="shrink-0 text-[10px] text-gray-600 font-mono">{formatDate(log.created_at)}</span>
                                    </div>
                                ))}

                                {logs.length === 0 && (
                                    <div className="px-6 py-16 text-center text-gray-600 text-xs uppercase tracking-widest">
                                        No audit entries recorded.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                </div>
            </main>

            {/* --- MODALS (Overlays) --- */}
            {/* TICKET EDITOR */}
            {editingTicket && (
                <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-[#0f0f0f] border border-white/10 w-full max-w-lg p-6 shadow-2xl">
                        <h3 className="text-white font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                            <MessageCircle className="w-4 h-4 text-blue-500" /> Response Terminal
                        </h3>

                        <div className="bg-black p-4 border border-white/5 mb-4 text-xs text-gray-400 font-mono">
                            <p className="mb-2 text-gray-500 uppercase">User Query:</p>
                            {editingTicket.description}
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] uppercase font-bold text-gray-500">Admin Response</label>
                                <textarea
                                    value={ticketReply}
                                    onChange={e => setTicketReply(e.target.value)}
                                    className="w-full h-32 bg-black border border-white/10 p-3 text-xs text-white outline-none focus:border-blue-500"
                                    placeholder="Type response..."
                                />
                            </div>
                            <div className="flex justify-between items-center">
                                <select
                                    value={ticketStatus}
                                    onChange={e => setTicketStatus(e.target.value)}
                                    className="bg-black border border-white/10 text-xs text-white p-2 outline-none"
                                >
                                    <option value="open">OPEN</option>
                                    <option value="in_progress">IN PROGRESS</option>
                                    <option value="resolved">RESOLVED</option>
                                </select>
                                <div className="flex gap-2">
                                    <button onClick={() => setEditingTicket(null)} className="px-4 py-2 text-xs uppercase font-bold text-gray-500 hover:text-white" disabled={isSavingTicket}>Cancel</button>
                                    <button onClick={handleSaveTicketResponse} disabled={isSavingTicket} className="px-4 py-2 bg-blue-600 text-white text-xs uppercase font-bold hover:bg-blue-500">
                                        {isSavingTicket ? 'Transmitting...' : 'Transmit'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* NOTICE EDITOR */}
            {editingNotice && (
                <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-[#0f0f0f] border border-white/10 w-full max-w-lg p-6 shadow-2xl">
                        <h3 className="text-white font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
                            <Megaphone className="w-4 h-4 text-orange-500" /> Broadcast System
                        </h3>
                        <div className="space-y-4">
                            <input
                                type="text"
                                className="w-full bg-black border border-white/10 p-3 text-sm text-white outline-none focus:border-orange-500"
                                placeholder="NOTICE TITLE"
                                value={editingNotice.title || ''}
                                onChange={e => setEditingNotice({ ...editingNotice, title: e.target.value })}
                            />
                            <textarea
                                className="w-full h-32 bg-black border border-white/10 p-3 text-xs text-white outline-none focus:border-orange-500"
                                placeholder="Message content..."
                                value={editingNotice.content || ''}
                                onChange={e => setEditingNotice({ ...editingNotice, content: e.target.value })}
                            />

                            <div className="flex gap-4">
                                <select
                                    className="bg-black border border-white/10 text-xs text-white p-2 outline-none flex-1"
                                    value={editingNotice.level || 'info'}
                                    onChange={e => setEditingNotice({ ...editingNotice, level: e.target.value as any })}
                                >
                                    <option value="info">Info (Blue)</option>
                                    <option value="important">Important (Orange)</option>
                                    <option value="critical">Critical (Red)</option>
                                </select>

                                <div className="flex flex-col gap-2">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 rounded border-white/10 bg-black text-orange-600 focus:ring-orange-500"
                                            checked={editingNotice.is_mandatory || false}
                                            onChange={e => setEditingNotice({ ...editingNotice, is_mandatory: e.target.checked })}
                                        />
                                        <span className="text-xs text-white">Mandatory (Block User)</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 rounded border-white/10 bg-black text-green-600 focus:ring-green-500"
                                            checked={editingNotice.is_active ?? true}
                                            onChange={e => setEditingNotice({ ...editingNotice, is_active: e.target.checked })}
                                        />
                                        <span className="text-xs text-white">Active (Visible)</span>
                                    </label>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 mt-4">
                                <button onClick={() => setEditingNotice(null)} className="px-4 py-2 text-xs uppercase font-bold text-gray-500 hover:text-white">Abort</button>
                                <button onClick={handleSaveNotice} className="px-4 py-2 bg-orange-600 text-black text-xs uppercase font-bold hover:bg-orange-500">
                                    {isSavingNotice ? 'Saving...' : 'Deploy Broadcast'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

const StatBox = ({ label, value, icon: Icon, trend, unit, color = "text-white" }: {
    label: string;
    value: string | number;
    icon: any;
    trend?: string;
    unit?: string;
    color?: string;
}) => (
    <div className="bg-[#0A0A0A] border border-white/10 p-6 flex flex-col justify-between group hover:border-white/20 transition-all">
        <div className="flex justify-between items-start mb-4">
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{label}</span>
            <Icon className={`w-4 h-4 ${color} opacity-50 group-hover:opacity-100 transition-opacity`} />
        </div>
        <div>
            <div className="text-2xl font-mono font-bold text-white flex items-end gap-2">
                {value}
                {unit && <span className="text-[10px] text-gray-600 mb-1">{unit}</span>}
            </div>
            {trend && <div className="text-[10px] text-green-500 font-bold mt-1">{trend} trend</div>}
        </div>
    </div>
);

function formatDate(dateString: string) {
    if (!dateString) return '--';
    return new Date(dateString).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}
