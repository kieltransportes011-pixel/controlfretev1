import React, { useState, useMemo } from 'react';
import { Freight, AppSettings, GoalHistoryEntry } from '../types';
import { formatCurrency, formatDate } from '../utils';
import { Card } from './Card';
import { Button } from './Button';
import { CalendarPicker } from './CalendarPicker';
import {
  Target,
  TrendingUp,
  Calendar,
  ArrowRight,
  CheckCircle,
  Info,
  Trophy,
  Zap,
  History as HistoryIcon,
  XCircle,
  ChevronRight,
  ChevronLeft,
  Trash2,
  AlertTriangle,
  Clock
} from 'lucide-react';

interface MonthlyGoalProps {
  freights: Freight[];
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onBack: () => void;
}

export const MonthlyGoal: React.FC<MonthlyGoalProps> = ({ freights, settings, onUpdateSettings, onBack }) => {
  const [goalInput, setGoalInput] = useState<string>(settings.monthlyGoal?.toString() || '');
  const [deadlineInput, setDeadlineInput] = useState<string>(settings.monthlyGoalDeadline || '');
  const [isSaved, setIsSaved] = useState(false);

  const stats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Deadline logic
    let remainingDays = 0;
    if (deadlineInput) {
      const [y, m, d] = deadlineInput.split('-').map(Number);
      const deadlineDate = new Date(y, m - 1, d);
      deadlineDate.setHours(23, 59, 59);
      const diff = deadlineDate.getTime() - now.getTime();
      remainingDays = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    } else {
      const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      remainingDays = Math.max(1, lastDayOfMonth - now.getDate() + 1);
    }

    const monthTotal = freights.reduce((acc, curr) => {
      // Normalizing date to midday (12:00:00) to avoid timezone shifts affecting month calculation
      const date = new Date(curr.date + 'T12:00:00');
      if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
        return acc + curr.totalValue;
      }
      return acc;
    }, 0);

    const goal = settings.monthlyGoal || 0;
    const remaining = Math.max(0, goal - monthTotal);
    const progress = goal > 0 ? Math.min(200, (monthTotal / goal) * 100) : 0;
    const dailyNeeded = remainingDays > 0 ? remaining / remainingDays : 0;

    return {
      monthTotal,
      goal,
      remaining,
      progress,
      dailyNeeded,
      remainingDays,
      deadline: deadlineInput
    };
  }, [freights, settings.monthlyGoal, deadlineInput]);

  const historyStats = useMemo(() => {
    const months = [];
    const now = new Date();

    // Check saved history first
    const savedHistory = settings.goalHistory || [];

    // Generate derived history if not in saved history for last 3 months
    for (let i = 1; i <= 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const m = d.getMonth();
      const y = d.getFullYear();
      const monthLabel = d.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
      const monthKey = `${y}-${String(m + 1).padStart(2, '0')}`;

      const totalAchieved = freights.reduce((acc, curr) => {
        const fDate = new Date(curr.date + 'T12:00:00');
        if (fDate.getMonth() === m && fDate.getFullYear() === y) {
          return acc + curr.totalValue;
        }
        return acc;
      }, 0);

      const historicalEntry = savedHistory.find(h => h.month === monthKey);

      // Se tivermos fretes no mês ou uma meta salva, incluímos
      if (totalAchieved > 0 || historicalEntry) {
        const goal = historicalEntry?.goal || 0;
        months.push({
          monthKey,
          label: monthLabel,
          goal: goal,
          achieved: totalAchieved,
          percent: goal > 0 ? (totalAchieved / goal) * 100 : 0,
          success: goal > 0 && totalAchieved >= goal,
          isSaved: !!historicalEntry
        });
      }
    }
    return months;
  }, [freights, settings.goalHistory, settings.monthlyGoal]);

  const handleSaveGoal = () => {
    const newGoal = parseFloat(goalInput) || 0;
    onUpdateSettings({
      ...settings,
      monthlyGoal: newGoal,
      monthlyGoalDeadline: deadlineInput
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleDeleteHistory = (monthKey: string) => {
    if (window.confirm('Deseja excluir este registro do histórico de metas?')) {
      const newHistory = (settings.goalHistory || []).filter(h => h.month !== monthKey);
      onUpdateSettings({ ...settings, goalHistory: newHistory });
    }
  };

  const isGoalReached = stats.progress >= 100 && stats.goal > 0;
  const isCloseToGoal = stats.progress >= 80 && stats.progress < 100;

  return (
    <div className="pb-24 space-y-6 animate-fadeIn">
      <header className="flex justify-between items-center relative px-1">
        <div className="flex items-center">
          <button onClick={onBack} className="p-2 -ml-2 text-slate-500 hover:text-brand transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="ml-2">
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight uppercase">Meta Mensal</h1>
            <p className="text-slate-500 dark:text-slate-400 text-[10px] font-roboto font-bold uppercase tracking-widest mt-0.5">Desempenho e Foco</p>
          </div>
        </div>
        {isGoalReached && (
          <div className="bg-accent-warning/20 p-2 rounded-full animate-bounce">
            <Trophy className="w-6 h-6 text-accent-warning" />
          </div>
        )}
      </header>

      {isGoalReached && (
        <Card className="bg-brand text-white border-none p-6 flex flex-col items-center text-center space-y-2 animate-slideUp">
          <Trophy className="w-12 h-12 text-blue-200 mb-2" />
          <h2 className="text-xl font-black uppercase tracking-tight">Meta Concluída! 🏆</h2>
          <p className="text-xs font-medium text-blue-100">Você atingiu seu objetivo financeiro deste mês.</p>
        </Card>
      )}

      {/* Goal Definition */}
      <Card className="space-y-5">
        <div className="space-y-3">
          <div>
            <label className="block text-[10px] font-roboto font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Valor da Meta (R$)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 font-bold">R$</span>
              <input
                type="number"
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
                placeholder="0,00"
                className="w-full pl-11 pr-4 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl outline-none focus:border-brand-secondary font-bold text-xl text-slate-800 dark:text-white transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-roboto font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Prazo Final da Meta</label>
            <CalendarPicker
              selectedDate={deadlineInput}
              onChange={setDeadlineInput}
              className="z-20"
            />
            <p className="text-[9px] text-slate-400 font-medium mt-2 px-1 italic">Dica: Define até quando você quer bater esse valor.</p>
          </div>
        </div>

        <Button fullWidth onClick={handleSaveGoal} className="h-14">
          {isSaved ? <><CheckCircle className="w-5 h-5" /> META ATUALIZADA</> : "SALVAR PLANEJAMENTO"}
        </Button>
      </Card>

      {/* Progress Visualization */}
      <Card className="space-y-6 relative overflow-hidden">
        <div className="flex justify-between items-start relative z-10">
          <div>
            <h3 className="text-[10px] font-roboto font-bold text-slate-400 uppercase tracking-widest mb-1">Status da Meta</h3>
            <div className="text-4xl font-black text-brand dark:text-brand-300 tabular-nums tracking-tighter">
              {stats.progress.toFixed(0)}%
            </div>
          </div>
          <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-2xl">
            <Target className="w-6 h-6 text-brand/40" />
          </div>
        </div>

        <div className="relative h-4 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5">
          <div
            className={`h-full rounded-full transition-all duration-1000 ease-out ${isGoalReached ? 'bg-accent-success' : 'bg-brand-secondary'}`}
            style={{ width: `${Math.min(100, stats.progress)}%` }}
          />
        </div>

        <div className="flex flex-col items-center gap-1.5 relative z-10">
          {isGoalReached ? (
            <span className="text-[10px] font-black text-accent-success uppercase flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" /> Objetivo Batido
            </span>
          ) : (
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
              <Clock className="w-3.5 h-3.5" />
              <span className="text-[10px] font-black uppercase tracking-widest">
                Faltam {formatCurrency(stats.remaining)}
              </span>
            </div>
          )}
        </div>
      </Card>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="py-4 text-center border-slate-100">
          <p className="text-[9px] font-roboto font-bold text-slate-400 uppercase tracking-widest mb-1">Já Faturado</p>
          <p className="text-lg font-black text-slate-800 dark:text-white tabular-nums">{formatCurrency(stats.monthTotal)}</p>
        </Card>
        <Card className="py-4 text-center border-slate-100">
          <p className="text-[9px] font-roboto font-bold text-slate-400 uppercase tracking-widest mb-1">Média/Dia Necessária</p>
          <p className="text-lg font-black text-brand-secondary tabular-nums">
            {stats.goal > 0 && stats.remainingDays > 0 ? formatCurrency(stats.dailyNeeded) : '---'}
          </p>
        </Card>
      </div>

      {/* Timeline Section */}
      <section className="space-y-4 pt-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <HistoryIcon className="w-4 h-4 text-slate-400" />
            <h3 className="text-[10px] font-roboto font-bold text-slate-400 uppercase tracking-[0.2em]">Histórico de Metas</h3>
          </div>
        </div>

        <div className="space-y-3">
          {historyStats.map((item, idx) => (
            <div
              key={idx}
              className={`bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border flex items-center justify-between animate-fadeIn ${item.success ? 'border-green-100 dark:border-green-900/20' : 'border-slate-50 dark:border-slate-700'}`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.success ? 'bg-green-50 text-accent-success' : 'bg-slate-50 text-slate-400'}`}>
                  {item.success ? <Trophy className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-white capitalize">{item.label}</h4>
                  <p className="text-[9px] font-bold text-slate-400 uppercase">
                    {formatCurrency(item.achieved)} / {item.goal > 0 ? formatCurrency(item.goal) : 'Meta ñ def.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className={`text-xs font-black tabular-nums ${item.success ? 'text-accent-success' : 'text-slate-400'}`}>
                    {item.percent.toFixed(0)}%
                  </span>
                </div>
                {item.isSaved && (
                  <button
                    onClick={() => handleDeleteHistory(item.monthKey)}
                    className="p-2 text-slate-300 hover:text-accent-error hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}

          {historyStats.length === 0 && (
            <div className="text-center py-10 opacity-30">
              <HistoryIcon className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p className="text-[10px] font-roboto font-bold uppercase tracking-widest">Sem histórico disponível</p>
            </div>
          )}
        </div>
      </section>

      <div className="bg-slate-100 dark:bg-slate-800/50 p-4 rounded-2xl flex items-start gap-3">
        <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        <p className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase leading-relaxed">
          O cálculo da média diária leva em conta o prazo definido. Caso não defina um prazo, o sistema usará o último dia do mês corrente como padrão.
        </p>
      </div>
    </div>
  );
};