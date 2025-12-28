import React, { useState, useEffect, useMemo } from 'react';
import { User } from '../types';
import { formatCurrency, getWeekNumber } from '../utils';
import { Card } from './Card';
import { Button } from './Button';
import { ChevronLeft, Gift, Sparkles, CheckCircle2, Copy, MessageCircle, ArrowRight, Zap, Users, DollarSign, Filter, Loader2, Calendar, Info } from 'lucide-react';
import { supabase } from '../supabase';

interface ReferralSystemProps {
  user: User;
  onUpdateUser: (user: User) => void;
  onBack: () => void;
}

interface ReferralItem {
  id: string;
  name: string;
  date: string;
  status: 'CONFIRMED' | 'PENDING';
  value: number;
}

type DateFilterType = 'ALL';

export const ReferralSystem: React.FC<ReferralSystemProps> = ({ user, onUpdateUser, onBack }) => {
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [referrals, setReferrals] = useState<ReferralItem[]>([]);

  const [statusFilter, setStatusFilter] = useState<'ALL' | 'CONFIRMED' | 'PENDING'>('ALL');
  const [dateFilter, setDateFilter] = useState<DateFilterType>('ALL');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (!user.referralCode) return;

    setLoading(true);

    // Supabase implementation
    const fetchReferrals = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('referred_by', user.referralCode);

        if (data) {
          const list = data.map((profile: any) => ({
            id: profile.id,
            name: profile.name || 'Usuário',
            date: profile.created_at ? new Date(profile.created_at).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR'),
            // Check if referred user is premium
            status: profile.is_premium ? 'CONFIRMED' : 'PENDING',
            // Only count value if confirmed
            value: 200 // 200 CF
          }));
          setReferrals(list);
        } else if (error) {
          console.error("Error fetching referrals:", error);
        }
      } catch (e) {
        console.error("Error fetching referrals:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchReferrals();
  }, [user.referralCode]);

  // Only sum value of confirmed referrals
  const balanceCF = referrals
    .filter(r => r.status === 'CONFIRMED')
    .reduce((acc, curr) => acc + curr.value, 0);

  // Conversion: 200 CF = R$ 2.00 -> 100 CF = R$ 1.00
  const balanceBRL = balanceCF / 100;
  const minWithdrawBRL = 20.00;
  const minWithdrawCF = minWithdrawBRL * 100; // 2000 CF

  const withdrawProgress = Math.min(100, (balanceCF / minWithdrawCF) * 100);

  const copyToClipboard = () => {
    if (user.referralCode) {
      navigator.clipboard.writeText(user.referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareText = `🚀 Ei! Estou usando o *Control Frete* para gerenciar meus ganhos. Usa meu código *${user.referralCode}* e ganhe 7 dias grátis para testar também! Baixe aqui: https://fretecontrol.app`;

  const handleShareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
  };

  const filteredHistory = useMemo(() => {
    return referrals.filter(item => {
      if (statusFilter !== 'ALL' && item.status !== statusFilter) return false;
      return true;
    });
  }, [referrals, statusFilter]);

  return (
    <div className="pb-24 space-y-4 animate-fadeIn">
      <header className="flex justify-between items-center px-1 relative">
        <div className="flex items-center">
          <button onClick={onBack} className="p-2 -ml-2 text-slate-500 hover:text-brand transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="ml-2">
            <h1 className="text-xl font-bold text-base-text dark:text-white">Indique e Ganhe</h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">Acumule CF e troque por dinheiro</p>
          </div>
        </div>
        <div className="bg-brand-500/10 p-2 rounded-xl">
          <Gift className="w-5 h-5 text-brand" />
        </div>
      </header>

      <div className="relative group px-1">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-brand-400 to-indigo-500 rounded-3xl blur opacity-20 group-hover:opacity-30 transition duration-1000"></div>
        <Card className="relative overflow-hidden border-none shadow-lg bg-white dark:bg-slate-800 p-0">
          <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-[#F5F7FA] dark:bg-slate-950 rounded-full shadow-inner z-10"></div>
          <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-[#F5F7FA] dark:bg-slate-950 rounded-full shadow-inner z-10"></div>

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
                {/* Caixa de código reduzida */}
                <div className="bg-slate-50 dark:bg-slate-900/50 border-2 border-dashed border-brand/20 rounded-xl px-6 py-4 flex flex-col items-center gap-1 group/code">
                  <span className="text-xl font-mono font-black text-brand dark:text-brand-300 tracking-[0.15em] break-all max-w-[200px]">
                    {user.referralCode}
                  </span>
                  {copied ? (
                    <div className="flex items-center gap-1 text-accent-success animate-fadeIn">
                      <CheckCircle2 className="w-3 h-3" />
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
                ENVIAR CONVITE NO WHATSAPP
              </button>
            </div>
          </div>
        </Card>
      </div>

      <Card className="space-y-4 border-l-4 border-l-brand relative overflow-hidden py-4">
        <div className="flex justify-between items-start relative z-10">
          <div>
            <h3 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-tight">Saldo Acumulado</h3>
            <p className="text-[9px] text-slate-400 font-bold uppercase">
              Mínimo para saque: {minWithdrawCF} CF ({formatCurrency(minWithdrawBRL)})
            </p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-black text-brand dark:text-brand-300">{balanceCF} CF</span>
            <p className="text-[10px] font-bold text-accent-success uppercase">
              = {formatCurrency(balanceBRL)}
            </p>
          </div>
        </div>

        <div className="space-y-1.5 relative z-10">
          <div className="flex justify-between text-[9px] font-black text-slate-500 uppercase">
            <span>Progresso para saque</span>
            <span>{withdrawProgress.toFixed(0)}%</span>
          </div>
          <div className="h-3 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden p-0.5 shadow-inner">
            <div
              className={`h-full rounded-full transition-all duration-1000 ease-out relative ${withdrawProgress >= 100 ? 'bg-accent-success' : 'bg-brand'}`}
              style={{ width: `${withdrawProgress}%` }}
            />
          </div>
        </div>

        <Button
          fullWidth
          disabled={balanceCF < minWithdrawCF}
          variant={balanceCF >= minWithdrawCF ? 'success' : 'secondary'}
          className="h-12 font-black text-xs uppercase"
        >
          {balanceCF >= minWithdrawCF ? (
            <>SOLICITAR RESGATE PIX <ArrowRight className="w-4 h-4 ml-1" /></>
          ) : (
            `Faltam ${minWithdrawCF - balanceCF} CF para sacar`
          )}
        </Button>
      </Card>

      <div className="grid grid-cols-3 gap-2 px-1">
        {[
          { icon: <Zap className="w-4 h-4" />, text: "Indique", color: "text-brand bg-brand/10" },
          { icon: <Users className="w-4 h-4" />, text: "Amigo Assina", color: "text-brand bg-brand/10" },
          { icon: <DollarSign className="w-4 h-4" />, text: "Ganhe 200 CF", color: "text-accent-success bg-accent-success/10" }
        ].map((step, i) => (
          <div key={i} className="text-center space-y-1.5 p-2 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
            <div className={`w-10 h-10 ${step.color} rounded-xl flex items-center justify-center mx-auto`}>
              {step.icon}
            </div>
            <p className="text-[9px] font-black text-slate-800 dark:text-white uppercase leading-tight">{step.text}</p>
          </div>
        ))}
      </div>

      <div className="px-1">
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-tight">Convidados ({referrals.length})</h3>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-1.5 rounded-lg transition-all ${showFilters ? 'bg-brand text-white' : 'bg-white dark:bg-slate-800 text-slate-400 border border-slate-100 dark:border-slate-700'}`}
          >
            <Filter className="w-3 h-3" />
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
                <Users className="w-6 h-6 text-slate-200 dark:text-slate-700 mx-auto mb-2" />
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Nenhum convidado ainda</p>
              </div>
            ) : (
              filteredHistory.map(item => (
                <div key={item.id} className="bg-white dark:bg-slate-800 p-3 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex justify-between items-center animate-fadeIn">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-accent-success/10 text-accent-success flex items-center justify-center font-black text-xs uppercase">
                      {item.name.charAt(0)}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-base-text dark:text-white text-xs">{item.name}</span>
                      <span className="text-[9px] text-slate-400 flex items-center gap-1 font-bold">
                        <Calendar className="w-2.5 h-2.5" /> {item.date}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    {item.status === 'CONFIRMED' ? (
                      <>
                        <div className="font-black text-accent-success text-xs">+{item.value} CF</div>
                        <div className="text-[7px] font-black px-1.5 py-0.5 rounded-full uppercase inline-block mt-0.5 bg-accent-success/10 text-accent-success">
                          OK
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="font-black text-slate-300 text-xs">+{item.value} CF</div>
                        <div className="text-[7px] font-black px-1.5 py-0.5 rounded-full uppercase inline-block mt-0.5 bg-slate-100 text-slate-400">
                          PENDENTE
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 text-[9px] text-slate-400 justify-center p-4 border-t border-slate-100 dark:border-slate-800">
        <Info className="w-3 h-3" />
        <span className="font-bold uppercase tracking-tighter">Bônus liberado após assinatura anual.</span>
      </div>
    </div>
  );
};