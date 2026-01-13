import React, { useMemo, useState } from 'react';
import { Freight, Expense, DashboardStats, User, AccountPayable, ExtraIncome } from '../types';
import { formatCurrency, formatDate, getWeekNumber } from '../utils';
import { Card } from './Card';
import { Button } from './Button';
import { TrendingUp, Truck, Wallet, Briefcase, Plus, Calendar, Minus, X, Clock, Target, ArrowRight, Calculator, Sparkles, AlertTriangle, Zap, Shield, Gift } from 'lucide-react';
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
  accountsPayable: AccountPayable[];
  extraIncomes: ExtraIncome[];
  onRequestUpgrade?: () => void;
  onViewReferrals?: () => void;
  onAddExtraIncome: (ei: Omit<ExtraIncome, 'id' | 'user_id' | 'created_at'>) => Promise<void>;
  onDeleteExtraIncome: (id: string) => Promise<void>;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, freights, expenses, accountsPayable, extraIncomes, onAddFreight, onAddExpense, onViewSchedule, onOpenCalculator, onViewGoals, onUpgrade, onViewAgenda, onRequestUpgrade, onViewReferrals, onAddExtraIncome, onDeleteExtraIncome }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showBillAlert, setShowBillAlert] = useState(true);
  const [showUsageBanner, setShowUsageBanner] = useState(false);
  const [showExtraIncomeModal, setShowExtraIncomeModal] = useState(false);
  const [eiDesc, setEiDesc] = useState('');
  const [eiValue, setEiValue] = useState('');
  const [eiSource, setEiSource] = useState<'COMPANY' | 'DRIVER' | 'RESERVE'>('COMPANY');

  React.useEffect(() => {
    if (user.isPremium) return;

    // Check usage limits locally for prompt
    const freightCount = freights.length;
    const daysSinceSignup = Math.floor((new Date().getTime() - new Date(user.createdAt).getTime()) / (1000 * 3600 * 24));

    if (freightCount >= 5 || daysSinceSignup >= 7) {
      const lastPrompt = localStorage.getItem('control_frete_upgrade_prompt');
      if (!lastPrompt || (new Date().getTime() - new Date(lastPrompt).getTime()) > (7 * 24 * 60 * 60 * 1000)) {
        setShowUsageBanner(true);
      }
    }
  }, [user, freights]);

  const upcomingBills = useMemo(() => {
    if (!accountsPayable) return [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const in3Days = new Date(today);
    in3Days.setDate(today.getDate() + 3);

    return accountsPayable.filter(bill => {
      if (bill.status !== 'aberto') return false;
      const [y, m, d] = bill.due_date.split('-').map(Number);
      const dueDate = new Date(y, m - 1, d);
      dueDate.setHours(0, 0, 0, 0); // normalize
      return dueDate <= in3Days;
    });
  }, [accountsPayable]);

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

    // Deduct paid accounts payable based on source
    accountsPayable?.forEach(bill => {
      if (bill.status === 'pago' && bill.payment_source) {
        if (bill.payment_source === 'COMPANY') incomeStats.totalCompany -= bill.value;
        if (bill.payment_source === 'DRIVER') incomeStats.totalDriver -= bill.value;
        if (bill.payment_source === 'RESERVE') incomeStats.totalReserve -= bill.value;
      }
    });

    // Add Extra Incomes
    extraIncomes?.forEach(ei => {
      if (ei.source === 'COMPANY') incomeStats.totalCompany += ei.value;
      if (ei.source === 'DRIVER') incomeStats.totalDriver += ei.value;
      if (ei.source === 'RESERVE') incomeStats.totalReserve += ei.value;
    });

    return incomeStats;
  }, [freights, expenses, extraIncomes]);

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
      ...expenses.map(e => ({ ...e, type: 'EXPENSE' as const, sortDate: new Date(e.date) })),
      ...extraIncomes.map(ei => ({ ...ei, type: 'EXTRA' as const, sortDate: new Date(ei.date) }))
    ];

    return allItems
      .sort((a, b) => b.sortDate.getTime() - a.sortDate.getTime())
      .slice(0, 5);
  }, [freights, expenses, extraIncomes]);

  const pendingPercentage = stats.totalPending > 0
    ? Math.min(100, Math.round((receivableStats.next7Total / stats.totalPending) * 100))
    : 0;

  const { daysRemaining, isTrial, isExpired, isActive } = useSubscription(user);

  return (
    <div className="pb-24 space-y-6">
      {/* Pro Badge / Upgrade Banner */}
      {isActive ? (
        <div className={`border p-4 rounded-2xl flex items-center justify-between mb-2 ${isTrial ? 'bg-gradient-to-r from-brand to-brand-secondary border-brand/20 text-white' : 'bg-gradient-to-r from-accent-success/10 to-accent-success/5 border-accent-success/20'}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${isTrial ? 'bg-white/20' : 'bg-accent-success text-white'}`}>
              {isTrial ? <Zap className="w-5 h-5" /> : <Shield className="w-5 h-5" />}
            </div>
            <div>
              <h3 className={`font-bold text-sm uppercase tracking-tight ${isTrial ? 'text-white' : 'text-accent-success'}`}>
                {isTrial ? 'Período de Teste Ativo' : 'Plano Profissional Ativo'}
              </h3>
              <p className={`text-[10px] font-medium uppercase tracking-wider ${isTrial ? 'opacity-90' : 'text-accent-success/70'}`}>
                {isTrial ? `Você tem ${daysRemaining} dias restantes de acesso total` : 'Acesso Total Liberado'}
              </p>
            </div>
          </div>
          {isTrial && (
            <button
              onClick={onUpgrade}
              className="bg-white text-brand px-3 py-1.5 rounded-lg font-black text-[9px] uppercase tracking-wider hover:bg-slate-50 transition-colors shadow-sm"
            >
              Assinar Agora
            </button>
          )}
          {!isTrial && <Sparkles className="w-5 h-5 text-accent-success animate-pulse" />}
        </div>
      ) : (
        <div className="bg-red-500 p-4 rounded-2xl shadow-lg shadow-red-500/20 text-white flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5" />
            <div>
              <h3 className="font-bold text-sm uppercase">Período de Teste Expirado</h3>
              <p className="text-[10px] font-medium">Assine o Pro para liberar todos os recursos.</p>
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

      {/* Usage Trigger Banner */}
      {showUsageBanner && !user.isPremium && (
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-2xl shadow-lg text-white flex items-center justify-between mb-4 animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-full">
              <Sparkles className="w-5 h-5 text-yellow-300" />
            </div>
            <div>
              <h3 className="font-bold text-sm uppercase">Uso Intenso Detectado!</h3>
              <p className="text-[10px] opacity-90">Você está aproveitando bem o sistema. Vire PRO para não ter limites.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setShowUsageBanner(false);
                localStorage.setItem('control_frete_upgrade_prompt', new Date().toISOString());
              }}
              className="p-2 text-white/60 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
            <button
              onClick={onRequestUpgrade || onUpgrade}
              className="bg-white text-blue-600 px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-wider hover:bg-blue-50 transition-colors"
            >
              Vire PRO
            </button>
          </div>
        </div>
      )}

      <header className="flex items-center justify-between py-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight uppercase">Visão Geral</h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-roboto uppercase tracking-widest mt-0.5">Gestão Financeira</p>
        </div>
        <div className="flex items-center gap-2">
          {isActive && (
            <div className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border flex items-center gap-1.5 ring-4 ${isTrial ? 'bg-brand/20 text-brand border-brand/30 ring-brand/5' : 'bg-accent-success/10 text-accent-success border-accent-success/20 ring-accent-success/5'}`}>
              <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${isTrial ? 'bg-brand' : 'bg-accent-success'}`} />
              {isTrial ? 'TRIAL' : 'PRO'}
            </div>
          )}
          <div className="h-10 w-10 bg-brand/5 dark:bg-slate-800 rounded-xl flex items-center justify-center border border-slate-100 dark:border-slate-700">
            <Truck className="w-5 h-5 text-brand dark:text-brand-300" />
          </div>
        </div>
      </header>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

      {/* Referral Shortcut Widget - PRO Only */}
      {isActive && (
        <Card
          onClick={onViewReferrals}
          className="relative overflow-hidden border-none bg-gradient-to-br from-slate-900 to-black hover:from-black hover:to-slate-900 cursor-pointer transition-all group p-5 shadow-xl shadow-brand/10"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand/10 rounded-full blur-2xl -mr-10 -mt-10 opacity-30" />
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-4">
              <div className="bg-brand text-white p-2.5 rounded-xl shadow-lg shadow-brand/20">
                <Gift className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Convide e Ganhe R$</h3>
                <p className="text-[10px] font-bold text-brand uppercase tracking-widest mt-0.5">Ganhe 20% de cada indicação</p>
              </div>
            </div>
            <div className="bg-white/10 p-2 rounded-lg text-white group-hover:bg-brand group-hover:text-white transition-all">
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </Card>
      )}

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
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

          <div className="grid grid-cols-2 gap-3 md:contents">
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
                <div className={`w-1 h-8 rounded-full ${item.type === 'INCOME' || item.type === 'EXTRA' ? 'bg-accent-success' : 'bg-accent-error'}`}></div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white leading-tight">{(item as any).client || (item as any).description}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-[10px] text-slate-400 font-medium">{formatDate(item.date)}</p>
                    {item.type === 'EXTRA' && (
                      <span className="text-[8px] font-bold bg-green-100 text-green-600 px-1 rounded uppercase tracking-tighter">Entrada Extra</span>
                    )}
                  </div>
                </div>
              </div>
              <span className={`font-bold tabular-nums text-sm ${item.type === 'INCOME' || item.type === 'EXTRA' ? 'text-accent-success' : 'text-accent-error'}`}>
                {item.type === 'INCOME' || item.type === 'EXTRA' ? '+' : '-'}{formatCurrency((item as any).totalValue || (item as any).value)}
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
              onClick={() => { setIsMenuOpen(false); setShowExtraIncomeModal(true); }}
              className="flex items-center gap-3 bg-white dark:bg-slate-800 text-accent-success py-2.5 px-5 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 animate-slideUp"
            >
              <span className="font-roboto font-bold text-xs uppercase tracking-wider">Injetar Saldo</span>
              <TrendingUp className="w-5 h-5" />
            </button>
            <button
              onClick={() => { setIsMenuOpen(false); onOpenCalculator(); }}
              className="flex items-center gap-3 bg-white dark:bg-slate-800 text-brand-secondary py-2.5 px-5 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 animate-slideUp"
            >
              <span className="font-roboto font-bold text-xs uppercase tracking-wider">Calculadora</span>
              <Calculator className="w-5 h-5" />
            </button>
            <button
              onClick={() => {
                if (!isActive) {
                  alert('A Agenda é uma funcionalidade Pro!');
                  onUpgrade();
                  return;
                }
                setIsMenuOpen(false);
                onViewAgenda();
              }}
              className="flex items-center gap-3 bg-white dark:bg-slate-800 text-brand-secondary py-2.5 px-5 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 animate-slideUp"
            >
              <span className="font-roboto font-bold text-xs uppercase tracking-wider">Agenda {!isActive && '🔒'}</span>
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
              <span className="font-roboto font-bold text-xs uppercase tracking-wider">Lançar Entrada</span>
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

      {/* Accounts Payable Alert Modal */}
      {upcomingBills.length > 0 && showBillAlert && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-2xl p-6 shadow-2xl relative animate-slideUp">
            <button onClick={() => setShowBillAlert(false)} className="absolute top-4 right-4 text-slate-400">
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-xl">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Contas a Pagar</h3>
                <p className="text-xs text-slate-500">Você tem contas vencendo em breve.</p>
              </div>
            </div>

            <div className="space-y-2 mb-6 max-h-48 overflow-y-auto">
              {upcomingBills.map(bill => (
                <div key={bill.id} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{bill.description}</span>
                    <span className="text-[10px] text-slate-400">Vencimento: {formatDate(bill.due_date)}</span>
                  </div>
                  <span className="text-sm font-bold text-slate-800 dark:text-white tabular-nums">{formatCurrency(bill.value)}</span>
                </div>
              ))}
            </div>

            <Button onClick={() => { setShowBillAlert(false); onViewSchedule(); }} fullWidth>
              VER CONTAS
            </Button>
          </div>
        </div>
      )}

      {/* Extra Income Modal */}
      {showExtraIncomeModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-[2rem] p-6 shadow-2xl animate-slideUp relative">
            <button
              onClick={() => setShowExtraIncomeModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="mb-6 text-center">
              <div className="w-12 h-12 bg-green-50 dark:bg-green-900/20 rounded-2xl flex items-center justify-center text-accent-success mb-3 mx-auto">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">Injetar Saldo</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Adicione saldo manualmente sem descontos de serviço.</p>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!eiDesc || !eiValue) return;
              await onAddExtraIncome({
                description: eiDesc,
                value: parseFloat(eiValue),
                source: eiSource,
                date: new Date().toISOString().split('T')[0]
              });
              setShowExtraIncomeModal(false);
              setEiDesc('');
              setEiValue('');
            }} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Descrição</label>
                <input
                  type="text"
                  required
                  value={eiDesc}
                  onChange={(e) => setEiDesc(e.target.value)}
                  className="w-full p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700 outline-none focus:border-brand focus:ring-4 focus:ring-brand/10 transition-all font-medium text-slate-800 dark:text-white"
                  placeholder="Ex: Aporte de Capital"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Valor (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={eiValue}
                  onChange={(e) => setEiValue(e.target.value)}
                  className="w-full p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700 outline-none focus:border-brand focus:ring-4 focus:ring-brand/10 transition-all font-medium text-slate-800 dark:text-white"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Conta de Destino</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'COMPANY', label: 'Empresa' },
                    { id: 'DRIVER', label: 'Mot.' },
                    { id: 'RESERVE', label: 'Res.' }
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setEiSource(s.id as any)}
                      className={`py-2 text-[10px] font-bold uppercase rounded-xl border transition-all ${eiSource === s.id
                        ? 'bg-brand text-white border-brand'
                        : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-100 dark:border-slate-700 hover:bg-slate-50'}`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4">
                <Button type="submit" fullWidth className="bg-brand hover:bg-brand-hover text-white shadow-lg shadow-brand/20 h-14 text-sm uppercase tracking-widest font-black rounded-2xl">
                  INJETAR AGORA
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};