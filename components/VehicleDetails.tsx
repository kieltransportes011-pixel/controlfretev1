import React, { useMemo } from 'react';
import { Vehicle, MaintenanceLog, Freight, Expense } from '../types';
import { Card } from './Card';
import { formatCurrency, formatDate } from '../utils';
import { X, Hash, Calendar, Wrench, DollarSign, AlertCircle, Trash2, Fuel } from 'lucide-react';
import { useConfirm } from '../contexts/ConfirmContext';
import { getVehiclesNeedingAttention } from '../utils/vehicleAlerts';
import { CATEGORY_LABELS, CATEGORY_COLORS } from './MaintenanceLogs';

interface VehicleDetailsProps {
  vehicle: Vehicle;
  maintenanceLogs: MaintenanceLog[];
  freights: Freight[];
  expenses: Expense[];
  onBack: () => void;
  onEditVehicle: () => void;
  onDeleteLog: (id: string) => Promise<void>;
}

export const VehicleDetails: React.FC<VehicleDetailsProps> = ({ vehicle, maintenanceLogs, freights, expenses, onBack, onEditVehicle, onDeleteLog }) => {
  const confirmDialog = useConfirm();

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

  return (
    <div className="pb-24 space-y-6 animate-fadeIn">
      <header className="flex justify-between items-center pb-1">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 -ml-2 text-slate-400 hover:text-brand transition-colors">
            <X className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">{vehicle.model}</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{vehicle.plate}</p>
          </div>
        </div>
        <button
          onClick={onEditVehicle}
          className="bg-brand text-white p-2.5 rounded-xl shadow-lg shadow-brand/20 hover:scale-105 transition-transform"
        >
          <Wrench className="w-5 h-5" />
        </button>
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
    </div>
  );
};
