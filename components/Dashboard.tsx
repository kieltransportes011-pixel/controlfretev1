import React, { useMemo, useState } from 'react';
import { Freight, Expense, DashboardStats, User, AccountPayable, ExtraIncome } from '../types';
import { formatCurrency, formatDate, getWeekNumber } from '../utils';
import { Card } from './Card';
import { Button } from './Button';
import {
  TrendingUp, Truck, Wallet, Briefcase, Plus, Calendar, Minus, X, Clock,
  Target, ArrowRight, Calculator, Sparkles, AlertTriangle, Zap, Shield,
  Gift, Users, Wrench, FileStack, ShieldCheck, Loader2
} from 'lucide-react';
import { CardSkeleton } from './Skeleton';
import { useSubscription } from '../hooks/useSubscription';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

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
  onViewClients: () => void;
  onViewFleet: () => void;
  onViewMaintenance: () => void;
  onViewDocuments: () => void;
  onAddExtraIncome: (ei: Omit<ExtraIncome, 'id' | 'user_id' | 'created_at'>) => Promise<void>;
  onDeleteExtraIncome: (id: string) => Promise<void>;
  loading?: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, freights, expenses, accountsPayable, extraIncomes, onAddFreight, onAddExpense, onViewSchedule, onOpenCalculator, onViewGoals, onUpgrade, onViewAgenda, onRequestUpgrade, onViewReferrals, onViewClients, onViewFleet, onViewMaintenance, onViewDocuments, onAddExtraIncome, onDeleteExtraIncome, loading }) => {
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

      if (isThisMonth) {
        acc.companyMonth += curr.companyValue;
        acc.driverMonth += curr.driverValue;
        acc.reserveMonth += curr.reserveValue;
        acc.receivedMonth += received;
      }

      return acc;
    }, { monthTotal: 0, weekTotal: 0, companyMonth: 0, driverMonth: 0, reserveMonth: 0, receivedMonth: 0 });

    const expenseTotal = expenses.reduce((acc, curr) => {
      const date = new Date(curr.date);
      if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
        return acc + curr.value;
      }
      return acc;
    }, 0);

    const extraTotal = extraIncomes.reduce((acc, curr) => {
      const date = new Date(curr.date);
      if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
        return acc + curr.value;
      }
      return acc;
    }, 0);

    const netProfit = incomeStats.monthTotal - expenseTotal + extraTotal;

    return {
      ...incomeStats,
      expenseMonth: expenseTotal,
      extraMonth: extraTotal,
      netProfit
    };
  }, [freights, expenses, extraIncomes]);

  const chartData = useMemo(() => {
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const now = new Date();
    const weekData = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now);
      d.setDate(now.getDate() - (6 - i));
      return {
        name: days[d.getDay()],
        total: freights
          .filter(f => new Date(f.date).toDateString() === d.toDateString())
          .reduce((sum, f) => sum + f.totalValue, 0)
      };
    });
    return weekData;
  }, [freights]);

  const { isActive, isTrial } = useSubscription(user);

  return (
    <div className="pb-24 space-y-6 animate-fadeIn">
      {/* Header */}
      <header className="flex justify-between items-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-4 -m-4 mb-2 sticky top-0 z-10 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand rounded-full flex items-center justify-center text-white shadow-lg shadow-brand/20">
            <Zap className="w-6 h-6 fill-current" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Painel Principal</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1">
              {user.isPremium ? <><Shield className="w-3 h-3 text-brand" /> Plano Pro Ativo</> : 'Acesso Limitado'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onOpenCalculator} className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-brand hover:text-white transition-all">
            <Calculator className="w-5 h-5" />
          </button>
          {!user.isPremium && (
            <button onClick={onUpgrade} className="hidden md:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-orange-500/20 hover:scale-105 transition-all">
              <Sparkles className="w-4 h-4" /> Virar Pro
            </button>
          )}
        </div>
      </header>

      {/* Bill Alerts */}
      {upcomingBills.length > 0 && showBillAlert && (
        <div className="bg-red-500 text-white p-4 rounded-2xl flex items-center justify-between shadow-lg shadow-red-500/20 animate-bounce-subtle">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-xl">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-tight">Contas Próximas do Vencimento</p>
              <p className="text-[10px] opacity-90 font-bold">{upcomingBills.length} pendência(s) para os próximos 3 dias.</p>
            </div>
          </div>
          <button onClick={() => setShowBillAlert(false)} className="bg-white/10 p-1.5 rounded-lg hover:bg-white/20">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Trial Banner */}
      {isTrial && trialDaysRemaining > 0 && (
        <div className="bg-gradient-to-r from-brand to-blue-600 text-white p-4 rounded-2xl flex items-center justify-between shadow-lg shadow-brand/20">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-xl">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-tight">Período de Teste Grátis</p>
              <p className="text-[10px] opacity-90 font-bold">Você tem {trialDaysRemaining} dias de acesso PRO liberado.</p>
            </div>
          </div>
          <button onClick={onUpgrade} className="bg-white text-brand px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-colors">
            Assinar Agora
          </button>
        </div>
      )}

      {/* Usage Banner */}
      {showUsageBanner && (
        <Card className="bg-slate-900 border-none p-6 text-white overflow-hidden relative group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand/20 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-brand/40 transition-all"></div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-black leading-tight uppercase tracking-tight">Evolua seu negócio <br /><span className="text-brand">Vire um profissional PRO</span></h2>
              <p className="text-slate-400 text-sm font-bold flex items-center gap-2">
                <Truck className="w-4 h-4" /> Gestão Completa • Sem Limites • Relatórios PDF
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowUsageBanner(false)} className="px-6 py-3 border border-slate-700 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-colors">
                Depois
              </button>
              <button
                onClick={onUpgrade}
                className="px-8 py-3 bg-brand text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-xl shadow-brand/20 hover:scale-105 transition-all flex items-center gap-2"
              >
                Começar Agora <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {loading ? (
          <>
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

            <Card className="border-l-4 border-l-blue-500">
              <div className="flex items-center gap-2 text-slate-400 mb-1">
                <TrendingUp className="w-3 h-3" />
                <span className="text-[10px] font-black uppercase tracking-widest">Saldo Líquido</span>
              </div>
              <p className={`text-lg font-black ${stats.netProfit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                {formatCurrency(stats.netProfit)}
              </p>
            </Card>

            <Card onClick={onViewGoals} className="group cursor-pointer hover:border-orange-500/30 transition-all border-l-4 border-l-orange-500">
              <div className="flex items-center gap-2 text-slate-400 mb-1">
                <Target className="w-3 h-3" />
                <span className="text-[10px] font-black uppercase tracking-widest group-hover:text-orange-500 transition-colors">Meta Mensal</span>
              </div>
              <div className="flex items-end justify-between">
                <p className="text-lg font-black text-slate-800 dark:text-white">
                  {Math.round((stats.monthTotal / (user.monthlyGoal || 1)) * 100)}%
                </p>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:translate-x-1 transition-transform" />
              </div>
            </Card>
          </>
        )}
      </div>

      {/* Pro Features Shortcuts */}
      {isActive && (
        <div className="space-y-3">
          <h2 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] px-1 flex items-center gap-2">
            <ShieldCheck className="w-3 h-3" /> Gestão de Ativos (Frota)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Card onClick={onViewFleet} className="p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all group border-b-2 border-transparent hover:border-brand">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500 group-hover:text-brand group-hover:bg-brand/10 transition-all">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase">Caminhões</h3>
                  <p className="text-[9px] text-slate-400 font-bold uppercase">Frota Ativa</p>
                </div>
              </div>
            </Card>
            <Card onClick={onViewMaintenance} className="p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all group border-b-2 border-transparent hover:border-orange-500">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500 group-hover:text-orange-500 group-hover:bg-orange-500/10 transition-all">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase">Manutenção</h3>
                  <p className="text-[9px] text-slate-400 font-bold uppercase">Alertas de Revisão</p>
                </div>
              </div>
            </Card>
            <Card onClick={onViewDocuments} className="p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all group border-b-2 border-transparent hover:border-blue-500">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500 group-hover:text-blue-500 group-hover:bg-blue-500/10 transition-all">
                  <FileStack className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase">Documentos</h3>
                  <p className="text-[9px] text-slate-400 font-bold uppercase">Cofre de Arquivos</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Main Charts & Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="h-80 relative overflow-hidden">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-tight">Evolução do Faturamento</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Últimos 7 dias</p>
              </div>
              <TrendingUp className="w-5 h-5 text-emerald-500" />
            </div>
            {loading ? (
              <div className="w-full h-full pb-10 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-slate-200 animate-spin" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                    dy={10}
                  />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontWeight: 'bold' }}
                  />
                  <Area type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-none p-6 text-white overflow-hidden relative group">
              <div className="absolute -bottom-4 -right-4 bg-white/5 w-24 h-24 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
              <Clock className="w-8 h-8 text-brand/50 mb-4" />
              <h3 className="text-lg font-black uppercase tracking-tight mb-1">Agenda de Recebíveis</h3>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-6 leading-relaxed">Controle o fluxo de caixa futuro e não perca nenhum vencimento.</p>
              <button
                onClick={onViewSchedule}
                className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
              >
                Gerenciar Agenda <ArrowRight className="w-4 h-4" />
              </button>
            </Card>

            <Card className="bg-gradient-to-br from-indigo-900 to-blue-900 border-none p-6 text-white overflow-hidden relative group">
              <div className="absolute -top-4 -left-4 bg-white/5 w-24 h-24 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
              <Briefcase className="w-8 h-8 text-blue-400/50 mb-4" />
              <h3 className="text-lg font-black uppercase tracking-tight mb-1">Base de Clientes</h3>
              <p className="text-blue-200/50 text-[10px] font-bold uppercase tracking-widest mb-6 leading-relaxed">Mantenha os contatos e dados de faturamento sempre à mão.</p>
              <button
                onClick={onViewClients}
                className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
              >
                Ver Clientes <ArrowRight className="w-4 h-4" />
              </button>
            </Card>
          </div>
        </div>

        <div className="space-y-6">
          <Card className="p-6 bg-slate-50 dark:bg-slate-900/50 border-dashed">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-tight">Entradas Extras</h3>
              <Plus
                className="w-4 h-4 text-slate-400 cursor-pointer hover:text-brand"
                onClick={() => setShowExtraIncomeModal(true)}
              />
            </div>
            <div className="space-y-3">
              {extraIncomes.slice(0, 3).map(ei => (
                <div key={ei.id} className="flex justify-between items-center group">
                  <div>
                    <p className="text-[10px] font-black uppercase text-slate-700 dark:text-slate-300">{ei.description}</p>
                    <p className="text-[8px] font-bold text-slate-400 uppercase">{formatDate(ei.date)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-[10px] font-black text-emerald-500">+{formatCurrency(ei.value)}</p>
                    <button
                      onClick={() => onDeleteExtraIncome(ei.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-300 hover:text-red-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
              {extraIncomes.length === 0 && (
                <p className="text-[10px] text-slate-400 font-bold uppercase text-center py-4">Nenhuma entrada extra</p>
              )}
            </div>
          </Card>
        </div>
      </div>

      {showExtraIncomeModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <Card className="w-full max-w-sm space-y-4 animate-slideUp">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">Nova Entrada Extra</h2>
              <button onClick={() => setShowExtraIncomeModal(false)} className="text-slate-400"><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Descrição</label>
                <input
                  type="text" value={eiDesc} onChange={e => setEiDesc(e.target.value)}
                  placeholder="Ex: Reembolso de Pedágio"
                  className="w-full p-3 bg-slate-50 dark:bg-slate-900 rounded-xl outline-none focus:ring-2 ring-brand/20 font-bold text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Valor (R$)</label>
                <input
                  type="number" value={eiValue} onChange={e => setEiValue(e.target.value)}
                  placeholder="0,00"
                  className="w-full p-3 bg-slate-50 dark:bg-slate-900 rounded-xl outline-none focus:ring-2 ring-brand/20 font-bold text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Destino do Saldo</label>
                <select
                  value={eiSource} onChange={e => setEiSource(e.target.value as any)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-900 rounded-xl outline-none focus:ring-2 ring-brand/20 font-bold text-sm"
                >
                  <option value="COMPANY">Saldo Empresa</option>
                  <option value="DRIVER">Saldo Motorista</option>
                  <option value="RESERVE">Saldo Reserva</option>
                </select>
              </div>
              <Button fullWidth onClick={async () => {
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
              }}>
                Confirmar Entrada
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Floating Action Button (FAB) */}
      <div className="fixed bottom-24 right-6 z-[60] flex flex-col items-end gap-3">
        <AnimatePresence>
          {isMenuOpen && (
            <div className="flex flex-col items-end gap-3 mb-2">
              <motion.button
                initial={{ opacity: 0, y: 10, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.8 }}
                onClick={() => { onAddFreight(); setIsMenuOpen(false); }}
                className="flex items-center gap-3 px-4 py-2.5 bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-500/20 font-black text-[10px] uppercase tracking-widest whitespace-nowrap overflow-hidden"
              >
                Novo Frete <TrendingUp className="w-4 h-4" />
              </motion.button>

              <motion.button
                initial={{ opacity: 0, y: 10, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.8 }}
                onClick={() => { onAddExpense(); setIsMenuOpen(false); }}
                className="flex items-center gap-3 px-4 py-2.5 bg-red-500 text-white rounded-xl shadow-lg shadow-red-500/20 font-black text-[10px] uppercase tracking-widest whitespace-nowrap overflow-hidden"
              >
                Lançar Despesa <Minus className="w-4 h-4" />
              </motion.button>

              <motion.button
                initial={{ opacity: 0, y: 10, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.8 }}
                onClick={() => { setShowExtraIncomeModal(true); setIsMenuOpen(false); }}
                className="flex items-center gap-3 px-4 py-2.5 bg-slate-800 text-white rounded-xl shadow-lg shadow-slate-800/20 font-black text-[10px] uppercase tracking-widest whitespace-nowrap overflow-hidden"
              >
                Entrada Extra <Plus className="w-4 h-4" />
              </motion.button>

              <motion.button
                initial={{ opacity: 0, y: 10, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.8 }}
                onClick={() => { onOpenCalculator(); setIsMenuOpen(false); }}
                className="flex items-center gap-3 px-4 py-2.5 bg-blue-500 text-white rounded-xl shadow-lg shadow-blue-500/20 font-black text-[10px] uppercase tracking-widest whitespace-nowrap overflow-hidden"
              >
                Simular Lucro <Calculator className="w-4 h-4" />
              </motion.button>
            </div>
          )}
        </AnimatePresence>

        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-xl shadow-brand/30 transition-all duration-300 ${isMenuOpen ? 'bg-slate-800 rotate-45 scale-90' : 'bg-brand rotate-0 hover:scale-110'}`}
        >
          <Plus className="w-7 h-7" />
        </button>
      </div>

      {/* Backdrop for FAB */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMenuOpen(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[50]"
          />
        )}
      </AnimatePresence>
    </div>
  );
};