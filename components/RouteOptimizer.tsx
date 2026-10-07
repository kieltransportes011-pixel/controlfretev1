import React, { useEffect, useState } from 'react';
import { User } from '../types';
import { supabase } from '../supabase';
import { generateId } from '../utils';
import { Button } from './Button';
import { Card } from './Card';
import { AddressAutocomplete } from './AddressAutocomplete';
import { useToast } from '../contexts/ToastContext';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Route,
  Coins,
  Loader2,
  Share2,
  MapPinned,
  CheckCircle,
} from 'lucide-react';

interface RouteOptimizerProps {
  user: User;
  onBack: () => void;
}

interface Stop {
  id: string;
  address: string;
}

interface OptimizeResult {
  optimized_order: number[];
  total_distance_km: number;
  cf_cost: number;
  cf_balance_after: number;
}

const COST = 8;

export const RouteOptimizer: React.FC<RouteOptimizerProps> = ({ user, onBack }) => {
  const { error: showError } = useToast();
  const [stops, setStops] = useState<Stop[]>([
    { id: generateId(), address: '' },
    { id: generateId(), address: '' },
  ]);
  const [cfBalance, setCfBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OptimizeResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWallet = async () => {
      const { data } = await supabase.from('cf_wallet').select('balance').eq('user_id', user.id).maybeSingle();
      setCfBalance(data?.balance ?? 0);
    };
    fetchWallet();
  }, [user.id]);

  const addStop = () => {
    if (stops.length >= 6) return;
    setStops([...stops, { id: generateId(), address: '' }]);
  };

  const removeStop = (id: string) => {
    if (stops.length <= 2) return;
    setStops(stops.filter(s => s.id !== id));
  };

  const updateStop = (id: string, address: string) => {
    setStops(stops.map(s => s.id === id ? { ...s, address } : s));
  };

  const stopLabel = (index: number) => {
    if (index === 0) return 'Origem';
    if (index === stops.length - 1) return 'Destino Final';
    return `Parada ${index + 1}`;
  };

  const canOptimize = stops.every(s => s.address.trim().length > 0) && (cfBalance ?? 0) >= COST;

  const handleOptimize = async () => {
    if (!stops.every(s => s.address.trim().length > 0)) {
      showError('Preencha todos os endereços antes de otimizar.');
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('optimize-route', {
        body: { stops: stops.map(s => s.address) },
      });
      if (fnError || data?.error) {
        const msg = data?.error === 'insufficient_balance'
          ? `Saldo insuficiente. Você tem ${data.balance} CF, a otimização custa ${data.cost} CF.`
          : (data?.error || fnError?.message || 'Erro ao otimizar rota.');
        setError(msg);
        return;
      }
      setResult(data);
      setCfBalance(data.cf_balance_after);
    } catch (err: any) {
      setError(err.message || 'Erro ao otimizar rota.');
    } finally {
      setLoading(false);
    }
  };

  const orderedAddresses = result ? result.optimized_order.map(i => stops[i]?.address).filter(Boolean) : [];

  const handleShareWhatsapp = () => {
    if (!result) return;
    const text = `
📍 *Rota Otimizada*

${orderedAddresses.map((a, i) => `${i + 1}. ${a}`).join('\n')}

🛣️ Distância total: ${result.total_distance_km} km
    `.trim();
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleOpenGoogleMaps = () => {
    if (!result || orderedAddresses.length < 2) return;
    const origin = orderedAddresses[0];
    const destination = orderedAddresses[orderedAddresses.length - 1];
    const middleWaypoints = orderedAddresses.slice(1, -1);
    const url = `https://www.google.com/maps/dir/?api=1` +
      `&origin=${encodeURIComponent(origin)}` +
      `&destination=${encodeURIComponent(destination)}` +
      (middleWaypoints.length ? `&waypoints=${encodeURIComponent(middleWaypoints.join('|'))}` : '') +
      `&travelmode=driving`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6 pb-24">
      <header className="flex items-center gap-4">
        <Button variant="ghost" onClick={onBack} className="p-2">
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-base-text dark:text-white">Otimizador de Rota</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Economize KM reordenando suas paradas.</p>
        </div>
      </header>

      <Card className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <Coins className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Seu saldo</p>
            <p className="text-lg font-bold text-slate-800 dark:text-white">
              {cfBalance === null ? '...' : cfBalance} <span className="text-xs font-normal text-slate-400">CF</span>
            </p>
          </div>
        </div>
        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Custo: {COST} CF por otimização</span>
      </Card>

      <div className="space-y-3">
        {stops.map((stop, index) => (
          <div key={stop.id} className="flex items-end gap-2">
            <div className="flex-1">
              <AddressAutocomplete
                label={stopLabel(index)}
                value={stop.address}
                onChange={(v) => updateStop(stop.id, v)}
                placeholder="Endereço completo"
              />
            </div>
            {stops.length > 2 && (
              <button
                onClick={() => removeStop(stop.id)}
                className="p-3 mb-[1px] text-slate-400 hover:text-red-500 transition-colors shrink-0"
                title="Remover parada"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}

        {stops.length < 6 && (
          <button
            onClick={addStop}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 font-roboto font-bold text-xs uppercase tracking-widest hover:border-brand-secondary hover:text-brand-secondary transition-colors"
          >
            <Plus className="w-4 h-4" /> Adicionar Parada
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 rounded-xl p-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      <Button
        fullWidth
        onClick={handleOptimize}
        disabled={loading || !canOptimize}
        className="!py-4"
      >
        {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Route className="w-5 h-5 mr-2" />}
        Otimizar Rota ({COST} CF)
      </Button>
      {(cfBalance ?? 0) < COST && (
        <p className="text-xs text-center text-slate-400 -mt-4">
          Saldo insuficiente. Ganhe CF Coins indicando amigos ou completando seu perfil em Ajustes.
        </p>
      )}

      {result && (
        <Card className="space-y-4 bg-gradient-to-br from-brand/5 to-transparent border-brand/20">
          <div className="flex items-center gap-2 text-brand dark:text-brand-300 font-bold text-sm">
            <CheckCircle className="w-5 h-5" />
            Rota otimizada!
          </div>
          <div className="space-y-2">
            {orderedAddresses.map((a, i) => (
              <div key={i} className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-200">
                <span className="w-6 h-6 rounded-full bg-brand/10 dark:bg-blue-500/20 text-brand dark:text-blue-300 flex items-center justify-center text-xs font-bold shrink-0">
                  {i + 1}
                </span>
                {a}
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-700">
            <span className="text-sm text-slate-500 dark:text-slate-400">Distância total</span>
            <span className="text-lg font-bold text-slate-800 dark:text-white">{result.total_distance_km} km</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={handleShareWhatsapp} className="!py-2.5 flex items-center justify-center gap-2">
              <Share2 className="w-4 h-4" /> WhatsApp
            </Button>
            <Button variant="outline" onClick={handleOpenGoogleMaps} className="!py-2.5 flex items-center justify-center gap-2">
              <MapPinned className="w-4 h-4" /> Google Maps
            </Button>
          </div>
          <p className="text-[10px] text-slate-400 text-center">
            A ordem pode variar levemente dependendo do app de navegação usado no celular.
          </p>
        </Card>
      )}
    </div>
  );
};
