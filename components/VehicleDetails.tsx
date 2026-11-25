import React, { useMemo, useRef, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Vehicle, VehicleStatus, MaintenanceLog, Freight, Expense, VehicleInspection, Driver, OdometerReading, OdometerSource, VehicleMaintenancePlan, InspectionIssue, IssueSeverity, VehicleDocument, VehicleDocumentType } from '../types';
import { Card } from './Card';
import { Button } from './Button';
import { formatCurrency, formatDate } from '../utils';
import { X, Hash, Calendar, Wrench, DollarSign, AlertCircle, Trash2, Fuel, User, Printer, CheckCircle, Circle, Gauge, ClipboardList, FileText } from 'lucide-react';
import { useConfirm } from '../contexts/ConfirmContext';
import { useToast } from '../contexts/ToastContext';
import { getVehiclesNeedingAttention, getRevisionLevel, getExpiryLevel } from '../utils/vehicleAlerts';
import { calculateAverageConsumption, calculatePeriodCost } from '../utils/vehicleCostAnalysis';
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
  drivers: Driver[];
  plans: VehicleMaintenancePlan[];
  odometerReadings: OdometerReading[];
  issues: InspectionIssue[];
  documents: VehicleDocument[];
  onBack: () => void;
  onEditVehicle: () => void;
  onDeleteLog: (id: string) => Promise<void>;
  onAddInspection: (i: Omit<VehicleInspection, 'id' | 'user_id' | 'created_at'>) => Promise<void>;
  onAddOdometerReading: (r: Omit<OdometerReading, 'id' | 'user_id' | 'created_at'>) => Promise<void>;
  onUpdateIssue: (id: string, patch: Partial<Pick<InspectionIssue, 'status' | 'severity' | 'maintenance_log_id'>>) => Promise<void>;
  onAddDocument: (d: Omit<VehicleDocument, 'id' | 'user_id' | 'created_at' | 'last_alert_at'>) => Promise<void>;
  onDeleteDocument: (id: string) => Promise<void>;
}

const DOCUMENT_LABELS: Record<VehicleDocumentType, string> = {
  seguro: 'Seguro',
  licenciamento: 'Licenciamento',
  ipva: 'IPVA',
  outro: 'Outro',
};

const SEVERITY_LABELS: Record<IssueSeverity, string> = { baixa: 'Baixa', media: 'Média', alta: 'Alta' };
const SEVERITY_COLORS: Record<IssueSeverity, string> = {
  baixa: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
  media: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  alta: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};
const SEVERITY_CYCLE: Record<IssueSeverity, IssueSeverity> = { baixa: 'media', media: 'alta', alta: 'baixa' };

