
import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { Loader2, ShieldCheck, User, Shield, Server, Clock } from 'lucide-react';
import { AccountActivityLog } from '../types';

interface ActivityHistoryProps {
    userId: string;
}

export const ActivityHistory: React.FC<ActivityHistoryProps> = ({ userId }) => {
    const [logs, setLogs] = useState<AccountActivityLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLogs();
    }, [userId]);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('account_activity_logs')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(20); // Limit to last 20 events for cleaner view

            if (error) throw error;
            setLogs(data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            </div>
        );
    }

    if (logs.length === 0) {
        return (
            <div className="text-center p-8 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                <ShieldCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500">Nenhuma atividade de segurança registrada recentemente.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <h3 className="font-bold text-sm text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Últimas Atividades de Segurança
            </h3>
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                {logs.map((log) => {
                    const isUser = log.actor === 'user';
                    const isAdmin = log.actor === 'admin';

                    return (
                        <div key={log.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                            <div className="flex items-start gap-3">
                                <div className={`mt-0.5 p-1.5 rounded-full ${isUser ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/20' :
                                        isAdmin ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/20' :
                                            'bg-slate-100 text-slate-600'
                                    }`}>
                                    {isUser ? <User className="w-4 h-4" /> :
                                        isAdmin ? <Shield className="w-4 h-4" /> :
                                            <Server className="w-4 h-4" />}
                                </div>
                                <div>
                                    <p className="font-medium text-slate-800 dark:text-slate-200 text-sm">{log.action}</p>
                                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                                        <span>Origem: {isUser ? 'Você' : isAdmin ? 'Suporte / Admin' : 'Sistema'}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-slate-400 sm:text-right pl-9 sm:pl-0">
                                <Clock className="w-3 h-3" />
                                {new Date(log.created_at).toLocaleString()}
                            </div>
                        </div>
                    );
                })}
            </div>
            <div className="text-center">
                <p className="text-[10px] text-slate-400">
                    Mostrando as últimas 20 atividades. Logs mais antigos são arquivados por segurança.
                </p>
            </div>
        </div>
    );
};
