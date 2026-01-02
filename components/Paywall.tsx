import React, { useState } from 'react';
import { User } from '../types';
import { Button } from './Button';
import { Card } from './Card';
import { Shield, CheckCircle, Crown, Loader2, Star, Zap } from 'lucide-react';
import { supabase } from '../supabase';

interface PaywallProps {
  user: User;
  onPaymentSuccess: () => void;
  onCancel?: () => void;
}

export const Paywall: React.FC<PaywallProps> = ({ user, onCancel }) => {
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('stripe-checkout', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('URL de checkout não retornada');
      }
    } catch (err: any) {
      console.error('Erro no checkout:', err);
      const msg = err.message || 'Erro ao iniciar pagamento';
      alert(`Não foi possível iniciar o checkout: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/95 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <Card className="max-w-md w-full bg-white dark:bg-slate-900 border-2 border-brand relative overflow-hidden shadow-2xl">
        {/* Header Decorativo */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-brand to-brand-secondary opacity-10 -z-10" />
        <div className="absolute top-0 right-0 p-4">
          <Star className="w-24 h-24 text-brand/5 rotate-12" />
        </div>

        <div className="p-8 space-y-8 relative">
          {onCancel && (
            <button
              onClick={onCancel}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          )}

          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-brand/10 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce-short">
              <Crown className="w-8 h-8 text-brand" />
            </div>
            <h1 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">
              Seu período gratuito acabou
            </h1>
            <p className="text-sm text-slate-500 font-medium">
              Não perca os dados dos seus fretes. Continue crescendo com o plano profissional.
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 text-center space-y-4">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Plano Anual</span>
              <div className="flex items-center justify-center gap-1 text-slate-800 dark:text-white mt-1">
                <span className="text-sm font-bold mt-1">R$</span>
                <span className="text-4xl font-black tracking-tighter">49,99</span>
                <span className="text-sm font-bold self-end mb-1">/ano</span>
              </div>
              <p className="text-[10px] text-green-600 font-bold mt-2 bg-green-100 dark:bg-green-900/30 py-1 px-3 rounded-full inline-block">
                Menos de R$ 4,20 por mês
              </p>
            </div>

            <div className="space-y-3 pt-2 text-left px-4">
              {[
                'Lançamentos Ilimitados',
                'Agenda Inteligente',
                'Gestão de Metas',
                'Suporte Prioritário'
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-xs font-bold text-slate-600 dark:text-slate-300">
                  <CheckCircle className="w-4 h-4 text-brand" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <Button
              fullWidth
              size="lg"
              onClick={handleSubscribe}
              disabled={loading}
              className="h-14 font-black text-sm uppercase tracking-widest shadow-xl shadow-brand/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Assinar Agora com Stripe
                </div>
              )}
            </Button>

            <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400 font-bold uppercase">
              <Shield className="w-3 h-3" />
              Pagamento 100% Seguro
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
