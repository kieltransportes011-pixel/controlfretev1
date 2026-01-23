import React from 'react';
import { Check, Star, Zap, Crown, Clock } from 'lucide-react';

interface PricingCardProps {
    title: string;
    price: string;
    period: string;
    description: string;
    features: string[];
    highlight?: boolean;
    onSelect: () => void;
    tag?: string;
    oldPrice?: string;
    scarceCount?: number;
}

export const PricingCard: React.FC<PricingCardProps> = ({
    title,
    price,
    period,
    description,
    features,
    highlight,
    onSelect,
    tag,
    oldPrice,
    scarceCount
}) => {
    return (
        <div className={`
            relative flex flex-col p-8 rounded-[2.5rem] transition-all duration-300
            ${highlight
                ? 'bg-slate-900 text-white shadow-2xl scale-105 z-10 border-4 border-brand'
                : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-100 dark:border-slate-700 hover:border-slate-300 hover:shadow-xl'
            }
        `}>
            {tag && (
                <div className="absolute top-0 right-0">
                    <div className={`
                        px-6 py-2 rounded-bl-2xl text-[10px] font-black uppercase tracking-[0.2em]
                        ${highlight ? 'bg-brand text-white' : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}
                    `}>
                        {tag}
                    </div>
                </div>
            )}

            <div className="mb-8">
                <h3 className={`text-xl font-black uppercase tracking-tight mb-4 ${highlight ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                    {title}
                </h3>

                <div className="flex flex-col">
                    {oldPrice && (
                        <span className="text-slate-400 dark:text-slate-500 line-through text-lg font-bold">
                            {oldPrice}
                        </span>
                    )}
                    <div className="flex items-baseline gap-1">
                        <span className={`text-4xl sm:text-5xl font-black ${highlight ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                            {price}
                        </span>
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${highlight ? 'text-slate-400' : 'text-slate-500'}`}>
                            /{period}
                        </span>
                    </div>
                </div>

                <p className={`mt-4 text-sm font-medium leading-relaxed ${highlight ? 'text-slate-400' : 'text-slate-500 dark:text-slate-400'}`}>
                    {description}
                </p>

                {/* Scarcity Indicator */}
                {scarceCount !== undefined && (
                    <div className="mt-6 bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-center gap-3 animate-pulse">
                        <Clock className="w-4 h-4 text-red-500" />
                        <div>
                            <div className="text-[10px] font-black uppercase text-red-500 tracking-widest mb-1">
                                Oferta Relâmpago
                            </div>
                            <div className="h-1.5 w-full bg-red-500/20 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-red-500 rounded-full transition-all duration-1000"
                                    style={{ width: `${(scarceCount / 20) * 100}%` }}
                                />
                            </div>
                            <p className="text-[10px] font-bold text-red-400 mt-1 text-right">
                                Restam apenas {scarceCount} vagas
                            </p>
                        </div>
                    </div>
                )}
            </div>

            <div className="space-y-4 mb-8 flex-1">
                {features.map((feature, i) => (
                    <div key={i} className="flex items-start gap-3">
                        <div className={`
                            mt-0.5 p-1 rounded-full flex-shrink-0
                            ${highlight ? 'bg-brand text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}
                        `}>
                            <Check className="w-3 h-3 font-bold" />
                        </div>
                        <span className={`text-sm font-bold ${highlight ? 'text-slate-200' : 'text-slate-600 dark:text-slate-400'}`}>
                            {feature}
                        </span>
                    </div>
                ))}
            </div>

            <button
                onClick={onSelect}
                className={`
                    w-full py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all hover:scale-105
                    ${highlight
                        ? 'bg-brand text-white shadow-xl shadow-brand/20'
                        : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                    }
                `}
            >
                {highlight ? 'Quero Promoção' : 'Selecionar Plano'}
            </button>
        </div>
    );
};