export const VehicleDetails: React.FC<VehicleDetailsProps> = ({ vehicle, maintenanceLogs, freights, expenses, inspections, drivers, plans, odometerReadings, issues, documents, onBack, onEditVehicle, onDeleteLog, onAddInspection, onAddOdometerReading, onUpdateIssue, onAddDocument, onDeleteDocument }) => {
  const driverDisplayName = (vehicle.driver_id && drivers.find(d => d.id === vehicle.driver_id)?.name) || vehicle.driver_name || '';
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

  const expensesForVehicle = useMemo(
    () => expenses.filter(e => e.vehicle_id === vehicle.id),
    [expenses, vehicle.id]
  );

  const fuelExpensesForVehicle = useMemo(
    () => expensesForVehicle.filter(e => e.category === 'FUEL'),
    [expensesForVehicle]
  );
  const totalFuelCost = fuelExpensesForVehicle.reduce((acc, e) => acc + e.value, 0);

  const consumption = useMemo(() => calculateAverageConsumption(fuelExpensesForVehicle), [fuelExpensesForVehicle]);
  const totalProfit = totalRevenue - totalMaintenanceCost - totalFuelCost;

  const plan = useMemo(() => plans.find(p => p.vehicle_id === vehicle.id), [plans, vehicle.id]);

  const alerts = useMemo(
    () => getVehiclesNeedingAttention([vehicle], plans),
    [vehicle, plans]
  );

  const revisionLevel = getRevisionLevel(plan, vehicle.current_km);

  const readingsForVehicle = useMemo(
    () => odometerReadings
      .filter(r => r.vehicle_id === vehicle.id)
      .slice()
      .sort((a, b) => new Date(a.reading_date).getTime() - new Date(b.reading_date).getTime()),
    [odometerReadings, vehicle.id]
  );

  const kmHistory = useMemo(
    () => readingsForVehicle.map(r => ({ name: formatDate(r.reading_date), km: r.km })),
    [readingsForVehicle]
  );

  const lastReading = readingsForVehicle[readingsForVehicle.length - 1];

  const periodComparison = useMemo(() => {
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const args = { readings: readingsForVehicle, maintenanceLogs: logsForVehicle, expenses: expensesForVehicle };
    return {
      current: calculatePeriodCost({ ...args, start: thisMonthStart, end: thisMonthEnd }),
      previous: calculatePeriodCost({ ...args, start: lastMonthStart, end: lastMonthEnd }),
    };
  }, [readingsForVehicle, logsForVehicle, expensesForVehicle]);

  const openIssues = useMemo(
    () => issues
      .filter(iss => iss.vehicle_id === vehicle.id && iss.status !== 'resolvida')
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [issues, vehicle.id]
  );

  const [resolvingIssueId, setResolvingIssueId] = useState<string | null>(null);
  const [resolveLogId, setResolveLogId] = useState('');

  const handleResolveIssue = async (id: string) => {
    await onUpdateIssue(id, { status: 'resolvida', maintenance_log_id: resolveLogId || null });
    setResolvingIssueId(null);
    setResolveLogId('');
  };

  const documentsForVehicle = useMemo(
    () => documents
      .filter(d => d.vehicle_id === vehicle.id)
      .sort((a, b) => new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime()),
    [documents, vehicle.id]
  );

  const [showDocForm, setShowDocForm] = useState(false);
  const [docType, setDocType] = useState<VehicleDocumentType>('seguro');
  const [docExpiry, setDocExpiry] = useState('');
  const [docAlertDays, setDocAlertDays] = useState('30');
  const [savingDoc, setSavingDoc] = useState(false);

  const handleSaveDocument = async () => {
    if (!docExpiry) {
      toastError('Informe a data de vencimento.');
      return;
    }
    if (savingDoc) return;
    setSavingDoc(true);
    try {
      await onAddDocument({
        vehicle_id: vehicle.id,
        type: docType,
        expiry_date: docExpiry,
        alert_days_before: docAlertDays ? parseInt(docAlertDays) : 30,
      });
      setShowDocForm(false);
      setDocType('seguro');
      setDocExpiry('');
      setDocAlertDays('30');
    } catch (err: any) {
      console.error('Erro ao salvar documento:', err);
      toastError(err?.message || 'Erro ao salvar documento. Tente novamente.');
    } finally {
      setSavingDoc(false);
    }
  };

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
        date: new Date().toISOString().slice(0, 10),
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

  const [showReadingForm, setShowReadingForm] = useState(false);
  const [readingKm, setReadingKm] = useState('');
  const [readingNote, setReadingNote] = useState('');
  const [confirmingCorrection, setConfirmingCorrection] = useState(false);
  const [savingReading, setSavingReading] = useState(false);

  const resetReadingForm = () => {
    setShowReadingForm(false);
    setReadingKm('');
    setReadingNote('');
    setConfirmingCorrection(false);
  };

  const handleSaveReading = async (source: OdometerSource) => {
    const km = parseFloat(readingKm);
    if (!readingKm || isNaN(km) || km < 0) {
      toastError('Informe um KM válido.');
      return;
    }
    if (source === 'correction' && !readingNote.trim()) {
      toastError('Explique o motivo da correção.');
      return;
    }
    if (savingReading) return;
    setSavingReading(true);
    try {
      await onAddOdometerReading({
        vehicle_id: vehicle.id,
        km,
        reading_date: new Date().toISOString().slice(0, 10),
        source,
        note: readingNote || undefined,
      });
      resetReadingForm();
    } catch (err: any) {
      console.error('Erro ao salvar leitura de KM:', err);
      toastError(err?.message || 'Erro ao salvar leitura. Tente novamente.');
    } finally {
      setSavingReading(false);
    }
  };

  const handleSubmitReading = () => {
    const km = parseFloat(readingKm);
    if (!readingKm || isNaN(km) || km < 0) {
      toastError('Informe um KM válido.');
      return;
    }
    if (lastReading && km < lastReading.km && !confirmingCorrection) {
      setConfirmingCorrection(true);
      return;
    }
    handleSaveReading(confirmingCorrection ? 'correction' : 'manual');
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
    printWindow.document.write(`<html><head><title>Relatório do Veículo - ${vehicle.plate}</title>
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
              {driverDisplayName && (
                <span className="flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase">
                  <User className="w-3 h-3" /> {driverDisplayName}
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
        <Card className={`p-4 space-y-1 ${alerts[0].level === 'OVERDUE'
          ? 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30'
          : 'bg-orange-50 dark:bg-orange-900/10 border-orange-100 dark:border-orange-900/30'}`}>
          <div className={`flex items-center gap-2 ${alerts[0].level === 'OVERDUE' ? 'text-red-600 dark:text-red-400' : 'text-orange-600 dark:text-orange-400'}`}>
            <AlertCircle className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">
              {alerts[0].level === 'OVERDUE' ? 'Revisão vencida' : 'Revisão em breve'}
            </span>
          </div>
          {alerts.map(a => (
            <p key={a.vehicle.id} className={`text-xs font-bold ${a.level === 'OVERDUE' ? 'text-red-700 dark:text-red-300' : 'text-orange-700 dark:text-orange-300'}`}>
              {a.reason !== 'DATE' && `Revisão aos ${a.dueKm?.toLocaleString()} KM`}
              {a.reason === 'BOTH' && ' ou '}
              {a.reason !== 'KM' && a.dueDate && `Revisão em ${formatDate(a.dueDate)}`}
            </p>
          ))}
        </Card>
      )}

      {plan && revisionLevel === 'OK' && (
        <div className="flex items-center gap-2 px-1 text-green-600 dark:text-green-400">
          <CheckCircle className="w-3.5 h-3.5" />
          <span className="text-[10px] font-black uppercase tracking-widest">Revisão em dia</span>
        </div>
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
            <p className="text-[10px] text-slate-400 font-bold uppercase">
              {lastReading ? `Última leitura: ${lastReading.km.toLocaleString()} KM` : 'Sem leituras registradas'}
            </p>
          </div>
          <button
            onClick={() => setShowReadingForm(s => !s)}
            className="flex items-center gap-1 text-[10px] font-black text-brand uppercase tracking-widest shrink-0"
          >
            <Gauge className="w-3.5 h-3.5" /> {showReadingForm ? 'Cancelar' : 'Registrar KM'}
          </button>
        </div>

        {showReadingForm && (
          <div className="space-y-2 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
            <input
              type="number"
              value={readingKm}
              onChange={(e) => { setReadingKm(e.target.value); setConfirmingCorrection(false); }}
              placeholder={lastReading ? `Maior que ${lastReading.km.toLocaleString()}` : 'KM atual'}
              className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl outline-none font-bold dark:text-white"
            />
            {confirmingCorrection && (
              <>
                <p className="text-xs text-amber-600 dark:text-amber-400 font-bold px-1">
                  Esse KM é menor que a última leitura ({lastReading?.km.toLocaleString()}). Se for uma correção, explique o motivo:
                </p>
                <textarea
                  value={readingNote}
                  onChange={(e) => setReadingNote(e.target.value)}
                  placeholder="Ex: odômetro trocado, leitura anterior errada..."
                  rows={2}
                  className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl outline-none text-sm resize-none dark:text-white"
                />
              </>
            )}
            <button
              onClick={handleSubmitReading}
              disabled={savingReading}
              className="w-full py-3 bg-brand text-white rounded-xl font-black text-xs uppercase tracking-widest disabled:opacity-50"
            >
              {savingReading ? 'Salvando...' : confirmingCorrection ? 'Confirmar correção' : 'Salvar leitura'}
            </button>
          </div>
        )}

        {kmHistory.length < 2 ? (
          <div className="h-28 flex items-center justify-center text-xs text-slate-400 text-center px-6">
            Registre leituras de KM (ou manutenções informando o KM) pra ver a evolução.
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

      <Card className="p-4 space-y-3">
        <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-tight">Consumo e Custo por KM</h3>

        <div>
          <p className="text-[10px] text-slate-400 font-bold uppercase">Consumo médio</p>
          {consumption.avgKmPerLiter ? (
            <p className="text-sm font-black text-slate-800 dark:text-white">{consumption.avgKmPerLiter.toFixed(1)} km/L <span className="text-[10px] text-slate-400 font-bold">(estimado, {consumption.intervalsUsed} {consumption.intervalsUsed === 1 ? 'intervalo' : 'intervalos'})</span></p>
          ) : (
            <p className="text-xs text-slate-400 font-bold">{consumption.reason}</p>
          )}
        </div>

        <div>
          <p className="text-[10px] text-slate-400 font-bold uppercase">Custo por KM (este mês)</p>
          {periodComparison.current.costPerKm ? (
            <div className="flex items-baseline gap-2">
              <p className="text-sm font-black text-slate-800 dark:text-white">{formatCurrency(periodComparison.current.costPerKm)}/km <span className="text-[10px] text-slate-400 font-bold">(estimado)</span></p>
              {periodComparison.previous.costPerKm && (
                <span className={`text-[10px] font-black ${periodComparison.current.costPerKm > periodComparison.previous.costPerKm ? 'text-red-500' : 'text-green-600'}`}>
                  {periodComparison.current.costPerKm > periodComparison.previous.costPerKm ? '▲' : '▼'} vs {formatCurrency(periodComparison.previous.costPerKm)}/km mês anterior
                </span>
              )}
            </div>
          ) : (
            <p className="text-xs text-slate-400 font-bold">{periodComparison.current.reason}</p>
          )}
          {!periodComparison.previous.costPerKm && periodComparison.current.costPerKm && (
            <p className="text-[10px] text-slate-400 font-bold mt-0.5">Sem dados suficientes do mês anterior pra comparar.</p>
          )}
        </div>
      </Card>

      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">
            <FileText className="w-3.5 h-3.5" /> Documentos do Veículo
          </h2>
          <button
            onClick={() => setShowDocForm(s => !s)}
            className="text-[10px] font-black text-brand uppercase tracking-widest"
          >
            {showDocForm ? 'Cancelar' : '+ Novo'}
          </button>
        </div>

        {showDocForm && (
          <Card className="p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value as VehicleDocumentType)}
                className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl outline-none font-bold dark:text-white"
              >
                {(Object.keys(DOCUMENT_LABELS) as VehicleDocumentType[]).map(t => (
                  <option key={t} value={t}>{DOCUMENT_LABELS[t]}</option>
                ))}
              </select>
              <input
                type="date"
                value={docExpiry}
                onChange={(e) => setDocExpiry(e.target.value)}
                className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl outline-none font-bold dark:text-white"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Avisar com quantos dias de antecedência</label>
              <input
                type="number"
                value={docAlertDays}
                onChange={(e) => setDocAlertDays(e.target.value)}
                placeholder="30"
                className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl outline-none font-bold dark:text-white mt-1"
              />
            </div>
            <button
              onClick={handleSaveDocument}
              disabled={savingDoc}
              className="w-full py-3 bg-brand text-white rounded-xl font-black text-xs uppercase tracking-widest disabled:opacity-50"
            >
              {savingDoc ? 'Salvando...' : 'Salvar Documento'}
            </button>
          </Card>
        )}

        {documentsForVehicle.length === 0 && !showDocForm && (
          <Card className="p-4 text-center text-xs text-slate-400 font-bold">Nenhum documento registrado ainda.</Card>
        )}
        {documentsForVehicle.map(doc => {
          const level = getExpiryLevel(doc.expiry_date, doc.alert_days_before);
          const levelColor = level === 'OVERDUE'
            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
            : level === 'SOON'
              ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
              : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
          const levelLabel = level === 'OVERDUE' ? 'Vencido' : level === 'SOON' ? 'Em breve' : 'Em dia';
          return (
            <Card key={doc.id} className="p-4 flex items-center justify-between group">
              <div>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{DOCUMENT_LABELS[doc.type]}</p>
                <p className="text-xs text-slate-400">Vence em {formatDate(doc.expiry_date)}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-[9px] font-black px-2 py-1 rounded-full uppercase tracking-widest ${levelColor}`}>{levelLabel}</span>
                <button
                  onClick={async () => { if (await confirmDialog({ message: 'Excluir documento?', danger: true })) onDeleteDocument(doc.id); }}
                  className="p-1.5 text-slate-300 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </Card>
          );
        })}
      </div>

      {openIssues.length > 0 && (
        <div className="space-y-3">
          <h2 className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] px-1">
            <ClipboardList className="w-3.5 h-3.5" /> Pendências de Inspeção ({openIssues.length})
          </h2>
          {openIssues.map(issue => (
            <Card key={issue.id} className="p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{issue.item}</span>
                <button
                  onClick={() => onUpdateIssue(issue.id, { severity: SEVERITY_CYCLE[issue.severity] })}
                  className={`text-[9px] font-black px-2 py-1 rounded-full uppercase tracking-widest shrink-0 ${SEVERITY_COLORS[issue.severity]}`}
                >
                  {SEVERITY_LABELS[issue.severity]}
                </button>
              </div>

              {resolvingIssueId === issue.id ? (
                <div className="space-y-2">
                  <select
                    value={resolveLogId}
                    onChange={(e) => setResolveLogId(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-lg outline-none text-xs font-bold dark:text-white"
                  >
                    <option value="">Sem manutenção vinculada</option>
                    {logsForVehicle.map(log => (
                      <option key={log.id} value={log.id}>{formatDate(log.date)} - {log.description}</option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setResolvingIssueId(null); setResolveLogId(''); }}
                      className="flex-1 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => handleResolveIssue(issue.id)}
                      className="flex-1 py-2 bg-brand text-white rounded-lg text-[10px] font-black uppercase tracking-widest"
                    >
                      Confirmar
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setResolvingIssueId(issue.id)}
                  className="flex items-center gap-1 text-[10px] font-black text-brand uppercase tracking-widest"
                >
                  <CheckCircle className="w-3.5 h-3.5" /> Marcar como resolvida
                </button>
              )}
            </Card>
          ))}
        </div>
      )}

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
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{formatDate(insp.date.slice(0, 10))}</p>
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
              <h2 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">Relatório do Veículo</h2>
              <button onClick={() => setShowPdfPreview(false)} className="text-slate-400 p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div ref={printRef} className="space-y-4 text-slate-800">
              <div>
                <h1 style={{ fontSize: 18, fontWeight: 900, margin: 0 }}>Relatório do Veículo</h1>
                <p style={{ color: '#64748b', fontSize: 12, margin: '4px 0 0' }}>
                  {vehicle.model} - {vehicle.plate}{driverDisplayName ? ` - Motorista: ${driverDisplayName}` : ''}
                </p>
              </div>
              <div className="stats" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {[
                  ['KM Atual', vehicle.current_km.toLocaleString()],
                  ['Gasto Manutenção', formatCurrency(totalMaintenanceCost)],
                  ['Gasto Combustível', formatCurrency(totalFuelCost)],
                  ['Lucro', formatCurrency(totalProfit)],
                  ['Custo/KM (mês, estimado)', periodComparison.current.costPerKm ? `${formatCurrency(periodComparison.current.costPerKm)}/km` : 'N/D'],
                  ['Consumo médio (estimado)', consumption.avgKmPerLiter ? `${consumption.avgKmPerLiter.toFixed(1)} km/L` : 'N/D'],
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

              <div>
                <h2 style={{ fontSize: 12, fontWeight: 900, textTransform: 'uppercase', margin: '0 0 6px' }}>Documentos</h2>
                {documentsForVehicle.length === 0 ? (
                  <p style={{ fontSize: 12, color: '#94a3b8' }}>Nenhum documento registrado.</p>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <tbody>
                      {documentsForVehicle.map(doc => {
                        const level = getExpiryLevel(doc.expiry_date, doc.alert_days_before);
                        return (
                          <tr key={doc.id}>
                            <td style={{ padding: '6px 8px', borderBottom: '1px solid #f1f5f9' }}>{DOCUMENT_LABELS[doc.type]}</td>
                            <td style={{ padding: '6px 8px', borderBottom: '1px solid #f1f5f9' }}>Vence em {formatDate(doc.expiry_date)}</td>
                            <td className="text-right" style={{ padding: '6px 8px', borderBottom: '1px solid #f1f5f9', textAlign: 'right' }}>
                              {level === 'OVERDUE' ? 'Vencido' : level === 'SOON' ? 'Em breve' : 'Em dia'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              <div>
                <h2 style={{ fontSize: 12, fontWeight: 900, textTransform: 'uppercase', margin: '0 0 6px' }}>Checklists de Inspeção</h2>
                {inspectionsForVehicle.length === 0 ? (
                  <p style={{ fontSize: 12, color: '#94a3b8' }}>Nenhum checklist registrado.</p>
                ) : (
                  <>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                      <tbody>
                        {inspectionsForVehicle.slice(0, 10).map(insp => {
                          const total = Object.keys(insp.items).length;
                          const checked = Object.values(insp.items).filter(Boolean).length;
                          return (
                            <tr key={insp.id}>
                              <td style={{ padding: '6px 8px', borderBottom: '1px solid #f1f5f9' }}>{formatDate(insp.date.slice(0, 10))}</td>
                              <td className="text-right" style={{ padding: '6px 8px', borderBottom: '1px solid #f1f5f9', textAlign: 'right' }}>{checked}/{total} OK</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    {openIssues.length > 0 && (
                      <p style={{ fontSize: 11, color: '#d97706', marginTop: 6, fontWeight: 700 }}>{openIssues.length} pendência(s) aberta(s) — veja na tela do veículo.</p>
                    )}
                  </>
                )}
              </div>

              <div>
                <h2 style={{ fontSize: 12, fontWeight: 900, textTransform: 'uppercase', margin: '0 0 6px' }}>Abastecimento</h2>
                <p style={{ fontSize: 12 }}>Total gasto: {formatCurrency(totalFuelCost)}</p>
                <p style={{ fontSize: 12 }}>
                  Consumo médio: {consumption.avgKmPerLiter ? `${consumption.avgKmPerLiter.toFixed(1)} km/L (estimado)` : `Não disponível — ${consumption.reason}`}
                </p>
              </div>
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
