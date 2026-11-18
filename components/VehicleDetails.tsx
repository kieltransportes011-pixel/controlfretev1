import React, { useMemo, useRef, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Vehicle, VehicleStatus, MaintenanceLog, Freight, Expense, VehicleInspection } from '../types';
import { Card } from './Card';
import { Button } from './Button';
import { formatCurrency, formatDate } from '../utils';
import { X, Hash, Calendar, Wrench, DollarSign, AlertCircle, Trash2, Fuel, User, Printer, CheckCircle, Circle, TrendingUp } from 'lucide-react';
import { useConfirm } from '../contexts/ConfirmContext';
import { useToast } from '../contexts/ToastContext';
import { getVehiclesNeedingAttention } from '../utils/vehicleAlerts';
import { CATEGORY_LABELS, CATEGORY_COLORS } from './MaintenanceLogs';

const STATUS_LABELS: Record<VehicleStatus, string> = {
  ativo: 'Ativo',
  em_manutencao: 'Em Manutenção',
  vendido: 'Vendido',
  inativo: 'Inativo',
};

const STATUS_COLORS: Record<VehicleStatus, string> = {
  ativo: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  em_manutencao: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  vendido: 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400',
  inativo: 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400',
};

const CHECKLIST_ITEMS = ['Pneus', 'Freios', 'Óleo', 'Água do Radiador', 'Luzes/Sinalização', 'Nível de Combustível', 'Documentação'];

interface VehicleDetailsProps {
  vehicle: Vehicle;
  maintenanceLogs: MaintenanceLog[];
  freights: Freight[];
  expenses: Expense[];
  inspections: VehicleInspection[];
  onBack: () => void;
  onEditVehicle: () => void;
  onDeleteLog: (id: string) => Promise<void>;
  onAddInspection: (i: Omit<VehicleInspection, 'id' | 'user_id' | 'created_at'>) => Promise<void>;
}

