import React, { useState } from 'react';
import { Expense, ExpenseSource, ExpenseCategory } from '../types';
import { generateId } from '../utils';
import { Button } from './Button';
import { Card } from './Card';
import { ChevronLeft, Wallet, Briefcase, Truck, CheckCircle, Fuel, Wrench, Receipt, Utensils, Tag } from 'lucide-react';

interface AddExpenseProps {
  onSave: (expense: Expense) => void;
  onCancel: () => void;
}

export const AddExpense: React.FC<AddExpenseProps> = ({ onSave, onCancel }) => {
  const [value, setValue] = useState<string>('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [source, setSource] = useState<ExpenseSource>('COMPANY');
  const [category, setCategory] = useState<ExpenseCategory>('FUEL');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value || parseFloat(value) <= 0) return;

    const newExpense: Expense = {
      id: generateId(),
      date,
      description: description || getCategoryLabel(category),
      value: parseFloat(value),
      source,
      category
    };

    setIsSuccess(true);
    setTimeout(() => {
        onSave(newExpense);
    }, 1500);
  };

  const getCategoryLabel = (cat: ExpenseCategory) => {
    switch (cat) {
        case 'FUEL': return 'Combustível';
        case 'MAINTENANCE': return 'Manutenção';
        case 'TOLL': return 'Pedágio';
        case 'FOOD': return 'Alimentação';
        case 'OTHER': return 'Outros';
        default: return 'Despesa';
    }
  };

  if (isSuccess) {
    return (
        <div className="fixed inset-0 bg-slate-50 dark:bg-slate-900 z-50 flex flex-col items-center justify-center p-4 animate-fadeIn">
            <div className="bg-red-100 dark:bg-red-900/30 p-6 rounded-full mb-6 animate-bounce">
                <CheckCircle className="w-16 h-16 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Despesa Registrada!</h2>
            <p className="text-slate-500 dark:text-slate-400">O valor foi descontado do saldo.</p>
        </div>
    );
  }

  return (
    <div className="pb-24">
      <div className="flex items-center mb-6">
        <button onClick={onCancel} className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-full">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold text-slate-800 dark:text-white ml-2">Nova Despesa</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Main Inputs */}
        <Card className="space-y-4 border-t-4 border-t-red-500">
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Valor da Saída (R$)</label>
            <input
              type="number"
              step="0.01"
              required
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="0,00"
              className="w-full text-3xl font-bold text-red-600 placeholder-red-200 border-b-2 border-slate-100 dark:border-slate-700 focus:border-red-500 outline-none py-2 bg-transparent transition-colors"
            />
          </div>

          <div>
             <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Categoria</label>
             <div className="relative">
                 <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                    className="w-full p-3 pl-10 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 appearance-none text-slate-700 dark:text-white"
                 >
                    <option value="FUEL">Combustível</option>
                    <option value="MAINTENANCE">Manutenção</option>
                    <option value="TOLL">Pedágio</option>
                    <option value="FOOD">Alimentação</option>
                    <option value="OTHER">Outros</option>
                 </select>
                 <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    {category === 'FUEL' && <Fuel className="w-5 h-5" />}
                    {category === 'MAINTENANCE' && <Wrench className="w-5 h-5" />}
                    {category === 'TOLL' && <Receipt className="w-5 h-5" />}
                    {category === 'FOOD' && <Utensils className="w-5 h-5" />}
                    {category === 'OTHER' && <Tag className="w-5 h-5" />}
                 </div>
             </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Descrição</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 dark:text-white"
              placeholder={`Ex: ${getCategoryLabel(category)}`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Data</label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-slate-700 dark:text-white"
            />
          </div>
        </Card>

        {/* Source Selection */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Origem do Pagamento</h3>
          <div className="grid grid-cols-1 gap-3">
            <button
              type="button"
              onClick={() => setSource('COMPANY')}
              className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                source === 'COMPANY' 
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300' 
                  : 'border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              <div className={`p-2 rounded-full ${source === 'COMPANY' ? 'bg-green-200 dark:bg-green-800' : 'bg-slate-100 dark:bg-slate-700'}`}>
                <Briefcase className="w-5 h-5" />
              </div>
              <div className="text-left">
                <span className="block font-bold text-sm">Conta Empresa</span>
                <span className="text-xs opacity-70">Debitar do saldo da empresa</span>
              </div>
              <div className="ml-auto">
                 <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${source === 'COMPANY' ? 'border-green-500' : 'border-slate-300 dark:border-slate-600'}`}>
                    {source === 'COMPANY' && <div className="w-2.5 h-2.5 rounded-full bg-green-500" />}
                 </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setSource('DRIVER')}
              className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                source === 'DRIVER' 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300' 
                  : 'border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              <div className={`p-2 rounded-full ${source === 'DRIVER' ? 'bg-blue-200 dark:bg-blue-800' : 'bg-slate-100 dark:bg-slate-700'}`}>
                <Truck className="w-5 h-5" />
              </div>
              <div className="text-left">
                <span className="block font-bold text-sm">Conta Motorista</span>
                <span className="text-xs opacity-70">Debitar do saldo do motorista</span>
              </div>
              <div className="ml-auto">
                 <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${source === 'DRIVER' ? 'border-blue-500' : 'border-slate-300 dark:border-slate-600'}`}>
                    {source === 'DRIVER' && <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />}
                 </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setSource('RESERVE')}
              className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                source === 'RESERVE' 
                  ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-800 dark:text-orange-300' 
                  : 'border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              <div className={`p-2 rounded-full ${source === 'RESERVE' ? 'bg-orange-200 dark:bg-orange-800' : 'bg-slate-100 dark:bg-slate-700'}`}>
                <Wallet className="w-5 h-5" />
              </div>
              <div className="text-left">
                <span className="block font-bold text-sm">Conta Reserva</span>
                <span className="text-xs opacity-70">Debitar do fundo de reserva</span>
              </div>
              <div className="ml-auto">
                 <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${source === 'RESERVE' ? 'border-orange-500' : 'border-slate-300 dark:border-slate-600'}`}>
                    {source === 'RESERVE' && <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />}
                 </div>
              </div>
            </button>
          </div>
        </div>

        <div className="pt-4">
          <Button type="submit" variant="danger" fullWidth disabled={!value}>
            Confirmar Saída
          </Button>
        </div>
      </form>
    </div>
  );
};