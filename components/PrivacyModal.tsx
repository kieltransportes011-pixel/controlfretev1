import React, { useState } from 'react';
import { Shield, Check, Lock, ExternalLink } from 'lucide-react';
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
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in duration-300">
                <div className="bg-brand text-white p-6 text-center">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                        <Lock className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-xl font-black uppercase tracking-wide">Transparência e Privacidade</h2>
                </div>

                <div className="p-8 space-y-6">
                    <div className="space-y-4">
                        <p className="text-slate-600 dark:text-slate-300 text-lg leading-relaxed font-medium">
                            Seus dados são exclusivamente seus.
                        </p>
                        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                            O <strong className="text-brand">Control Frete</strong> não acessa ganhos, despesas ou relatórios financeiros pessoais.
                            O acesso administrativo existe apenas para suporte, segurança e gestão da plataforma.
                        </p>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                        <div className="flex items-start gap-3">
                            <Shield className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Estamos comprometidos com a Lei Geral de Proteção de Dados (LGPD) e a segurança das suas informações.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-3 pt-2">
                        <button
                            onClick={handleAccept}
                            disabled={loading}
                            className="w-full bg-brand hover:bg-brand-hover text-white font-bold py-4 rounded-xl shadow-lg shadow-brand/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
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
                            className="w-full py-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                        >
                            Política de Privacidade <ExternalLink className="w-3 h-3" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