export const VehicleDetails: React.FC<VehicleDetailsProps> = ({ vehicle, maintenanceLogs, freights, expenses, inspections, onBack, onEditVehicle, onDeleteLog, onAddInspection }) => {
  const confirmDialog = useConfirm();
  const { error: toastError } = useToast();

  const logsForVehicle = useMemo(
    () => maintenanceLogs
      .filter(l => l.vehicle_id === vehicle.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [maintenanceLogs, vehicle.id]
  );

  const freightsForVehicle = useMemo(
    () => freights.filter(f => f.vehicle_id === vehicle.id),
    [freights, vehicle.id]
  );

  const totalMaintenanceCost = logsForVehicle.reduce((acc, l) => acc + l.cost, 0);
  const totalRevenue = freightsForVehicle.reduce((acc, f) => acc + f.totalValue, 0);

  const fuelExpensesForVehicle = useMemo(
    () => expenses.filter(e => e.vehicle_id === vehicle.id && e.category === 'FUEL'),
    [expenses, vehicle.id]
  );
  const totalFuelCost = fuelExpensesForVehicle.reduce((acc, e) => acc + e.value, 0);
  const totalProfit = totalRevenue - totalMaintenanceCost - totalFuelCost;

  const alerts = useMemo(
    () => getVehiclesNeedingAttention([vehicle], maintenanceLogs),
    [vehicle, maintenanceLogs]
  );

  const kmHistory = useMemo(
    () => logsForVehicle
      .filter(l => l.km_at_service)
      .slice()
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(l => ({ name: formatDate(l.date), km: l.km_at_service as number })),
    [logsForVehicle]
  );

  const inspectionsForVehicle = useMemo(
    () => inspections
      .filter(i => i.vehicle_id === vehicle.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [inspections, vehicle.id]
  );

  const [showChecklistForm, setShowChecklistForm] = useState(false);
  const [checklistState, setChecklistState] = useState<Record<string, boolean>>(
    () => Object.fromEntries(CHECKLIST_ITEMS.map(i => [i, false]))
  );
  const [checklistNotes, setChecklistNotes] = useState('');
  const [savingChecklist, setSavingChecklist] = useState(false);

  const handleSaveChecklist = async () => {
    if (savingChecklist) return;
    setSavingChecklist(true);
    try {
      await onAddInspection({
        vehicle_id: vehicle.id,
        date: new Date().toISOString(),
        items: checklistState,
        notes: checklistNotes || undefined,
      });
      setShowChecklistForm(false);
      setChecklistState(Object.fromEntries(CHECKLIST_ITEMS.map(i => [i, false])));
      setChecklistNotes('');
    } catch (err: any) {
      console.error('Erro ao salvar checklist:', err);
      toastError(err?.message || 'Erro ao salvar checklist. Tente novamente.');
    } finally {
      setSavingChecklist(false);
    }
  };

  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const printWindow = window.open('', '', 'height=700,width=900');
    if (!printWindow || printWindow === window) {
      // Esse ambiente (ex: app instalado/PWA) não permite abrir uma janela
      // separada — a pré-visualização em tela já cobre o essencial, então
      // só avisa em vez de arriscar navegar o app inteiro pra fora.
      toastError('Esse dispositivo não permite abrir a janela de impressão. Use a pré-visualização na tela.');
      return;
    }
    printWindow.document.write(`<html><head><title>Relatório de Manutenção - ${vehicle.plate}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 24px; color: #1e293b; }
        h1 { font-size: 20px; margin-bottom: 4px; }
        .subtitle { color: #64748b; font-size: 12px; margin-bottom: 24px; }
        .stats { display: flex; gap: 16px; margin-bottom: 24px; flex-wrap: wrap; }
        .stat { border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; }
        .stat-label { font-size: 10px; color: #94a3b8; text-transform: uppercase; }
        .stat-value { font-size: 16px; font-weight: bold; }
        table { width: 100%; border-collapse: collapse; }
        th { background: #f1f5f9; text-align: left; padding: 10px; font-size: 11px; text-transform: uppercase; }
        td { padding: 10px; font-size: 12px; border-bottom: 1px solid #f1f5f9; }
        .text-right { text-align: right; }
        @media print { body { padding: 0; } }
      </style>
    </head><body>${content.innerHTML}</body></html>`);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return (
    <div className="pb-24 space-y-6 animate-fadeIn">
      <header className="flex justify-between items-center pb-1">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 -ml-2 text-slate-400 hover:text-brand transition-colors">
            <X className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">{vehicle.model}</h1>
            <div className="flex items-center gap-2 flex-wrap mt-0.5">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{vehicle.plate}</p>
              <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest ${STATUS_COLORS[vehicle.status || 'ativo']}`}>
                {STATUS_LABELS[vehicle.status || 'ativo']}
              </span>
              {vehicle.driver_name && (
                <span className="flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase">
                  <User className="w-3 h-3" /> {vehicle.driver_name}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPdfPreview(true)}
            className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 p-2.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <Printer className="w-5 h-5" />
          </button>
          <button
            onClick={onEditVehicle}
            className="bg-brand text-white p-2.5 rounded-xl shadow-lg shadow-brand/20 hover:scale-105 transition-transform"
          >
            <Wrench className="w-5 h-5" />
          </button>
        </div>
      </header>

      {alerts.length > 0 && (
        <Card className="bg-orange-50 dark:bg-orange-900/10 border-orange-100 dark:border-orange-900/30 p-4 space-y-1">
          <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
            <AlertCircle className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">Revisão pendente</span>
          </div>
          {alerts.map(a => (
            <p key={a.vehicle.id} className="text-xs text-orange-700 dark:text-orange-300 font-bold">
              {a.reason !== 'DATE' && `Revisão aos ${a.dueKm?.toLocaleString()} KM`}
              {a.reason === 'BOTH' && ' ou '}
              {a.reason !== 'KM' && a.dueDate && `Revisão em ${formatDate(a.dueDate)}`}
            </p>
          ))}
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
            <Hash className="w-3 h-3" />
            <span className="text-[10px] font-black uppercase tracking-widest">KM Atual</span>
          </div>
          <p className="text-lg font-black text-slate-800 dark:text-white">{vehicle.current_km.toLocaleString()}</p>
        </Card>
        {vehicle.year && (
          <Card className="p-4">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
              <Calendar className="w-3 h-3" />
              <span className="text-[10px] font-black uppercase tracking-widest">Ano</span>
            </div>
            <p className="text-lg font-black text-slate-800 dark:text-white">{vehicle.year}</p>
          </Card>
        )}
        <Card className="bg-orange-50 dark:bg-orange-900/10 border-orange-100 dark:border-orange-900/30 p-4">
          <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 mb-1">
            <Wrench className="w-3 h-3" />
            <span className="text-[10px] font-black uppercase tracking-widest">Gasto Manutenção</span>
          </div>
          <p className="text-lg font-black text-slate-800 dark:text-white">{formatCurrency(totalMaintenanceCost)}</p>
        </Card>
        <Card className="bg-green-50 dark:bg-green-900/10 border-green-100 dark:border-green-900/30 p-4">
          <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-1">
            <DollarSign className="w-3 h-3" />
            <span className="text-[10px] font-black uppercase tracking-widest">Receita (Fretes)</span>
          </div>
          <p className="text-lg font-black text-slate-800 dark:text-white">{formatCurrency(totalRevenue)}</p>
        </Card>
        <Card className="bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30 p-4">
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-1">
            <Fuel className="w-3 h-3" />
            <span className="text-[10px] font-black uppercase tracking-widest">Gasto Combustível</span>
          </div>
          <p className="text-lg font-black text-slate-800 dark:text-white">{formatCurrency(totalFuelCost)}</p>
        </Card>
        <Card className={totalProfit >= 0
          ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/30 p-4'
          : 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30 p-4'}>
          <div className={`flex items-center gap-2 mb-1 ${totalProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
            <DollarSign className="w-3 h-3" />
            <span className="text-[10px] font-black uppercase tracking-widest">Lucro</span>
          </div>
          <p className="text-lg font-black text-slate-800 dark:text-white">{formatCurrency(totalProfit)}</p>
        </Card>
      </div>

      <Card className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-tight">Evolução de KM</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase">Baseado nas manutenções registradas</p>
          </div>
          <TrendingUp className="w-5 h-5 text-brand" />
        </div>
        {kmHistory.length < 2 ? (
          <div className="h-28 flex items-center justify-center text-xs text-slate-400 text-center px-6">
            Registre mais manutenções informando o KM pra ver a evolução.
          </div>
        ) : (
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={kmHistory}>
                <defs>
                  <linearGradient id="colorKm" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} dy={10} />
                <YAxis hide />
                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontWeight: 'bold' }} />
                <Area type="monotone" dataKey="km" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorKm)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      <div className="space-y-3">
        <h2 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] px-1">Histórico de Manutenção</h2>
        {logsForVehicle.length === 0 && (
          <Card className="p-4 text-center text-xs text-slate-400 font-bold">Nenhum serviço registrado ainda.</Card>
        )}
        {logsForVehicle.map(log => (
          <Card key={log.id} className="p-4 group relative overflow-hidden">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter ${CATEGORY_COLORS[log.category]}`}>
                  {CATEGORY_LABELS[log.category]}
                </span>
                <span className="text-[10px] font-bold text-slate-400">{formatDate(log.date)}</span>
              </div>
              <div className="font-black text-slate-800 dark:text-white text-sm">
                {formatCurrency(log.cost)}
              </div>
            </div>
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 leading-tight">
              {log.description}
            </h3>
            <button
              onClick={async () => { if (await confirmDialog({ message: 'Excluir log de manutenção?', danger: true })) onDeleteLog(log.id); }}
              className="absolute bottom-3 right-3 p-2 text-slate-300 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </Card>
        ))}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Checklist de Inspeção</h2>
          <button
            onClick={() => setShowChecklistForm(s => !s)}
            className="text-[10px] font-black text-brand uppercase tracking-widest"
          >
            {showChecklistForm ? 'Cancelar' : '+ Novo Checklist'}
          </button>
        </div>

        {showChecklistForm && (
          <Card className="p-4 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {CHECKLIST_ITEMS.map(item => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setChecklistState(s => ({ ...s, [item]: !s[item] }))}
                  className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-bold text-left transition-colors ${checklistState[item] ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' : 'bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400'}`}
                >
                  {checklistState[item] ? <CheckCircle className="w-4 h-4 shrink-0" /> : <Circle className="w-4 h-4 shrink-0" />}
                  {item}
                </button>
              ))}
            </div>
            <textarea
              value={checklistNotes}
              onChange={(e) => setChecklistNotes(e.target.value)}
              placeholder="Observações (opcional)"
              rows={2}
              className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl outline-none text-sm resize-none dark:text-white"
            />
            <button
              onClick={handleSaveChecklist}
              disabled={savingChecklist}
              className="w-full py-3 bg-brand text-white rounded-xl font-black text-xs uppercase tracking-widest disabled:opacity-50"
            >
              {savingChecklist ? 'Salvando...' : 'Salvar Checklist'}
            </button>
          </Card>
        )}

        {inspectionsForVehicle.length === 0 && !showChecklistForm && (
          <Card className="p-4 text-center text-xs text-slate-400 font-bold">Nenhum checklist registrado ainda.</Card>
        )}
        {inspectionsForVehicle.slice(0, 5).map(insp => {
          const total = Object.keys(insp.items).length;
          const checked = Object.values(insp.items).filter(Boolean).length;
          const complete = checked === total;
          return (
            <Card key={insp.id} className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{formatDate(insp.date)}</p>
                {insp.notes && <p className="text-xs text-slate-400 mt-0.5">{insp.notes}</p>}
              </div>
              <span className={`text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-widest shrink-0 ${complete ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                {checked}/{total} OK
              </span>
            </Card>
          );
        })}
      </div>

      {showPdfPreview && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <Card className="w-full max-w-lg max-h-[85vh] overflow-y-auto space-y-4 animate-slideUp">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">Relatório de Manutenção</h2>
              <button onClick={() => setShowPdfPreview(false)} className="text-slate-400 p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div ref={printRef} className="space-y-4 text-slate-800">
              <div>
                <h1 style={{ fontSize: 18, fontWeight: 900, margin: 0 }}>Relatório de Manutenção</h1>
                <p style={{ color: '#64748b', fontSize: 12, margin: '4px 0 0' }}>
                  {vehicle.model} - {vehicle.plate}{vehicle.driver_name ? ` - Motorista: ${vehicle.driver_name}` : ''}
                </p>
              </div>
              <div className="stats" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {[
                  ['KM Atual', vehicle.current_km.toLocaleString()],
                  ['Gasto Manutenção', formatCurrency(totalMaintenanceCost)],
                  ['Gasto Combustível', formatCurrency(totalFuelCost)],
                  ['Lucro', formatCurrency(totalProfit)],
                ].map(([label, value]) => (
                  <div key={label} className="stat" style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px' }}>
                    <div className="stat-label" style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase' }}>{label}</div>
                    <div className="stat-value" style={{ fontSize: 14, fontWeight: 700 }}>{value}</div>
                  </div>
                ))}
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr>
                    <th style={{ background: '#f1f5f9', textAlign: 'left', padding: 8, fontSize: 10, textTransform: 'uppercase' }}>Data</th>
                    <th style={{ background: '#f1f5f9', textAlign: 'left', padding: 8, fontSize: 10, textTransform: 'uppercase' }}>Categoria</th>
                    <th style={{ background: '#f1f5f9', textAlign: 'left', padding: 8, fontSize: 10, textTransform: 'uppercase' }}>Descrição</th>
                    <th className="text-right" style={{ background: '#f1f5f9', textAlign: 'right', padding: 8, fontSize: 10, textTransform: 'uppercase' }}>KM</th>
                    <th className="text-right" style={{ background: '#f1f5f9', textAlign: 'right', padding: 8, fontSize: 10, textTransform: 'uppercase' }}>Custo</th>
                  </tr>
                </thead>
                <tbody>
                  {logsForVehicle.length === 0 ? (
                    <tr><td colSpan={5} style={{ textAlign: 'center', color: '#94a3b8', padding: 16 }}>Nenhum serviço registrado.</td></tr>
                  ) : logsForVehicle.map(l => (
                    <tr key={l.id}>
                      <td style={{ padding: 8, borderBottom: '1px solid #f1f5f9' }}>{formatDate(l.date)}</td>
                      <td style={{ padding: 8, borderBottom: '1px solid #f1f5f9' }}>{CATEGORY_LABELS[l.category]}</td>
                      <td style={{ padding: 8, borderBottom: '1px solid #f1f5f9' }}>{l.description}</td>
                      <td className="text-right" style={{ padding: 8, borderBottom: '1px solid #f1f5f9', textAlign: 'right' }}>{l.km_at_service ? `${l.km_at_service.toLocaleString()} KM` : '-'}</td>
                      <td className="text-right" style={{ padding: 8, borderBottom: '1px solid #f1f5f9', textAlign: 'right' }}>{formatCurrency(l.cost)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Button fullWidth onClick={handlePrint} className="!py-2.5">
              <Printer className="w-4 h-4 mr-2" />
              Imprimir / Salvar PDF
            </Button>
          </Card>
        </div>
      )}
    </div>
  );
};
