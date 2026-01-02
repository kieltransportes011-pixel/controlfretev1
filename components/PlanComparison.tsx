import React from 'react';
import { Check, X, Crown, Zap } from 'lucide-react';
import { Button } from './Button';

interface PlanComparisonProps {
    onUpgrade: () => void;
    isLoading?: boolean;
}

export const PlanComparison: React.FC<PlanComparisonProps> = ({ onUpgrade, isLoading }) => {
    const features = [
        { name: 'Cálculo de Fretes', free: '5 por mês', pro: 'Ilimitado' },
        { name: 'Histórico de Registros', free: 'Últimos 7 dias', pro: 'Completo' },
        { name: 'Meta Mensal', free: '1 Ativa', pro: 'Histórico Completo' },
        { name: 'Relatórios e Exportação', free: false, pro: true },
        { name: 'Agenda Inteligente', free: false, pro: true },
        { name: 'Suporte Prioritário', free: false, pro: true },
        { name: 'Backup na Nuvem', free: true, pro: true },
    ];

    return (
        <div className="grid md:grid-cols-2 gap-4 max-w-4xl mx-auto p-4">
            {/* Free Plan */}
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 flex flex-col items-center">
                <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest mb-2">Gratuito</h3>
                <p className="text-3xl font-black text-slate-800 dark:text-white mb-6">R$ 0</p>

                <div className="w-full space-y-4 mb-8 flex-1">
                    {features.map((feature, idx) => (
                        <div key={idx} className="flex justify-between items-center text-sm border-b border-slate-200 dark:border-slate-700 pb-2 last:border-0">
                            <span className="text-slate-600 dark:text-slate-400 font-medium">{feature.name}</span>
                            <span className="text-slate-800 dark:text-white font-bold text-right">
                                {feature.free === true ? <Check className="w-5 h-5 text-green-500" /> :
                                    feature.free === false ? <X className="w-5 h-5 text-slate-300" /> :
                                        feature.free}
                            </span>
                        </div>
                    ))}
                </div>

                <button disabled className="w-full py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 text-slate-400 font-bold text-xs uppercase cursor-default">
                    Plano Atual
                </button>
            </div>

            {/* Pro Plan */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border-2 border-brand relative flex flex-col items-center shadow-xl shadow-brand/10 transform scale-105 z-10">
                <div className="absolute top-0 right-0 bg-brand text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-widest">
                    Mais Vantajoso
                </div>

                <div className="w-12 h-12 bg-brand/10 rounded-full flex items-center justify-center mb-2">
                    <Crown className="w-6 h-6 text-brand" />
                </div>
                <h3 className="text-xl font-bold text-brand uppercase tracking-widest mb-1">Profissional</h3>
                <div className="flex flex-col items-center mb-6">
                    <div className="flex items-end gap-1">
                        <span className="text-sm font-bold text-slate-400 mb-1">R$</span>
                        <span className="text-4xl font-black text-slate-800 dark:text-white tracking-tighter">49,99</span>
                        <span className="text-sm font-bold text-slate-400 mb-1">/ano</span>
                    </div>
                    <p className="text-xs font-bold text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-full mt-1">
                        Equivalente a R$ 4,16 / mês
                    </p>
                </div>

                <div className="w-full space-y-4 mb-8 flex-1">
                    {features.map((feature, idx) => (
                        <div key={idx} className="flex justify-between items-center text-sm border-b border-slate-100 dark:border-slate-800 pb-2 last:border-0">
                            <span className="text-slate-600 dark:text-slate-400 font-medium">{feature.name}</span>
                            <span className="text-slate-800 dark:text-white font-bold text-right">
                                {feature.pro === true ? <Check className="w-5 h-5 text-green-500" /> :
                                    feature.pro === false ? <X className="w-5 h-5 text-slate-300" /> :
                                        feature.pro}
                            </span>
                        </div>
                    ))}
                </div>

                <Button
                    fullWidth
                    onClick={onUpgrade}
                    disabled={isLoading}
                    className="h-12 text-sm uppercase tracking-widest font-black"
                >
                    {isLoading ? 'Processando...' : 'Desbloquear Agora'}
                </Button>
            </div>
        </div>
    );
};
