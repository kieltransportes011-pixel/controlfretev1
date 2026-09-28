import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import {
    Loader2, Users, Shield, ArrowLeft, Search, Edit2, Ban,
    Lock, Save, X, MessageCircle, CheckCircle, Clock,
    AlertTriangle, FileText, Activity, Bell, Trash2, Tag,
    Eye, Megaphone, Plus, DollarSign, Calendar, Zap,
    TrendingUp, TrendingDown, BarChart3, Terminal, Cpu,
    Crosshair, Signal, Handshake, Star, Sparkles
} from 'lucide-react';
import { SupportTicket, AdminLog, PlatformNotice, Partner, PartnerOffer, PartnerLead } from '../types';
import { formatCurrency } from '../utils';
import { useToast } from '../contexts/ToastContext';
import { useConfirm } from '../contexts/ConfirmContext';

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
    totalPartners: number;
    activeOffers: number;
    totalLeads: number;
    leadsLast30d: number;
}

type TabView = 'USERS' | 'SUPPORT' | 'LOGS' | 'NOTICES' | 'REFERRALS' | 'REVENUE' | 'PARTNERS';
type PartnersSubTab = 'PARTNERS' | 'OFFERS' | 'LEADS';

const LEAD_STATUS_LABELS: Record<string, string> = {
    novo: 'Novo',
    contatado: 'Contatado',
    convertido: 'Convertido',
    descartado: 'Descartado',
};

const PARTNER_CATEGORY_OPTIONS = ['Pneus', 'Peças', 'Combustível', 'Alimentação', 'Hospedagem', 'Oficina Mecânica', 'Documentação', 'Outros'];

const TICKET_STATUS_LABELS: Record<string, string> = {
    all: 'Todos',
    open: 'Aberto',
    in_progress: 'Em andamento',
    resolved: 'Resolvido',
    closed: 'Fechado',
};

const TICKET_PRIORITY_LABELS: Record<string, string> = {
    high: 'Alta',
    medium: 'Média',
    low: 'Baixa',
};

