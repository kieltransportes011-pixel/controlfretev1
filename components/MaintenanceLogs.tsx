import React, { useState } from 'react';
import { MaintenanceLog, Vehicle, MaintenanceCategory } from '../types';
import { Card } from './Card';
import { Button } from './Button';
import { formatCurrency, formatDate } from '../utils';
import { Wrench, Plus, X, Calendar, Hash, Tag, ChevronDown, Filter, Trash2, AlertCircle, Truck } from 'lucide-react';

interface MaintenanceProps {
    logs: MaintenanceLog[];
    vehicles: Vehicle[];
    onAddLog: (log: Omit<MaintenanceLog, 'id' | 'user_id' | 'created_at'>) => Promise<void>;
    onDeleteLog: (id: string) => Promise<void>;
    onBack: () => void;
}

const CATEGORY_LABELS: Record<MaintenanceCategory, string> = {
    OIL: 'Troca de Óleo',
    TIRES: 'Pneus',
    BRAKES: 'Freios',
    ENGINE: 'Motor',
    REVISION: 'Revisão Geral',
    OTHER: 'Outros'
};

const CATEGORY_COLORS: Record<MaintenanceCategory, string> = {
    OIL: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    TIRES: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    BRAKES: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    ENGINE: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    REVISION: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    OTHER: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
};

