
import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { Sparkles, X, ArrowRight } from 'lucide-react';
import { PlatformNotice, User } from '../types';
import { Button } from './Button';

interface UpdateModalProps {
    user: User;
}

export const UpdateModal: React.FC<UpdateModalProps> = ({ user }) => {
    const [currentNotice, setCurrentNotice] = useState<PlatformNotice | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkUpdateNotices();
    }, [user.id]);

    const checkUpdateNotices = async () => {
        try {
            setLoading(true);

            // Get all active NON-mandatory notices (mandatory ones are handled by MandatoryNoticeModal)
            const { data: notices, error } = await supabase
                .from('platform_notices')
                .select('*')
                .eq('is_active', true)
                .eq('is_mandatory', false)
                .order('created_at', { ascending: false })
                .limit(1); // Only care about the very latest one

            if (error) throw error;
            if (!notices || notices.length === 0) {
                setLoading(false);
                return;
            }

            const latestNotice = notices[0];

            // Check if user has read this specific notice
            const { data: reads, error: readError } = await supabase
                .from('notice_reads')
                .select('notice_id')
                .eq('user_id', user.id)
                .eq('notice_id', latestNotice.id)
                .single();

            if (readError && readError.code !== 'PGRST116') throw readError; // PGRST116 is "no rows found"

            // If no read record found, show it
            if (!reads) {
                setCurrentNotice(latestNotice);
            }

        } catch (err) {
            console.error("Error checking update notices", err);
        } finally {
            setLoading(false);
        }
    };

    const handleDismiss = async () => {
        if (!currentNotice) return;

        // Mark as Read locally to close immediately
        const noticeId = currentNotice.id;
        setCurrentNotice(null);

        try {
            // Persist read status
            await supabase.from('notice_reads').insert([{
                user_id: user.id,
                notice_id: noticeId
            }]);
        } catch (err) {
            console.error("Error marking update as read", err);
        }
    };

    if (loading || !currentNotice) return null;

    return (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-500">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-purple-100 dark:border-purple-900 relative animate-in zoom-in-95 duration-300">
                {/* Decoration */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500"></div>
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl"></div>

                <div className="p-6 pb-0 relative">
                    <button
                        onClick={handleDismiss}
                        className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="w-14 h-14 bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/40 dark:to-indigo-900/40 rounded-2xl flex items-center justify-center mb-5 rotate-3 shadow-sm border border-white dark:border-slate-800">
                        <Sparkles className="w-7 h-7 text-purple-600 dark:text-purple-400" />
                    </div>

                    <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2 pr-8">
                        {currentNotice.title}
                    </h2>
                    <p className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest mb-4">
                        Novidades & Atualizações
                    </p>
                </div>

                <div className="px-6 py-2 max-h-[50vh] overflow-y-auto custom-scrollbar">
                    <div className="prose prose-sm dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 leading-relaxed">
                        <p className="whitespace-pre-wrap">{currentNotice.content}</p>
                    </div>
                </div>

                <div className="p-6 pt-4">
                    <Button fullWidth onClick={handleDismiss} className="shadow-lg shadow-purple-500/20">
                        Entendi, vamos lá! <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                </div>
            </div>
        </div>
    );
};
