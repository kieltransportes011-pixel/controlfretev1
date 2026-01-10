import React from 'react';
import { Truck, X, Info } from 'lucide-react';

interface FreightNoticeModalProps {
    onClose: () => void;
}

export const FreightNoticeModal: React.FC<FreightNoticeModalProps> = ({ onClose }) => {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-300">
                <div className="relative p-6 text-center">
                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute right-4 top-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    {/* Icon */}
                    <div className="w-20 h-20 bg-brand-secondary/10 dark:bg-brand-secondary/20 rounded-full flex items-center justify-center mx-auto mb-6 ring-8 ring-brand-secondary/5">
                        <div className="relative">
                            <Truck className="w-10 h-10 text-brand-secondary" />
                            <div className="absolute -top-1 -right-1 bg-white dark:bg-slate-900 rounded-full p-0.5">
                                <Info className="w-4 h-4 text-brand-secondary" />
                            </div>
                        </div>
                    </div>

                    {/* Title */}
                    <h2 className="text-xl font-black text-slate-900 dark:text-white mb-3 uppercase tracking-tight">
                        Novidade em Breve
                    </h2>

                    {/* Content */}
                    <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed px-2">
                        Em breve haverá fretes disponíveis aqui. Estamos preparando essa funcionalidade.
                    </p>

                    {/* Action Button */}
                    <button
                        onClick={onClose}
                        className="w-full py-4 text-base font-bold bg-brand-secondary hover:bg-brand-secondary/90 text-white rounded-2xl shadow-lg shadow-brand-secondary/20 transition-all transform active:scale-[0.98]"
                    >
                        Entendi
                    </button>
                </div>

                {/* Bottom Bar Decoration */}
                <div className="h-1.5 w-full bg-gradient-to-r from-brand-secondary to-blue-600" />
            </div>
        </div>
    );
};
