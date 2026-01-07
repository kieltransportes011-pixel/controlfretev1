import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { User, SupportTicket } from '../types';
import { Button } from './Button';
import { Card } from './Card';
import { MessageCircle, Plus, ArrowLeft, Loader2, Send, FileText, CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface SupportProps {
    user: User;
    onBack: () => void;
}

type SupportView = 'LIST' | 'CREATE' | 'DETAIL';

export const Support: React.FC<SupportProps> = ({ user, onBack }) => {
    const [view, setView] = useState<SupportView>('LIST');
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);

    // Form State
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('Dúvida');
    const [description, setDescription] = useState('');
    const [sending, setSending] = useState(false);

    useEffect(() => {
        fetchTickets();
    }, [user.id]);

    const fetchTickets = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('support_tickets')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setTickets(data || []);
        } catch (error) {
            console.error('Error fetching tickets:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !description.trim()) {
            alert('Preencha todos os campos obrigatórios.');
            return;
        }

        setSending(true);
        try {
            const { error } = await supabase.from('support_tickets').insert([
                {
                    user_id: user.id,
                    title,
                    category,
                    description,
                    status: 'open',
                    priority: 'medium',
                }
            ]);

            if (error) throw error;

            alert('Solicitação enviada com sucesso! Nosso suporte irá analisar.');
            setTitle('');
            setDescription('');
            setCategory('Dúvida');
            setView('LIST');
            fetchTickets();
        } catch (error: any) {
            console.error('Error creating ticket:', error);
            alert('Erro ao enviar solicitação: ' + error.message);
        } finally {
            setSending(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'open': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
            case 'in_progress': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300';
            case 'resolved': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
            case 'closed': return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            open: 'Aberto',
            in_progress: 'Em Análise',
            resolved: 'Resolvido',
            closed: 'Fechado'
        };
        return labels[status] || status;
    };

    return (
        <div className="space-y-6 pb-24">
            <header className="flex items-center gap-4">
                <Button variant="ghost" onClick={() => view === 'LIST' ? onBack() : setView('LIST')} className="p-2">
                    <ArrowLeft className="w-6 h-6" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-base-text dark:text-white">Suporte</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Central de Ajuda</p>
                </div>
            </header>

            {view === 'LIST' && (
                <div className="space-y-6">
                    <Card className="p-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white border-none shadow-lg">
                        <h2 className="text-xl font-bold mb-2">Como podemos ajudar?</h2>
                        <p className="text-blue-100 mb-6 text-sm">
                            Abra um chamado para resolver problemas técnicos, dúvidas sobre pagamentos ou enviar sugestões.
                        </p>
                        <Button
                            onClick={() => setView('CREATE')}
                            className="bg-white text-blue-700 hover:bg-blue-50 border-none font-bold shadow-sm w-full sm:w-auto"
                        >
                            <Plus className="w-5 h-5 mr-2" />
                            Novo Chamado
                        </Button>
                    </Card>

                    <div>
                        <h3 className="text-lg font-bold text-base-text dark:text-white mb-4">Seus Chamados</h3>
                        {loading ? (
                            <div className="flex justify-center p-8">
                                <Loader2 className="w-8 h-8 animate-spin text-brand" />
                            </div>
                        ) : tickets.length === 0 ? (
                            <div className="text-center py-12 bg-slate-50 dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                                <MessageCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                <p className="text-slate-500 font-medium">Nenhum chamado encontrado.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {tickets.map((ticket) => (
                                    <Card
                                        key={ticket.id}
                                        className="p-4 hover:shadow-md transition-shadow cursor-pointer border border-slate-200 dark:border-slate-800"
                                        onClick={() => {
                                            setSelectedTicket(ticket);
                                            setView('DETAIL');
                                        }}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wide ${getStatusColor(ticket.status)}`}>
                                                {getStatusLabel(ticket.status)}
                                            </span>
                                            <span className="text-xs text-slate-400">
                                                {new Date(ticket.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <h4 className="font-bold text-base-text dark:text-white mb-1 line-clamp-1">{ticket.title}</h4>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">{ticket.description}</p>
                                        {ticket.admin_reply && (
                                            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400 font-medium">
                                                <MessageCircle className="w-3 h-3" />
                                                Respondido pelo suporte
                                            </div>
                                        )}
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {view === 'CREATE' && (
                <Card className="p-6">
                    <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-brand" />
                        Novo Chamado
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Título do Problema *</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Resumo do problema"
                                className="w-full p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:border-brand dark:text-white"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Categoria *</label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:border-brand dark:text-white"
                            >
                                <option value="Acesso / Login">Acesso / Login</option>
                                <option value="Pagamento / Plano">Pagamento / Plano</option>
                                <option value="Erro no Sistema">Erro no Sistema</option>
                                <option value="Dúvida">Dúvida</option>
                                <option value="Sugestão">Sugestão</option>
                                <option value="Outro">Outro</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Descrição Detalhada *</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Descreva o que aconteceu..."
                                rows={5}
                                className="w-full p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:border-brand dark:text-white resize-none"
                                required
                            />
                        </div>

                        <div className="pt-4 flex gap-3">
                            <Button type="button" variant="outline" onClick={() => setView('LIST')} disabled={sending} className="flex-1">
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={sending} className="flex-1 flex items-center justify-center gap-2">
                                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                Enviar Solicitação
                            </Button>
                        </div>
                    </form>
                </Card>
            )}

            {view === 'DETAIL' && selectedTicket && (
                <div className="space-y-6">
                    <Card className="p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wide mb-2 inline-block ${getStatusColor(selectedTicket.status)}`}>
                                    {getStatusLabel(selectedTicket.status)}
                                </span>
                                <h2 className="text-xl font-bold text-base-text dark:text-white">{selectedTicket.title}</h2>
                                <span className="text-xs text-slate-400">Categoria: {selectedTicket.category} • {new Date(selectedTicket.created_at).toLocaleString()}</span>
                            </div>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg mb-6 border border-slate-100 dark:border-slate-800">
                            <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                                {selectedTicket.description}
                            </p>
                        </div>

                        {selectedTicket.admin_reply ? (
                            <div className="bg-blue-50 dark:bg-blue-900/10 p-5 rounded-xl border border-blue-100 dark:border-blue-900/30">
                                <h3 className="text-sm font-bold text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2">
                                    <MessageCircle className="w-4 h-4" />
                                    Resposta do Suporte
                                </h3>
                                <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                                    {selectedTicket.admin_reply}
                                </p>
                                <p className="text-[10px] text-blue-400 mt-2 text-right">
                                    Atualizado em: {new Date(selectedTicket.updated_at).toLocaleString()}
                                </p>
                            </div>
                        ) : (
                            <div className="text-center py-6 text-slate-400 text-sm flex flex-col items-center gap-2">
                                <Clock className="w-8 h-8 text-slate-300" />
                                <p>Aguardando análise da nossa equipe.</p>
                            </div>
                        )}
                    </Card>
                </div>
            )}
        </div>
    );
};
