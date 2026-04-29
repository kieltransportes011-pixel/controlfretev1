import React, { useState, useEffect, useMemo } from 'react';
import { Freight } from '../types';
import { formatCurrency, generateId } from '../utils';
import { Button } from './Button';
import { Card } from './Card';
import {
  ChevronLeft,
  Copy,
  CheckCircle,
  Truck,
  RefreshCcw,
  Share2,
  Fuel,
  Coins,
  AlertTriangle,
  Plus,
  Trash2,
  CircleDollarSign
} from 'lucide-react';

interface ExtraItem {
  id: string;
  label: string;
  value: string;
}

interface FreightCalculatorProps {
  onCancel: () => void;
  onRegister: (data: Partial<Freight>) => void;
}

export const FreightCalculator: React.FC<FreightCalculatorProps> = ({ onCancel, onRegister }) => {
  // Dados Principais
  const [distance, setDistance] = useState<string>('');
  const [pricePerKm, setPricePerKm] = useState<string>('');

  // Lista dinâmica de extras
  const [extraItems, setExtraItems] = useState<ExtraItem[]>([
    { id: generateId(), label: 'Pedágio', value: '' }
  ]);

  // Estimativa de Combustível
  const [showFuel, setShowFuel] = useState(false);
  const [consumption, setConsumption] = useState<string>('2.5');
  const [dieselPrice, setDieselPrice] = useState<string>('');

  // Custos Fixos & Margem
  const [fixedDailyCost, setFixedDailyCost] = useState<string>('');
  const [tripDays, setTripDays] = useState<string>('1');
  const [targetMargin, setTargetMargin] = useState<string>('20');

  // Estados de Validação
  const [consumptionError, setConsumptionError] = useState(false);

  // Cálculos Derivados
  const totals = useMemo(() => {
    const km = Math.max(0, parseFloat(distance) || 0);
    const price = Math.max(0, parseFloat(pricePerKm) || 0);
    const freightBase = km * price;

    const extrasTotal = extraItems.reduce((acc, item) => acc + (Math.max(0, parseFloat(item.value) || 0)), 0);
    const total = freightBase + extrasTotal;

    const rawKmL = parseFloat(consumption);
    const kmL = isNaN(rawKmL) || rawKmL <= 0 ? 1 : rawKmL;
    const diesel = Math.max(0, parseFloat(dieselPrice) || 0);
    const fuelCost = (km / kmL) * diesel;
    
    const fixedDaily = Math.max(0, parseFloat(fixedDailyCost) || 0);
    const days = Math.max(1, parseFloat(tripDays) || 1);
    const tripFixedCost = fixedDaily * days;

    const estimatedProfit = total - extrasTotal - fuelCost - tripFixedCost;
    const profitMargin = total > 0 ? (estimatedProfit / total) * 100 : 0;
    const isMarginOk = profitMargin >= (parseFloat(targetMargin) || 0);

    return {
      freightBase,
      extrasTotal,
      total,
      fuelCost,
      tripFixedCost,
      estimatedProfit,
      profitMargin,
      isMarginOk
    };
  }, [distance, pricePerKm, extraItems, consumption, dieselPrice, fixedDailyCost, tripDays, targetMargin]);

  const addExtraItem = () => {
    setExtraItems([...extraItems, { id: generateId(), label: '', value: '' }]);
  };

  const removeExtraItem = (id: string) => {
    if (extraItems.length > 1) {
      setExtraItems(extraItems.filter(item => item.id !== id));
    } else {
      setExtraItems([{ id: generateId(), label: '', value: '' }]);
    }
  };

  const updateExtraItem = (id: string, field: keyof ExtraItem, val: string) => {
    setExtraItems(extraItems.map(item => item.id === id ? { ...item, [field]: val } : item));
  };

  const handleCopy = () => {
    const extrasDetails = extraItems
      .filter(i => parseFloat(i.value) > 0)
      .map(i => `➕ ${i.label || 'Extra'}: ${formatCurrency(parseFloat(i.value))}`)
      .join('\n');

    const text = `
🚛 *Orçamento de Frete*
🛣️ Distância: ${distance}km
💰 Valor por Km: ${formatCurrency(parseFloat(pricePerKm) || 0)}
📦 Frete Base: ${formatCurrency(totals.freightBase)}
${extrasDetails ? `${extrasDetails}\n` : ''}
✅ *TOTAL COBRADO: ${formatCurrency(totals.total)}*
    `.trim();

    navigator.clipboard.writeText(text);
    alert("Copiado para a área de transferência!");
  };

  const handleShareWhatsapp = () => {
    const extrasDetails = extraItems
      .filter(i => parseFloat(i.value) > 0)
      .map(i => `➕ ${i.label || 'Extra'}: ${formatCurrency(parseFloat(i.value))}`)
      .join('\n');

    const text = `
🚛 *ORÇAMENTO RÁPIDO*
🛣️ Distância: ${distance}km
💰 Valor por Km: ${formatCurrency(parseFloat(pricePerKm) || 0)}
----------------
📦 Frete Base: ${formatCurrency(totals.freightBase)}
${extrasDetails ? `${extrasDetails}\n` : ''}
----------------
✅ *VALOR TOTAL COBRADO: ${formatCurrency(totals.total)}*
    `.trim();

    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleRegister = () => {
    onRegister({
      totalValue: totals.total,
      client: `Frete de ${distance}km`,
      date: new Date().toISOString().split('T')[0]
    });
  };

  return (
    <div className="pb-24 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <button onClick={onCancel} className="p-2 -ml-2 text-slate-400 hover:text-brand transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white ml-2">Calculadora Rápida</h1>
        </div>
        <button
          onClick={() => {
            setDistance(''); setPricePerKm('');
            setExtraItems([{ id: generateId(), label: 'Pedágio', value: '' }]);
          }}
          className="p-2 text-slate-300 hover:text-brand-secondary transition-colors"
        >
          <RefreshCcw className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-6">

        {/* Display Principal - Visibilidade Máxima */}
        <div className="bg-brand rounded-3xl p-8 text-white shadow-xl flex flex-col items-center justify-center text-center relative overflow-hidden border border-white/10">
          <span className="text-blue-200 text-[10px] font-roboto font-bold uppercase tracking-[0.2em] mb-2 opacity-80">Valor Total Estimado</span>
          <div className="text-5xl font-bold tracking-tighter tabular-nums mb-1">
            {formatCurrency(totals.total)}
          </div>
          <div className="h-1 w-12 bg-brand-secondary rounded-full mt-2"></div>

          {/* BG Decorativo */}
          <CircleDollarSign className="absolute -right-4 -bottom-4 w-24 h-24 text-white/5 -rotate-12" />
        </div>

        {/* Inputs Principais */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-roboto font-bold text-slate-400 uppercase tracking-widest px-1">Distância (Km)</label>
            <div className="relative group">
              <Truck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-brand-secondary transition-colors" />
              <input
                type="number"
                value={distance}
                onChange={(e) => setDistance(e.target.value)}
                placeholder="0"
                className="w-full pl-11 pr-4 py-4 bg-white dark:bg-slate-800 rounded-2xl border-none shadow-sm focus:ring-2 focus:ring-brand-secondary/20 text-lg font-bold text-slate-800 dark:text-white transition-all tabular-nums"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-roboto font-bold text-slate-400 uppercase tracking-widest px-1">Valor por Km</label>
            <div className="relative group">
              <Coins className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-brand-secondary transition-colors" />
              <input
                type="number"
                step="0.01"
                value={pricePerKm}
                onChange={(e) => setPricePerKm(e.target.value)}
                placeholder="0,00"
                className="w-full pl-11 pr-4 py-4 bg-white dark:bg-slate-800 rounded-2xl border-none shadow-sm focus:ring-2 focus:ring-brand-secondary/20 text-lg font-bold text-slate-800 dark:text-white transition-all tabular-nums"
              />
            </div>
          </div>
        </div>

        {/* Múltiplos Custos Extras */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-[10px] font-roboto font-bold text-slate-400 uppercase tracking-[0.2em]">Custos Extras e Pedágios</h3>
            <button
              onClick={addExtraItem}
              className="flex items-center gap-1 text-[10px] font-roboto font-bold text-brand-secondary uppercase hover:bg-brand-secondary/10 px-2 py-1 rounded-lg transition-all"
            >
              <Plus className="w-3 h-3" /> Adicionar
            </button>
          </div>

          <div className="space-y-3">
            {extraItems.map((item, index) => (
              <div key={item.id} className="flex gap-2 animate-slideUp">
                <div className="flex-1 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-50 dark:border-slate-700 flex overflow-hidden">
                  <input
                    type="text"
                    placeholder="Ex: Pedágio, Chapa..."
                    value={item.label}
                    onChange={(e) => updateExtraItem(item.id, 'label', e.target.value)}
                    className="flex-1 px-4 py-3 text-xs font-medium bg-transparent border-none outline-none text-slate-700 dark:text-white"
                  />
                  <div className="w-[1px] h-6 bg-slate-100 dark:bg-slate-700 self-center"></div>
                  <div className="relative w-32">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-300">R$</span>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0,00"
                      value={item.value}
                      onChange={(e) => updateExtraItem(item.id, 'value', e.target.value)}
                      className="w-full pl-8 pr-4 py-3 text-sm font-bold bg-transparent border-none outline-none text-brand-secondary tabular-nums"
                    />
                  </div>
                </div>
                <button
                  onClick={() => removeExtraItem(item.id)}
                  className="p-3 text-slate-300 hover:text-accent-error hover:bg-red-50 dark:hover:bg-red-900/20 rounded-2xl transition-all"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Estimativa de Lucro */}
        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 transition-all">
          <button
            onClick={() => setShowFuel(!showFuel)}
            className="flex items-center justify-between w-full text-[10px] font-roboto font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest"
          >
            <span className="flex items-center gap-2"><Fuel className="w-4 h-4" /> Custos Operacionais e Margem Estimada</span>
            <span className={`px-2 py-1 rounded-lg ${showFuel ? 'bg-brand text-white' : 'bg-slate-200 dark:bg-slate-700'}`}>
              {showFuel ? 'OCULTAR' : 'CONFIGURAR'}
            </span>
          </button>

          {showFuel && (
            <div className="mt-5 space-y-4 animate-fadeIn">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-slate-400 tracking-tighter">Média (Km/L)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={consumption}
                    onChange={(e) => setConsumption(e.target.value)}
                    className="w-full p-3 rounded-xl bg-white dark:bg-slate-800 border-none shadow-sm text-sm font-bold text-slate-700 dark:text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-slate-400 tracking-tighter">Preço Diesel (L)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={dieselPrice}
                    onChange={(e) => setDieselPrice(e.target.value)}
                    placeholder="0.00"
                    className="w-full p-3 rounded-xl bg-white dark:bg-slate-800 border-none shadow-sm text-sm font-bold text-slate-700 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-slate-400 tracking-tighter">Custo Fixo/Dia (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={fixedDailyCost}
                    onChange={(e) => setFixedDailyCost(e.target.value)}
                    placeholder="0.00"
                    className="w-full p-3 rounded-xl bg-white dark:bg-slate-800 border-none shadow-sm text-sm font-bold text-slate-700 dark:text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-slate-400 tracking-tighter">Dias de Viagem</label>
                  <input
                    type="number"
                    value={tripDays}
                    onChange={(e) => setTripDays(e.target.value)}
                    className="w-full p-3 rounded-xl bg-white dark:bg-slate-800 border-none shadow-sm text-sm font-bold text-slate-700 dark:text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-slate-400 tracking-tighter">Margem Alvo (%)</label>
                  <input
                    type="number"
                    value={targetMargin}
                    onChange={(e) => setTargetMargin(e.target.value)}
                    className="w-full p-3 rounded-xl bg-white dark:bg-slate-800 border-none shadow-sm text-sm font-bold text-slate-700 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-2xl border border-red-100 dark:border-red-900/20">
                  <p className="text-[9px] text-accent-error font-black uppercase mb-1">Combustível</p>
                  <p className="text-xl font-black text-accent-error tabular-nums">
                    {formatCurrency(totals.fuelCost)}
                  </p>
                </div>
                <div className="bg-orange-50 dark:bg-orange-900/10 p-4 rounded-2xl border border-orange-100 dark:border-orange-900/20">
                  <p className="text-[9px] text-orange-500 font-black uppercase mb-1">Custo Fixo</p>
                  <p className="text-xl font-black text-orange-500 tabular-nums">
                    {formatCurrency(totals.tripFixedCost)}
                  </p>
                </div>
                <div className={`col-span-2 lg:col-span-1 p-4 rounded-2xl border ${totals.isMarginOk ? 'bg-green-50 dark:bg-green-900/10 border-green-100 dark:border-green-900/20' : 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/20'}`}>
                  <p className={`text-[9px] font-black uppercase mb-1 ${totals.isMarginOk ? 'text-accent-success' : 'text-accent-error'}`}>Lucro Estimado ({totals.profitMargin.toFixed(1)}%)</p>
                  <p className={`text-xl font-black tabular-nums ${totals.isMarginOk ? 'text-accent-success' : 'text-accent-error'}`}>
                    {formatCurrency(totals.estimatedProfit)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Ações */}
        <div className="grid grid-cols-2 gap-3 pt-4">
          <button
            onClick={handleShareWhatsapp}
            className="flex items-center justify-center gap-2 bg-[#25D366] text-white py-4 rounded-2xl font-roboto font-bold text-xs uppercase tracking-widest shadow-lg shadow-green-500/20 active:scale-95 transition-all"
          >
            <Share2 className="w-4 h-4" /> WhatsApp
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-white py-4 rounded-2xl font-roboto font-bold text-xs uppercase tracking-widest active:scale-95 transition-all"
          >
            <Copy className="w-4 h-4" /> Copiar
          </button>
          <Button
            onClick={handleRegister}
            disabled={totals.total <= 0}
            className="col-span-2 h-16 text-sm font-black"
          >
            <CheckCircle className="w-5 h-5 mr-2" />
            REGISTRAR VALOR NO FRETE
          </Button>
        </div>
      </div>
    </div>
  );
};
