import React, { useMemo, useState } from 'react';
import { Freight, Expense, DashboardStats, User } from '../types';
import { formatCurrency, formatDate, getWeekNumber } from '../utils';
import { Card } from './Card';
import { TrendingUp, Truck, Wallet, Briefcase, Plus, Calendar, Minus, X, Clock, Target, ArrowRight, Calculator, Sparkles, AlertTriangle, Zap, Shield } from 'lucide-react';
import { useSubscription } from '../hooks/useSubscription';

interface DashboardProps {
  user: User;
  freights: Freight[];
  expenses: Expense[];
  onAddFreight: () => void;
  onAddExpense: () => void;
  onViewSchedule: () => void;
  onOpenCalculator: () => void;
  onViewGoals: () => void;
  onUpgrade: () => void;
  onViewAgenda: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, freights, expenses, onAddFreight, onAddExpense, onViewSchedule, onOpenCalculator, onViewGoals, onUpgrade, onViewAgenda }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const trialDaysRemaining = useMemo(() => {
    if (user.isPremium) return 0;
    const start = new Date(user.createdAt);
    const now = new Date();
    const diffMs = now.getTime() - start.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    return Math.max(0, Math.ceil(7 - diffDays));
  }, [user]);

  const stats: DashboardStats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const currentWeek = getWeekNumber(now);

    const incomeStats = freights.reduce((acc, curr) => {
      const date = new Date(curr.date);
      const isThisMonth = date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      const isThisWeek = getWeekNumber(date) === currentWeek && date.getFullYear() === currentYear;

      if (isThisMonth) acc.monthTotal += curr.totalValue;
      if (isThisWeek) acc.weekTotal += curr.totalValue;

      const received = curr.receivedValue ?? (curr.status === 'PAID' ? curr.totalValue : 0);
      const ratio = curr.totalValue > 0 ? received / curr.totalValue : 0;

      acc.totalCompany += (curr.companyValue * ratio);
      acc.totalDriver += (curr.driverValue * ratio);
      acc.totalReserve += (curr.reserveValue * ratio);

      acc.totalPending += (curr.pendingValue || 0);

      return acc;
    }, {
      monthTotal: 0,
      weekTotal: 0,
      totalCompany: 0,
      totalDriver: 0,
      totalReserve: 0,
      totalPending: 0
    });

    expenses.forEach(exp => {
      if (exp.source === 'COMPANY') incomeStats.totalCompany -= exp.value;
      if (exp.source === 'DRIVER') incomeStats.totalDriver -= exp.value;
      if (exp.source === 'RESERVE') incomeStats.totalReserve -= exp.value;
    });

    return incomeStats;
  }, [freights, expenses]);

  const receivableStats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const next7Days = new Date(today);
    next7Days.setDate(today.getDate() + 7);

    let next7Total = 0;

    freights.forEach(f => {
      if (f.status !== 'PAID' && f.pendingValue > 0 && f.dueDate) {
        const [y, m, d] = f.dueDate.split('-').map(Number);
        const due = new Date(y, m - 1, d);
        due.setHours(0, 0, 0, 0);
        if (due <= next7Days) {
          next7Total += f.pendingValue;
        }
      }
    });

    return { next7Total };
  }, [freights]);

  const recentActivity = useMemo(() => {
    const allItems = [
      ...freights.map(f => ({ ...f, type: 'INCOME' as const, sortDate: new Date(f.date) })),
      ...expenses.map(e => ({ ...e, type: 'EXPENSE' as const, sortDate: new Date(e.date) }))
    ];

    return allItems
      .sort((a, b) => b.sortDate.getTime() - a.sortDate.getTime())
      .slice(0, 5);
  }, [freights, expenses]);

  const pendingPercentage = stats.totalPending > 0
    ? Math.min(100, Math.round((receivableStats.next7Total / stats.totalPending) * 100))
    : 0;

  const { daysRemaining, isTrial, isExpired } = useSubscription(user);

  return (
    <div className="pb-24 space-y-6">
      {/* Pro Badge / Upgrade Banner */}
      {user.plano === 'pro' ? (
        <div className="bg-gradient-to-r from-accent-success/10 to-accent-success/5 border border-accent-success/20 p-4 rounded-2xl flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="bg-accent-success text-white p-2 rounded-xl">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-accent-success uppercase tracking-tight">Plano Profissional Ativo</h3>
              <p className="text-[10px] text-accent-success/70 font-medium uppercase tracking-wider">Acesso Total Liberado</p>
            </div>
          </div>
          <Sparkles className="w-5 h-5 text-accent-success animate-pulse" />
        </div>
      ) : (
        <>
          {isTrial && (
            <div className="bg-gradient-to-r from-brand to-brand-secondary p-4 rounded-2xl shadow-lg shadow-brand/20 text-white relative overflow-hidden animate-pulse-slow">
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-xl">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm uppercase tracking-tight">Plano Gratuito</h3>
                    <p className="text-[10px] font-medium opacity-90">Avaliação termina em <span className="font-black text-white">{daysRemaining} dias</span></p>
                  </div>
                </div>
                <button
                  onClick={onUpgrade}
                  className="bg-white text-brand px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-wider hover:bg-slate-50 transition-colors shadow-sm"
                >
                  Assinar Pro
                </button>
              </div>
              <Zap className="absolute -right-2 -bottom-2 w-16 h-16 opacity-10 rotate-12" />
            </div>
          )}

          {isExpired && (
            <div className="bg-red-500 p-4 rounded-2xl shadow-lg shadow-red-500/20 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5" />
                <div>
                  <h3 className="font-bold text-sm uppercase">Acesso Bloqueado</h3>
                  <p className="text-[10px] font-medium">Sua avaliação expirou. Assine o Pro para continuar.</p>
                </div>
              </div>
              <button
                onClick={onUpgrade}
                className="bg-white text-red-500 px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-wider"
              >
                Assinar Agora
              </button>
            </div>
          )}
        </>
      )}

      <header className="flex items-center justify-between py-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight uppercase">Visão Geral</h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-roboto uppercase tracking-widest mt-0.5">Gestão Financeira</p>
        </div>
        <div className="flex items-center gap-2">
          {user.plano === 'pro' && (
            <div className="bg-accent-success/10 text-accent-success px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-accent-success/20 flex items-center gap-1.5 ring-4 ring-accent-success/5">
              <div className="w-1.5 h-1.5 bg-accent-success rounded-full animate-pulse" />
              PRO
            </div>
          )}
          <div className="h-10 w-10 bg-brand/5 dark:bg-slate-800 rounded-xl flex items-center justify-center border border-slate-100 dark:border-slate-700">
            <Truck className="w-5 h-5 text-brand dark:text-brand-300" />
          </div>
        </div>
      </header>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-brand text-white border-none shadow-lg shadow-brand/20 relative overflow-hidden">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-3.5 h-3.5 text-blue-200" />
            <span className="text-[10px] font-roboto font-bold text-blue-100 uppercase tracking-widest">Receita Mês</span>
          </div>
          <p className="text-2xl font-bold text-white tabular-nums relative z-10">{formatCurrency(stats.monthTotal)}</p>
          <div className="absolute -right-4 -bottom-4 opacity-10">
            <TrendingUp className="w-20 h-20" />
          </div>
        </Card>

        <Card className="bg-white dark:bg-slate-800 border-slate-100">
          <div className="flex items-center gap-2 mb-2 text-slate-500">
            <TrendingUp className="w-3.5 h-3.5 text-accent-success" />
            <span className="text-[10px] font-roboto font-bold uppercase tracking-widest">Semanal</span>
          </div>
          <p className="text-2xl font-bold text-slate-800 dark:text-white tabular-nums">{formatCurrency(stats.weekTotal)}</p>
        </Card>
      </div>

      {/* Goal Widget */}
      <Card
        onClick={onViewGoals}
        className="relative overflow-hidden border border-slate-100 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-all group p-4"
      >
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-4">
            <div className="bg-slate-100 dark:bg-slate-700 text-brand dark:text-brand-300 p-2.5 rounded-xl">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white text-sm">Metas de Faturamento</h3>
              <p className="text-[10px] font-roboto text-slate-500 dark:text-slate-400 uppercase tracking-wider">Acompanhar progresso mensal</p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-brand-secondary group-hover:translate-x-1 transition-all" />
        </div>
      </Card>

      {/* Receivables Widget */}
      {stats.totalPending > 0 && (
        <div
          onClick={onViewSchedule}
          className="group bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer relative overflow-hidden"
        >
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="bg-orange-50 dark:bg-orange-900/20 p-1.5 rounded-lg text-accent-warning">
                  <Clock className="w-4 h-4" />
                </div>
                <h3 className="text-[10px] font-roboto font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">A Receber</h3>
              </div>
              <p className="text-2xl font-bold text-slate-800 dark:text-white tabular-nums">
                {formatCurrency(stats.totalPending)}
              </p>
            </div>
            <div className="text-slate-300 group-hover:text-brand-secondary transition-colors">
              <ArrowRight className="w-5 h-5" />
            </div>
          </div>

          <div className="relative z-10">
            <div className="flex justify-between items-end mb-2 text-xs">
              <span className="text-slate-500 dark:text-slate-400">Vencendo em breve</span>
              <span className="font-bold text-brand-secondary tabular-nums">
                {formatCurrency(receivableStats.next7Total)}
              </span>
            </div>

            <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-secondary rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${pendingPercentage}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* Cash Flow Section */}
      <div className="space-y-3">
        <h2 className="text-[10px] font-roboto font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] px-1">Saldo Líquido (Disponível)</h2>
        <div className="grid grid-cols-1 gap-3">
          <Card className="flex items-center justify-between py-3.5 border-slate-100">
            <div className="flex items-center gap-3">
              <div className="bg-slate-50 dark:bg-slate-700 p-2 rounded-lg">
                <Briefcase className="w-4 h-4 text-slate-400" />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-roboto font-bold uppercase">Empresa</p>
                <p className={`text-lg font-bold tabular-nums ${stats.totalCompany < 0 ? 'text-accent-error' : 'text-slate-800 dark:text-white'}`}>
                  {formatCurrency(stats.totalCompany)}
                </p>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-2 gap-3">
            <Card className="flex flex-col py-3.5 border-slate-100">
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-roboto font-bold uppercase mb-1">Motorista</p>
              <p className={`text-lg font-bold tabular-nums ${stats.totalDriver < 0 ? 'text-accent-error' : 'text-slate-800 dark:text-white'}`}>
                {formatCurrency(stats.totalDriver)}
              </p>
            </Card>
            <Card className="flex flex-col py-3.5 border-slate-100">
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-roboto font-bold uppercase mb-1">Reserva</p>
              <p className={`text-lg font-bold tabular-nums ${stats.totalReserve < 0 ? 'text-accent-error' : 'text-slate-800 dark:text-white'}`}>
                {formatCurrency(stats.totalReserve)}
              </p>
            </Card>
          </div>
        </div>
      </div>

      {/* Activity List */}
      <div className="space-y-3">
        <h2 className="text-[10px] font-roboto font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] px-1">Atividade Recente</h2>
        <div className="space-y-2.5">
          {recentActivity.map((item) => (
            <div key={item.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-slate-50 dark:border-slate-700 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className={`w-1 h-8 rounded-full ${item.type === 'INCOME' ? 'bg-accent-success' : 'bg-accent-error'}`}></div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white leading-tight">{(item as any).client || (item as any).description}</h3>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">{formatDate(item.date)}</p>
                </div>
              </div>
              <span className={`font-bold tabular-nums text-sm ${item.type === 'INCOME' ? 'text-accent-success' : 'text-accent-error'}`}>
                {item.type === 'INCOME' ? '+' : '-'}{formatCurrency((item as any).totalValue || (item as any).value)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Floating Button and Menu */}
      <div className="fixed bottom-24 right-4 z-50 flex flex-col items-end space-y-3">
        {isMenuOpen && (
          <>
            <button
              onClick={() => { setIsMenuOpen(false); onOpenCalculator(); }}
              className="flex items-center gap-3 bg-white dark:bg-slate-800 text-brand-secondary py-2.5 px-5 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 animate-slideUp"
            >
              <span className="font-roboto font-bold text-xs uppercase tracking-wider">Calculadora</span>
              <Calculator className="w-5 h-5" />
            </button>
            <button
              onClick={() => {
                if (user.plano !== 'pro') {
                  alert('A Agenda é uma funcionalidade Pro!');
                  onUpgrade();
                  return;
                }
                setIsMenuOpen(false);
                onViewAgenda();
              }}
              className="flex items-center gap-3 bg-white dark:bg-slate-800 text-brand-secondary py-2.5 px-5 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 animate-slideUp"
            >
              <span className="font-roboto font-bold text-xs uppercase tracking-wider">Agenda {user.plano !== 'pro' && '🔒'}</span>
              <Calendar className="w-5 h-5" />
            </button>
            <button
              onClick={() => { setIsMenuOpen(false); onAddExpense(); }}
              className="flex items-center gap-3 bg-white dark:bg-slate-800 text-accent-error py-2.5 px-5 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 animate-slideUp"
            >
              <span className="font-roboto font-bold text-xs uppercase tracking-wider">Lançar Saída</span>
              <Minus className="w-5 h-5" />
            </button>
            <button
              onClick={() => { setIsMenuOpen(false); onAddFreight(); }}
              className="flex items-center gap-3 bg-brand text-white py-2.5 px-5 rounded-2xl shadow-xl animate-slideUp"
            >
              <span className="font-roboto font-bold text-xs uppercase tracking-wider">Novo Frete</span>
              <Plus className="w-5 h-5" />
            </button>
          </>
        )}

        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className={`w-14 h-14 bg-brand hover:bg-brand-hover text-white rounded-2xl shadow-xl shadow-brand/20 transition-all flex items-center justify-center ${isMenuOpen ? 'rotate-45' : ''}`}
        >
          {isMenuOpen ? <X className="w-7 h-7" /> : <Plus className="w-7 h-7" />}
        </button>
      </div>
    </div>
  );
};