export const MaintenanceLogs: React.FC<MaintenanceProps> = ({ logs, vehicles, onAddLog, onDeleteLog, onBack }) => {
    const [showForm, setShowForm] = useState(false);
    const [filterVehicle, setFilterVehicle] = useState('ALL');

    // Form State
    const [vehicleId, setVehicleId] = useState(vehicles[0]?.id || '');
    const [date, setDate] = useState(new Date().toISOString().substring(0, 10));
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState<MaintenanceCategory>('OIL');
    const [km, setKm] = useState('');
    const [nextKm, setNextKm] = useState('');
    const [nextDate, setNextDate] = useState('');
    const [cost, setCost] = useState('');

    const filteredLogs = logs.filter(l => filterVehicle === 'ALL' || l.vehicle_id === filterVehicle);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!vehicleId || !description || !cost) {
            alert('Preencha os campos obrigatórios (Veículo, Descrição, Valor)');
            return;
        }

        try {
            await onAddLog({
                vehicle_id: vehicleId,
                date,
                description,
                category,
                km_at_service: km ? parseFloat(km) : undefined,
                next_revision_km: nextKm ? parseFloat(nextKm) : undefined,
                next_revision_date: nextDate || undefined,
                cost: parseFloat(cost)
            });
            setShowForm(false);
            setDescription('');
            setCost('');
            setKm('');
            setNextKm('');
            setNextDate('');
        } catch (error) {
            console.error(error);
            alert('Erro ao salvar manutenção');
        }
    };

    return (
        <div className="pb-24 space-y-6 animate-fadeIn">
            <header className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 -m-4 mb-2 sticky top-0 z-10 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="p-2 -ml-2 text-slate-400 hover:text-brand transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                    <div>
                        <h1 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Manutenção</h1>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Controle de Serviços</p>
                    </div>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="bg-orange-500 text-white p-2.5 rounded-xl shadow-lg shadow-orange-500/20 hover:scale-105 transition-transform"
                >
                    <Plus className="w-5 h-5" />
                </button>
            </header>

            {/* Stats Quick View */}
            <div className="grid grid-cols-2 gap-3">
                <Card className="bg-orange-50 dark:bg-orange-900/10 border-orange-100 dark:border-orange-900/30 p-4">
                    <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 mb-1">
                        <Wrench className="w-3 h-3" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Total Gasto</span>
                    </div>
                    <p className="text-lg font-black text-slate-800 dark:text-white">
                        {formatCurrency(logs.reduce((acc, l) => acc + l.cost, 0))}
                    </p>
                </Card>
                <Card className="bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30 p-4">
                    <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-1">
                        <AlertCircle className="w-3 h-3" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Serviços</span>
                    </div>
                    <p className="text-lg font-black text-slate-800 dark:text-white">{logs.length}</p>
                </Card>
            </div>

            {/* Filter */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                <button
                    onClick={() => setFilterVehicle('ALL')}
                    className={`whitespace-nowrap px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${filterVehicle === 'ALL' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-100 dark:border-slate-700'}`}
                >
                    Todos
                </button>
                {vehicles.map(v => (
                    <button
                        key={v.id}
                        onClick={() => setFilterVehicle(v.id)}
                        className={`whitespace-nowrap px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${filterVehicle === v.id ? 'bg-orange-500 text-white border-orange-500' : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-100 dark:border-slate-700'}`}
                    >
                        {v.plate}
                    </button>
                ))}
            </div>

            {/* Log List */}
            <div className="space-y-3">
                {filteredLogs.map((log) => {
                    const v = vehicles.find(veh => veh.id === log.vehicle_id);
                    return (
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

                            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-2 leading-tight">
                                {log.description}
                            </h3>

                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                                    <Truck className="w-3.5 h-3.5" />
                                    {v ? `${v.model} (${v.plate})` : 'Veículo não encontrado'}
                                </div>
                                {log.km_at_service && (
                                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                                        <Hash className="w-3.5 h-3.5" />
                                        {log.km_at_service.toLocaleString()} KM
                                    </div>
                                )}
                            </div>

                            {(log.next_revision_km || log.next_revision_date) && (
                                <div className="mt-3 pt-3 border-t border-slate-50 dark:border-slate-800 flex items-center gap-3">
                                    <div className="text-[9px] font-black text-orange-500 uppercase tracking-widest flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" /> Próxima Revisão:
                                    </div>
                                    {log.next_revision_km && (
                                        <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase">{log.next_revision_km.toLocaleString()} KM</span>
                                    )}
                                    {log.next_revision_date && (
                                        <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase">{formatDate(log.next_revision_date)}</span>
                                    )}
                                </div>
                            )}

                            <button
                                onClick={() => { if (confirm('Excluir log de manutenção?')) onDeleteLog(log.id); }}
                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-2 text-slate-300 hover:text-accent-error transition-all"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </Card>
                    );
                })}

                {filteredLogs.length === 0 && (
                    <div className="text-center py-20 opacity-30">
                        <Wrench className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                        <h3 className="text-sm font-black uppercase tracking-widest">Nenhuma manutenção registrada</h3>
                        <p className="text-xs mt-1">Clique no botão + para registrar um serviço</p>
                    </div>
                )}
            </div>

            {showForm && (
                <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm">
                    <Card className="w-full sm:max-w-xl space-y-4 animate-slideUp sm:rounded-3xl rounded-t-3xl rounded-b-none h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center sticky top-0 bg-white dark:bg-slate-800 py-2 z-10">
                            <h2 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">Registrar Manutenção</h2>
                            <button onClick={() => setShowForm(false)} className="text-slate-400 p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5 pb-6">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Veículo *</label>
                                <select
                                    value={vehicleId}
                                    onChange={(e) => setVehicleId(e.target.value)}
                                    className="w-full p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl outline-none focus:border-orange-500 font-bold"
                                >
                                    <option value="">Selecione um caminhão</option>
                                    {vehicles.map(v => (
                                        <option key={v.id} value={v.id}>{v.model} - {v.plate}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Data *</label>
                                    <input
                                        type="date"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        className="w-full p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl outline-none focus:border-orange-500 font-bold"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Categoria *</label>
                                    <select
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value as any)}
                                        className="w-full p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl outline-none focus:border-orange-500 font-bold"
                                    >
                                        {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                                            <option key={key} value={key}>{label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Descrição do Serviço *</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Ex: Troca de óleo do motor e filtros (15W40)"
                                    rows={2}
                                    className="w-full p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl outline-none focus:border-orange-500 font-bold resize-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Valor do Serviço (R$) *</label>
                                    <input
                                        type="number"
                                        value={cost}
                                        onChange={(e) => setCost(e.target.value)}
                                        placeholder="0,00"
                                        className="w-full p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl outline-none focus:border-orange-500 font-bold"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">KM do Momento</label>
                                    <input
                                        type="number"
                                        value={km}
                                        onChange={(e) => setKm(e.target.value)}
                                        placeholder="0"
                                        className="w-full p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl outline-none focus:border-orange-500 font-bold"
                                    />
                                </div>
                            </div>

                            <div className="bg-orange-50 dark:bg-orange-900/10 p-4 rounded-2xl border border-orange-100 dark:border-orange-900/30 space-y-4">
                                <h3 className="text-[10px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-widest flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4" /> Alerta de Próxima Revisão
                                </h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Próxima Revisão (KM)</label>
                                        <input
                                            type="number"
                                            value={nextKm}
                                            onChange={(e) => setNextKm(e.target.value)}
                                            placeholder="Ex: 120.000"
                                            className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-orange-500 font-bold"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Próxima Revisão (Data)</label>
                                        <input
                                            type="date"
                                            value={nextDate}
                                            onChange={(e) => setNextDate(e.target.value)}
                                            className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-orange-500 font-bold"
                                        />
                                    </div>
                                </div>
                            </div>

                            <Button fullWidth type="submit" className="h-14 bg-orange-500 hover:bg-orange-600 shadow-orange-500/20">
                                SALVAR REGISTRO
                            </Button>
                        </form>
                    </Card>
                </div>
            )}
        </div>
    );
};
