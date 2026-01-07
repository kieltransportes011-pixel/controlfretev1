
import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { Loader2, Megaphone, ChevronDown, ChevronUp, Clock, AlertTriangle, ShieldAlert, Info } from 'lucide-react';
import { PlatformNotice, User } from '../types';

interface NoticesCenterProps {
    user: User;
    onBack: () => void;
}

export const NoticesCenter: React.FC<NoticesCenterProps> = ({ user, onBack }) => {
    const [notices, setNotices] = useState<PlatformNotice[]>([]);
    const [readNoticeIds, setReadNoticeIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [expandedNoticeId, setExpandedNoticeId] = useState<string | null>(null);

    useEffect(() => {
        fetchNotices();
    }, []);

    const fetchNotices = async () => {
        try {
            setLoading(true);
            const { data: noticesData, error } = await supabase
                .from('platform_notices')
                .select('*')
                .eq('is_active', true)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const { data: readsData } = await supabase
                .from('notice_reads')
                .select('notice_id')
                .eq('user_id', user.id);

            if (readsData) {
                setReadNoticeIds(new Set(readsData.map(r => r.notice_id)));
            }

            setNotices(noticesData || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const toggleNotice = async (notice: PlatformNotice) => {
        const isExpanded = expandedNoticeId === notice.id;
        setExpandedNoticeId(isExpanded ? null : notice.id);

        if (!isExpanded && !readNoticeIds.has(notice.id)) {
            // Mark as read
            try {
                await supabase.from('notice_reads').insert([{
                    user_id: user.id,
                    notice_id: notice.id
                }]);
                setReadNoticeIds(prev => new Set(prev).add(notice.id));
            } catch (err) {
                console.error("Error marking read", err);
            }
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 min-h-[400px]">
                <Loader2 className="w-8 h-8 text-purple-600 animate-spin mb-4" />
                <p className="text-slate-500 font-medium">Carregando avisos...</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6 pb-24 animate-in fade-in duration-500">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 rounded-xl shadow-sm">
                    <Megaphone className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Central de Avisos</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Fique por dentro das novidades e comunicados oficiais.</p>
                </div>
            </div>

            <div className="space-y-4">
                {notices.map(notice => {
                    const isRead = readNoticeIds.has(notice.id);
                    const isExpanded = expandedNoticeId === notice.id;

                    return (
                        <div
                            key={notice.id}
                            className={`bg-white dark:bg-slate-900 rounded-xl border transition-all duration-300 overflow-hidden ${!isRead
                                    ? 'border-purple-200 shadow-md ring-1 ring-purple-100 dark:border-purple-800 dark:ring-purple-900/50'
                                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                                }`}
                        >
                            <div
                                onClick={() => toggleNotice(notice)}
                                className="p-5 cursor-pointer flex gap-4 items-start group"
                            >
                                <div className={`mt-1 p-2 rounded-lg shrink-0 transition-colors ${notice.level === 'critical' ? 'bg-red-50 text-red-600 dark:bg-red-900/20' :
                                        notice.level === 'important' ? 'bg-orange-50 text-orange-600 dark:bg-orange-900/20' :
                                            'bg-purple-50 text-purple-600 dark:bg-purple-900/20'
                                    }`}>
                                    {notice.level === 'critical' ? <ShieldAlert className="w-5 h-5" /> :
                                        notice.level === 'important' ? <AlertTriangle className="w-5 h-5" /> :
                                            <Info className="w-5 h-5" />}
                                </div>

                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        {!isRead && (
                                            <span className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded-full shadow-sm">
                                                Novo
                                            </span>
                                        )}
                                        <span className="text-xs text-slate-400 flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                                            <Clock className="w-3 h-3" />
                                            {new Date(notice.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <h3 className={`text-base font-bold mb-1 transition-colors ${!isRead ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300 group-hover:text-purple-600 dark:group-hover:text-purple-400'}`}>
                                        {notice.title}
                                    </h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
                                        {notice.summary || notice.content}
                                    </p>
                                </div>

                                <button className="text-slate-400 transition-transform duration-300 group-hover:text-purple-500">
                                    {isExpanded ? <ChevronUp /> : <ChevronDown />}
                                </button>
                            </div>

                            {/* Expanded Content */}
                            {isExpanded && (
                                <div className="px-5 pb-8 pt-0 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <div className="h-px bg-slate-100 dark:bg-slate-800 mb-6" />
                                    <div className="prose prose-sm dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                                        {notice.content}
                                    </div>
                                    {notice.level !== 'info' && (
                                        <div className="mt-6 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs text-slate-400 italic">
                                            Este é um comunicado oficial do sistema e não deve ser respondido.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}

                {notices.length === 0 && (
                    <div className="text-center py-16 px-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                        <div className="bg-slate-100 dark:bg-slate-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Megaphone className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">Nenhum aviso no momento</h3>
                        <p className="text-slate-500 max-w-sm mx-auto mt-2 text-sm">
                            Não há comunicados oficiais para serem exibidos.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};
