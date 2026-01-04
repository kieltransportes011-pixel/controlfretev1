import React, { useMemo, useState } from 'react';
import { Freight, AccountPayable } from '../types';
import { formatCurrency, formatDate } from '../utils';
import { Card } from './Card';
import { Button } from './Button';
import {
  CalendarClock,
  CheckCircle,
  AlertTriangle,
  Clock,
  Loader2,
  ArrowRight,
  Search,
  Wallet,
  CalendarDays,
  Plus,
  Trash2,
  FileText,
  X,
  CreditCard,
  Circle
} from 'lucide-react';

interface ScheduleProps {
  freights: Freight[];
  onReceivePayment: (freightId: string) => Promise<void>;
  accountsPayable: AccountPayable[];
  onAddAccountPayable: (acc: Omit<AccountPayable, 'id' | 'user_id'>) => Promise<void>;
  onDeleteAccountPayable: (id: string) => Promise<void>;
  onToggleAccountPayableStatus: (acc: AccountPayable) => Promise<void>;
}

type FilterStatus = 'ALL' | 'OVERDUE' | 'SOON' | 'FUTURE';

export const Schedule: React.FC<ScheduleProps> = ({
  freights,
  onReceivePayment,
  accountsPayable,
  onAddAccountPayable,
  onDeleteAccountPayable,
  onToggleAccountPayableStatus
}) => {
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'RECEIVABLES' | 'PAYABLES'>('RECEIVABLES');
  const [activeFilter, setActiveFilter] = useState<FilterStatus>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Add Bill Modal State
  const [showAddBillModal, setShowAddBillModal] = useState(false);
  const [newBillDesc, setNewBillDesc] = useState('');
  const [newBillValue, setNewBillValue] = useState('');
  const [newBillDate, setNewBillDate] = useState('');
  const [newBillRecurrence, setNewBillRecurrence] = useState<'unica' | 'mensal' | 'semanal'>('unica');

  const getDaysUntilDue = (dueDateStr?: string) => {
    if (!dueDateStr) return 999;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [y, m, d] = dueDateStr.split('-').map(Number);
    const due = new Date(y, m - 1, d);
    due.setHours(0, 0, 0, 0);

    const diffTime = due.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const handleSaveBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBillDesc || !newBillValue || !newBillDate) return;

    await onAddAccountPayable({
      description: newBillDesc,
      value: parseFloat(newBillValue),
      due_date: newBillDate,
      status: 'aberto',
      recurrence: newBillRecurrence
    });

    setShowAddBillModal(false);
    setNewBillDesc('');
    setNewBillValue('');
    setNewBillDate('');
    setNewBillRecurrence('unica');
  };

  const allPending = useMemo(() => {
    return freights
      .filter(f => f.status !== 'PAID' && (f.pendingValue > 0 || f.receivedValue === 0))
      .sort((a, b) => {
        const dateA = a.dueDate ? new Date(a.dueDate).getTime() : 0;
        const dateB = b.dueDate ? new Date(b.dueDate).getTime() : 0;
        return dateA - dateB;
      });
  }, [freights]);

  const filteredItems = useMemo(() => {
    return allPending.filter(item => {
      const days = getDaysUntilDue(item.dueDate);
      const matchesSearch = item.client?.toLowerCase().includes(searchTerm.toLowerCase());

      let matchesFilter = true;
      if (activeFilter === 'OVERDUE') matchesFilter = days < 0;
      if (activeFilter === 'SOON') matchesFilter = days >= 0 && days <= 3;
      if (activeFilter === 'FUTURE') matchesFilter = days > 3;

      return matchesSearch && matchesFilter;
    });
  }, [allPending, activeFilter, searchTerm]);

  const stats = useMemo(() => {
    const total = allPending.reduce((acc, curr) => acc + curr.pendingValue, 0);
    const overdue = allPending.filter(i => getDaysUntilDue(i.dueDate) < 0).reduce((acc, curr) => acc + curr.pendingValue, 0);
    return { total, overdue };
  }, [allPending]);

  // Payables Logic
  const sortedBills = useMemo(() => {
    if (!accountsPayable) return [];
    return accountsPayable.sort((a, b) => {
      // Sort by status (open first), then date
      if (a.status !== b.status) return a.status === 'aberto' ? -1 : 1;
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    });
  }, [accountsPayable]);

  const payableStats = useMemo(() => {
    if (!accountsPayable) return { total: 0, overdue: 0 };
    const openBills = accountsPayable.filter(b => b.status === 'aberto');
    const total = openBills.reduce((acc, curr) => acc + curr.value, 0);
    const overdue = openBills.filter(b => getDaysUntilDue(b.due_date) < 0).reduce((acc, curr) => acc + curr.value, 0);
    return { total, overdue };
  }, [accountsPayable]);

  const filteredBills = useMemo(() => {
    return sortedBills.filter(bill => {
      const matchesSearch = bill.description.toLowerCase().includes(searchTerm.toLowerCase());
      let matchesFilter = true;
      // Reuse filter logic if desired, or simplify for bills
      if (activeFilter === 'OVERDUE') matchesFilter = bill.status === 'aberto' && getDaysUntilDue(bill.due_date) < 0;
      // For bills, 'ALL' shows pending and paid. Maybe split?
      return matchesSearch && matchesFilter;
    });
  }, [sortedBills, searchTerm, activeFilter]);

  const handleConfirm = async (id: string, value: number) => {
    if (window.confirm(`Confirmar recebimento de ${formatCurrency(value)}?`)) {
      try {
        setConfirmingId(id);
        await onReceivePayment(id);
      } catch (error) {
        console.error("Erro ao confirmar:", error);
        alert("Não foi possível confirmar. Tente novamente.");
      } finally {
        setConfirmingId(null);
      }
    }
  };

  return (
    <div className="pb-24 space-y-6 animate-fadeIn">
      {/* Header */}
      <header className="px-1 py-2">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200 tracking-tight">Finanças</h1>
        <p className="text-slate-500 dark:text-slate-500 text-[10px] font-roboto font-bold uppercase tracking-widest mt-0.5">Pendências de Fretes</p>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 px-1">
        <Card className={`text-white border-none shadow-lg relative overflow-hidden flex flex-col justify-center p-5 transition-colors ${activeTab === 'RECEIVABLES' ? 'bg-brand' : 'bg-red-500'}`}>
          <span className={`text-[9px] font-roboto font-bold uppercase tracking-widest block mb-1 ${activeTab === 'RECEIVABLES' ? 'text-blue-200' : 'text-red-200'}`}>
            {activeTab === 'RECEIVABLES' ? 'Total a Receber' : 'Total a Pagar'}
          </span>
          <span className="text-2xl font-bold text-white tabular-nums tracking-tight relative z-10">
            {formatCurrency(activeTab === 'RECEIVABLES' ? stats.total : payableStats.total)}
          </span>
        </Card>
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex flex-col justify-center">
          <span className="text-[9px] font-roboto font-bold text-accent-warning uppercase tracking-widest block mb-1">Vencido</span>
          <span className="text-2xl font-bold text-accent-error dark:text-red-400 tabular-nums tracking-tight">
            {formatCurrency(activeTab === 'RECEIVABLES' ? stats.overdue : payableStats.overdue)}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mx-1">
        <button
          onClick={() => setActiveTab('RECEIVABLES')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'RECEIVABLES' ? 'bg-white dark:bg-slate-700 shadow text-brand dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}
        >
          A Receber
        </button>
        <button
          onClick={() => setActiveTab('PAYABLES')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'PAYABLES' ? 'bg-white dark:bg-slate-700 shadow text-red-500 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}
        >
          A Pagar
        </button>
      </div>

      {/* Filters & Actions */}
      <div className="px-1 space-y-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder={activeTab === 'RECEIVABLES' ? "Buscar por cliente..." : "Buscar por conta..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-5 py-3.5 bg-white dark:bg-slate-800 border-none rounded-2xl outline-none shadow-sm text-xs font-medium text-slate-800 dark:text-white placeholder-slate-400"
            />
          </div>
          {activeTab === 'PAYABLES' && (
            <Button onClick={() => setShowAddBillModal(true)} className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-brand hover:bg-brand-hover text-white font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-brand/20 transition-all shrink-0">
              <Plus className="w-4 h-4" />
              <span>Nova Conta</span>
            </Button>
          )}
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {[
            { id: 'ALL', label: 'TODOS' },
            { id: 'OVERDUE', label: 'VENCIDOS' },
            ...(activeTab === 'RECEIVABLES' ? [
              { id: 'SOON', label: 'PRÓXIMOS' },
              { id: 'FUTURE', label: 'FUTUROS' }
            ] : [])
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id as FilterStatus)}
              className={`px-4 py-2 rounded-xl text-[10px] font-roboto font-bold tracking-widest transition-all ${activeFilter === f.id
                ? 'bg-brand text-white shadow-md shadow-brand/20'
                : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="space-y-4 px-1">
        <div className="px-1 border-b border-slate-100 dark:border-slate-800 pb-2">
          <h2 className="text-[10px] font-roboto font-bold text-slate-400 uppercase tracking-[0.2em]">
            {activeTab === 'RECEIVABLES' ? 'Lista de Recebíveis' : 'Minhas Contas'}
          </h2>
        </div>

        {activeTab === 'RECEIVABLES' ? (
          filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
              <AlertTriangle className="w-12 h-12 text-slate-300 mb-3" />
              <p className="font-roboto font-bold text-xs uppercase tracking-widest text-slate-500">Nada pendente</p>
            </div>
          ) : (
            filteredItems.map(item => {
              const days = getDaysUntilDue(item.dueDate);
              const isLate = days < 0;
              const isNear = days >= 0 && days <= 3;
              const isConfirming = confirmingId === item.id;

              return (
                <Card key={item.id} className={`p-5 relative overflow-hidden transition-all ${isConfirming ? 'opacity-50' : ''}`}>
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className={`inline-block px-2 py-0.5 rounded text-[8px] font-roboto font-bold uppercase tracking-widest ${isLate ? 'bg-red-50 text-accent-error' : 'bg-orange-50 text-accent-warning'}`}>
                          {isLate ? 'Vencido' : (isNear ? 'Vencendo' : 'Pendente')}
                        </div>
                        <h3 className="font-bold text-slate-800 dark:text-white text-lg tracking-tight uppercase">
                          {item.client || 'CLIENTE AVULSO'}
                        </h3>
                        <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase font-roboto tracking-wider">
                          <Clock className="w-3 h-3" />
                          <span>Vencimento: {item.dueDate ? formatDate(item.dueDate) : '---'}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-roboto font-bold text-slate-400 uppercase tracking-widest mb-1">Saldo</p>
                        <p className="text-xl font-bold text-slate-800 dark:text-white tabular-nums">
                          {formatCurrency(item.pendingValue)}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-2">
                      <div className="flex justify-between text-[8px] font-roboto font-bold text-slate-400 uppercase tracking-widest">
                        <span>Pago: {formatCurrency(item.receivedValue)}</span>
                        <span>Total: {formatCurrency(item.totalValue)}</span>
                      </div>
                      <div className="h-1 w-full bg-slate-50 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-brand-secondary transition-all duration-1000"
                          style={{ width: `${(item.receivedValue / item.totalValue) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-1">
                      <Button
                        disabled={isConfirming}
                        onClick={() => handleConfirm(item.id, item.pendingValue)}
                        className="px-6 py-2.5 rounded-xl text-[10px]"
                      >
                        {isConfirming ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>RECEBER <ArrowRight className="w-3.5 h-3.5" /></>
                        )}
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })
          )
        ) : (
          // PAYABLES LIST
          filteredBills.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
              <FileText className="w-12 h-12 text-slate-300 mb-3" />
              <p className="font-roboto font-bold text-xs uppercase tracking-widest text-slate-500">Nenhuma conta encontrada</p>
            </div>
          ) : (
            filteredBills.map(bill => {
              const days = getDaysUntilDue(bill.due_date);
              const isLate = bill.status === 'aberto' && days < 0;
              const isDraft = bill.status === 'aberto';

              return (
                <Card key={bill.id} className="p-5 relative overflow-hidden transition-all">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className={`inline-block px-2 py-0.5 rounded text-[8px] font-roboto font-bold uppercase tracking-widest ${!isDraft ? 'bg-green-50 text-accent-success' : (isLate ? 'bg-red-50 text-accent-error' : 'bg-slate-100 text-slate-500')
                          }`}>
                          {isDraft ? (isLate ? 'Atrasado' : 'Aberto') : 'Pago'}
                        </div>
                        {bill.recurrence !== 'unica' && (
                          <div className="inline-block px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-[8px] font-bold text-slate-500 uppercase tracking-widest">
                            {bill.recurrence}
                          </div>
                        )}
                      </div>
                      <h3 className="font-bold text-slate-800 dark:text-white text-lg tracking-tight uppercase">
                        {bill.description}
                      </h3>
                      <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase font-roboto tracking-wider">
                        <CalendarDays className="w-3 h-3" />
                        <span>Vencimento: {formatDate(bill.due_date)}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-roboto font-bold text-slate-400 uppercase tracking-widest mb-1">Valor</p>
                      <p className="text-xl font-bold text-slate-800 dark:text-white tabular-nums">
                        {formatCurrency(bill.value)}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-slate-50 dark:border-slate-800/50">
                    <button
                      onClick={() => onDeleteAccountPayable(bill.id)}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                    <Button
                      variant={isDraft ? "primary" : "outline"}
                      onClick={() => onToggleAccountPayableStatus(bill)}
                      className={`px-4 py-2 text-[10px] flex items-center gap-2 ${isDraft ? 'bg-accent-success hover:bg-green-600 border-none' : ''}`}
                    >
                      {isDraft ? (
                        <>MARCAR PAGO <CheckCircle className="w-3.5 h-3.5" /></>
                      ) : (
                        <>REABRIR <Circle className="w-3.5 h-3.5" /></>
                      )}
                    </Button>
                  </div>
                </Card>
              );
            })
          )
        )}
      </div>

      {/* Add Bill Modal */}
      {showAddBillModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-[2rem] p-6 shadow-2xl animate-slideUp relative">
            <button onClick={() => setShowAddBillModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
              <X className="w-6 h-6" />
            </button>

            <div className="mb-6">
              <div className="w-12 h-12 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center text-red-500 mb-3">
                <CreditCard className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">Nova Conta</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Adicione uma conta a pagar ao seu controle.</p>
            </div>

            <form onSubmit={handleSaveBill} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Descrição</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newBillDesc}
                  onChange={(e) => setNewBillDesc(e.target.value)}
                  className="w-full p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700 outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/10 transition-all font-medium text-slate-800 dark:text-white"
                  placeholder="Ex: Aluguel, Parcela Caminhão"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Valor (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newBillValue}
                    onChange={(e) => setNewBillValue(e.target.value)}
                    className="w-full p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700 outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/10 transition-all font-medium text-slate-800 dark:text-white"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Vencimento</label>
                  <input
                    type="date"
                    required
                    value={newBillDate}
                    onChange={(e) => setNewBillDate(e.target.value)}
                    className="w-full p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700 outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/10 transition-all font-medium text-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Recorrência</label>
                <div className="grid grid-cols-3 gap-2">
                  {['unica', 'mensal', 'semanal'].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setNewBillRecurrence(r as any)}
                      className={`py-2 text-xs font-bold uppercase rounded-xl border transition-all ${newBillRecurrence === r
                        ? 'bg-red-500 text-white border-red-500'
                        : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-100 dark:border-slate-700 hover:bg-slate-50'}`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4">
                <Button type="submit" fullWidth className="bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20 h-12 text-sm">
                  CADASTRAR CONTA
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};