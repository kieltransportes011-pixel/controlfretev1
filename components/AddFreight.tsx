
import React, { useState, useEffect } from 'react';
import { AppSettings, Freight } from '../types';
import { formatCurrency, generateId } from '../utils';
import { Button } from './Button';
import { Card } from './Card';
import { CalendarPicker } from './CalendarPicker';
import { ChevronLeft, Calculator, CalendarClock, CheckCircle, AlertTriangle, FileText } from 'lucide-react';

interface AddFreightProps {
  settings: AppSettings;
  onSave: (freight: Freight) => void;
  onCancel: () => void;
  initialData?: Partial<Freight>;
}

export const AddFreight: React.FC<AddFreightProps> = ({ settings, onSave, onCancel, initialData }) => {
  const [totalValue, setTotalValue] = useState<string>(initialData?.totalValue ? String(initialData.totalValue) : '');
  const [client, setClient] = useState(initialData?.client || '');
  const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]);

  // Payment Status
  const [isPaidInFull, setIsPaidInFull] = useState(initialData?.status === 'PAID' || !initialData?.status);
  const [advanceValue, setAdvanceValue] = useState<string>(initialData?.receivedValue !== undefined && initialData?.status !== 'PAID' ? String(initialData.receivedValue) : '');
  const [dueDate, setDueDate] = useState(initialData?.dueDate || '');

  // Percentages - Use stored percentages if editing, otherwise default
  const [companyPercent, setCompanyPercent] = useState(initialData?.companyPercent || settings.defaultCompanyPercent);
  const [driverPercent, setDriverPercent] = useState(initialData?.driverPercent || settings.defaultDriverPercent);
  const [reservePercent, setReservePercent] = useState(initialData?.reservePercent || settings.defaultReservePercent);

  // Advanced Details for Receipt
  const [origin, setOrigin] = useState(initialData?.origin || '');
  const [destination, setDestination] = useState(initialData?.destination || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [paymentMethod, setPaymentMethod] = useState(initialData?.paymentMethod || 'PIX');
  const [clientDoc, setClientDoc] = useState(initialData?.clientDoc || '');

  // Calculation Results
  const [calculated, setCalculated] = useState({
    company: 0,
    driver: 0,
    reserve: 0
  });

  const [isSuccess, setIsSuccess] = useState(false);

  const handleCalculate = () => {
    const value = parseFloat(totalValue) || 0;
    const company = value * (companyPercent / 100);
    const driver = value * (driverPercent / 100);
    const reserve = value * (reservePercent / 100);

    setCalculated({ company, driver, reserve });
  };

  // Auto calculate when inputs change
  useEffect(() => {
    handleCalculate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalValue, companyPercent, driverPercent, reservePercent]);

  // If initial data indicates a partial payment, update the toggle on mount
  useEffect(() => {
    if (initialData?.status === 'PARTIAL' || initialData?.status === 'PENDING') {
      setIsPaidInFull(false);
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!totalValue || parseFloat(totalValue) <= 0) return;

    const total = parseFloat(totalValue);
    let received = total;
    let pending = 0;
    let status: 'PAID' | 'PARTIAL' | 'PENDING' = 'PAID';

    if (!isPaidInFull) {
      const advance = parseFloat(advanceValue) || 0;
      received = advance;
      pending = total - advance;

      if (received === 0) status = 'PENDING';
      else if (received < total) status = 'PARTIAL';
      else status = 'PAID';
    }

    const newFreight: Freight = {
      id: initialData?.id || '', // Only use existing ID if editing, otherwise empty
      date,
      client,
      totalValue: total,
      companyValue: calculated.company,
      driverValue: calculated.driver,
      reserveValue: calculated.reserve,
      companyPercent,
      driverPercent,
      reservePercent,
      status,
      receivedValue: received,
      pendingValue: pending,
      dueDate: pending > 0 ? dueDate : undefined,
      origin,
      destination,
      description,
      paymentMethod,
      clientDoc
    };

    setIsSuccess(true);
    setTimeout(() => {
      onSave(newFreight);
    }, 1500);
  };

  const totalPercent = companyPercent + driverPercent + reservePercent;
  const isPercentValid = Math.abs(totalPercent - 100) < 0.1;

  const totalNum = parseFloat(totalValue) || 0;
  const advanceNum = parseFloat(advanceValue) || 0;

  // Logic for Pending Amount Calculation
  const pendingAmount = totalNum - advanceNum;
  const isAdvanceInvalid = advanceNum > totalNum;

  const getTitle = () => {
    if (initialData?.id) return 'Editar Frete';
    if (initialData) return 'Realizar Frete Agendado';
    return 'Novo Frete';
  }

  if (isSuccess) {
    return (
      <div className="fixed inset-0 bg-[#F5F7FA] dark:bg-slate-900 z-50 flex flex-col items-center justify-center p-4 animate-fadeIn">
        <div className="bg-green-100 dark:bg-green-900/30 p-6 rounded-full mb-6 animate-bounce-short">
          <CheckCircle className="w-16 h-16 text-accent-success dark:text-green-400" />
        </div>
        <h2 className="text-2xl font-bold text-base-text dark:text-white mb-2">Sucesso!</h2>
        <p className="text-slate-500 dark:text-slate-400">O frete foi registrado corretamente.</p>
      </div>
    );
  }

  return (
    <div className="pb-24">
      <div className="flex items-center mb-6">
        <button onClick={onCancel} className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-full">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold text-base-text dark:text-white ml-2">
          {getTitle()}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Main Inputs */}
        <Card className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Valor Total do Frete (R$)</label>
            <input
              type="number"
              step="0.01"
              required
              value={totalValue}
              onChange={(e) => setTotalValue(e.target.value)}
              placeholder="0,00"
              className="w-full text-3xl font-bold text-brand dark:text-brand-300 placeholder-brand-200 dark:placeholder-brand-900/50 border-b-2 border-slate-100 dark:border-slate-700 focus:border-brand outline-none py-2 bg-transparent transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Cliente <span className="text-slate-400 font-normal">(Opcional)</span></label>
            <input
              type="text"
              value={client}
              onChange={(e) => setClient(e.target.value)}
              className="w-full p-3 bg-[#F5F7FA] dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand dark:text-white"
              placeholder="Nome do cliente"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Data do Serviço</label>
            <CalendarPicker
              selectedDate={date}
              onChange={setDate}
            />
          </div>
        </Card>

        {/* Payment Terms */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
            <CalendarClock className="w-4 h-4" />
            Pagamento
          </h3>
          <Card className="space-y-4">
            <div className="flex bg-[#F5F7FA] dark:bg-slate-900 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setIsPaidInFull(true)}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${isPaidInFull ? 'bg-white dark:bg-slate-700 text-brand dark:text-brand-300 shadow-sm' : 'text-slate-500'}`}
              >
                À Vista / Total
              </button>
              <button
                type="button"
                onClick={() => setIsPaidInFull(false)}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${!isPaidInFull ? 'bg-white dark:bg-slate-700 text-brand dark:text-brand-300 shadow-sm' : 'text-slate-500'}`}
              >
                Adiantamento + Saldo
              </button>
            </div>

            {!isPaidInFull && (
              <div className="space-y-4 animate-fadeIn">
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Valor do Adiantamento (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={advanceValue}
                    onChange={(e) => setAdvanceValue(e.target.value)}
                    placeholder="0,00"
                    className={`w-full p-3 bg-[#F5F7FA] dark:bg-slate-900 rounded-xl border outline-none focus:border-brand font-bold text-slate-700 dark:text-white ${isAdvanceInvalid ? 'border-red-300 bg-red-50 dark:bg-red-900/20' : 'border-slate-200 dark:border-slate-700'}`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Restante a Receber</label>
                  <div className={`w-full p-3 rounded-xl border flex justify-between items-center transition-all ${isAdvanceInvalid ? 'bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-800' : 'bg-[#F5F7FA] dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>
                    <span className="text-slate-500 dark:text-slate-400 text-sm">Calculado:</span>
                    <span className={`font-bold text-lg ${pendingAmount < 0 || isAdvanceInvalid ? 'text-accent-error' : 'text-base-text dark:text-white'}`}>
                      {formatCurrency(pendingAmount)}
                    </span>
                  </div>
                  {isAdvanceInvalid && (
                    <p className="text-xs text-accent-error mt-2 flex items-center gap-1 animate-pulse">
                      <AlertTriangle className="w-3 h-3" />
                      O adiantamento não pode ser maior que o valor total.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Data prevista para o Saldo</label>
                  <CalendarPicker
                    selectedDate={dueDate}
                    onChange={setDueDate}
                  />
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Advanced Details for Receipt */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Detalhes para o Recibo <span className="text-[10px] font-normal lowercase">(Opcional)</span>
          </h3>
          <Card className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1 uppercase">Origem</label>
                <input
                  type="text"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  placeholder="Cidade / Endereço de Coleta"
                  className="w-full p-3 bg-[#F5F7FA] dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:border-brand dark:text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1 uppercase">Destino</label>
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="Cidade / Endereço de Entrega"
                  className="w-full p-3 bg-[#F5F7FA] dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:border-brand dark:text-white text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1 uppercase">Descrição da Carga / Serviço</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Transporte de móveis residenciais, frete de 50 sacos de cimento, etc."
                rows={2}
                className="w-full p-3 bg-[#F5F7FA] dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:border-brand dark:text-white text-sm resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1 uppercase">Forma de Pagamento</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full p-3 bg-[#F5F7FA] dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:border-brand dark:text-white text-sm"
                >
                  <option value="PIX">Pix</option>
                  <option value="DINHEIRO">Dinheiro</option>
                  <option value="CARTÃO DE CRÉDITO">Cartão de Crédito</option>
                  <option value="CARTÃO DE DÉBITO">Cartão de Débito</option>
                  <option value="TRANSFERÊNCIA">Transferência</option>
                  <option value="BOLETO">Boleto</option>
                  <option value="OUTRO">Outro</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1 uppercase">CPF/CNPJ do Cliente</label>
                <input
                  type="text"
                  value={clientDoc}
                  onChange={(e) => setClientDoc(e.target.value)}
                  placeholder="000.000.000-00"
                  className="w-full p-3 bg-[#F5F7FA] dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:border-brand dark:text-white text-sm"
                />
              </div>
            </div>
          </Card>
        </div>

        {/* Percentages */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className={`text-sm font-semibold uppercase tracking-wider ${!isPercentValid ? 'text-accent-error' : 'text-slate-500'}`}>Divisão (%)</h3>
            {!isPercentValid && (
              <span className="text-xs text-accent-error font-bold flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Total: {totalPercent}%
              </span>
            )}
          </div>
          <Card className={`space-y-4 transition-all duration-300 ${!isPercentValid ? 'border-red-300 dark:border-red-700 ring-2 ring-red-100 dark:ring-red-900/20 shadow-red-100 dark:shadow-none' : ''}`}>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className={`block text-xs font-medium mb-1 ${!isPercentValid ? 'text-accent-error' : 'text-slate-500'}`}>Empresa</label>
                <div className="relative">
                  <input
                    type="number"
                    value={companyPercent}
                    onChange={(e) => setCompanyPercent(Number(e.target.value))}
                    className={`w-full p-2 bg-[#F5F7FA] dark:bg-slate-900 rounded-lg border text-center font-semibold outline-none focus:border-brand transition-colors ${!isPercentValid ? 'border-red-300 dark:border-red-700 text-accent-error dark:text-red-400' : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-white'}`}
                  />
                  <span className="absolute right-2 top-2 text-xs text-slate-400">%</span>
                </div>
              </div>
              <div>
                <label className={`block text-xs font-medium mb-1 ${!isPercentValid ? 'text-accent-error' : 'text-slate-500'}`}>Motorista</label>
                <div className="relative">
                  <input
                    type="number"
                    value={driverPercent}
                    onChange={(e) => setDriverPercent(Number(e.target.value))}
                    className={`w-full p-2 bg-[#F5F7FA] dark:bg-slate-900 rounded-lg border text-center font-semibold outline-none focus:border-brand transition-colors ${!isPercentValid ? 'border-red-300 dark:border-red-700 text-accent-error dark:text-red-400' : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-white'}`}
                  />
                  <span className="absolute right-2 top-2 text-xs text-slate-400">%</span>
                </div>
              </div>
              <div>
                <label className={`block text-xs font-medium mb-1 ${!isPercentValid ? 'text-accent-error' : 'text-slate-500'}`}>Reserva</label>
                <div className="relative">
                  <input
                    type="number"
                    value={reservePercent}
                    onChange={(e) => setReservePercent(Number(e.target.value))}
                    className={`w-full p-2 bg-[#F5F7FA] dark:bg-slate-900 rounded-lg border text-center font-semibold outline-none focus:border-brand transition-colors ${!isPercentValid ? 'border-red-300 dark:border-red-700 text-accent-error dark:text-red-400' : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-white'}`}
                  />
                  <span className="absolute right-2 top-2 text-xs text-slate-400">%</span>
                </div>
              </div>
            </div>
            {!isPercentValid && (
              <div className="text-xs text-accent-error bg-red-50 dark:bg-red-900/20 p-2 rounded flex items-center justify-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                <span>A soma das porcentagens deve ser 100%.</span>
              </div>
            )}
          </Card>
        </div>

        {/* Results Preview */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
            <Calculator className="w-4 h-4" />
            Resultado (Valor Total)
          </h3>
          <div className="bg-slate-800 rounded-2xl p-5 text-white shadow-lg space-y-4">
            <div className="flex justify-between items-center border-b border-slate-700 pb-2">
              <span className="text-slate-400 text-sm">Empresa ({companyPercent}%)</span>
              <span className="font-mono font-bold text-lg text-green-400">{formatCurrency(calculated.company)}</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-700 pb-2">
              <span className="text-slate-400 text-sm">Motorista ({driverPercent}%)</span>
              <span className="font-mono font-bold text-lg text-blue-400">{formatCurrency(calculated.driver)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-sm">Reserva ({reservePercent}%)</span>
              <span className="font-mono font-bold text-lg text-orange-400">{formatCurrency(calculated.reserve)}</span>
            </div>
          </div>
          {!isPaidInFull && (
            <p className="text-xs text-slate-400 text-center">
              Nota: O saldo em caixa será atualizado apenas conforme o recebimento.
            </p>
          )}
        </div>

        <div className="pt-4">
          <Button type="submit" fullWidth disabled={!totalValue || !isPercentValid || isAdvanceInvalid}>
            Salvar Frete
          </Button>
        </div>
      </form>
    </div>
  );
};
