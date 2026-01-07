
import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { Loader2, ShieldAlert, CheckCircle, AlertTriangle } from 'lucide-react';
import { PlatformNotice, User } from '../types';

interface MandatoryNoticeModalProps {
    user: User;
    onAllRead?: () => void;
}

export const MandatoryNoticeModal: React.FC<MandatoryNoticeModalProps> = ({ user, onAllRead }) => {
    const [currentNotice, setCurrentNotice] = useState<PlatformNotice | null>(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        checkMandatoryNotices();
    }, []);

    const checkMandatoryNotices = async () => {
        try {
            setLoading(true);

            // Get all mandatory active notices
            const { data: notices, error } = await supabase
                .from('platform_notices')
                .select('*')
                .eq('is_active', true)
                .eq('is_mandatory', true);

            if (error) throw error;
            if (!notices || notices.length === 0) {
                setLoading(false);
                if (onAllRead) onAllRead();
                return;
            }

            // Get user reads
            const { data: reads, error: readError } = await supabase
                .from('notice_reads')
                .select('notice_id')
                .eq('user_id', user.id);

            if (readError) throw readError;

            const readIds = new Set(reads?.map(r => r.notice_id) || []);

            // Find first unread mandatory notice
            const unread = notices.find(n => !readIds.has(n.id));

            if (unread) {
                setCurrentNotice(unread);
            } else {
                if (onAllRead) onAllRead();
            }

        } catch (err) {
            console.error("Error checking mandatory notices", err);
        } finally {
            setLoading(false);
        }
    };

    const handleAccept = async () => {
        if (!currentNotice) return;
        setProcessing(true);
        try {
            // Mark as Read
            await supabase.from('notice_reads').insert([{
                user_id: user.id,
                notice_id: currentNotice.id
            }]);

            // Check for next notice
            setCurrentNotice(null);
            checkMandatoryNotices();

        } catch (err) {
            console.error("Error accepting notice", err);
            alert("Erro ao confirmar leitura. Tente novamente.");
        } finally {
            setProcessing(false);
        }
    };

    if (loading || !currentNotice) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-300">
                <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex items-center gap-4">
                    <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full shrink-0">
                        <ShieldAlert className="w-8 h-8 text-red-600 dark:text-red-500" />
                    </div>
                    <div>
                        <span className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">Comunicado Obrigatório</span>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-tight mt-1">{currentNotice.title}</h2>
                    </div>
                </div>

                <div className="p-8 max-h-[60vh] overflow-y-auto">
                    <div className="prose prose-slate dark:prose-invert max-w-none text-slate-700 dark:text-slate-300">
                        <p className="whitespace-pre-wrap leading-relaxed">{currentNotice.content}</p>
                    </div>
                </div>

                <div className="p-6 bg-slate-50 dark:bg-slate-800 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3 mb-4 text-xs text-slate-500 dark:text-slate-400 bg-blue-50 dark:bg-blue-900/10 p-3 rounded-lg border border-blue-100 dark:border-blue-900/30">
                        <AlertTriangle className="w-4 h-4 text-blue-500 shrink-0" />
                        <p>Você precisa confirmar a leitura deste aviso para continuar usando a plataforma.</p>
                    </div>

                    <button
                        onClick={handleAccept}
                        disabled={processing}
                        className="w-full py-4 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-900 font-bold rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-lg shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {processing ? <Loader2 className="w-6 h-6 animate-spin" /> : <CheckCircle className="w-6 h-6" />}
                        Entendi e Concordo
                    </button>
                </div>
            </div>
        </div>
    );
};
