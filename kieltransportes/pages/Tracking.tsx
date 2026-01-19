import React, { useState } from 'react';
import { Search, Package, MapPin, CheckCircle, Clock } from 'lucide-react';
import { TrackingStatus } from '../types';

export const Tracking = () => {
  const [code, setCode] = useState('');
  const [result, setResult] = useState<TrackingStatus | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) return;
    
    setLoading(true);
    // Mock simulation
    setTimeout(() => {
      setResult({
        code: code.toUpperCase(),
        status: 'Em Trânsito',
        location: 'Centro de Distribuição - São Paulo, SP',
        timestamp: new Date().toLocaleString('pt-BR'),
        details: 'Carga saiu para entrega ao destinatário.'
      });
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-[80vh] bg-gray-50 py-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-black text-gray-900 uppercase italic">Rastreamento de Cargas</h1>
          <p className="text-gray-600 mt-2">Digite o código de rastreamento (CT-e) para localizar sua encomenda.</p>
        </div>

        <div className="bg-white p-8 rounded-lg shadow-lg border-t-4 border-kiel-orange">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Ex: KIEL123456BR"
              className="flex-grow p-4 border-2 border-gray-200 rounded-md focus:border-kiel-orange focus:ring-0 outline-none uppercase font-mono tracking-wider transition-colors"
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-kiel-dark hover:bg-gray-800 text-white font-bold uppercase px-8 py-4 rounded-md transition-colors flex items-center justify-center"
            >
              {loading ? 'Buscando...' : <><Search size={20} className="mr-2" /> Buscar</>}
            </button>
          </form>
        </div>

        {result && (
          <div className="mt-8 bg-white rounded-lg shadow-md overflow-hidden animate-fade-in-up">
            <div className="bg-gray-100 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <span className="font-bold text-gray-700">Rastreio: {result.code}</span>
              <span className="bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full font-bold uppercase">{result.status}</span>
            </div>
            <div className="p-6">
              <div className="relative border-l-2 border-gray-200 ml-4 pl-8 pb-8 space-y-8">
                {/* Timeline Items (Mock) */}
                <div className="relative">
                  <div className="absolute -left-[41px] bg-kiel-orange text-white p-1 rounded-full">
                    <Package size={20} />
                  </div>
                  <p className="font-bold text-gray-900">Saiu para Entrega</p>
                  <p className="text-sm text-gray-500">{result.timestamp}</p>
                  <p className="text-gray-600 mt-1">{result.details}</p>
                </div>
                
                <div className="relative opacity-50">
                  <div className="absolute -left-[41px] bg-gray-300 text-white p-1 rounded-full">
                    <MapPin size={20} />
                  </div>
                  <p className="font-bold text-gray-900">Em Transferência</p>
                  <p className="text-sm text-gray-500">Ontem, 14:30</p>
                  <p className="text-gray-600 mt-1">Transferência entre filiais.</p>
                </div>

                <div className="relative opacity-50">
                  <div className="absolute -left-[41px] bg-gray-300 text-white p-1 rounded-full">
                    <CheckCircle size={20} />
                  </div>
                  <p className="font-bold text-gray-900">Objeto Coletado</p>
                  <p className="text-sm text-gray-500">Ontem, 09:00</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {!result && !loading && (
          <div className="mt-12 text-center opacity-50">
             <Clock size={48} className="mx-auto text-gray-400 mb-4" />
             <p className="text-gray-500">Aguardando código para busca.</p>
          </div>
        )}
      </div>
    </div>
  );
};