import React from 'react';
import { Crown, X, Check } from 'lucide-react';
import { Button } from './Button';

interface UpgradeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpgrade: () => void;
    title?: string;
    description?: string;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose, onUpgrade, title, description }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl shadow-2xl relative overflow-hidden border border-slate-200 dark:border-slate-800">

                {/* Decorativo Header */}
                <div className="bg-brand h-32 absolute top-0 left-0 right-0 z-0 flex items-center justify-center">
                    <div className="w-96 h-96 bg-white/10 rounded-full absolute -top-48 -left-20 animate-pulse"></div>
                    <Crown className="w-16 h-16 text-white relative z-10 drop-shadow-md" />
                </div>

                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-20 p-2 bg-black/20 hover:bg-black/30 text-white rounded-full transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="pt-36 px-6 pb-8 text-center relative z-10">
                    <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight mb-2">
                        {title || 'Desbloqueie o Pro'}
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed mb-6">
                        {description || 'Você atingiu o limite do seu plano atual. Faça o upgrade para remover todas as restrições.'}
                    </p>

                    <div className="space-y-3 mb-8 text-left bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                            <Check className="w-4 h-4 text-green-500 font-bold" />
                            <span>Fretes Ilimitados</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                            <Check className="w-4 h-4 text-green-500 font-bold" />
                            <span>Histórico Completo</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                            <Check className="w-4 h-4 text-green-500 font-bold" />
                            <span>Relatórios e Recibos</span>
                        </div>
                    </div>

                    <Button onClick={onUpgrade} fullWidth className="h-14 text-sm font-black uppercase tracking-widest shadow-xl shadow-brand/20">
                        Quero ser PRO
                    </Button>

                    <button
                        onClick={onClose}
                        className="mt-4 text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 uppercase tracking-widest transition-colors"
                    >
                        Agora Não
                    </button>
                </div>
            </div>
        </div>
    );
};
