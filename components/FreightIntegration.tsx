import React, { useState, useMemo } from 'react';
import { Freight, OFretejaFreight } from '../types';
import { formatCurrency, formatDate } from '../utils';
import { Truck, ChevronLeft, MapPin, XCircle, CheckCircle2, Navigation, Ban } from 'lucide-react';

interface FreightIntegrationProps {
    freights: Freight[];
    ofretejaFreights: OFretejaFreight[];
    onApprove: (freight: OFretejaFreight) => void;
    onReject: (freight: OFretejaFreight) => void;
    onCancel: (freight: OFretejaFreight) => void;
    onBack: () => void;
}

export const FreightIntegration: React.FC<FreightIntegrationProps> = ({ freights, ofretejaFreights, onApprove, onReject, onCancel, onBack }) => {
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const allItems = useMemo(() => {
        const standard = freights.map(f => ({ ...f, origin: 'ControlFrete' as const, sortDate: new Date(f.date) }));
        const ofreteja = ofretejaFreights.map(f => ({ ...f, origin: 'O FreteJá' as const, sortDate: new Date(f.date) }));

        return [...standard, ...ofreteja].sort((a, b) => b.sortDate.getTime() - a.sortDate.getTime());
    }, [freights, ofretejaFreights]);

    return (
        <div className="pb-24 space-y-4 px-4 sm:px-0 animate-fadeIn">
            <header className="flex items-center gap-3 pt-4 sm:pt-0">
                <button
                    onClick={onBack}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500"
                >
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white">Central de Fretes</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm">Gerenciamento O FreteJá</p>
                </div>
            </header>

            <div className="space-y-4">
                {allItems.length === 0 ? (
                    <div className="text-center py-20 text-slate-400">
                        <Truck className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p>Nenhum frete encontrado.</p>
                    </div>
                ) : (
                    allItems.map((item, idx) => {
                        const isOFreteja = item.origin === 'O FreteJá';
                        const freight = item as any;
                        const isExpanded = expandedId === freight.id;

                        const getStatusStyle = (status: string) => {
                            switch (status) {
                                case 'AGUARDANDO_ANALISE':
                                case 'AGUARDANDO_APROVACAO':
                                    return 'bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400';
                                case 'APROVADO':
                                case 'IMPORTED':
                                    return 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400';
                                case 'REPROVADO':
                                    return 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400';
                                case 'CANCELLED':
                                    return 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400';
                                default:
                                    return 'bg-slate-100 text-slate-500';
                            }
                        };

                        return (
                            <div key={idx} className={`bg-white dark:bg-slate-800 rounded-xl shadow-sm border ${isOFreteja ? 'border-blue-200 dark:border-blue-900/50 ring-1 ring-blue-500/5' : 'border-slate-100 dark:border-slate-700'} relative overflow-hidden transition-all hover:shadow-md animate-slideUp`}>
                                <div className={`absolute left-0 top-0 bottom-0 w-1 ${isOFreteja ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'}`}></div>

                                <div className="p-4 pl-5">
                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className={`text-[8px] sm:text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${isOFreteja ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500 dark:bg-slate-700'}`}>
                                                    {item.origin}
                                                </span>
                                                <span className="text-[10px] text-slate-400 font-medium">{formatDate(freight.date)}</span>
                                            </div>
                                            <h3 className="font-bold text-slate-800 dark:text-white text-base leading-tight truncate">
                                                {isOFreteja ? (freight.empresas_ofreteja?.name || 'Carregando...') : (freight.client || 'Cliente Padrão')}
                                            </h3>

                                            <div className="flex items-center gap-1.5 mt-1.5">
                                                <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                                <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 truncate">
                                                    {isOFreteja ? `${freight.origin_address} → ${freight.delivery_address}` : 'Trajeto Padrão'}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex flex-row sm:flex-col justify-between items-center sm:items-end gap-1 shrink-0">
                                            <p className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                                                {isOFreteja ? (freight.estimated_value ? formatCurrency(freight.estimated_value) : 'Sob Consulta') : formatCurrency(freight.totalValue)}
                                            </p>
                                            {isOFreteja && (
                                                <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded ${getStatusStyle(freight.status)}`}>
                                                    {freight.status?.replace('_', ' ') || 'Pendente'}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {isOFreteja && (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setExpandedId(isExpanded ? null : freight.id)}
                                                className="text-[10px] font-bold text-blue-600 uppercase flex items-center gap-1.5 mt-1 bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-lg flex-1 sm:flex-none justify-center"
                                            >
                                                {isExpanded ? 'Ocultar Detalhes' : 'Ver Detalhes do Trajeto'}
                                                <ChevronLeft className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-90' : '-rotate-90'}`} />
                                            </button>
                                        </div>
                                    )}

                                    {isOFreteja && isExpanded && (
                                        <div className="mt-4 pt-4 border-t border-slate-50 dark:border-slate-700/50 space-y-4 animate-fadeIn">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div className="space-y-1">
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Origem</p>
                                                    <p className="text-xs text-slate-700 dark:text-slate-200">
                                                        {freight.origin_address}, {freight.origin_number} {freight.origin_complement && `(${freight.origin_complement})`}<br />
                                                        <span className="text-slate-400">{freight.origin_cep}</span>
                                                    </p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Entrega Final</p>
                                                    <p className="text-xs text-slate-700 dark:text-slate-200">
                                                        {freight.delivery_address}, {freight.delivery_number} {freight.delivery_complement && `(${freight.delivery_complement})`}<br />
                                                        <span className="text-slate-400">{freight.delivery_cep}</span>
                                                    </p>
                                                </div>
                                            </div>

                                            {freight.stops?.length > 0 && (
                                                <div className="bg-slate-50 dark:bg-slate-900/40 rounded-xl p-3">
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">Paradas Intermediárias ({freight.stops.length})</p>
                                                    <div className="space-y-2">
                                                        {freight.stops.map((stop: any, sIdx: number) => (
                                                            <div key={sIdx} className="flex items-start gap-2.5 text-[11px] sm:text-xs">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0"></div>
                                                                <p className="text-slate-600 dark:text-slate-400">
                                                                    {stop.address} <span className="opacity-50">({stop.cep})</span>
                                                                </p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {freight.rejection_reason && (
                                                <div className="bg-red-50 dark:bg-red-900/10 rounded-xl p-3 border border-red-100 dark:border-red-900/20">
                                                    <p className="text-[9px] font-bold text-red-500 uppercase mb-1">Motivo da Reprovação</p>
                                                    <p className="text-xs text-red-700 dark:text-red-300 italic">"{freight.rejection_reason}"</p>
                                                </div>
                                            )}

                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
                                                <div className="flex flex-wrap items-center gap-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                                                            <Truck className="w-4 h-4 text-blue-600" />
                                                        </div>
                                                        <div>
                                                            <p className="text-[9px] font-bold text-slate-400 uppercase">Veículo</p>
                                                            <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                                                                {freight.categorias_veiculos?.name || 'Consultar'}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {freight.distance_km && (
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-400">
                                                                <Navigation className="w-4 h-4" />
                                                            </div>
                                                            <div>
                                                                <p className="text-[9px] font-bold text-slate-400 uppercase">Distância</p>
                                                                <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                                                                    {freight.distance_km} km
                                                                </p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {(freight.status === 'AGUARDANDO_ANALISE' || freight.status === 'AGUARDANDO_APROVACAO') && (
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); onReject(freight); }}
                                                            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-red-100 dark:border-red-900/30 text-red-500 text-xs font-bold flex items-center justify-center gap-2 hover:bg-red-50 transition-colors"
                                                        >
                                                            <Ban className="w-4 h-4" /> Reprovar
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); onApprove(freight); }}
                                                            className="flex-1 sm:flex-none bg-blue-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-shadow active:scale-95 transition-transform"
                                                        >
                                                            <CheckCircle2 className="w-4 h-4" /> Aprovar
                                                        </button>
                                                    </div>
                                                )}

                                                {freight.status === 'AGUARDANDO_ANALISE' && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); onCancel(freight); }}
                                                        className="px-4 py-2 text-slate-400 text-[10px] font-bold uppercase hover:text-slate-600"
                                                    >
                                                        Cancelar Solicitação
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};
