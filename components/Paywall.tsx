import React, { useState, useEffect, useRef } from 'react';
import { User } from '../types';
import { Button } from './Button';
import { Card } from './Card';
import { Truck, CheckCircle, Shield, CreditCard, Sparkles, Loader2, ArrowRight, Zap, Info, Lock, AlertTriangle, ChevronLeft, Copy, QrCode, Clock, ExternalLink } from 'lucide-react';
import { supabase } from '../supabase';

// Mercado Pago Public Key Oficial (Produção)
const MP_PUBLIC_KEY = "APP_USR-8e0c75cf-c860-4efa-80ef-122c95d41d7c";

interface PaywallProps {
  user: User;
  onPaymentSuccess: () => void;
  onCancel?: () => void;
}

declare global {
  interface Window {
    MercadoPago: any;
  }
}

export const Paywall: React.FC<PaywallProps> = ({ user, onPaymentSuccess, onCancel }) => {
  if (!user) return <div className="p-10 text-center">Erro: Usuário não encontrado.</div>;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentStep, setPaymentStep] = useState<'OFFER' | 'CHECKOUT' | 'PIX_INSTRUCTIONS'>('OFFER');
  const [pixData, setPixData] = useState<{ qrCode: string; qrCodeBase64: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const bricksBuilderRef = useRef<any>(null);
  const paymentBrickControllerRef = useRef<any>(null);

  useEffect(() => {
    if (paymentStep === 'CHECKOUT' && window.MercadoPago) {
      console.log("Paywall: Iniciando configuração do checkout...");
      const mp = new window.MercadoPago(MP_PUBLIC_KEY, { locale: 'pt-BR' });
      const bricksBuilder = mp.bricks();
      bricksBuilderRef.current = bricksBuilder;

      const settings = {
        initialization: {
          amount: 49.90,
          payer: {
            email: user.email,
          },
        },
        customization: {
          paymentMethods: {
            ticket: "all",
            bankTransfer: "all",
            creditCard: "all",
            maxInstallments: 1
          },
          visual: {
            style: {
              theme: 'flat',
            },
          },
          payer: {
            email: user.email,
            identification: {
              docType: "CPF",
            },
          },
        },
        callbacks: {
          onReady: () => {
            console.log("Paywall: Brick pronto para renderização");
            setLoading(false);
          },
          onSubmit: ({ selectedPaymentMethod, formData }: any) => {
            return new Promise(async (resolve, reject) => {
              setLoading(true);
              setError(null);

              try {
                const sanitizedData = {
                  transaction_amount: Number(formData.transaction_amount || 49.90),
                  token: formData.token ? String(formData.token) : null,
                  installments: 1,
                  payment_method_id: String(formData.payment_method_id),
                  issuer_id: formData.issuer_id ? String(formData.issuer_id) : null,
                  payer: {
                    email: String(formData.payer?.email || user.email),
                    identification: formData.payer?.identification ? {
                      type: String(formData.payer.identification.type),
                      number: String(formData.payer.identification.number)
                    } : null
                  }
                };

                const { data, error: funcError } = await supabase.functions.invoke('process-payment', {
                  body: {
                    formData: sanitizedData,
                    userId: user.id
                  }
                });

                if (funcError) throw funcError;

                if (data.status === 'success') {
                  onPaymentSuccess();
                  resolve(true);
                } else if (data.status === 'pending') {
                  if (data.paymentMethod === 'pix' && data.pixData) {
                    setPixData(data.pixData);
                    setPaymentStep('PIX_INSTRUCTIONS');
                    resolve(true);
                  } else {
                    setPaymentStep('OFFER');
                    setError("Pagamento em processamento. Aguarde a compensação.");
                    resolve(true);
                  }
                } else {
                  throw new Error(data.message || 'Pagamento recusado.');
                }

              } catch (err: any) {
                console.error("Paywall: Erro no processamento", err);
                setError(err.message || "Erro ao processar pagamento.");
                reject();
              } finally {
                setLoading(false);
              }
            });
          },
          onError: (error: any) => {
            console.error("Paywall: Erro interno do Brick", error);
            setError("Erro técnico no checkout.");
            setLoading(false);
          },
        },
      };

      const initBrick = async () => {
        try {
          if (paymentBrickControllerRef.current) {
            await paymentBrickControllerRef.current.unmount();
          }
          paymentBrickControllerRef.current = await bricksBuilder.create('payment', 'paymentBrick_container', settings);
        } catch (err) {
          setError("Não foi possível carregar o formulário.");
          setLoading(false);
        }
      };

      initBrick();

      return () => {
        if (paymentBrickControllerRef.current) {
          paymentBrickControllerRef.current.unmount();
        }
      };
    }
  }, [paymentStep, user]);

  const handleLinkPayment = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: funcError } = await supabase.functions.invoke('process-payment', {
        body: { action: 'create-preference' }
      });
      if (funcError) throw funcError;
      if (data?.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error("Link de pagamento não gerado.");
      }
    } catch (err: any) {
      setError(err.message || "Erro ao gerar link de pagamento.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPix = () => {
    if (pixData?.qrCode) {
      navigator.clipboard.writeText(pixData.qrCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 animate-fadeIn">
      <div className="max-w-md w-full space-y-6">
        <header className="text-center space-y-2 relative">
          {(onCancel || paymentStep !== 'OFFER') && (
            <button
              onClick={paymentStep === 'PIX_INSTRUCTIONS' || paymentStep === 'CHECKOUT' ? () => setPaymentStep('OFFER') : onCancel}
              className="absolute -top-4 -left-2 p-2 text-slate-400 hover:text-brand transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}
          <div className="inline-flex items-center justify-center p-4 bg-brand rounded-3xl shadow-xl shadow-brand/20 mb-4 animate-bounce-short">
            <Truck className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">
            {paymentStep === 'OFFER' ? 'Seja Pro' : (paymentStep === 'PIX_INSTRUCTIONS' ? 'Pague com Pix' : 'Checkout Seguro')}
          </h1>
        </header>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-100 dark:border-red-900/30 p-6 rounded-3xl text-center mb-0 animate-fadeIn">
            <AlertTriangle className="w-12 h-12 text-accent-error mx-auto mb-3" />
            <h3 className="text-red-800 dark:text-red-400 font-bold mb-2">Ops! Algo deu errado</h3>
            <p className="text-red-600/80 dark:text-red-400/60 text-xs mb-4">{error}</p>
            <Button onClick={() => setPaymentStep('OFFER')} variant="outline" className="text-xs">
              Tentar Novamente
            </Button>
          </div>
        )}

        <Card className={`relative overflow-hidden border-2 border-brand dark:bg-slate-900 shadow-2xl transition-all duration-500 ${paymentStep === 'CHECKOUT' ? 'p-0' : 'p-6'}`}>
          {paymentStep === 'OFFER' && (
            <div className="space-y-6 animate-fadeIn text-center">
              <div className="text-center py-4">
                <div className="flex flex-col items-center">
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-slate-400 text-sm font-bold">R$</span>
                    <span className="text-5xl font-black text-brand dark:text-brand-300">49,90</span>
                    <span className="text-slate-400 text-xs font-bold">/ano</span>
                  </div>
                  <span className="text-[10px] font-black text-brand-secondary uppercase tracking-[0.2em] mt-2">Pagamento Único à Vista</span>
                </div>
              </div>
              <div className="space-y-3 text-left">
                {[
                  "Lançamentos Ilimitados",
                  "Cálculo de Lucro Real",
                  "Emissão de Recibos",
                  "Backup na Nuvem"
                ].map((feature, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300 font-medium">
                    <CheckCircle className="w-5 h-5 text-accent-success shrink-0" />
                    {feature}
                  </div>
                ))}
              </div>

              <div className="space-y-3 pt-4">
                <Button fullWidth onClick={handleLinkPayment} disabled={loading} className="h-16 text-lg group bg-brand hover:bg-brand-600">
                  {loading ? <Loader2 className="w-6 h-6 animate-spin mr-2" /> : <ExternalLink className="w-6 h-6 mr-2" />}
                  PAGAR COM LINK (MAIS SEGURO)
                </Button>

                <button
                  onClick={() => setPaymentStep('CHECKOUT')}
                  className="w-full text-[10px] text-slate-400 font-bold uppercase hover:text-brand transition-colors py-2"
                >
                  Outras formas de pagamento (Pix/Cartão Direto)
                </button>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl flex items-start gap-2 text-left">
                <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <p className="text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase leading-tight">
                  O Link de Pagamento é o método mais estável. Você será redirecionado para o site oficial do Mercado Pago.
                </p>
              </div>
            </div>
          )}

          {paymentStep === 'CHECKOUT' && (
            <div className="animate-slideUp min-h-[400px]">
              <div id="paymentBrick_container" className="mp-bricks-container"></div>
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-slate-900/80 z-10 backdrop-blur-sm">
                  <Loader2 className="w-8 h-8 text-brand animate-spin" />
                </div>
              )}
            </div>
          )}

          {paymentStep === 'PIX_INSTRUCTIONS' && pixData && (
            <div className="animate-fadeIn space-y-6 flex flex-col items-center text-center">
              <div className="bg-white p-4 rounded-2xl shadow-inner border border-slate-100">
                <img src={`data:image/png;base64,${pixData.qrCodeBase64}`} alt="QR Code Pix" className="w-48 h-48" />
              </div>
              <div className="w-full space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase">Copia e Cola</label>
                <div className="flex items-center gap-2">
                  <input readOnly value={pixData.qrCode} className="flex-1 p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono overflow-hidden" />
                  <button onClick={handleCopyPix} className={`p-3 rounded-xl ${copied ? 'bg-accent-success' : 'bg-brand'} text-white transition-colors`}>
                    {copied ? <CheckCircle className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <Button fullWidth variant="outline" onClick={() => setPaymentStep('OFFER')}>Voltar</Button>
            </div>
          )}
        </Card>

        <div className="text-center">
          <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400 font-bold uppercase">
            <Shield className="w-4 h-4 text-accent-success" />
            Checkout Seguro Mercado Pago
          </div>
        </div>
      </div>
    </div>
  );
};
