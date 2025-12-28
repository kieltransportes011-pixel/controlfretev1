import React, { useMemo, useState } from 'react';
import { Freight } from '../types';
import { formatCurrency, formatDate } from '../utils';
import { Card } from './Card';
import { Button } from './Button';
import { 
  CalendarClock, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Loader2, 
  ArrowRight, 
  Search,
  Wallet,
  CalendarDays
} from 'lucide-react';

interface ScheduleProps {
  freights: Freight[];
  onReceivePayment: (freightId: string) => Promise<void>;
}

type FilterStatus = 'ALL' | 'OVERDUE' | 'SOON' | 'FUTURE';

export const Schedule: React.FC<ScheduleProps> = ({ freights, onReceivePayment }) => {
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterStatus>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

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
        <Card className="bg-brand text-white border-none shadow-lg relative overflow-hidden flex flex-col justify-center p-5">
          <span className="text-[9px] font-roboto font-bold text-blue-200 uppercase tracking-widest block mb-1">Total a Receber</span>
          <span className="text-2xl font-bold text-white tabular-nums tracking-tight relative z-10">{formatCurrency(stats.total)}</span>
        </Card>
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex flex-col justify-center">
          <span className="text-[9px] font-roboto font-bold text-accent-warning uppercase tracking-widest block mb-1">Vencido</span>
          <span className="text-2xl font-bold text-accent-error dark:text-red-400 tabular-nums tracking-tight">{formatCurrency(stats.overdue)}</span>
        </div>
      </div>

      {/* Filters */}
      <div className="px-1 space-y-4">
        <div className="relative">
          <input 
            type="text"
            placeholder="Buscar por cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-5 py-3.5 bg-white dark:bg-slate-800 border-none rounded-2xl outline-none shadow-sm text-xs font-medium text-slate-800 dark:text-white placeholder-slate-400"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {[
            { id: 'ALL', label: 'TODOS' },
            { id: 'OVERDUE', label: 'VENCIDOS' },
            { id: 'SOON', label: 'PRÓXIMOS' },
            { id: 'FUTURE', label: 'FUTUROS' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id as FilterStatus)}
              className={`px-4 py-2 rounded-xl text-[10px] font-roboto font-bold tracking-widest transition-all ${
                activeFilter === f.id 
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
            <h2 className="text-[10px] font-roboto font-bold text-slate-400 uppercase tracking-[0.2em]">Lista de Recebíveis</h2>
        </div>

        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
            <CheckCircle className="w-12 h-12 text-slate-300 mb-3" />
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
        )}
      </div>
    </div>
  );
};