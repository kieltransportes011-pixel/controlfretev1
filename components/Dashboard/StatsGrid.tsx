import React from 'react';
import { Card } from '../Card';
import { Calendar, TrendingUp, Target, ArrowUpRight, ArrowRight } from 'lucide-react';
import { formatCurrency } from '../../utils';
import { DashboardStats, AppSettings } from '../../types';
import { CardSkeleton } from '../Skeleton';

interface StatsGridProps {
    stats: DashboardStats;
    settings: AppSettings;
    loading?: boolean;
    onViewSchedule: () => void;
    onViewGoals: () => void;
    onOpenBalance: () => void;
}

export const StatsGrid: React.FC<StatsGridProps> = ({
    stats,
    settings,
    loading,
    onViewSchedule,
    onViewGoals,
    onOpenBalance
}) => {
    return (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {loading ? (
                <>
                    <CardSkeleton />
                    <CardSkeleton />
                    <CardSkeleton />
                    <CardSkeleton />
                    <CardSkeleton />
                </>
            ) : (
                <>
                    <Card
                        onClick={onViewSchedule}
                        className="group cursor-pointer hover:border-brand/30 transition-all border-l-4 border-l-brand"
                    >
                        <div className="flex items-center gap-2 text-slate-400 mb-1">
                            <Calendar className="w-3 h-3" />
                            <span className="text-[10px] font-black uppercase tracking-widest group-hover:text-brand transition-colors">Faturamento Semanal</span>
                        </div>
                        <p className="text-lg font-black text-slate-800 dark:text-white">{formatCurrency(stats.weekTotal)}</p>
                    </Card>

                    <Card className="border-l-4 border-l-emerald-500">
                        <div className="flex items-center gap-2 text-slate-400 mb-1">
                            <TrendingUp className="w-3 h-3" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Faturamento do Mês</span>
                        </div>
                        <p className="text-lg font-black text-slate-800 dark:text-white">{formatCurrency(stats.monthTotal)}</p>
                    </Card>

                    <Card className="border-l-4 border-l-indigo-500">
                        <div className="flex items-center gap-2 text-slate-400 mb-1">
                            <TrendingUp className="w-3 h-3" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Faturamento Mês Anterior</span>
                        </div>
                        <p className="text-lg font-black text-slate-800 dark:text-white">{formatCurrency(stats.previousMonthTotal)}</p>
                    </Card>

                    <Card onClick={onOpenBalance} className="border-l-4 border-l-blue-500 group cursor-pointer hover:border-blue-500/30 transition-all">
                        <div className="flex items-center gap-2 text-slate-400 mb-1">
                            <TrendingUp className="w-3 h-3" />
                            <span className="text-[10px] font-black uppercase tracking-widest group-hover:text-blue-500 transition-colors">Saldo Líquido</span>
                        </div>
                        <div className="flex items-end justify-between">
                            <p className={`text-lg font-black ${stats.netProfit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                {formatCurrency(stats.netProfit)}
                            </p>
                            <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                        </div>
                    </Card>

                    <Card onClick={onViewGoals} className="group cursor-pointer hover:border-orange-500/30 transition-all border-l-4 border-l-orange-500">
                        <div className="flex items-center gap-2 text-slate-400 mb-1">
                            <Target className="w-3 h-3" />
                            <span className="text-[10px] font-black uppercase tracking-widest group-hover:text-orange-500 transition-colors">Meta Mensal</span>
                        </div>
                        <div className="flex items-end justify-between">
                            <p className="text-lg font-black text-slate-800 dark:text-white">
                                {settings.monthlyGoal && settings.monthlyGoal > 0 ? Math.round((stats.monthTotal / settings.monthlyGoal) * 100) : 0}%
                            </p>
                            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:translate-x-1 transition-transform" />
                        </div>
                    </Card>
                </>
            )}
        </div>
    );
};
