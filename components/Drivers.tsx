import React, { useState, useMemo } from 'react';
import { Driver } from '../types';
import { Card } from './Card';
import { Button } from './Button';
import { Users, Search, Plus, Phone, IdCard, Pencil, Trash2, X, ChevronLeft, Loader2 } from 'lucide-react';
import { maskPhone } from '../utils';

interface DriversProps {
    drivers: Driver[];
    onSaveDriver: (driver: Partial<Driver>) => Promise<void>;
    onDeleteDriver: (id: string) => Promise<void>;
    onBack: () => void;
}

export const Drivers: React.FC<DriversProps> = ({ drivers, onSaveDriver, onDeleteDriver, onBack }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form State
    const [formData, setFormData] = useState({ name: '', phone: '', cnh: '' });

    const filteredDrivers = useMemo(() => {
        return drivers.filter(d =>
            d.name.toLowerCase().includes(searchTerm.toLowerCase())
        ).sort((a, b) => a.name.localeCompare(b.name));
    }, [drivers, searchTerm]);

    const handleOpenModal = (driver?: Driver) => {
        if (driver) {
            setEditingDriver(driver);
            setFormData({ name: driver.name, phone: driver.phone || '', cnh: driver.cnh || '' });
        } else {
            setEditingDriver(null);
            setFormData({ name: '', phone: '', cnh: '' });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || isSubmitting) return;

        setIsSubmitting(true);
        try {
            await onSaveDriver({ id: editingDriver?.id, ...formData });
            setIsModalOpen(false);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="pb-24 space-y-6 animate-fadeIn">
            <header className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                    <button onClick={onBack} className="p-2 -ml-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Motoristas</h1>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">Cadastre uma vez, reaproveite nos veículos</p>
                    </div>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-brand text-white p-3 rounded-full shadow-lg shadow-brand/20 hover:scale-105 transition-transform active:scale-95"
                >
                    <Plus className="w-6 h-6" />
                </button>
            </header>

            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                    type="text"
                    placeholder="Buscar por nome..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand dark:text-white transition-all"
                />
            </div>

            {/* Drivers List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredDrivers.length === 0 ? (
                    <div className="col-span-full py-12 flex flex-col items-center justify-center text-slate-400">
                        <Users className="w-12 h-12 mb-3 opacity-20" />
                        <p>Nenhum motorista cadastrado.</p>
                    </div>
                ) : (
                    filteredDrivers.map(driver => (
                        <Card key={driver.id} className="group relative overflow-hidden">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-brand/10 text-brand rounded-full flex items-center justify-center font-bold text-lg">
                                        {driver.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800 dark:text-white group-hover:text-brand transition-colors">
                                            {driver.name}
                                        </h3>
                                        {driver.cnh && (
                                            <div className="flex items-center gap-1 text-xs text-slate-400">
                                                <IdCard className="w-3 h-3" />
                                                CNH {driver.cnh}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => handleOpenModal(driver)}
                                        className="p-2 text-slate-400 hover:text-brand hover:bg-brand/10 dark:hover:bg-brand-500/20 rounded-lg transition-all"
                                    >
                                        <Pencil className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => setIsDeleting(driver.id)}
                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {driver.phone && (
                                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                    <Phone className="w-4 h-4 text-slate-300" />
                                    {driver.phone}
                                </div>
                            )}
                        </Card>
                    ))
                )}
            </div>

            {/* Form Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                                {editingDriver ? 'Editar Motorista' : 'Novo Motorista'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Nome Completo</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full p-3 bg-[#F5F7FA] dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:border-brand dark:text-white text-sm"
                                    placeholder="Ex: João Silva"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Telefone</label>
                                <input
                                    type="text"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: maskPhone(e.target.value) })}
                                    className="w-full p-3 bg-[#F5F7FA] dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:border-brand dark:text-white text-sm"
                                    placeholder="(00) 00000-0000"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">CNH <span className="text-slate-400 font-normal">(Opcional)</span></label>
                                <input
                                    type="text"
                                    value={formData.cnh}
                                    onChange={(e) => setFormData({ ...formData, cnh: e.target.value })}
                                    className="w-full p-3 bg-[#F5F7FA] dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:border-brand dark:text-white text-sm"
                                    placeholder="00000000000"
                                />
                            </div>

                            <div className="pt-4">
                                <Button type="submit" fullWidth disabled={isSubmitting}>
                                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : (editingDriver ? 'Salvar Alterações' : 'Cadastrar Motorista')}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation */}
            {isDeleting && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-3xl p-6 shadow-2xl text-center">
                        <div className="bg-red-100 text-red-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Trash2 className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Excluir Motorista?</h3>
                        <p className="text-slate-600 dark:text-slate-400 text-sm mb-6">
                            Esta ação não pode ser desfeita. O motorista será removido da sua lista (os veículos que já usam esse nome não são afetados).
                        </p>
                        <div className="flex gap-3">
                            <Button variant="secondary" fullWidth onClick={() => setIsDeleting(null)}>Cancelar</Button>
                            <Button variant="danger" fullWidth onClick={async () => {
                                await onDeleteDriver(isDeleting);
                                setIsDeleting(null);
                            }}>Excluir</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
