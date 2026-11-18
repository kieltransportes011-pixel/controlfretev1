import React, { useMemo, useState } from 'react';
import { Vehicle, VehicleStatus, MaintenanceLog, Expense } from '../types';
import { Card } from './Card';
import { Button } from './Button';
import { Truck, Plus, ChevronRight, Search, Hash, Calendar, Fuel, Trash2, Edit3, X, Loader2, User, TrendingUp } from 'lucide-react';
import { formatCurrency } from '../utils';
import { useToast } from '../contexts/ToastContext';
import { useConfirm } from '../contexts/ConfirmContext';

interface FleetProps {
    vehicles: Vehicle[];
    maintenanceLogs: MaintenanceLog[];
    expenses: Expense[];
    onAddVehicle: (v: Omit<Vehicle, 'id' | 'user_id' | 'created_at'>) => Promise<void>;
    onEditVehicle: (v: Vehicle) => Promise<void>;
    onDeleteVehicle: (id: string) => Promise<void>;
    onViewDetails: (v: Vehicle) => void;
    onBack: () => void;
}

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

export const Fleet: React.FC<FleetProps> = ({ vehicles, maintenanceLogs, expenses, onAddVehicle, onEditVehicle, onDeleteVehicle, onViewDetails, onBack }) => {
    const { error: toastError } = useToast();
    const confirmDialog = useConfirm();
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showInactive, setShowInactive] = useState(false);

    // Form State
    const [plate, setPlate] = useState('');
    const [brand, setBrand] = useState('');
    const [model, setModel] = useState('');
    const [year, setYear] = useState('');
    const [km, setKm] = useState('');
    const [status, setStatus] = useState<VehicleStatus>('ativo');
    const [driverName, setDriverName] = useState('');

    const inactiveCount = vehicles.filter(v => v.status === 'vendido' || v.status === 'inativo').length;

    const filteredVehicles = vehicles.filter(v => {
        if (!showInactive && (v.status === 'vendido' || v.status === 'inativo')) return false;
        return v.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
            v.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
            v.brand?.toLowerCase().includes(searchTerm.toLowerCase());
    });

    const costRanking = useMemo(() => {
        const ranked = vehicles
            .filter(v => v.current_km > 0)
            .map(v => {
                const maintCost = maintenanceLogs.filter(l => l.vehicle_id === v.id).reduce((a, l) => a + l.cost, 0);
                const fuelCost = expenses.filter(e => e.vehicle_id === v.id && e.category === 'FUEL').reduce((a, e) => a + e.value, 0);
                return { vehicle: v, costPerKm: (maintCost + fuelCost) / v.current_km };
            })
            .sort((a, b) => b.costPerKm - a.costPerKm);
        return ranked;
    }, [vehicles, maintenanceLogs, expenses]);

    const resetForm = () => {
        setPlate('');
        setBrand('');
        setModel('');
        setYear('');
        setKm('');
        setStatus('ativo');
        setDriverName('');
        setEditingVehicle(null);
        setShowAddForm(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!plate || !model) {
            toastError('Placa e Modelo são obrigatórios.');
            return;
        }
        if (isSubmitting) return;

        const vehicleData = {
            plate: plate.toUpperCase(),
            brand,
            model,
            year: year ? parseInt(year) : undefined,
            current_km: km ? parseFloat(km) : 0,
            status,
            driver_name: driverName || undefined,
        };

        setIsSubmitting(true);
        try {
            if (editingVehicle) {
                await onEditVehicle({ ...editingVehicle, ...vehicleData });
            } else {
                await onAddVehicle(vehicleData);
            }
            resetForm();
        } catch (error) {
            console.error(error);
            toastError('Erro ao salvar veículo.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = (v: Vehicle) => {
        setEditingVehicle(v);
        setPlate(v.plate);
        setBrand(v.brand || '');
        setModel(v.model);
        setYear(v.year?.toString() || '');
        setKm(v.current_km.toString());
        setStatus(v.status || 'ativo');
        setDriverName(v.driver_name || '');
        setShowAddForm(true);
    };

    return (
        <div className="pb-24 space-y-6 animate-fadeIn">
            <header className="flex justify-between items-center pb-1">
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="p-2 -ml-2 text-slate-400 hover:text-brand transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                    <div>
                        <h1 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Frota de Veículos</h1>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{vehicles.length} Caminhões</p>
                    </div>
                </div>
                <button
                    onClick={() => setShowAddForm(true)}
                    className="bg-brand text-white p-2.5 rounded-xl shadow-lg shadow-brand/20 hover:scale-105 transition-transform"
                >
                    <Plus className="w-5 h-5" />
                </button>
            </header>

            {costRanking.length >= 2 && (
                <Card className="p-4 space-y-3">
                    <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-brand" />
                        <h2 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-tight">Custo por KM da Frota</h2>
                    </div>
                    <div className="space-y-2.5">
                        {costRanking.map(({ vehicle, costPerKm }) => (
                            <div key={vehicle.id}>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{vehicle.model} ({vehicle.plate})</span>
                                    <span className="text-xs font-black text-slate-700 dark:text-slate-200">{formatCurrency(costPerKm)}/km</span>
                                </div>
                                <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                    <div
                                        className="bg-brand h-full"
                                        style={{ width: `${costRanking[0].costPerKm > 0 ? Math.max(4, (costPerKm / costRanking[0].costPerKm) * 100) : 0}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            {/* Search */}
            <div className="flex items-center gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Buscar por placa ou modelo..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-11 pr-4 py-3.5 bg-white dark:bg-slate-800 border-none rounded-2xl shadow-sm outline-none focus:ring-2 focus:ring-brand/20 text-sm transition-all"
                    />
                </div>
                {inactiveCount > 0 && (
                    <button
                        onClick={() => setShowInactive(s => !s)}
                        className={`shrink-0 px-3 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-colors ${showInactive ? 'bg-brand text-white' : 'bg-white dark:bg-slate-800 text-slate-400'}`}
                    >
                        Inativos ({inactiveCount})
                    </button>
                )}
            </div>

            {showAddForm && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <Card className="w-full max-w-md space-y-4 animate-slideUp">
                        <div className="flex justify-between items-center">
                            <h2 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">
                                {editingVehicle ? 'Editar Veículo' : 'Novo Veículo'}
                            </h2>
                            <button onClick={resetForm} className="text-slate-400 p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Placa *</label>
                                    <input
                                        type="text"
                                        value={plate}
                                        onChange={(e) => setPlate(e.target.value)}
                                        placeholder="ABC-1234"
                                        className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl outline-none focus:border-brand-secondary font-bold uppercase"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">KM Atual</label>
                                    <input
                                        type="number"
                                        value={km}
                                        onChange={(e) => setKm(e.target.value)}
                                        placeholder="0"
                                        className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl outline-none focus:border-brand-secondary font-bold"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Modelo *</label>
                                <input
                                    type="text"
                                    value={model}
                                    onChange={(e) => setModel(e.target.value)}
                                    placeholder="Ex: FH 540"
                                    className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl outline-none focus:border-brand-secondary font-bold"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Marca</label>
                                    <input
                                        type="text"
                                        value={brand}
                                        onChange={(e) => setBrand(e.target.value)}
                                        placeholder="Ex: Volvo"
                                        className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl outline-none focus:border-brand-secondary font-bold"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Ano</label>
                                    <input
                                        type="number"
                                        value={year}
                                        onChange={(e) => setYear(e.target.value)}
                                        placeholder="2024"
                                        className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl outline-none focus:border-brand-secondary font-bold"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Status</label>
                                    <select
                                        value={status}
                                        onChange={(e) => setStatus(e.target.value as VehicleStatus)}
                                        className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl outline-none focus:border-brand-secondary font-bold"
                                    >
                                        {(Object.keys(STATUS_LABELS) as VehicleStatus[]).map(s => (
                                            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Motorista</label>
                                    <input
                                        type="text"
                                        value={driverName}
                                        onChange={(e) => setDriverName(e.target.value)}
                                        placeholder="Opcional"
                                        className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl outline-none focus:border-brand-secondary font-bold"
                                    />
                                </div>
                            </div>

                            <Button fullWidth type="submit" className="h-12" disabled={isSubmitting}>
                                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : (editingVehicle ? 'SALVAR ALTERAÇÕES' : 'CADASTRAR VEÍCULO')}
                            </Button>
                        </form>
                    </Card>
                </div>
            )}

            {/* Vehicle List */}
            <div className="space-y-3">
                {filteredVehicles.map((vehicle) => (
                    <Card
                        key={vehicle.id}
                        className="group hover:border-brand/40 transition-all cursor-pointer p-4 relative overflow-hidden"
                        onClick={() => onViewDetails(vehicle)}
                    >
                        <div className="flex items-center gap-4 relative z-10">
                            <div className="w-14 h-14 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-brand transition-colors group-hover:bg-brand group-hover:text-white">
                                <Truck className="w-7 h-7" />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h3 className="text-base font-black text-slate-800 dark:text-white uppercase tracking-tight">{vehicle.model}</h3>
                                    <span className="text-[9px] bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">{vehicle.plate}</span>
                                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest ${STATUS_COLORS[vehicle.status || 'ativo']}`}>
                                        {STATUS_LABELS[vehicle.status || 'ativo']}
                                    </span>
                                </div>
                                <div className="flex items-center gap-4 mt-1 flex-wrap">
                                    <div className="flex items-center gap-1 text-slate-400">
                                        <Hash className="w-3 h-3" />
                                        <span className="text-[10px] font-bold uppercase">{vehicle.current_km.toLocaleString()} KM</span>
                                    </div>
                                    {vehicle.year && (
                                        <div className="flex items-center gap-1 text-slate-400">
                                            <Calendar className="w-3 h-3" />
                                            <span className="text-[10px] font-bold uppercase">{vehicle.year}</span>
                                        </div>
                                    )}
                                    {vehicle.driver_name && (
                                        <div className="flex items-center gap-1 text-slate-400">
                                            <User className="w-3 h-3" />
                                            <span className="text-[10px] font-bold uppercase">{vehicle.driver_name}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex flex-col gap-2">
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleEdit(vehicle); }}
                                    className="p-2 text-slate-300 hover:text-brand hover:bg-brand/5 rounded-lg transition-all"
                                >
                                    <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={async (e) => { e.stopPropagation(); if (await confirmDialog({ message: 'Excluir veículo?', danger: true })) onDeleteVehicle(vehicle.id); }}
                                    className="p-2 text-slate-300 hover:text-accent-error hover:bg-red-50 rounded-lg transition-all"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        <div className="absolute right-0 top-0 bottom-0 w-1 bg-brand opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Card>
                ))}

                {filteredVehicles.length === 0 && (
                    <div className="text-center py-20 opacity-30">
                        <Truck className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                        <h3 className="text-sm font-black uppercase tracking-widest">Nenhum veículo encontrado</h3>
                        <p className="text-xs mt-1">Adicione seu primeiro caminhão clicando no botão +</p>
                    </div>
                )}
            </div>
        </div>
    );
};
