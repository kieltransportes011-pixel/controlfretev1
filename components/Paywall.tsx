import React, { useState } from 'react';
import { User } from '../types';
import { Card } from './Card';
import { Shield, Crown } from 'lucide-react';
import { supabase } from '../supabase';
import { PricingCard } from './PricingCard';

interface PaywallProps {
  user: User;
  onPaymentSuccess: () => void;
  onCancel?: () => void;
}

export const Paywall: React.FC<PaywallProps> = ({ user, onCancel }) => {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async (planType: string = 'annual_promo') => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { email: user.email, plan: planType }
      });

      if (error) throw error;
      if (!data?.init_point) throw new Error("Link de pagamento não retornado.");

      // Redirect to Mercado Pago Official Checkout
      window.location.href = data.init_point;

    } catch (err: any) {
      console.error('Erro ao iniciar checkout:', err);
      alert(`Erro: ${err.message || 'Falha ao conectar com Mercado Pago'}`);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/95 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn overflow-y-auto">
      <Card className="max-w-6xl w-full bg-slate-50 dark:bg-slate-950 border-none relative overflow-visible shadow-2xl p-0">
        {onCancel && (
          <button
            onClick={onCancel}
            className="absolute -top-2 -right-2 z-50 bg-slate-800 text-white p-2 rounded-full hover:bg-slate-700 shadow-lg border-2 border-slate-600"
          >
            ✕
          </button>
        )}

        <div className="p-6 md:p-8 text-center bg-white dark:bg-slate-900 rounded-t-2xl border-b border-slate-100 dark:border-slate-800">
          <div className="w-16 h-16 bg-brand/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Crown className="w-8 h-8 text-brand" />
          </div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight mb-2">
            Escolha seu Plano
          </h1>
          <p className="text-slate-500 font-medium max-w-lg mx-auto">
            Desbloqueie todo o potencial do Control Frete. <strong>Oferta por tempo limitado.</strong>
          </p>
        </div>

        <div className="p-4 md:p-8">
          <div className="grid md:grid-cols-3 gap-6 items-center">
            {/* Mensal */}
            <PricingCard
              title="Mensal"
              price="R$ 9,90"
              period="mês"
              description="Flexibilidade total para testar."
              features={[
                "Fretes ILIMITADOS",
                "Histórico Completo",
                "Recibos Profissionais",
                "Sem fidelidade"
              ]}
              onSelect={() => handleCheckout('monthly')}
              oldPrice="R$ 19,90"
            />

            {/* Anual Promo */}
            <PricingCard
              title="Anual Pro"
              price="R$ 49,99"
              period="ano"
              description="Melhor custo-benefício. Apenas R$ 4,16/mês."
              features={[
                "Tudo do Plano Mensal",
                "Prioridade no Suporte",
                "Bônus Exclusivos",
                "Economia de 70%"
              ]}
              highlight={true}
              tag="OFERTA RELÂMPAGO"
              oldPrice="R$ 59,99"
              onSelect={() => handleCheckout('annual_promo')}
            />

            {/* Vitalício */}
            <PricingCard
              title="Vitalício"
              price="R$ 249,90"
              period="único"
              description="Pague uma vez, use para sempre."
              features={[
                "Acesso Vitalício",
                "Sem mensalidades",
                "Suporte VIP",
                "Selo de Membro Fundador"
              ]}
              tag="VIP"
              onSelect={() => handleCheckout('lifetime')}
            />
          </div>

          <div className="mt-8 flex flex-col items-center">
            <p className="text-xs text-slate-400 mb-2 font-medium">Aceitamos:</p>
            <div className="flex gap-3 grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all">
              <span className="bg-white border text-brand font-bold px-2 py-1 rounded text-xs select-none shadow-sm">PIX</span>
              <span className="bg-white border text-blue-800 font-bold px-2 py-1 rounded text-xs select-none shadow-sm">Cartão de Crédito</span>
              <span className="bg-white border text-slate-600 font-bold px-2 py-1 rounded text-xs select-none shadow-sm">Boleto</span>
            </div>
          </div>
        </div>

        <div className="p-4 text-center bg-slate-100 dark:bg-slate-900 rounded-b-2xl border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400 font-bold uppercase">
            <Shield className="w-3 h-3" />
            Pagamento 100% Seguro via Mercado Pago
          </div>
        </div>
      </Card>
    </div>
  );
};
