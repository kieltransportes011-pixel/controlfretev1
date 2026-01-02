import React, { useState, useEffect, useMemo } from 'react';
import { User } from '../types';
import { formatCurrency } from '../utils';
import { Card } from './Card';
import { Button } from './Button';
import { ChevronLeft, Gift, Sparkles, CheckCircle, Copy, MessageCircle, ArrowRight, Zap, Users, DollarSign, Filter, Loader2, Calendar, Info, Wallet, PiggyBank, CreditCard } from 'lucide-react';
import { supabase } from '../supabase';

interface ReferralSystemProps {
  user: User;
  onUpdateUser: (user: User) => void;
  onBack: () => void;
}

interface CFTransaction {
  id: string;
  type: 'referral_bonus' | 'discount_usage' | 'withdrawal' | 'refund_adjustment';
  amount_cf: number;
  amount_brl: number;
  status: 'pending' | 'approved' | 'revoked' | 'completed' | 'confirmed';
  description: string;
  created_at: string;
}

interface WalletData {
  balance_available: number;
  balance_blocked: number;
}

export const ReferralSystem: React.FC<ReferralSystemProps> = ({ user, onUpdateUser, onBack }) => {
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<CFTransaction[]>([]);
  const [wallet, setWallet] = useState<WalletData>({ balance_available: 0, balance_blocked: 0 });
  const [activeModal, setActiveModal] = useState<'withdraw' | 'discount' | null>(null);
  const [pixKey, setPixKey] = useState('');
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [processing, setProcessing] = useState(false);

  const [statusFilter, setStatusFilter] = useState<'ALL' | 'INCOME' | 'OUTCOME'>('ALL');

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch Wallet
      const { data: walletData } = await supabase
        .from('user_cf_wallet')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (walletData) {
        setWallet({
          balance_available: walletData.balance_available || 0,
          balance_blocked: walletData.balance_blocked || 0
        });
      }

      // Fetch Transactions
      const { data: txData } = await supabase
        .from('cf_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (txData) {
        setTransactions(txData);
      }
    } catch (e) {
      console.error("Error fetching data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user.id]);

  const balanceCF = wallet.balance_available;
  const balanceBRL = balanceCF / 100;
  const minWithdrawBRL = 20.00;
  const minWithdrawCF = 2000;

  const withdrawProgress = Math.min(100, (balanceCF / minWithdrawCF) * 100);

  const copyToClipboard = () => {
    if (user.referralCode) {
      navigator.clipboard.writeText(user.referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareText = `🚀 Ei! Estou usando o *Control Frete* para gerenciar meus ganhos. Usa meu código *${user.referralCode}* e ganhe bônus exclusivos! Baixe aqui: https://fretecontrol.app`;

  const handleShareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
  };

  const handleWithdrawal = async () => {
    if (!pixKey) return alert('Informe a chave PIX');
    if (balanceCF < minWithdrawCF) return alert('Saldo insuficiente');

    setProcessing(true);
    try {
      const { error } = await supabase.functions.invoke('request-withdrawal', {
        body: { amount_cf: balanceCF, pix_key: pixKey } // Withdrawing ALL available by default? Let's assume yes or add input.
        // Simplified: User withdraws Amount >= 2000. For now withdrawing everything > 2000? 
        // Let's modify to withdraw exactly what they want or just fixed amounts. 
        // For MVP, withdraw All Available if >= 2000 is easiest, or just pass a fixed amount.
        // Let's pass 'amount_cf: balanceCF' to withdraw distinct amount? 
        // Actually, usually users want to withdraw everything.
      });
      if (error) throw error;
      alert('Solicitação recebida! Em breve o valor será enviado.');
      setActiveModal(null);
      fetchData();
    } catch (e: any) {
      alert('Erro ao solicitar: ' + e.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleDiscount = async () => {
    // Logic: User inputs amount to convert
    if (discountAmount <= 0) return alert('Valor inválido');
    if (discountAmount > balanceCF) return alert('Saldo insuficiente');

    setProcessing(true);
    try {
      const { error } = await supabase.functions.invoke('apply-cf-discount', {
        body: { amount_cf: discountAmount }
      });
      if (error) throw error;
      alert(`Desconto de ${formatCurrency(discountAmount / 100)} aplicado na sua próxima fatura!`);
      setActiveModal(null);
      fetchData();
    } catch (e: any) {
      alert('Erro ao aplicar desconto: ' + e.message);
    } finally {
      setProcessing(false);
    }
  };

  const filteredHistory = useMemo(() => {
    return transactions.filter(item => {
      if (statusFilter === 'INCOME') return item.amount_cf > 0;
      if (statusFilter === 'OUTCOME') return item.amount_cf < 0;
      return true;
    });
  }, [transactions, statusFilter]);

  return (
    <div className="pb-24 space-y-4 animate-fadeIn">
      {/* HEADER */}
      <header className="flex justify-between items-center px-1 relative">
        <div className="flex items-center">
          <button onClick={onBack} className="p-2 -ml-2 text-slate-500 hover:text-brand transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="ml-2">
            <h1 className="text-xl font-bold text-base-text dark:text-white">Indique e Ganhe CF</h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">Control Frete Coins</p>
          </div>
        </div>
        <div className="bg-brand-500/10 p-2 rounded-xl">
          <Gift className="w-5 h-5 text-brand" />
        </div>
      </header>

      {/* SHARE CARD */}
      <div className="relative group px-1">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-brand-400 to-indigo-500 rounded-3xl blur opacity-20 group-hover:opacity-30 transition duration-1000"></div>
        <Card className="relative overflow-hidden border-none shadow-lg bg-white dark:bg-slate-800 p-0">
          <div className="flex flex-col">
            <div className="p-4 text-center">
              <div className="flex justify-center items-center gap-2 mb-3">
                <Sparkles className="w-3 h-3 text-accent-warning" />
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">SEU CÓDIGO ÚNICO</span>
                <Sparkles className="w-3 h-3 text-accent-warning" />
              </div>

              <div
                onClick={copyToClipboard}
                className="cursor-pointer relative inline-block active:scale-95 transition-all"
              >
                <div className="bg-slate-50 dark:bg-slate-900/50 border-2 border-dashed border-brand/20 rounded-xl px-6 py-4 flex flex-col items-center gap-1 group/code">
                  <span className="text-xl font-mono font-black text-brand dark:text-brand-300 tracking-[0.15em] break-all max-w-[200px]">
                    {user.referralCode || '...'}
                  </span>
                  {copied ? (
                    <div className="flex items-center gap-1 text-accent-success animate-fadeIn">
                      <CheckCircle className="w-3 h-3" />
                      <span className="text-[9px] font-bold uppercase">Copiado!</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-slate-400 group-hover/code:text-brand transition-colors">
                      <Copy className="w-3 h-3" />
                      <span className="text-[9px] font-bold uppercase">Toque para copiar</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="border-t border-dashed border-slate-100 dark:border-slate-700 px-4 py-3 bg-slate-50/50 dark:bg-slate-900/20">
              <button
                onClick={handleShareWhatsApp}
                className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white py-3 rounded-xl font-black flex items-center justify-center gap-2 shadow-md shadow-green-500/20 active:scale-95 transition-all text-sm uppercase tracking-tight"
              >
                <MessageCircle className="w-5 h-5 fill-white" />
                ENVIAR CONVITE
              </button>
            </div>
          </div>
        </Card>
      </div>

      {/* BALANCE & ACTIONS */}
      <Card className="space-y-4 border-l-4 border-l-brand relative overflow-hidden py-4">
        <div className="flex justify-between items-start relative z-10">
          <div>
            <h3 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-tight">Saldo Disponível</h3>
            <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">
              1 CF = R$ 0,01
            </p>
          </div>
          <div className="text-right">
            <span className="text-3xl font-black text-brand dark:text-brand-300">{balanceCF} <span className="text-sm">CF</span></span>
            <p className="text-[10px] font-bold text-accent-success uppercase">
              ≈ {formatCurrency(balanceBRL)}
            </p>
          </div>
        </div>

        {/* PROGRES BAR FOR WITHDRAWAL */}
        <div className="space-y-1.5 relative z-10">
          <div className="flex justify-between text-[9px] font-black text-slate-500 uppercase">
            <span>Progresso para saque (min. 2000 CF)</span>
            <span>{withdrawProgress.toFixed(0)}%</span>
          </div>
          <div className="h-3 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden p-0.5 shadow-inner">
            <div
              className={`h-full rounded-full transition-all duration-1000 ease-out relative ${withdrawProgress >= 100 ? 'bg-accent-success' : 'bg-brand'}`}
              style={{ width: `${withdrawProgress}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-2">
          <Button
            variant="outline"
            disabled={balanceCF <= 0}
            onClick={() => {
              setDiscountAmount(balanceCF);
              setActiveModal('discount');
            }}
            className="h-10 text-[10px] font-black uppercase"
          >
            <CreditCard className="w-3 h-3 mr-1" />
            Usar Desconto
          </Button>
          <Button
            variant="success"
            disabled={balanceCF < minWithdrawCF}
            onClick={() => setActiveModal('withdraw')}
            className="h-10 text-[10px] font-black uppercase"
          >
            <Wallet className="w-3 h-3 mr-1" />
            Sacar Pix
          </Button>
        </div>
      </Card>

      {/* INFO STEPS */}
      <div className="grid grid-cols-3 gap-2 px-1">
        {[
          { icon: <Zap className="w-4 h-4" />, text: "Indique", color: "text-brand bg-brand/10" },
          { icon: <Users className="w-4 h-4" />, text: "Amigo Assina Anual", color: "text-brand bg-brand/10" },
          { icon: <DollarSign className="w-4 h-4" />, text: "Ganhe 1000 CF", color: "text-accent-success bg-accent-success/10" }
        ].map((step, i) => (
          <div key={i} className="text-center space-y-1.5 p-2 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
            <div className={`w-10 h-10 ${step.color} rounded-xl flex items-center justify-center mx-auto`}>
              {step.icon}
            </div>
            <p className="text-[8px] font-black text-slate-800 dark:text-white uppercase leading-tight">{step.text}</p>
          </div>
        ))}
      </div>

      {/* HISTORY */}
      <div className="px-1">
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-tight">Extrato</h3>
          <button
            onClick={() => setStatusFilter(prev => prev === 'ALL' ? 'INCOME' : prev === 'INCOME' ? 'OUTCOME' : 'ALL')}
            className={`p-1.5 rounded-lg transition-all flex items-center gap-1 text-[10px] font-bold ${statusFilter !== 'ALL' ? 'bg-brand text-white' : 'bg-white dark:bg-slate-800 text-slate-400 border border-slate-100 dark:border-slate-700'}`}
          >
            <Filter className="w-3 h-3" />
            {statusFilter === 'ALL' ? 'TODOS' : statusFilter === 'INCOME' ? 'ENTRADAS' : 'SAÍDAS'}
          </button>
        </div>

        {loading ? (
          <div className="py-8 flex justify-center">
            <Loader2 className="w-5 h-5 text-brand animate-spin" />
          </div>
        ) : (
          <div className="space-y-2">
            {filteredHistory.length === 0 ? (
              <div className="text-center py-10 bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                <PiggyBank className="w-6 h-6 text-slate-200 dark:text-slate-700 mx-auto mb-2" />
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Nenhuma transação</p>
              </div>
            ) : (
              filteredHistory.map(item => (
                <div key={item.id} className="bg-white dark:bg-slate-800 p-3 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex justify-between items-center animate-fadeIn">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs uppercase ${item.amount_cf > 0 ? 'bg-accent-success/10 text-accent-success' : 'bg-slate-100 text-slate-500'}`}>
                      {item.amount_cf > 0 ? <ArrowRight className="w-3 h-3 -rotate-45" /> : <ArrowRight className="w-3 h-3 rotate-45" />}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-base-text dark:text-white text-xs">{item.description}</span>
                      <span className="text-[9px] text-slate-400 flex items-center gap-1 font-bold">
                        <Calendar className="w-2.5 h-2.5" />
                        {new Date(item.created_at).toLocaleDateString('pt-BR')}
                        <span className="text-[8px] bg-slate-100 dark:bg-slate-700 px-1 rounded uppercase min-w-[30px] text-center ml-1">{item.status}</span>
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-black text-xs ${item.amount_cf > 0 ? 'text-accent-success' : 'text-slate-600 dark:text-slate-400'}`}>
                      {item.amount_cf > 0 ? '+' : ''}{item.amount_cf} CF
                    </div>
                    <div className="text-[9px] font-bold text-slate-400">
                      {formatCurrency(Math.abs(item.amount_brl))}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 text-[9px] text-slate-400 justify-center p-4 border-t border-slate-100 dark:border-slate-800">
        <Info className="w-3 h-3" />
        <span className="font-bold uppercase tracking-tighter">Bônus sujeito a validação de pagamento anual.</span>
      </div>

      {/* MODALS */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
          <Card className="max-w-xs w-full bg-white dark:bg-slate-900 shadow-2xl animate-scaleIn">
            <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase mb-4">
              {activeModal === 'withdraw' ? 'Solicitar Saque Pix' : 'Usar Saldo em Desconto'}
            </h3>

            {activeModal === 'withdraw' ? (
              <div className="space-y-3">
                <p className="text-xs text-slate-500">Valor a sacar: <strong className="text-slate-900 dark:text-white">{balanceCF} CF</strong> ({formatCurrency(balanceBRL)})</p>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">Chave Pix</label>
                  <input
                    type="text"
                    placeholder="CPF, E-mail ou Aleatória"
                    value={pixKey}
                    onChange={e => setPixKey(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:border-brand"
                  />
                </div>
                <div className="flex gap-2 mt-4">
                  <Button variant="secondary" fullWidth onClick={() => setActiveModal(null)} disabled={processing}>Cancelar</Button>
                  <Button variant="success" fullWidth onClick={handleWithdrawal} disabled={processing || !pixKey}>
                    {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmar'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-slate-500">
                  O valor será adicionado como crédito na sua conta Stripe e abatido automaticamente da próxima fatura.
                </p>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">Valor em CF a converter</label>
                  <input
                    type="number"
                    value={discountAmount}
                    onChange={e => setDiscountAmount(Number(e.target.value))}
                    max={balanceCF}
                    className="w-full text-xs p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:border-brand"
                  />
                  <p className="text-[9px] text-right text-slate-400 mt-1">Disponível: {balanceCF} CF</p>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button variant="secondary" fullWidth onClick={() => setActiveModal(null)} disabled={processing}>Cancelar</Button>
                  <Button variant="primary" fullWidth onClick={handleDiscount} disabled={processing || discountAmount <= 0}>
                    {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmar'}
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
};