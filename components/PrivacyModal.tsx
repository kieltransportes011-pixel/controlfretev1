import React, { useState } from 'react';
import { Shield, Lock, CheckCircle, FileText, ChevronRight } from 'lucide-react';

interface PrivacyModalProps {
    onAccept: () => void;
    onReadPolicy: () => void;
}

export const PrivacyModal: React.FC<PrivacyModalProps> = ({ onAccept, onReadPolicy }) => {
    const [isAccepting, setIsAccepting] = useState(false);

    const handleAccept = async () => {
        setIsAccepting(true);
        // Mimic async operation locally purely for UI feedback, 
        // real wait happens in parent or subsequent effect if needed, 
        // but here we just trigger the prop callback.
        setTimeout(() => {
            onAccept();
        }, 500);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-300">

                {/* Visual Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white text-center">
                    <div className="mx-auto w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mb-4 backdrop-blur-md">
                        <Lock className="w-6 h-6 text-white" />
                    </div>
                    <h2 className="text-xl font-bold">Transparência e Privacidade</h2>
                    <p className="text-white/80 text-sm mt-1">Seus dados são seus.</p>
                </div>

                <div className="p-6 md:p-8 space-y-6">

                    <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                        O <strong>Control Frete</strong> é uma ferramenta de gestão criada para ajudar você a se organizar — não para monitorar seus ganhos ou despesas.
                    </p>

                    {/* What we DON'T access */}
                    <div className="bg-red-50 dark:bg-red-900/10 rounded-xl p-4 border border-red-100 dark:border-red-900/20">
                        <h3 className="text-red-700 dark:text-red-400 font-bold text-xs uppercase tracking-wider mb-3 flex items-center gap-2">
                            <Shield className="w-3 h-3" />
                            O que NÃO acessamos
                        </h3>
                        <ul className="space-y-2">
                            {[
                                "Ganhos ou faturamento",
                                "Despesas registradas",
                                "Registros detalhados de fretes",
                                "Relatórios financeiros pessoais"
                            ].map((item, idx) => (
                                <li key={idx} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                        <p className="text-xs text-red-600 dark:text-red-400 mt-3 font-medium italic">
                            Essas informações são exclusivamente suas.
                        </p>
                    </div>

                    {/* What Admin CAN do */}
                    <div className="bg-green-50 dark:bg-green-900/10 rounded-xl p-4 border border-green-100 dark:border-green-900/20">
                        <h3 className="text-green-700 dark:text-green-400 font-bold text-xs uppercase tracking-wider mb-3 flex items-center gap-2">
                            <CheckCircle className="w-3 h-3" />
                            O que o admin pode fazer
                        </h3>
                        <ul className="space-y-2">
                            {[
                                "Gerenciar contas e planos",
                                "Prestar suporte técnico",
                                "Restaurar acesso em caso de problemas",
                                "Garantir a segurança da plataforma"
                            ].map((item, idx) => (
                                <li key={idx} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 shrink-0" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                        <p className="text-xs text-green-700 dark:text-green-400 mt-3 font-medium">
                            Nenhuma ação envolve análise financeira individual.
                        </p>
                    </div>

                    <div className="text-center text-xs text-slate-400 leading-relaxed px-4">
                        <span className="flex items-center justify-center gap-1.5 mb-1">
                            <Lock className="w-3 h-3" /> Seus dados são protegidos por regras de segurança e boas práticas conforme a LGPD.
                        </span>
                        Ao continuar, você concorda com nossos termos de uso e política de privacidade.
                    </div>

                </div>

                {/* Footer Actions */}
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-3">
                    <button
                        onClick={onReadPolicy}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 font-medium text-sm transition-colors"
                    >
                        <FileText className="w-4 h-4" />
                        Ler política de privacidade
                    </button>
                    <button
                        onClick={handleAccept}
                        disabled={isAccepting}
                        className="flex-[1.5] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20 font-bold text-sm transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isAccepting ? "Salvando..." : "Entendi e continuar"}
                        {!isAccepting && <ChevronRight className="w-4 h-4" />}
                    </button>
                </div>

            </div>
        </div>
    );
};
