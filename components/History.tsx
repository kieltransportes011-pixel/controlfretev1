import React, { useState, useMemo } from 'react';
import { Freight, Expense, AppSettings, ExpenseCategory } from '../types';
import { formatCurrency, formatDate, getWeekNumber } from '../utils';
import { CalendarRange, ArrowDownCircle, ArrowUpCircle, Trash2, AlertTriangle, X, Printer, Pencil, Filter, Fuel, Wrench, Receipt, Utensils, Tag, CalendarDays } from 'lucide-react';
import { Button } from './Button';
import { ReceiptModal } from './ReceiptModal';

interface HistoryProps {
  freights: Freight[];
  expenses: Expense[];
  onDeleteFreight: (id: string) => void;
  onDeleteExpense: (id: string) => void;
  onEditFreight: (freight: Freight) => void;
  settings?: AppSettings;
  isPremium?: boolean;
}

type FilterType = 'ALL' | 'MONTH' | 'WEEK' | 'CUSTOM';
type StatusFilterType = 'ALL' | 'PAID' | 'PARTIAL' | 'PENDING';

export const History: React.FC<HistoryProps> = ({ freights, expenses, onDeleteFreight, onDeleteExpense, onEditFreight, settings, isPremium }) => {
  const [filter, setFilter] = useState<FilterType>('ALL');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const [statusFilter, setStatusFilter] = useState<StatusFilterType>('ALL');
  const [itemToDelete, setItemToDelete] = useState<{ id: string, type: 'INCOME' | 'EXPENSE' } | null>(null);
  const [receiptFreight, setReceiptFreight] = useState<Freight | null>(null);

  const filteredItems = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const currentWeek = getWeekNumber(now);

    const allItems = [
      ...freights.map(f => ({ ...f, type: 'INCOME' as const, sortDate: new Date(f.date) })),
      ...expenses.map(e => ({ ...e, type: 'EXPENSE' as const, sortDate: new Date(e.date) }))
    ];

    return allItems.filter(item => {
      // Date Filter logic
      let matchesDate = true;
      const date = item.sortDate;
      const dateStr = item.date; // YYYY-MM-DD string

      if (filter === 'MONTH') {
        matchesDate = date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      } else if (filter === 'WEEK') {
        matchesDate = getWeekNumber(date) === currentWeek && date.getFullYear() === currentYear;
      } else if (filter === 'CUSTOM') {
        if (customStart && dateStr < customStart) matchesDate = false;
        if (customEnd && dateStr > customEnd) matchesDate = false;
      }

      // Status Filter logic
      let matchesStatus = true;
      if (statusFilter !== 'ALL') {
        if (item.type === 'EXPENSE') {
          matchesStatus = false; // Hide expenses when filtering by status
        } else {
          const freight = item as Freight;
          const status = freight.status || 'PAID';
          matchesStatus = status === statusFilter;
        }
      }

      return matchesDate && matchesStatus;
    }).sort((a, b) => b.sortDate.getTime() - a.sortDate.getTime());
  }, [freights, expenses, filter, statusFilter, customStart, customEnd]);

  const confirmDelete = () => {
    if (itemToDelete) {
      if (itemToDelete.type === 'INCOME') {
        onDeleteFreight(itemToDelete.id);
      } else {
        onDeleteExpense(itemToDelete.id);
      }
      setItemToDelete(null);
    }
  };

  const getCategoryIcon = (category?: ExpenseCategory) => {
    switch (category) {
      case 'FUEL': return <Fuel className="w-3.5 h-3.5 text-red-500" />;
      case 'MAINTENANCE': return <Wrench className="w-3.5 h-3.5 text-red-500" />;
      case 'TOLL': return <Receipt className="w-3.5 h-3.5 text-red-500" />;
      case 'FOOD': return <Utensils className="w-3.5 h-3.5 text-red-500" />;
      case 'OTHER': return <Tag className="w-3.5 h-3.5 text-red-500" />;
      default: return <ArrowDownCircle className="w-3.5 h-3.5 text-red-500" />;
    }
  };

  return (
    <div className="pb-24 space-y-6 relative">
      <header>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Histórico</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Extrato completo</p>
      </header>

      {/* Date Filters */}
      <div className="space-y-3">
        <div className="flex bg-white dark:bg-slate-800 p-1 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setFilter('ALL')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${filter === 'ALL' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
          >
            Todos
          </button>
          <button
            onClick={() => setFilter('MONTH')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${filter === 'MONTH' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
          >
            Este Mês
          </button>
          <button
            onClick={() => setFilter('WEEK')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${filter === 'WEEK' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
          >
            Esta Semana
          </button>
          <button
            onClick={() => setFilter('CUSTOM')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${filter === 'CUSTOM' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
          >
            Personalizado
          </button>
        </div>

        {/* Custom Range Inputs */}
        {filter === 'CUSTOM' && (
          <div className="grid grid-cols-2 gap-3 animate-fadeIn bg-slate-100 dark:bg-slate-800/50 p-3 rounded-xl">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">De</label>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="w-full p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-white outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Até</label>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="w-full p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-white outline-none focus:border-blue-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Status Filters */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        <div className="text-slate-400 p-1">
          <Filter className="w-4 h-4" />
        </div>
        {(['ALL', 'PAID', 'PARTIAL', 'PENDING'] as const).map(s => {
          const labels = { ALL: 'Tudo', PAID: 'Pagos', PARTIAL: 'Parciais', PENDING: 'Pendentes' };
          const isActive = statusFilter === s;
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap border ${isActive
                ? 'bg-slate-800 text-white border-slate-800 dark:bg-white dark:text-slate-900 dark:border-white'
                : 'bg-white text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                }`}
            >
              {labels[s]}
            </button>
          );
        })}
      </div>

      {/* List */}
      <div className="space-y-4">
        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400 dark:text-slate-500">
            <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-full mb-3">
              <CalendarRange className="w-8 h-8 text-slate-300 dark:text-slate-600" />
            </div>
            <p>Nenhum lançamento encontrado.</p>
          </div>
        ) : (
          filteredItems.map((item) => {
            if (item.type === 'INCOME') {
              const freight = item as Freight;
              const isPaid = freight.status === 'PAID' || !freight.status;
              const isPartial = freight.status === 'PARTIAL';

              return (
                <div key={freight.id} className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-100 dark:border-slate-700 relative overflow-hidden group transition-all duration-300 hover:-translate-y-1 hover:shadow-md animate-fadeIn">
                  <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${isPaid ? 'bg-green-500' : 'bg-yellow-400'}`}></div>
                  <div className="pl-3">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="flex items-center gap-1.5 mb-1">
                          <ArrowUpCircle className={`w-3.5 h-3.5 ${isPaid ? 'text-green-600' : 'text-yellow-600'}`} />
                          <span className={`text-xs font-semibold uppercase tracking-wide ${isPaid ? 'text-green-600' : 'text-yellow-600'}`}>
                            {isPaid ? 'Entrada' : (isPartial ? 'Parcial' : 'Pendente')}
                          </span>
                        </div>
                        <h3 className="font-bold text-slate-800 dark:text-white text-lg">{freight.client || 'Cliente Avulso'}</h3>
                        <p className="text-xs text-slate-400 dark:text-slate-500">{formatDate(freight.date)}</p>
                      </div>
                      <div className="text-right flex flex-col items-end">
                        <div className="flex items-center gap-2">
                          <p className="text-xl font-bold text-slate-900 dark:text-white">+{formatCurrency(freight.totalValue)}</p>

                          {/* Edit Button */}
                          <button
                            onClick={() => onEditFreight(freight)}
                            className="p-1.5 text-slate-300 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => setItemToDelete({ id: freight.id, type: 'INCOME' })}
                            className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        {!isPaid && (
                          <p className="text-xs text-red-500 font-medium">Falta: {formatCurrency(freight.pendingValue)}</p>
                        )}
                      </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3 grid grid-cols-3 gap-2 text-center relative">
                      <div>
                        <p className="text-[10px] uppercase text-slate-400 font-bold">Empresa</p>
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{formatCurrency(freight.companyValue)}</p>
                      </div>
                      <div className="border-x border-slate-200 dark:border-slate-700">
                        <p className="text-[10px] uppercase text-slate-400 font-bold">Motorista</p>
                        <p className="text-sm font-bold text-blue-600 dark:text-blue-400">{formatCurrency(freight.driverValue)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase text-slate-400 font-bold">Reserva</p>
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{formatCurrency(freight.reserveValue)}</p>
                      </div>

                      {/* Receipt Action - Only for PRO */}
                      {isPremium && (
                        <button
                          onClick={() => setReceiptFreight(freight)}
                          className="absolute -bottom-2 -right-2 p-2 text-slate-400 hover:text-blue-600 transition-colors"
                          title="Gerar Recibo"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            } else {
              const expense = item as Expense;
              const sourceMap = {
                'COMPANY': 'Empresa',
                'DRIVER': 'Motorista',
                'RESERVE': 'Reserva'
              };
              const categoryMap: Record<string, string> = {
                'FUEL': 'Combustível',
                'MAINTENANCE': 'Manutenção',
                'TOLL': 'Pedágio',
                'FOOD': 'Alimentação',
                'OTHER': 'Outros'
              };

              return (
                <div key={expense.id} className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-100 dark:border-slate-700 relative overflow-hidden opacity-90 group transition-all duration-300 hover:-translate-y-1 hover:shadow-md animate-fadeIn">
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-red-500"></div>
                  <div className="pl-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-1.5 mb-1">
                          {getCategoryIcon(expense.category)}
                          <span className="text-xs font-semibold text-red-500 uppercase tracking-wide">
                            {expense.category ? categoryMap[expense.category] : 'Saída'}
                          </span>
                        </div>
                        <h3 className="font-bold text-slate-800 dark:text-white text-lg">{expense.description}</h3>
                        <p className="text-xs text-slate-400 dark:text-slate-500">{formatDate(expense.date)}</p>
                      </div>
                      <div className="text-right flex flex-col items-end">
                        <div className="flex items-center gap-2">
                          <p className="text-xl font-bold text-red-600">-{formatCurrency(expense.value)}</p>
                          <button
                            onClick={() => setItemToDelete({ id: expense.id, type: 'EXPENSE' })}
                            className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 inline-block px-2 py-1 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-xs font-medium rounded-md">
                      Saiu de: {sourceMap[expense.source]}
                    </div>
                  </div>
                </div>
              );
            }
          })
        )}
      </div>

      {/* Confirmation Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-2xl p-6 shadow-2xl scale-100 animate-slideUp">
            <div className="flex justify-between items-start mb-4">
              <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-full text-red-600 dark:text-red-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <button onClick={() => setItemToDelete(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Confirmar Exclusão</h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm mb-6">
              Tem certeza que deseja remover este item do histórico? Esta ação não pode ser desfeita e afetará os cálculos do saldo.
            </p>

            <div className="flex gap-3">
              <Button variant="secondary" fullWidth onClick={() => setItemToDelete(null)}>
                Cancelar
              </Button>
              <Button variant="danger" fullWidth onClick={confirmDelete}>
                Excluir
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {receiptFreight && settings && (
        <ReceiptModal
          freight={receiptFreight}
          settings={settings}
          onClose={() => setReceiptFreight(null)}
        />
      )}
    </div>
  );
};