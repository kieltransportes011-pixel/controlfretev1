import React, { useState } from 'react';
import { User } from '../types';
import { Card } from './Card';
import { Shield, Crown } from 'lucide-react';
import { supabase } from '../supabase';
import { PlanComparison } from './PlanComparison';

interface PaywallProps {
  user: User;
  onPaymentSuccess: () => void;
  onCancel?: () => void;
}


export const Paywall: React.FC<PaywallProps> = ({ user, onPaymentSuccess, onCancel }) => {
  const [status, setStatus] = useState<'idle' | 'generating' | 'pending' | 'approved'>('idle');
  const [pixData, setPixData] = useState<{ qrCode: string; copyPaste: string } | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);

  const handleCreatePix = async () => {
    setStatus('generating');
    try {
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: { email: user.email }
      });

      if (error) throw error;
      if (!data) throw new Error('Sem dados de retorno');

      // Check for error in response body
      if (data.error) throw new Error(data.error);

      // Mercado Pago Response Structure
      const qrCode = data.point_of_interaction?.transaction_data?.qr_code_base64;
      const copyPaste = data.point_of_interaction?.transaction_data?.qr_code;
      const id = data.id;

      if (!qrCode || !copyPaste) throw new Error('Dados do PIX não gerados');

      setPixData({ qrCode, copyPaste });
      setPaymentId(id);
      setStatus('pending');
      startPolling(user.id);

    } catch (err: any) {
      console.error('Erro ao gerar PIX:', err);
      // alert(`Erro: ${err.message || 'Falha ao criar pagamento'}`); // Removed alert to be less intrusive
      setStatus('idle');
    }
  };

  const startPolling = (userId: string) => {
    const interval = setInterval(async () => {
      // Check profile status indirectly via Supabase
      // Or cleaner: check if local user object updates (if parent updates it)
      // Safest: Check DB directly
      const { data } = await supabase.from('profiles').select('is_premium').eq('id', userId).single();

      if (data?.is_premium) {
        clearInterval(interval);
        setStatus('approved');
        setTimeout(() => {
          onPaymentSuccess();
        }, 3000);
      }
    }, 5000);

    // Stop after 5 minutes
    setTimeout(() => clearInterval(interval), 300000);
  };

  const copyToClipboard = () => {
    if (pixData?.copyPaste) {
      navigator.clipboard.writeText(pixData.copyPaste);
      alert('Código Copia e Cola copiado!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/95 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn overflow-y-auto">
      <Card className="max-w-4xl w-full bg-slate-50 dark:bg-slate-950 border-none relative overflow-visible shadow-2xl p-0">
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
            Desbloqueie todo o potencial do Control Frete e leve sua gestão para o próximo nível.
          </p>
        </div>

        <div className="p-4 md:p-8">
          {status === 'idle' && (
            <PlanComparison onUpgrade={handleCreatePix} isLoading={false} />
          )}

          {status === 'generating' && (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-brand mb-4"></div>
              <p className="text-lg font-bold text-slate-600">Gerando PIX...</p>
            </div>
          )}

          {status === 'pending' && pixData && (
            <div className="flex flex-col items-center justify-center max-w-md mx-auto space-y-6">
              <div className="bg-orange-100 text-orange-800 px-4 py-2 rounded-lg text-sm font-bold w-full text-center border border-orange-200">
                Aguardando confirmação do pagamento...
              </div>

              <div className="bg-white p-4 rounded-xl border-2 border-slate-200 shadow-inner">
                <img
                  src={`data:image/png;base64,${pixData.qrCode}`}
                  alt="QR Code PIX"
                  className="w-64 h-64 object-contain"
                />
              </div>

              <div className="w-full">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Pix Copia e Cola</label>
                <div className="flex gap-2">
                  <input
                    readOnly
                    value={pixData.copyPaste}
                    className="flex-1 bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-600"
                  />
                  <button
                    onClick={copyToClipboard}
                    className="bg-brand text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-brand-600"
                  >
                    Copiar
                  </button>
                </div>
              </div>

              <div className="text-center text-sm text-slate-500">
                <p>Abra o app do seu banco e escolha <strong>Pagar com Pix</strong>.</p>
                <p>O sistema identificará o pagamento automaticamente em alguns segundos.</p>
              </div>
            </div>
          )}

          {status === 'approved' && (
            <div className="flex flex-col items-center justify-center py-20 text-center animate-slideUp">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-6">
                <Shield className="w-10 h-10" />
              </div>
              <h2 className="text-3xl font-black text-slate-800 dark:text-white mb-2">Pagamento Confirmado!</h2>
              <p className="text-slate-500 text-lg mb-8">
                Sua assinatura PRO já está ativa. Aproveite!
              </p>
              <button className="bg-green-600 text-white px-8 py-3 rounded-xl font-bold rounded shadow-lg animate-bounce">
                Atualizando sistema...
              </button>
            </div>
          )}
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
