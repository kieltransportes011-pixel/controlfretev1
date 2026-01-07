import React, { useState } from 'react';
import { Check, Lock, ExternalLink } from 'lucide-react';
import { supabase } from '../supabase';

interface PrivacyModalProps {
    userId: string;
    onAccept: () => void;
}

export const PrivacyModal: React.FC<PrivacyModalProps> = ({ userId, onAccept }) => {
    const [loading, setLoading] = useState(false);

    const handleAccept = async () => {
        setLoading(true);
        try {
            const now = new Date().toISOString();

            const { error } = await supabase
                .from('profiles')
                .update({
                    privacy_accepted: true,
                    privacy_accepted_at: now
                })
                .eq('id', userId);

            if (error) throw error;
            onAccept();
        } catch (error) {
            console.error("Erro ao aceitar privacidade:", error);
            alert("Erro ao processar. Tente novamente.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in duration-300 max-h-[85vh] flex flex-col">

                {/* Header - Fixed */}
                <div className="bg-orange-600 text-white p-5 text-center shrink-0">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 backdrop-blur-sm">
                        <Lock className="w-6 h-6 text-white" />
                    </div>
                    <h2 className="text-lg font-black uppercase tracking-wide leading-tight">
                        Transparência e Privacidade
                    </h2>
                </div>

                {/* Content - Scrollable if needed */}
                <div className="p-6 space-y-4 overflow-y-auto flex-1 bg-white dark:bg-slate-900">
                    <p className="text-slate-700 dark:text-slate-300 text-base font-bold leading-relaxed">
                        Seus dados são exclusivamente seus.
                    </p>

                    <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                        Não acessamos ganhos, despesas ou relatórios financeiros.
                        O acesso admin existe apenas para suporte e segurança.
                    </p>
                </div>

                {/* Footer - Fixed at bottom */}
                <div className="p-5 pt-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 shrink-0 space-y-3">
                    <button
                        onClick={handleAccept}
                        disabled={loading}
                        className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-orange-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <span className="animate-pulse">Registrando...</span>
                        ) : (
                            <>
                                <Check className="w-5 h-5" />
                                Entendi e Continuar
                            </>
                        )}
                    </button>

                    <button
                        onClick={() => window.open('/privacy', '_blank')}
                        className="w-full py-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                    >
                        Política de Privacidade <ExternalLink className="w-3 h-3" />
                    </button>
                </div>
            </div>
        </div>
    );
};
