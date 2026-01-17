import React, { useState } from 'react';
import { Vehicle } from '../types';
import { Card } from './Card';
import { Button } from './Button';
import { Truck, Plus, ChevronRight, Search, Hash, Calendar, Fuel, Trash2, Edit3, X } from 'lucide-react';

interface FleetProps {
    vehicles: Vehicle[];
    onAddVehicle: (v: Omit<Vehicle, 'id' | 'user_id' | 'created_at'>) => Promise<void>;
    onEditVehicle: (v: Vehicle) => Promise<void>;
    onDeleteVehicle: (id: string) => Promise<void>;
    onViewDetails: (v: Vehicle) => void;
    onBack: () => void;
}

export const Fleet: React.FC<FleetProps> = ({ vehicles, onAddVehicle, onEditVehicle, onDeleteVehicle, onViewDetails, onBack }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

    // Form State
    const [plate, setPlate] = useState('');
    const [brand, setBrand] = useState('');
    const [model, setModel] = useState('');
    const [year, setYear] = useState('');
    const [km, setKm] = useState('');

    const filteredVehicles = vehicles.filter(v =>
        v.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.brand?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const resetForm = () => {
        setPlate('');
        setBrand('');
        setModel('');
        setYear('');
        setKm('');
        setEditingVehicle(null);
        setShowAddForm(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!plate || !model) {
            alert('Placa e Modelo são obrigatórios.');
            return;
        }

        const vehicleData = {
            plate: plate.toUpperCase(),
            brand,
            model,
            year: year ? parseInt(year) : undefined,
            current_km: km ? parseFloat(km) : 0,
        };

        try {
            if (editingVehicle) {
                await onEditVehicle({ ...editingVehicle, ...vehicleData });
            } else {
                await onAddVehicle(vehicleData);
            }
            resetForm();
        } catch (error) {
            console.error(error);
            alert('Erro ao salvar veículo.');
        }
    };

    const handleEdit = (v: Vehicle) => {
        setEditingVehicle(v);
        setPlate(v.plate);
        setBrand(v.brand || '');
        setModel(v.model);
        setYear(v.year?.toString() || '');
        setKm(v.current_km.toString());
        setShowAddForm(true);
    };

    return (
        <div className="pb-24 space-y-6 animate-fadeIn">
            <header className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 -m-4 mb-2 sticky top-0 z-10 border-b border-slate-100 dark:border-slate-800">
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

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                    type="text"
                    placeholder="Buscar por placa ou modelo..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 bg-white dark:bg-slate-800 border-none rounded-2xl shadow-sm outline-none focus:ring-2 focus:ring-brand/20 text-sm transition-all"
                />
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

                            <Button fullWidth type="submit" className="h-12">
                                {editingVehicle ? 'SALVAR ALTERAÇÕES' : 'CADASTRAR VEÍCULO'}
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
                                <div className="flex items-center gap-2">
                                    <h3 className="text-base font-black text-slate-800 dark:text-white uppercase tracking-tight">{vehicle.model}</h3>
                                    <span className="text-[9px] bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">{vehicle.plate}</span>
                                </div>
                                <div className="flex items-center gap-4 mt-1">
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
                                    onClick={(e) => { e.stopPropagation(); if (confirm('Excluir veículo?')) onDeleteVehicle(vehicle.id); }}
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