// Cada seção do painel é buscada de forma independente (Promise.allSettled):
// se uma falhar (ex: RPC quebrada), as outras continuam aparecendo em vez de
// zerar o painel inteiro.
function unwrapSettled<T>(result: PromiseSettledResult<{ data: T[] | null; error: any }>, label: string): T[] {
    if (result.status === 'rejected') {
        console.error(`Error fetching ${label}:`, result.reason);
        return [];
    }
    if (result.value.error) {
        console.error(`Error fetching ${label}:`, result.value.error);
        return [];
    }
    return result.value.data || [];
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBack, currentUser }) => {
    const { success: toastSuccess, error: toastError } = useToast();
    const confirmDialog = useConfirm();
    const [activeTab, setActiveTab] = useState<TabView>('USERS');
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState<any[]>([]);
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [logs, setLogs] = useState<AdminLog[]>([]);
    const [notices, setNotices] = useState<PlatformNotice[]>([]);
    const [commissions, setCommissions] = useState<any[]>([]);
    const [payments, setPayments] = useState<any[]>([]);
    const [partners, setPartners] = useState<Partner[]>([]);
    const [partnerOffers, setPartnerOffers] = useState<PartnerOffer[]>([]);
    const [partnerLeads, setPartnerLeads] = useState<PartnerLead[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [usersPage, setUsersPage] = useState(1);
    const [ticketStatusFilter, setTicketStatusFilter] = useState<'all' | 'open' | 'in_progress' | 'resolved' | 'closed'>('all');
    const [partnersSubTab, setPartnersSubTab] = useState<PartnersSubTab>('PARTNERS');

    // Edit States
    const [editingUser, setEditingUser] = useState<any | null>(null);
    const [userAction, setUserAction] = useState<string | null>(null);
    const [selectedPlan, setSelectedPlan] = useState<'free' | 'pro'>('free');
    const [adminNotesInput, setAdminNotesInput] = useState('');
    const [editingTicket, setEditingTicket] = useState<SupportTicket | null>(null);
    const [ticketReply, setTicketReply] = useState('');
    const [ticketStatus, setTicketStatus] = useState<string>('open');
    const [editingNotice, setEditingNotice] = useState<Partial<PlatformNotice> | null>(null);
    const [isSavingNotice, setIsSavingNotice] = useState(false);
    const [isSavingTicket, setIsSavingTicket] = useState(false);
    const [broadcastTitle, setBroadcastTitle] = useState('');
    const [broadcastBody, setBroadcastBody] = useState('');
    const [isSendingBroadcast, setIsSendingBroadcast] = useState(false);
    const [editingPartner, setEditingPartner] = useState<Partial<Partner> | null>(null);
    const [isSavingPartner, setIsSavingPartner] = useState(false);
    const [editingOffer, setEditingOffer] = useState<Partial<PartnerOffer> | null>(null);
    const [isSavingOffer, setIsSavingOffer] = useState(false);
    const [editingLead, setEditingLead] = useState<PartnerLead | null>(null);
    const [isSavingLead, setIsSavingLead] = useState(false);

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

            // Push notification é "melhor esforço": se falhar, não deve travar
            // o fluxo de resposta do ticket (que já foi salva com sucesso).
            supabase.functions.invoke('send-push-notification', {
                body: {
                    user_id: editingTicket.user_id,
                    title: 'Seu chamado foi respondido',
                    body: editingTicket.title,
                },
            }).catch((pushError) => {
                console.error('Push notification error:', pushError);
            });

            await fetchDashboardData();
            setEditingTicket(null);
            toastSuccess("Resposta enviada com sucesso!");
        } catch (error: any) {
            console.error('Error updating ticket logic:', error);
            toastError(`Erro ao responder ticket: ${error.message || 'Erro desconhecido'}`);
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
        sessionNewUsers: 0,
        totalPartners: 0,
        activeOffers: 0,
        totalLeads: 0,
        leadsLast30d: 0
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

        // Busca tudo em paralelo e isolado: uma seção quebrada não pode mais
        // zerar o painel inteiro (era o que acontecia antes — a RPC de
        // usuários lançava exceção e cancelava tickets/receita/indicações
        // no mesmo try/catch).
        const [usersRes, ticketsRes, noticesRes, logsRes, paymentsRes, commissionsRes, partnersRes, partnerOffersRes, partnerLeadsRes] = await Promise.allSettled([
            supabase.rpc('get_admin_users_with_freight_counts'),
            supabase.from('support_tickets').select('*').order('created_at', { ascending: false }),
            supabase.from('platform_notices').select('*').order('created_at', { ascending: false }),
            supabase.from('admin_logs').select('*').order('created_at', { ascending: false }).limit(100),
            supabase.from('payment_history').select('*').order('processed_at', { ascending: false }).limit(200),
            supabase.from('referral_commissions').select('*').order('created_at', { ascending: false }).limit(200),
            supabase.from('partners').select('*').order('created_at', { ascending: false }),
            supabase.from('partner_offers').select('*').order('created_at', { ascending: false }),
            supabase.from('partner_leads').select('*').order('created_at', { ascending: false }).limit(300),
        ]);

        if (usersRes.status === 'rejected' || usersRes.value.error) {
            const err = usersRes.status === 'rejected' ? usersRes.reason : usersRes.value.error;
            console.error('Error fetching admin users:', err);
            toastError(`Falha ao carregar usuários: ${err?.message || 'erro desconhecido'}`);
        }

        const usersData = unwrapSettled<any>(usersRes, 'usuários');
        const ticketsData = unwrapSettled<SupportTicket>(ticketsRes, 'tickets');
        const noticesData = unwrapSettled<PlatformNotice>(noticesRes, 'avisos');
        const logsData = unwrapSettled<AdminLog>(logsRes, 'logs');
        const paymentsData = unwrapSettled<any>(paymentsRes, 'pagamentos');
        const commissionsData = unwrapSettled<any>(commissionsRes, 'comissões');
        const partnersData = unwrapSettled<Partner>(partnersRes, 'parceiros');
        const partnerOffersData = unwrapSettled<PartnerOffer>(partnerOffersRes, 'ofertas de parceiros');
        const partnerLeadsData = unwrapSettled<PartnerLead>(partnerLeadsRes, 'leads de parceiros');

        setUsers(usersData);
        setTickets(ticketsData);
        setNotices(noticesData);
        setLogs(logsData);
        setPayments(paymentsData);
        setCommissions(commissionsData);
        setPartners(partnersData);
        setPartnerOffers(partnerOffersData);
        setPartnerLeads(partnerLeadsData);

        // 4. Calculate Stats
        const now = new Date();
        const startOfDay = new Date(new Date().setHours(0, 0, 0, 0)).toISOString();
        const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const startOfMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

        setStats({
            totalUsers: usersData.length,
            newUsersToday: usersData.filter(u => u.created_at >= startOfDay).length,
            newUsersWeek: usersData.filter(u => u.created_at >= startOfWeek).length,
            newUsersMonth: usersData.filter(u => u.created_at >= startOfMonth).length,
            activeProUsers: usersData.filter(u => u.is_premium).length,
            bannedUsers: usersData.filter(u => u.account_status === 'banned').length,
            openTickets: ticketsData.filter(t => t.status === 'open').length,
            activeNotices: noticesData.filter(n => n.is_active).length,
            sessionNewUsers: 0,
            totalPartners: partnersData.filter(p => p.is_active).length,
            activeOffers: partnerOffersData.filter(o => o.is_active).length,
            totalLeads: partnerLeadsData.length,
            leadsLast30d: partnerLeadsData.filter(l => l.created_at >= startOfMonth).length
        });

        setLoading(false);
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
            toastError(`Erro ao salvar aviso: ${e.message}`);
        } finally {
            setIsSavingNotice(false);
        }
    };

    const callAdminAction = async (action: string, targetId: string, payload?: any) => {
        setUserAction(action);
        try {
            const { data, error } = await supabase.functions.invoke('admin-actions', {
                body: { action, targetId, payload }
            });
            if (error || data?.error) throw new Error(data?.error || error?.message || 'Erro desconhecido');
            toastSuccess(data.message || 'Ação executada com sucesso.');
            await fetchDashboardData();
            return true;
        } catch (e: any) {
            console.error(e);
            toastError(`Erro: ${e.message}`);
            return false;
        } finally {
            setUserAction(null);
        }
    };

    const handleBanToggle = async (user: any) => {
        const isBanned = user.account_status === 'banned';
        const confirmed = await confirmDialog({
            message: isBanned
                ? `Reativar a conta de ${user.name}?`
                : `Banir ${user.name}? A pessoa não vai conseguir mais acessar o app.`,
            danger: !isBanned
        });
        if (!confirmed) return;
        const ok = await callAdminAction(isBanned ? 'unban_user' : 'ban_user', user.id);
        if (ok) setEditingUser((prev: any) => prev ? { ...prev, account_status: isBanned ? 'active' : 'banned' } : prev);
    };

    const handleUpdatePlan = async (user: any) => {
        const ok = await callAdminAction('update_plan', user.id, { plano: selectedPlan });
        if (ok) setEditingUser(null);
    };

    const handleSaveAdminNotes = async (user: any) => {
        await callAdminAction('update_admin_notes', user.id, { notes: adminNotesInput });
    };

    const handleForceLogout = async (user: any) => {
        const confirmed = await confirmDialog(`Forçar logout de todas as sessões de ${user.name}?`);
        if (!confirmed) return;
        await callAdminAction('force_logout', user.id);
    };

    const handleSendPasswordReset = async (user: any) => {
        const confirmed = await confirmDialog(`Enviar e-mail de redefinição de senha para ${user.email}?`);
        if (!confirmed) return;
        await callAdminAction('send_password_reset', user.id);
    };

    const handleDeleteNotice = async (id: string) => {
        if (!(await confirmDialog({ message: "Deletar aviso?", danger: true }))) return;
        await supabase.from('platform_notices').delete().eq('id', id);
        fetchDashboardData();
    };

    const handleSavePartner = async () => {
        if (!editingPartner || !editingPartner.name?.trim()) return;
        setIsSavingPartner(true);
        try {
            const payload = {
                name: editingPartner.name,
                category: editingPartner.category || 'Outros',
                description: editingPartner.description || null,
                logo_url: editingPartner.logo_url || null,
                whatsapp_phone: editingPartner.whatsapp_phone || null,
                website_url: editingPartner.website_url || null,
                city: editingPartner.city || null,
                state: editingPartner.state || null,
                is_featured: editingPartner.is_featured ?? false,
                is_active: editingPartner.is_active ?? true,
                updated_at: new Date().toISOString(),
            };
            if (editingPartner.id) {
                const { error } = await supabase.from('partners').update(payload).eq('id', editingPartner.id);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('partners').insert([payload]);
                if (error) throw error;
            }
            await fetchDashboardData();
            setEditingPartner(null);
            toastSuccess('Parceiro salvo com sucesso.');
        } catch (e: any) {
            console.error(e);
            toastError(`Erro ao salvar parceiro: ${e.message}`);
        } finally {
            setIsSavingPartner(false);
        }
    };

    const handleSaveOffer = async () => {
        if (!editingOffer || !editingOffer.title?.trim() || !editingOffer.partner_id) return;
        setIsSavingOffer(true);
        try {
            const payload = {
                partner_id: editingOffer.partner_id,
                title: editingOffer.title,
                description: editingOffer.description || null,
                rules: editingOffer.rules || null,
                valid_until: editingOffer.valid_until || null,
                is_active: editingOffer.is_active ?? true,
                updated_at: new Date().toISOString(),
            };
            if (editingOffer.id) {
                const { error } = await supabase.from('partner_offers').update(payload).eq('id', editingOffer.id);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('partner_offers').insert([payload]);
                if (error) throw error;
            }
            await fetchDashboardData();
            setEditingOffer(null);
            toastSuccess('Oferta salva com sucesso.');
        } catch (e: any) {
            console.error(e);
            toastError(`Erro ao salvar oferta: ${e.message}`);
        } finally {
            setIsSavingOffer(false);
        }
    };

    const handleSaveLead = async () => {
        if (!editingLead) return;
        setIsSavingLead(true);
        try {
            const { error } = await supabase.from('partner_leads').update({
                status: editingLead.status,
                admin_notes: editingLead.admin_notes || null,
                updated_at: new Date().toISOString(),
            }).eq('id', editingLead.id);
            if (error) throw error;
            await fetchDashboardData();
            setEditingLead(null);
            toastSuccess('Lead atualizado com sucesso.');
        } catch (e: any) {
            console.error(e);
            toastError(`Erro ao atualizar lead: ${e.message}`);
        } finally {
            setIsSavingLead(false);
        }
    };

    const handleSendBroadcastPush = async () => {
        if (!broadcastTitle.trim() || !broadcastBody.trim()) return;
        const confirmed = await confirmDialog({
            message: `Enviar essa notificação push para TODOS os usuários com o app instalado? Essa ação não pode ser desfeita.`,
            danger: true
        });
        if (!confirmed) return;

        setIsSendingBroadcast(true);
        try {
            const { data, error } = await supabase.functions.invoke('send-push-notification', {
                body: { broadcast: true, title: broadcastTitle.trim(), body: broadcastBody.trim() }
            });
            if (error || data?.error) throw new Error(data?.error || error?.message || 'Erro desconhecido');
            toastSuccess(`Push enviado: ${data.sent} de ${data.total} dispositivo(s).`);
            setBroadcastTitle('');
            setBroadcastBody('');
        } catch (e: any) {
            console.error(e);
            toastError(`Erro ao enviar push: ${e.message}`);
        } finally {
            setIsSendingBroadcast(false);
        }
    };

    const handleExportUsersCSV = () => {
        const headers = ['Nome', 'Email', 'Plano', 'Status Assinatura', 'Status Conta', 'Fretes', 'CF Coins', 'Criado em'];
        const rows = filteredUsers.map(u => [
            u.name, u.email, u.plano, u.status_assinatura, u.account_status,
            u.total_freights ?? 0, u.cf_coins_balance ?? 0, u.created_at
        ]);
        const csv = [headers, ...rows]
            .map(row => row.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
            .join('\n');
        const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `controlfrete_usuarios_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    };

    const userLookup = React.useMemo(() => {
        const map = new Map<string, any>();
        users.forEach(u => map.set(u.id, u));
        return map;
    }, [users]);

    const partnerLookup = React.useMemo(() => {
        const map = new Map<string, Partner>();
        partners.forEach(p => map.set(p.id, p));
        return map;
    }, [partners]);

    const offerLookup = React.useMemo(() => {
        const map = new Map<string, PartnerOffer>();
        partnerOffers.forEach(o => map.set(o.id, o));
        return map;
    }, [partnerOffers]);

    const revenueStats = React.useMemo(() => {
        const approved = payments.filter(p => p.status === 'approved');
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const thisMonth = approved.filter(p => p.processed_at >= startOfMonth);
        return {
            totalAllTime: approved.reduce((sum, p) => sum + Number(p.amount || 0), 0),
            totalThisMonth: thisMonth.reduce((sum, p) => sum + Number(p.amount || 0), 0),
            countThisMonth: thisMonth.length
        };
    }, [payments]);

    const commissionStats = React.useMemo(() => {
        const pending = commissions.filter(c => c.status === 'pending');
        const paid = commissions.filter(c => c.status === 'paid');
        return {
            pendingTotal: pending.reduce((sum, c) => sum + Number(c.amount || 0), 0),
            paidTotal: paid.reduce((sum, c) => sum + Number(c.amount || 0), 0),
        };
    }, [commissions]);

    const filteredUsers = users.filter(u =>
        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const USERS_PAGE_SIZE = 20;
    const usersTotalPages = Math.max(1, Math.ceil(filteredUsers.length / USERS_PAGE_SIZE));
    const paginatedUsers = filteredUsers.slice((usersPage - 1) * USERS_PAGE_SIZE, usersPage * USERS_PAGE_SIZE);

    React.useEffect(() => {
        setUsersPage(1);
    }, [searchTerm]);

    const PRIORITY_WEIGHT: Record<string, number> = { high: 3, medium: 2, low: 1 };

    const sortedFilteredTickets = tickets
        .filter(t => ticketStatusFilter === 'all' || t.status === ticketStatusFilter)
        .slice()
        .sort((a, b) => {
            const weightDiff = (PRIORITY_WEIGHT[b.priority] || 0) - (PRIORITY_WEIGHT[a.priority] || 0);
            if (weightDiff !== 0) return weightDiff;
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });

    const NAV_ITEMS: { id: TabView; label: string; icon: any; badge?: number | null }[] = [
        { id: 'USERS', label: 'Usuários', icon: Users },
        { id: 'SUPPORT', label: 'Suporte', icon: MessageCircle, badge: stats.openTickets > 0 ? stats.openTickets : null },
        { id: 'REVENUE', label: 'Receita', icon: DollarSign },
        { id: 'REFERRALS', label: 'Indicações', icon: TrendingUp },
        { id: 'PARTNERS', label: 'Parceiros', icon: Handshake },
        { id: 'NOTICES', label: 'Avisos', icon: Megaphone },
        { id: 'LOGS', label: 'Registros', icon: Activity },
    ];

    if (loading) {
        return (
            <div className="fixed inset-0 bg-[#0A1929] flex flex-col items-center justify-center z-50 text-white">
                <Loader2 className="w-12 h-12 text-blue-400 animate-spin mb-4" />
                <p className="animate-pulse tracking-widest text-xs text-slate-400">Carregando painel...</p>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 bg-[#0A1929] text-slate-300 flex flex-col md:flex-row overflow-hidden selection:bg-blue-500/30">
            {/* --- SIDEBAR (desktop) --- */}
            <aside className="hidden md:flex w-64 border-r border-white/10 bg-[#0F2A44] flex-col">
                <div className="h-16 flex items-center px-6 border-b border-white/10 gap-3">
                    <div className="w-8 h-8 bg-blue-600 flex items-center justify-center rounded-md">
                        <Terminal className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-sm font-bold text-white tracking-widest leading-none">CONTROL</h1>
                        <span className="text-[10px] text-blue-400 tracking-[0.2em] leading-none">PAINEL ADMIN</span>
                    </div>
                </div>

                <nav className="p-4 space-y-1 flex-1 overflow-y-auto">
                    <div className="px-4 py-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                        <Cpu className="w-3 h-3" /> Menu
                    </div>
                    {NAV_ITEMS.map(item => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`w-full flex items-center justify-between px-4 py-3 rounded-md transition-all border-l-2 ${activeTab === item.id
                                ? 'bg-white/5 border-blue-500 text-white shadow-[inset_10px_0_20px_-10px_rgba(47,128,237,0.15)]'
                                : 'border-transparent text-slate-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <item.icon className={`w-4 h-4 ${activeTab === item.id ? 'text-blue-400' : ''}`} />
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
                    <button onClick={onBack} className="w-full flex items-center gap-2 px-4 py-3 text-red-400 hover:bg-red-950/20 transition-all border border-transparent hover:border-red-900/30 rounded-md group">
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        <span className="text-xs font-bold uppercase tracking-widest">Sair do painel</span>
                    </button>
                </div>
            </aside>

            {/* --- TOP NAV (mobile) --- */}
            <div className="md:hidden border-b border-white/10 bg-[#0F2A44] flex flex-col shrink-0">
                <div className="h-14 flex items-center justify-between px-4">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-blue-600 flex items-center justify-center rounded-md">
                            <Terminal className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-sm font-bold text-white tracking-wide">CONTROL <span className="text-blue-400 font-normal">Admin</span></span>
                    </div>
                    <button onClick={onBack} className="flex items-center gap-1 text-red-400 text-[11px] font-bold uppercase px-2 py-1">
                        <ArrowLeft className="w-3.5 h-3.5" /> Sair
                    </button>
                </div>
                <nav className="flex overflow-x-auto gap-1 px-3 pb-3 -mt-0.5">
                    {NAV_ITEMS.map(item => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`shrink-0 flex items-center gap-1.5 px-3 py-2 text-[11px] font-bold uppercase rounded-md whitespace-nowrap transition-colors ${activeTab === item.id ? 'bg-blue-500/15 text-blue-400' : 'text-slate-400'
                                }`}
                        >
                            <item.icon className="w-3.5 h-3.5" /> {item.label}
                            {item.badge && (
                                <span className="bg-red-500/20 text-red-400 text-[9px] px-1 py-0.5 rounded-sm">{item.badge}</span>
                            )}
                        </button>
                    ))}
                </nav>
            </div>

            {/* --- MAIN CONTENT --- */}
            <main className="flex-1 flex flex-col relative bg-[#0A1929] min-h-0">

                {/* Header (desktop only — no espaço já ocupado pelo topo mobile) */}
                <header className="hidden md:flex h-16 border-b border-white/10 bg-[#0F2A44]/60 backdrop-blur items-center justify-between px-8 shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                            Status do sistema: <span className="text-white">Online</span>
                        </span>
                    </div>
                </header>

                <div className="flex-1 overflow-auto p-4 md:p-8">

                    {/* KPI GRID */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
                        <StatBox label="Usuários" value={stats.totalUsers} icon={Users} trend={stats.newUsersWeek > 0 ? `+${stats.newUsersWeek} na semana` : undefined} />
                        <StatBox label="Ativos PRO" value={stats.activeProUsers} icon={Shield} color="text-blue-400" />
                        <StatBox label="Chamados abertos" value={stats.openTickets} icon={MessageCircle} color={stats.openTickets > 0 ? "text-red-400" : "text-slate-400"} />
                        <StatBox label="Novos hoje" value={stats.newUsersToday} icon={Zap} unit="usuários" />
                    </div>

                    {/* --- TAB CONTENT: USERS --- */}
                    {activeTab === 'USERS' && (
                        <div className="space-y-4 animate-in slide-in-from-bottom-5 duration-300">
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 bg-[#12283F] p-4 border border-white/10 rounded-md">
                                <div className="flex items-center gap-2 text-blue-400">
                                    <Crosshair className="w-5 h-5" />
                                    <h2 className="text-sm font-bold uppercase tracking-widest text-white">Usuários Cadastrados</h2>
                                </div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <button
                                        onClick={handleExportUsersCSV}
                                        className="flex items-center gap-2 px-3 py-2 text-[10px] uppercase font-bold border border-white/10 text-slate-400 hover:text-white hover:border-white/20 transition-colors rounded-md"
                                    >
                                        <FileText className="w-3.5 h-3.5" /> Exportar CSV
                                    </button>
                                    <div className="relative flex-1 sm:flex-none">
                                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                                        <input
                                            type="text"
                                            placeholder="Buscar por nome ou e-mail..."
                                            value={searchTerm}
                                            onChange={e => setSearchTerm(e.target.value)}
                                            className="bg-[#0B1F33] border border-white/10 pl-10 pr-4 py-2 w-full sm:w-64 text-xs text-white focus:border-blue-500 focus:ring-0 outline-none transition-colors rounded-md"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="border border-white/10 rounded-md overflow-hidden bg-[#12283F]">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-xs text-left">
                                        <thead className="bg-[#0B1F33] text-slate-400 uppercase font-bold border-b border-white/10">
                                            <tr>
                                                <th className="px-6 py-4">Usuário</th>
                                                <th className="px-6 py-4">Plano</th>
                                                <th className="px-6 py-4">Status</th>
                                                <th className="px-6 py-4 text-right">CF Coins</th>
                                                <th className="px-6 py-4 text-right">Fretes</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {paginatedUsers.map(user => (
                                                <tr
                                                    key={user.id}
                                                    className="hover:bg-white/5 transition-colors group cursor-pointer"
                                                    onClick={() => {
                                                        setEditingUser(user);
                                                        setSelectedPlan(user.is_premium ? 'pro' : 'free');
                                                        setAdminNotesInput(user.admin_notes || '');
                                                    }}
                                                >
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 bg-white/10 flex items-center justify-center text-white font-bold border border-white/10 group-hover:border-blue-500/50 transition-colors rounded-md">
                                                                {user.name?.[0]}
                                                            </div>
                                                            <div>
                                                                <div className="font-bold text-white">{user.name}</div>
                                                                <div className="text-[10px] text-slate-500">{user.email}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {user.is_premium ? (
                                                            <span className="text-[10px] font-bold bg-blue-500/10 text-blue-400 px-2 py-1 border border-blue-500/20 rounded-sm">PRO</span>
                                                        ) : (
                                                            <span className="text-[10px] font-bold text-slate-500">FREE</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`text-[10px] font-bold px-2 py-1 border rounded-sm ${user.account_status === 'banned' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                                            'bg-green-500/10 text-green-400 border-green-500/20'
                                                            }`}>
                                                            {user.account_status === 'banned' ? 'Banido' : 'Ativo'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right font-mono text-amber-400">
                                                        {user.cf_coins_balance ?? 0}
                                                    </td>
                                                    <td className="px-6 py-4 text-right font-mono text-slate-400">
                                                        {user.total_freights}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {usersTotalPages > 1 && (
                                <div className="flex justify-between items-center px-2">
                                    <span className="text-[10px] text-slate-500">
                                        {filteredUsers.length} usuários • página {usersPage}/{usersTotalPages}
                                    </span>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setUsersPage(p => Math.max(1, p - 1))}
                                            disabled={usersPage === 1}
                                            className="px-3 py-1.5 text-[10px] uppercase font-bold border border-white/10 text-slate-400 hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed rounded-md"
                                        >
                                            Anterior
                                        </button>
                                        <button
                                            onClick={() => setUsersPage(p => Math.min(usersTotalPages, p + 1))}
                                            disabled={usersPage === usersTotalPages}
                                            className="px-3 py-1.5 text-[10px] uppercase font-bold border border-white/10 text-slate-400 hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed rounded-md"
                                        >
                                            Próxima
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* --- TAB CONTENT: SUPPORT --- */}
                    {activeTab === 'SUPPORT' && (
                        <div className="space-y-4 animate-in slide-in-from-bottom-5 duration-300">
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 bg-[#12283F] p-4 border border-white/10 rounded-md">
                                <div className="flex items-center gap-2 text-blue-400">
                                    <Signal className="w-5 h-5" />
                                    <h2 className="text-sm font-bold uppercase tracking-widest text-white">Chamados de Suporte</h2>
                                </div>
                                <div className="flex gap-1 flex-wrap">
                                    {(['all', 'open', 'in_progress', 'resolved', 'closed'] as const).map(s => (
                                        <button
                                            key={s}
                                            onClick={() => setTicketStatusFilter(s)}
                                            className={`px-3 py-1.5 text-[10px] uppercase font-bold border transition-colors rounded-md ${ticketStatusFilter === s
                                                ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                                                : 'border-white/10 text-slate-400 hover:text-white'
                                                }`}
                                        >
                                            {TICKET_STATUS_LABELS[s]}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="grid gap-2">
                                {sortedFilteredTickets.map(ticket => (
                                    <div key={ticket.id} className="bg-[#12283F] border border-white/10 p-4 flex justify-between items-center hover:border-blue-500/50 transition-colors cursor-pointer group rounded-md" onClick={() => { setEditingTicket(ticket); setTicketReply(ticket.admin_reply || ''); setTicketStatus(ticket.status); }}>
                                        <div className="flex gap-4 items-center">
                                            <div className={`w-2 h-2 rounded-full ${ticket.status === 'open' ? 'bg-red-400 animate-pulse' : 'bg-green-400'}`} />
                                            <div>
                                                <div className="text-white font-bold text-sm group-hover:text-blue-400 transition-colors">{ticket.title}</div>
                                                <div className="text-[10px] text-slate-500">{ticket.category} • #{ticket.id.slice(0, 8)}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-[9px] font-bold px-2 py-1 border uppercase rounded-sm ${ticket.priority === 'high' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                                ticket.priority === 'medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                                    'bg-white/5 text-slate-400 border-white/10'
                                                }`}>
                                                {TICKET_PRIORITY_LABELS[ticket.priority] || ticket.priority}
                                            </span>
                                            <div className="text-[10px] bg-white/5 px-2 py-1 rounded-sm border border-white/10 text-slate-400">
                                                {formatDate(ticket.created_at)}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {sortedFilteredTickets.length === 0 && (
                                    <div className="px-6 py-16 text-center text-slate-500 text-xs uppercase tracking-widest">
                                        Nenhum chamado com esse filtro.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* --- TAB CONTENT: REVENUE --- */}
                    {activeTab === 'REVENUE' && (
                        <div className="space-y-4 animate-in slide-in-from-bottom-5 duration-300">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                <StatBox label="Receita Total" value={formatCurrency(revenueStats.totalAllTime)} icon={DollarSign} color="text-green-400" />
                                <StatBox label="Receita Este Mês" value={formatCurrency(revenueStats.totalThisMonth)} icon={Calendar} color="text-blue-400" />
                                <StatBox label="Pagamentos Este Mês" value={revenueStats.countThisMonth} icon={TrendingUp} />
                            </div>

                            <div className="flex justify-between items-center bg-[#12283F] p-4 border border-white/10 rounded-md">
                                <div className="flex items-center gap-2 text-green-400">
                                    <DollarSign className="w-5 h-5" />
                                    <h2 className="text-sm font-bold uppercase tracking-widest text-white">Histórico de Pagamentos</h2>
                                </div>
                                <span className="text-[10px] text-slate-500">{payments.length} registros</span>
                            </div>

                            <div className="border border-white/10 rounded-md overflow-hidden bg-[#12283F] divide-y divide-white/5">
                                {payments.map(p => {
                                    const u = userLookup.get(p.user_id);
                                    return (
                                        <div key={p.payment_id} className="px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                                            <div>
                                                <div className="text-white text-xs font-bold">{u?.name || 'Usuário desconhecido'}</div>
                                                <div className="text-[10px] text-slate-500">{u?.email || p.user_id} • {p.payment_method}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-white text-sm font-mono font-bold">{formatCurrency(p.amount)}</div>
                                                <span className={`text-[9px] font-bold px-1.5 py-0.5 border uppercase rounded-sm ${p.status === 'approved' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-white/5 text-slate-400 border-white/10'}`}>
                                                    {p.status}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                                {payments.length === 0 && (
                                    <div className="px-6 py-16 text-center text-slate-500 text-xs uppercase tracking-widest">
                                        Nenhum pagamento registrado.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* --- TAB CONTENT: REFERRALS --- */}
                    {activeTab === 'REFERRALS' && (
                        <div className="space-y-4 animate-in slide-in-from-bottom-5 duration-300">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <StatBox label="Comissões Pendentes" value={formatCurrency(commissionStats.pendingTotal)} icon={Clock} color="text-amber-400" />
                                <StatBox label="Comissões Pagas" value={formatCurrency(commissionStats.paidTotal)} icon={CheckCircle} color="text-green-400" />
                            </div>

                            <div className="flex justify-between items-center bg-[#12283F] p-4 border border-white/10 rounded-md">
                                <div className="flex items-center gap-2 text-blue-400">
                                    <TrendingUp className="w-5 h-5" />
                                    <h2 className="text-sm font-bold uppercase tracking-widest text-white">Rede de Indicações</h2>
                                </div>
                                <span className="text-[10px] text-slate-500">{commissions.length} registros</span>
                            </div>

                            <div className="border border-white/10 rounded-md overflow-hidden bg-[#12283F] divide-y divide-white/5">
                                {commissions.map(c => {
                                    const referrer = userLookup.get(c.referrer_id);
                                    const referred = userLookup.get(c.referred_id);
                                    return (
                                        <div key={c.id} className="px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                                            <div>
                                                <div className="text-white text-xs font-bold">{referrer?.name || 'Desconhecido'} <span className="text-slate-500">indicou</span> {referred?.name || 'Desconhecido'}</div>
                                                <div className="text-[10px] text-slate-500">{c.commission_percentage}% de {formatCurrency(c.base_amount)}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-white text-sm font-mono font-bold">{formatCurrency(c.amount)}</div>
                                                <span className={`text-[9px] font-bold px-1.5 py-0.5 border uppercase rounded-sm ${c.status === 'paid' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                                                    {c.status}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                                {commissions.length === 0 && (
                                    <div className="px-6 py-16 text-center text-slate-500 text-xs uppercase tracking-widest">
                                        Nenhuma comissão de indicação registrada.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* --- TAB CONTENT: PARTNERS --- */}
                    {activeTab === 'PARTNERS' && (
                        <div className="space-y-4 animate-in slide-in-from-bottom-5 duration-300">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-4">
                                <StatBox label="Parceiros Ativos" value={stats.totalPartners} icon={Handshake} color="text-pink-400" />
                                <StatBox label="Ofertas Ativas" value={stats.activeOffers} icon={Sparkles} color="text-blue-400" />
                                <StatBox label="Leads Totais" value={stats.totalLeads} icon={Users} />
                                <StatBox label="Leads (30d)" value={stats.leadsLast30d} icon={TrendingUp} color="text-green-400" />
                            </div>

                            <div className="flex gap-1 flex-wrap">
                                {([
                                    { id: 'PARTNERS' as const, label: 'Parceiros' },
                                    { id: 'OFFERS' as const, label: 'Ofertas' },
                                    { id: 'LEADS' as const, label: 'Leads' },
                                ]).map(t => (
                                    <button
                                        key={t.id}
                                        onClick={() => setPartnersSubTab(t.id)}
                                        className={`px-3 py-1.5 text-[10px] uppercase font-bold border transition-colors rounded-md ${partnersSubTab === t.id
                                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                                            : 'border-white/10 text-slate-400 hover:text-white'
                                            }`}
                                    >
                                        {t.label}
                                    </button>
                                ))}
                            </div>

                            {partnersSubTab === 'PARTNERS' && (
                                <div className="space-y-4">
                                    <div className="flex justify-end">
                                        <button
                                            onClick={() => setEditingPartner({ is_active: true, is_featured: false, category: 'Outros' })}
                                            className="bg-blue-600 text-white px-4 py-2 text-xs font-bold uppercase hover:bg-blue-500 transition-colors rounded-md"
                                        >
                                            + Novo Parceiro
                                        </button>
                                    </div>
                                    <div className="border border-white/10 rounded-md overflow-hidden bg-[#12283F] divide-y divide-white/5">
                                        {partners.map(partner => (
                                            <div
                                                key={partner.id}
                                                className="px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors cursor-pointer"
                                                onClick={() => setEditingPartner(partner)}
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="w-10 h-10 rounded-md bg-white/10 flex items-center justify-center shrink-0 overflow-hidden">
                                                        {partner.logo_url ? (
                                                            <img src={partner.logo_url} alt={partner.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <Handshake className="w-5 h-5 text-slate-400" />
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="text-white text-sm font-bold truncate flex items-center gap-2">
                                                            {partner.name}
                                                            {partner.is_featured && <Star className="w-3 h-3 text-amber-400 fill-current shrink-0" />}
                                                        </div>
                                                        <div className="text-[10px] text-slate-500">{partner.category}</div>
                                                    </div>
                                                </div>
                                                <span className={`text-[10px] font-bold px-2 py-1 border rounded-sm shrink-0 ${partner.is_active ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-white/5 text-slate-400 border-white/10'}`}>
                                                    {partner.is_active ? 'Ativo' : 'Inativo'}
                                                </span>
                                            </div>
                                        ))}
                                        {partners.length === 0 && (
                                            <div className="px-6 py-16 text-center text-slate-500 text-xs uppercase tracking-widest">
                                                Nenhum parceiro cadastrado.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {partnersSubTab === 'OFFERS' && (
                                <div className="space-y-4">
                                    <div className="flex justify-end">
                                        <button
                                            onClick={() => setEditingOffer({ is_active: true, partner_id: partners[0]?.id })}
                                            disabled={partners.length === 0}
                                            className="bg-blue-600 text-white px-4 py-2 text-xs font-bold uppercase hover:bg-blue-500 transition-colors rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            + Nova Oferta
                                        </button>
                                    </div>
                                    <div className="border border-white/10 rounded-md overflow-hidden bg-[#12283F] divide-y divide-white/5">
                                        {partnerOffers.map(offer => (
                                            <div
                                                key={offer.id}
                                                className="px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors cursor-pointer"
                                                onClick={() => setEditingOffer(offer)}
                                            >
                                                <div className="min-w-0">
                                                    <div className="text-white text-sm font-bold truncate">{offer.title}</div>
                                                    <div className="text-[10px] text-slate-500">{partnerLookup.get(offer.partner_id)?.name || 'Parceiro removido'}</div>
                                                </div>
                                                <span className={`text-[10px] font-bold px-2 py-1 border rounded-sm shrink-0 ${offer.is_active ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-white/5 text-slate-400 border-white/10'}`}>
                                                    {offer.is_active ? 'Ativa' : 'Inativa'}
                                                </span>
                                            </div>
                                        ))}
                                        {partnerOffers.length === 0 && (
                                            <div className="px-6 py-16 text-center text-slate-500 text-xs uppercase tracking-widest">
                                                Nenhuma oferta cadastrada.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {partnersSubTab === 'LEADS' && (
                                <div className="border border-white/10 rounded-md overflow-hidden bg-[#12283F] divide-y divide-white/5">
                                    {partnerLeads.map(lead => (
                                        <div
                                            key={lead.id}
                                            className="px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors cursor-pointer gap-3"
                                            onClick={() => setEditingLead(lead)}
                                        >
                                            <div className="min-w-0">
                                                <div className="text-white text-sm font-bold truncate">
                                                    {lead.user_name || 'Usuário'} <span className="text-slate-500 font-normal">→</span> {partnerLookup.get(lead.partner_id)?.name || 'Parceiro removido'}
                                                </div>
                                                <div className="text-[10px] text-slate-500">
                                                    {lead.offer_id ? (offerLookup.get(lead.offer_id)?.title || 'Oferta removida') : 'Sem oferta'}
                                                    {lead.user_partner_code ? ` • ${lead.user_partner_code}` : ''}
                                                    {' • '}{formatDate(lead.created_at)}
                                                </div>
                                            </div>
                                            <span className={`text-[9px] font-bold px-2 py-1 border uppercase rounded-sm shrink-0 ${lead.status === 'convertido' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                                lead.status === 'descartado' ? 'bg-white/5 text-slate-400 border-white/10' :
                                                    lead.status === 'contatado' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                                        'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                                }`}>
                                                {LEAD_STATUS_LABELS[lead.status] || lead.status}
                                            </span>
                                        </div>
                                    ))}
                                    {partnerLeads.length === 0 && (
                                        <div className="px-6 py-16 text-center text-slate-500 text-xs uppercase tracking-widest">
                                            Nenhum lead registrado ainda.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* --- TAB CONTENT: NOTICES --- */}
                    {activeTab === 'NOTICES' && (
                        <div className="space-y-4 animate-in slide-in-from-bottom-5 duration-300">
                            <div className="bg-[#12283F] border border-blue-500/20 p-4 md:p-6 rounded-md">
                                <div className="flex items-center gap-2 text-blue-400 mb-4">
                                    <Zap className="w-4 h-4" />
                                    <h3 className="text-sm font-bold uppercase tracking-widest text-white">Push Manual (Todos os Usuários)</h3>
                                </div>
                                <div className="space-y-3">
                                    <input
                                        type="text"
                                        className="w-full bg-[#0B1F33] border border-white/10 p-3 text-sm text-white outline-none focus:border-blue-500 rounded-md"
                                        placeholder="Título da notificação"
                                        value={broadcastTitle}
                                        onChange={e => setBroadcastTitle(e.target.value)}
                                        maxLength={80}
                                    />
                                    <textarea
                                        className="w-full h-20 bg-[#0B1F33] border border-white/10 p-3 text-xs text-white outline-none focus:border-blue-500 rounded-md"
                                        placeholder="Mensagem..."
                                        value={broadcastBody}
                                        onChange={e => setBroadcastBody(e.target.value)}
                                        maxLength={180}
                                    />
                                    <div className="flex justify-end">
                                        <button
                                            onClick={handleSendBroadcastPush}
                                            disabled={isSendingBroadcast || !broadcastTitle.trim() || !broadcastBody.trim()}
                                            className="px-4 py-2 bg-blue-600 text-white text-xs uppercase font-bold hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-md"
                                        >
                                            {isSendingBroadcast ? 'Enviando...' : 'Enviar Push para Todos'}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
                                <h2 className="text-lg font-bold text-white tracking-tight">Avisos da Plataforma</h2>
                                <button
                                    onClick={() => setEditingNotice({ is_active: true, level: 'info' })}
                                    className="bg-blue-600 text-white px-4 py-2 text-xs font-bold uppercase hover:bg-blue-500 transition-colors rounded-md self-start sm:self-auto"
                                >
                                    + Novo Aviso
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {notices.map(notice => (
                                    <div key={notice.id} className="bg-[#12283F] border border-white/10 p-6 relative group hover:border-blue-500/30 transition-all rounded-md">
                                        <div className="absolute top-4 right-4 flex gap-2">
                                            <button onClick={() => setEditingNotice(notice)} className="text-slate-500 hover:text-white"><Edit2 className="w-3 h-3" /></button>
                                            <button onClick={() => handleDeleteNotice(notice.id)} className="text-slate-500 hover:text-red-400"><Trash2 className="w-3 h-3" /></button>
                                        </div>
                                        <div className={`inline-block px-2 py-0.5 text-[9px] font-bold uppercase mb-3 border rounded-sm ${notice.level === 'critical' ? 'border-red-500/30 text-red-400' : 'border-blue-500/30 text-blue-400'
                                            }`}>
                                            {notice.level}
                                        </div>
                                        <h3 className="text-white font-bold text-sm mb-2">{notice.title}</h3>
                                        <p className="text-slate-400 text-xs leading-relaxed">{notice.content}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* --- TAB CONTENT: LOGS --- */}
                    {activeTab === 'LOGS' && (
                        <div className="space-y-4 animate-in slide-in-from-bottom-5 duration-300">
                            <div className="flex justify-between items-center bg-[#12283F] p-4 border border-white/10 rounded-md">
                                <div className="flex items-center gap-2 text-blue-400">
                                    <Activity className="w-5 h-5" />
                                    <h2 className="text-sm font-bold uppercase tracking-widest text-white">Histórico de Ações</h2>
                                </div>
                                <span className="text-[10px] text-slate-500">{logs.length} registros</span>
                            </div>

                            <div className="border border-white/10 rounded-md overflow-hidden bg-[#12283F] divide-y divide-white/5">
                                {logs.map(log => (
                                    <div key={log.id} className="px-6 py-4 flex items-start gap-4 hover:bg-white/5 transition-colors">
                                        <span className={`shrink-0 mt-0.5 text-[9px] font-bold px-2 py-1 border uppercase rounded-sm ${log.target_type === 'user' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                            log.target_type === 'support_ticket' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                                'bg-white/5 text-slate-400 border-white/10'
                                            }`}>
                                            {log.target_type}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-white text-xs font-bold">{log.action}</div>
                                            <div className="text-[10px] text-slate-500 mt-0.5">{log.description}</div>
                                        </div>
                                        <span className="shrink-0 text-[10px] text-slate-500">{formatDate(log.created_at)}</span>
                                    </div>
                                ))}

                                {logs.length === 0 && (
                                    <div className="px-6 py-16 text-center text-slate-500 text-xs uppercase tracking-widest">
                                        Nenhum registro de auditoria.
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
                <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-[#0F273F] border border-white/10 w-full max-w-lg p-4 md:p-6 shadow-2xl rounded-lg max-h-[90vh] overflow-y-auto">
                        <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                            <MessageCircle className="w-4 h-4 text-blue-400" /> Responder Chamado
                        </h3>

                        <div className="bg-[#0B1F33] p-4 border border-white/5 mb-4 text-xs text-slate-400 rounded-md">
                            <p className="mb-2 text-slate-500 uppercase text-[10px] font-bold">Mensagem do usuário:</p>
                            {editingTicket.description}
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] uppercase font-bold text-slate-500">Resposta</label>
                                <textarea
                                    value={ticketReply}
                                    onChange={e => setTicketReply(e.target.value)}
                                    className="w-full h-32 bg-[#0B1F33] border border-white/10 p-3 text-xs text-white outline-none focus:border-blue-500 rounded-md"
                                    placeholder="Digite sua resposta..."
                                />
                            </div>
                            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2">
                                <select
                                    value={ticketStatus}
                                    onChange={e => setTicketStatus(e.target.value)}
                                    className="bg-[#0B1F33] border border-white/10 text-xs text-white p-2 outline-none rounded-md"
                                >
                                    <option value="open">Aberto</option>
                                    <option value="in_progress">Em andamento</option>
                                    <option value="resolved">Resolvido</option>
                                </select>
                                <div className="flex gap-2 justify-end">
                                    <button onClick={() => setEditingTicket(null)} className="px-4 py-2 text-xs uppercase font-bold text-slate-400 hover:text-white" disabled={isSavingTicket}>Cancelar</button>
                                    <button onClick={handleSaveTicketResponse} disabled={isSavingTicket} className="px-4 py-2 bg-blue-600 text-white text-xs uppercase font-bold hover:bg-blue-500 rounded-md">
                                        {isSavingTicket ? 'Enviando...' : 'Enviar'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* NOTICE EDITOR */}
            {editingNotice && (
                <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-[#0F273F] border border-white/10 w-full max-w-lg p-4 md:p-6 shadow-2xl rounded-lg max-h-[90vh] overflow-y-auto">
                        <h3 className="text-white font-bold mb-6 flex items-center gap-2">
                            <Megaphone className="w-4 h-4 text-blue-400" /> Novo Aviso da Plataforma
                        </h3>
                        <div className="space-y-4">
                            <input
                                type="text"
                                className="w-full bg-[#0B1F33] border border-white/10 p-3 text-sm text-white outline-none focus:border-blue-500 rounded-md"
                                placeholder="Título do aviso"
                                value={editingNotice.title || ''}
                                onChange={e => setEditingNotice({ ...editingNotice, title: e.target.value })}
                            />
                            <textarea
                                className="w-full h-32 bg-[#0B1F33] border border-white/10 p-3 text-xs text-white outline-none focus:border-blue-500 rounded-md"
                                placeholder="Conteúdo da mensagem..."
                                value={editingNotice.content || ''}
                                onChange={e => setEditingNotice({ ...editingNotice, content: e.target.value })}
                            />

                            <div className="flex flex-col sm:flex-row gap-4">
                                <select
                                    className="bg-[#0B1F33] border border-white/10 text-xs text-white p-2 outline-none flex-1 rounded-md"
                                    value={editingNotice.level || 'info'}
                                    onChange={e => setEditingNotice({ ...editingNotice, level: e.target.value as any })}
                                >
                                    <option value="info">Informativo (Azul)</option>
                                    <option value="important">Importante (Âmbar)</option>
                                    <option value="critical">Crítico (Vermelho)</option>
                                </select>

                                <div className="flex flex-col gap-2">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 rounded border-white/10 bg-[#0B1F33] text-blue-600 focus:ring-blue-500"
                                            checked={editingNotice.is_mandatory || false}
                                            onChange={e => setEditingNotice({ ...editingNotice, is_mandatory: e.target.checked })}
                                        />
                                        <span className="text-xs text-white">Obrigatório (bloqueia o usuário)</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 rounded border-white/10 bg-[#0B1F33] text-green-600 focus:ring-green-500"
                                            checked={editingNotice.is_active ?? true}
                                            onChange={e => setEditingNotice({ ...editingNotice, is_active: e.target.checked })}
                                        />
                                        <span className="text-xs text-white">Ativo (visível)</span>
                                    </label>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 mt-4">
                                <button onClick={() => setEditingNotice(null)} className="px-4 py-2 text-xs uppercase font-bold text-slate-400 hover:text-white">Cancelar</button>
                                <button onClick={handleSaveNotice} className="px-4 py-2 bg-blue-600 text-white text-xs uppercase font-bold hover:bg-blue-500 rounded-md">
                                    {isSavingNotice ? 'Salvando...' : 'Publicar Aviso'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* PARTNER EDITOR */}
            {editingPartner && (
                <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-[#0F273F] border border-white/10 w-full max-w-lg p-4 md:p-6 shadow-2xl rounded-lg max-h-[90vh] overflow-y-auto">
                        <h3 className="text-white font-bold mb-6 flex items-center gap-2">
                            <Handshake className="w-4 h-4 text-blue-400" /> {editingPartner.id ? 'Editar Parceiro' : 'Novo Parceiro'}
                        </h3>
                        <div className="space-y-4">
                            <input
                                type="text"
                                className="w-full bg-[#0B1F33] border border-white/10 p-3 text-sm text-white outline-none focus:border-blue-500 rounded-md"
                                placeholder="Nome do parceiro"
                                value={editingPartner.name || ''}
                                onChange={e => setEditingPartner({ ...editingPartner, name: e.target.value })}
                            />
                            <div>
                                <input
                                    type="text"
                                    list="partner-category-options"
                                    className="w-full bg-[#0B1F33] border border-white/10 p-3 text-sm text-white outline-none focus:border-blue-500 rounded-md"
                                    placeholder="Categoria"
                                    value={editingPartner.category || ''}
                                    onChange={e => setEditingPartner({ ...editingPartner, category: e.target.value })}
                                />
                                <datalist id="partner-category-options">
                                    {PARTNER_CATEGORY_OPTIONS.map(c => <option key={c} value={c} />)}
                                </datalist>
                            </div>
                            <textarea
                                className="w-full h-20 bg-[#0B1F33] border border-white/10 p-3 text-xs text-white outline-none focus:border-blue-500 rounded-md"
                                placeholder="Descrição"
                                value={editingPartner.description || ''}
                                onChange={e => setEditingPartner({ ...editingPartner, description: e.target.value })}
                            />
                            <input
                                type="text"
                                className="w-full bg-[#0B1F33] border border-white/10 p-3 text-sm text-white outline-none focus:border-blue-500 rounded-md"
                                placeholder="URL do logo"
                                value={editingPartner.logo_url || ''}
                                onChange={e => setEditingPartner({ ...editingPartner, logo_url: e.target.value })}
                            />
                            <input
                                type="text"
                                className="w-full bg-[#0B1F33] border border-white/10 p-3 text-sm text-white outline-none focus:border-blue-500 rounded-md"
                                placeholder="WhatsApp (dígitos com DDI, ex: 5511999998888)"
                                value={editingPartner.whatsapp_phone || ''}
                                onChange={e => setEditingPartner({ ...editingPartner, whatsapp_phone: e.target.value })}
                            />
                            <input
                                type="text"
                                className="w-full bg-[#0B1F33] border border-white/10 p-3 text-sm text-white outline-none focus:border-blue-500 rounded-md"
                                placeholder="Site (https://...)"
                                value={editingPartner.website_url || ''}
                                onChange={e => setEditingPartner({ ...editingPartner, website_url: e.target.value })}
                            />
                            <div className="flex gap-3">
                                <input
                                    type="text"
                                    className="flex-1 bg-[#0B1F33] border border-white/10 p-3 text-sm text-white outline-none focus:border-blue-500 rounded-md"
                                    placeholder="Cidade"
                                    value={editingPartner.city || ''}
                                    onChange={e => setEditingPartner({ ...editingPartner, city: e.target.value })}
                                />
                                <input
                                    type="text"
                                    className="w-20 bg-[#0B1F33] border border-white/10 p-3 text-sm text-white outline-none focus:border-blue-500 rounded-md"
                                    placeholder="UF"
                                    maxLength={2}
                                    value={editingPartner.state || ''}
                                    onChange={e => setEditingPartner({ ...editingPartner, state: e.target.value.toUpperCase() })}
                                />
                            </div>
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="w-4 h-4 rounded border-white/10 bg-[#0B1F33] text-amber-500 focus:ring-amber-500"
                                        checked={editingPartner.is_featured || false}
                                        onChange={e => setEditingPartner({ ...editingPartner, is_featured: e.target.checked })}
                                    />
                                    <span className="text-xs text-white">Destaque</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="w-4 h-4 rounded border-white/10 bg-[#0B1F33] text-green-600 focus:ring-green-500"
                                        checked={editingPartner.is_active ?? true}
                                        onChange={e => setEditingPartner({ ...editingPartner, is_active: e.target.checked })}
                                    />
                                    <span className="text-xs text-white">Ativo</span>
                                </label>
                            </div>
                            <div className="flex justify-end gap-2 mt-4">
                                <button onClick={() => setEditingPartner(null)} className="px-4 py-2 text-xs uppercase font-bold text-slate-400 hover:text-white">Cancelar</button>
                                <button onClick={handleSavePartner} disabled={isSavingPartner} className="px-4 py-2 bg-blue-600 text-white text-xs uppercase font-bold hover:bg-blue-500 rounded-md disabled:opacity-50">
                                    {isSavingPartner ? 'Salvando...' : 'Salvar Parceiro'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* OFFER EDITOR */}
            {editingOffer && (
                <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-[#0F273F] border border-white/10 w-full max-w-lg p-4 md:p-6 shadow-2xl rounded-lg max-h-[90vh] overflow-y-auto">
                        <h3 className="text-white font-bold mb-6 flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-blue-400" /> {editingOffer.id ? 'Editar Oferta' : 'Nova Oferta'}
                        </h3>
                        <div className="space-y-4">
                            <select
                                className="w-full bg-[#0B1F33] border border-white/10 p-3 text-sm text-white outline-none focus:border-blue-500 rounded-md"
                                value={editingOffer.partner_id || ''}
                                onChange={e => setEditingOffer({ ...editingOffer, partner_id: e.target.value })}
                            >
                                <option value="" disabled>Selecione o parceiro</option>
                                {partners.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                            <input
                                type="text"
                                className="w-full bg-[#0B1F33] border border-white/10 p-3 text-sm text-white outline-none focus:border-blue-500 rounded-md"
                                placeholder="Título do benefício (ex: 10% de desconto)"
                                value={editingOffer.title || ''}
                                onChange={e => setEditingOffer({ ...editingOffer, title: e.target.value })}
                            />
                            <textarea
                                className="w-full h-20 bg-[#0B1F33] border border-white/10 p-3 text-xs text-white outline-none focus:border-blue-500 rounded-md"
                                placeholder="Descrição do benefício"
                                value={editingOffer.description || ''}
                                onChange={e => setEditingOffer({ ...editingOffer, description: e.target.value })}
                            />
                            <textarea
                                className="w-full h-20 bg-[#0B1F33] border border-white/10 p-3 text-xs text-white outline-none focus:border-blue-500 rounded-md"
                                placeholder="Regras de uso"
                                value={editingOffer.rules || ''}
                                onChange={e => setEditingOffer({ ...editingOffer, rules: e.target.value })}
                            />
                            <div>
                                <label className="text-[10px] uppercase font-bold text-slate-500">Válido até (opcional)</label>
                                <input
                                    type="date"
                                    className="w-full bg-[#0B1F33] border border-white/10 p-3 text-sm text-white outline-none focus:border-blue-500 rounded-md mt-1"
                                    value={editingOffer.valid_until || ''}
                                    onChange={e => setEditingOffer({ ...editingOffer, valid_until: e.target.value })}
                                />
                            </div>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 rounded border-white/10 bg-[#0B1F33] text-green-600 focus:ring-green-500"
                                    checked={editingOffer.is_active ?? true}
                                    onChange={e => setEditingOffer({ ...editingOffer, is_active: e.target.checked })}
                                />
                                <span className="text-xs text-white">Ativa</span>
                            </label>
                            <div className="flex justify-end gap-2 mt-4">
                                <button onClick={() => setEditingOffer(null)} className="px-4 py-2 text-xs uppercase font-bold text-slate-400 hover:text-white">Cancelar</button>
                                <button onClick={handleSaveOffer} disabled={isSavingOffer || !editingOffer.partner_id} className="px-4 py-2 bg-blue-600 text-white text-xs uppercase font-bold hover:bg-blue-500 rounded-md disabled:opacity-50">
                                    {isSavingOffer ? 'Salvando...' : 'Salvar Oferta'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* LEAD EDITOR */}
            {editingLead && (
                <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-[#0F273F] border border-white/10 w-full max-w-lg p-4 md:p-6 shadow-2xl rounded-lg max-h-[90vh] overflow-y-auto">
                        <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                            <Users className="w-4 h-4 text-blue-400" /> Lead
                        </h3>
                        <div className="bg-[#0B1F33] p-4 border border-white/5 mb-4 rounded-md text-xs text-slate-300 space-y-1">
                            <div><span className="text-slate-500">Usuário:</span> {editingLead.user_name || '—'} {editingLead.user_partner_code ? `(${editingLead.user_partner_code})` : ''}</div>
                            <div><span className="text-slate-500">Parceiro:</span> {partnerLookup.get(editingLead.partner_id)?.name || '—'}</div>
                            <div><span className="text-slate-500">Oferta:</span> {editingLead.offer_id ? (offerLookup.get(editingLead.offer_id)?.title || '—') : '—'}</div>
                            <div><span className="text-slate-500">Data:</span> {formatDate(editingLead.created_at)}</div>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] uppercase font-bold text-slate-500">Status</label>
                                <select
                                    value={editingLead.status}
                                    onChange={e => setEditingLead({ ...editingLead, status: e.target.value as PartnerLead['status'] })}
                                    className="w-full bg-[#0B1F33] border border-white/10 text-sm text-white p-2 outline-none rounded-md mt-1"
                                >
                                    <option value="novo">Novo</option>
                                    <option value="contatado">Contatado</option>
                                    <option value="convertido">Convertido</option>
                                    <option value="descartado">Descartado</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] uppercase font-bold text-slate-500">Notas internas</label>
                                <textarea
                                    value={editingLead.admin_notes || ''}
                                    onChange={e => setEditingLead({ ...editingLead, admin_notes: e.target.value })}
                                    className="w-full h-20 bg-[#0B1F33] border border-white/10 p-3 text-xs text-white outline-none focus:border-blue-500 mt-1 rounded-md"
                                    placeholder="Ex: falei com o parceiro, aguardando retorno..."
                                />
                            </div>
                            <div className="flex justify-end gap-2 mt-4">
                                <button onClick={() => setEditingLead(null)} className="px-4 py-2 text-xs uppercase font-bold text-slate-400 hover:text-white">Cancelar</button>
                                <button onClick={handleSaveLead} disabled={isSavingLead} className="px-4 py-2 bg-blue-600 text-white text-xs uppercase font-bold hover:bg-blue-500 rounded-md disabled:opacity-50">
                                    {isSavingLead ? 'Salvando...' : 'Salvar'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* USER EDITOR */}
            {editingUser && (
                <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-[#0F273F] border border-white/10 w-full max-w-lg p-4 md:p-6 shadow-2xl max-h-[90vh] overflow-y-auto rounded-lg">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-white font-bold flex items-center gap-2">
                                <Users className="w-4 h-4 text-blue-400" /> Perfil do Usuário
                            </h3>
                            <button onClick={() => setEditingUser(null)} className="text-slate-500 hover:text-white">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="bg-[#0B1F33] p-4 border border-white/5 mb-4 rounded-md">
                            <div className="text-white font-bold text-sm">{editingUser.name}</div>
                            <div className="text-[10px] text-slate-500">{editingUser.email}</div>
                            <div className="flex gap-4 mt-3 text-[10px] text-slate-400 flex-wrap">
                                <span>Fretes: {editingUser.total_freights ?? 0}</span>
                                <span className="text-amber-400">CF Coins: {editingUser.cf_coins_balance ?? 0}</span>
                                <span>Desde: {formatDate(editingUser.created_at)}</span>
                                <span className={editingUser.account_status === 'banned' ? 'text-red-400' : 'text-green-400'}>
                                    {editingUser.account_status === 'banned' ? 'Banido' : 'Ativo'}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] uppercase font-bold text-slate-500">Plano</label>
                                <div className="flex gap-2 mt-1">
                                    <select
                                        value={selectedPlan}
                                        onChange={e => setSelectedPlan(e.target.value as 'free' | 'pro')}
                                        className="bg-[#0B1F33] border border-white/10 text-xs text-white p-2 outline-none flex-1 rounded-md"
                                    >
                                        <option value="free">FREE</option>
                                        <option value="pro">PRO</option>
                                    </select>
                                    <button
                                        onClick={() => handleUpdatePlan(editingUser)}
                                        disabled={!!userAction}
                                        className="px-4 py-2 bg-blue-600 text-white text-xs uppercase font-bold hover:bg-blue-500 disabled:opacity-50 rounded-md"
                                    >
                                        Aplicar
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] uppercase font-bold text-slate-500">Notas Administrativas (internas)</label>
                                <textarea
                                    value={adminNotesInput}
                                    onChange={e => setAdminNotesInput(e.target.value)}
                                    onBlur={() => handleSaveAdminNotes(editingUser)}
                                    className="w-full h-20 bg-[#0B1F33] border border-white/10 p-3 text-xs text-white outline-none focus:border-blue-500 mt-1 rounded-md"
                                    placeholder="Ex: cliente reclamou de cobrança duplicada em..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-2 pt-2">
                                <button
                                    onClick={() => handleBanToggle(editingUser)}
                                    disabled={!!userAction}
                                    className={`px-3 py-2 text-xs uppercase font-bold border transition-colors disabled:opacity-50 rounded-md ${editingUser.account_status === 'banned'
                                        ? 'border-green-500/30 text-green-400 hover:bg-green-500/10'
                                        : 'border-red-500/30 text-red-400 hover:bg-red-500/10'
                                        }`}
                                >
                                    {editingUser.account_status === 'banned' ? 'Reativar Conta' : 'Banir Usuário'}
                                </button>
                                <button
                                    onClick={() => handleForceLogout(editingUser)}
                                    disabled={!!userAction}
                                    className="px-3 py-2 text-xs uppercase font-bold border border-white/10 text-slate-400 hover:bg-white/5 disabled:opacity-50 rounded-md"
                                >
                                    Forçar Logout
                                </button>
                                <button
                                    onClick={() => handleSendPasswordReset(editingUser)}
                                    disabled={!!userAction}
                                    className="col-span-2 px-3 py-2 text-xs uppercase font-bold border border-white/10 text-slate-400 hover:bg-white/5 disabled:opacity-50 rounded-md"
                                >
                                    Enviar Redefinição de Senha
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
    <div className="bg-[#12283F] border border-white/10 p-4 md:p-6 flex flex-col justify-between group hover:border-white/20 transition-all rounded-md">
        <div className="flex justify-between items-start mb-2 md:mb-4">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{label}</span>
            <Icon className={`w-4 h-4 ${color} opacity-50 group-hover:opacity-100 transition-opacity shrink-0`} />
        </div>
        <div>
            <div className="text-xl md:text-2xl font-mono font-bold text-white flex items-end gap-2">
                {value}
                {unit && <span className="text-[10px] text-slate-500 mb-1">{unit}</span>}
            </div>
            {trend && <div className="text-[10px] text-green-400 font-bold mt-1">{trend}</div>}
        </div>
    </div>
);

function formatDate(dateString: string) {
    if (!dateString) return '--';
    return new Date(dateString).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}
