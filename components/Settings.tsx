import React, { useState } from 'react';
import { AppSettings, User, ViewState } from '../types';
import { Card } from './Card';
import { Button } from './Button';
import { Settings as SettingsIcon, Info, FileText, Moon, Sun, MapPin, Crown, CheckCircle, Zap, ArrowRight, Shield, Clock, Gift, Loader2 } from 'lucide-react';
import { supabase } from '../supabase';

interface SettingsProps {
  settings: AppSettings;
  user: User;
  onSave: (newSettings: AppSettings) => void;
  onNavigate: (view: ViewState) => void;
}

export const Settings: React.FC<SettingsProps> = ({ settings, user, onSave, onNavigate }) => {
  const [isUpgrading, setIsUpgrading] = useState(false);

  const handleStripeUpgrade = async () => {
    setIsUpgrading(true);
    try {
      const { data, error } = await supabase.functions.invoke('stripe-checkout');
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      console.error('Error initiating stripe checkout:', err);
      alert('Erro ao iniciar checkout. Tente novamente.');
    } finally {
      setIsUpgrading(false);
    }
  };
  const [company, setCompany] = useState(settings.defaultCompanyPercent);
  const [driver, setDriver] = useState(settings.defaultDriverPercent);
  const [reserve, setReserve] = useState(settings.defaultReservePercent);

  // Issuer State
  const [issuerName, setIssuerName] = useState(settings.issuerName || user?.name || '');
  const [issuerDoc, setIssuerDoc] = useState(settings.issuerDoc || '');
  const [issuerPhone, setIssuerPhone] = useState(settings.issuerPhone || '');

  // Address State
  const [issuerStreet, setIssuerStreet] = useState(settings.issuerAddressStreet || '');
  const [issuerNumber, setIssuerNumber] = useState(settings.issuerAddressNumber || '');
  const [issuerNeighborhood, setIssuerNeighborhood] = useState(settings.issuerAddressNeighborhood || '');
  const [issuerCity, setIssuerCity] = useState(settings.issuerAddressCity || '');
  const [issuerState, setIssuerState] = useState(settings.issuerAddressState || '');
  const [issuerZip, setIssuerZip] = useState(settings.issuerAddressZip || '');

  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    onSave({
      ...settings,
      defaultCompanyPercent: company,
      defaultDriverPercent: driver,
      defaultReservePercent: reserve,
      issuerName,
      issuerDoc,
      issuerPhone,
      issuerAddressStreet: issuerStreet,
      issuerAddressNumber: issuerNumber,
      issuerAddressNeighborhood: issuerNeighborhood,
      issuerCity,
      issuerAddressState: issuerState,
      issuerAddressZip: issuerZip,
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const toggleTheme = (theme: 'light' | 'dark') => {
    onSave({ ...settings, theme });
  };

  const total = company + driver + reserve;

  return (
    <div className="pb-24 space-y-6">
      <header className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-base-text dark:text-white">Configurações</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Preferências do usuário</p>
        </div>
      </header>

      {/* Referral Link (Indique e Ganhe) - Integrado aqui */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-2">
          <Gift className="w-4 h-4 text-brand" />
          Indicação
        </h2>
        <Card
          onClick={() => onNavigate('REFERRAL')}
          className="border-2 border-brand/20 bg-brand/5 dark:bg-brand/10 hover:shadow-md cursor-pointer transition-all group flex items-center gap-4 p-5"
        >
          <div className="bg-brand text-white p-3 rounded-2xl shadow-lg shadow-brand/20">
            <Gift className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-black text-brand text-sm uppercase">Indique e Ganhe</h3>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Convide amigos e ganhe prêmios</p>
          </div>
          <ArrowRight className="w-5 h-5 text-brand group-hover:translate-x-1 transition-transform" />
        </Card>
      </section>

      {/* Subscription Section */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-2">
          <Crown className="w-4 h-4 text-brand" />
          Assinatura
        </h2>
        <Card className={`relative overflow-hidden border-2 transition-all ${user.plano === 'pro' ? 'border-accent-success bg-green-50/50 dark:bg-green-900/10' : 'border-brand/20'}`}>
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="font-black text-slate-800 dark:text-white uppercase text-sm">
                Plano {user.plano === 'pro' ? 'Profissional' : 'Gratuito'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {user.plano === 'pro' ? `Status: ${user.status_assinatura === 'ativa' ? 'Ativa' : 'Inadimplente'}` : 'Upgrade para liberar todas as funções'}
              </p>
            </div>
            {user.plano === 'pro' ? (
              <div className="bg-accent-success text-white p-2 rounded-full shadow-lg shadow-accent-success/30">
                <Shield className="w-5 h-5" />
              </div>
            ) : (
              <Zap className="w-6 h-6 text-brand animate-pulse" />
            )}
          </div>

          {user.plano !== 'pro' && (
            <div className="space-y-4">
              <button
                onClick={handleStripeUpgrade}
                disabled={isUpgrading}
                className="w-full bg-brand text-white py-3 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-brand-600 transition-all active:scale-95 shadow-lg shadow-brand/20 disabled:opacity-50"
              >
                {isUpgrading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    Assinar Plano Pro
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}

          <div className="absolute -right-4 -bottom-4 opacity-[0.03] dark:opacity-[0.05] pointer-events-none">
            <Crown className="w-24 h-24" />
          </div>
        </Card>
      </section>

      {/* Theme Selection */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Aparência</h2>
        <Card className="flex p-1 bg-[#F5F7FA] dark:bg-slate-900 border-none">
          <button
            onClick={() => toggleTheme('light')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${settings.theme === 'light' ? 'bg-white shadow-sm text-brand' : 'text-slate-500'}`}
          >
            <Sun className="w-4 h-4" /> Claro
          </button>
          <button
            onClick={() => toggleTheme('dark')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${settings.theme === 'dark' ? 'bg-slate-700 shadow-sm text-brand-300' : 'text-slate-500'}`}
          >
            <Moon className="w-4 h-4" /> Escuro
          </button>
        </Card>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-2">
          <SettingsIcon className="w-4 h-4" />
          Porcentagens Padrão
        </h2>
        <Card className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Empresa (%)</label>
            <input
              type="number"
              value={company}
              onChange={(e) => setCompany(Number(e.target.value))}
              className="w-full p-3 bg-[#F5F7FA] dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:border-brand dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Motorista (%)</label>
            <input
              type="number"
              value={driver}
              onChange={(e) => setDriver(Number(e.target.value))}
              className="w-full p-3 bg-[#F5F7FA] dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:border-brand dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Reserva (%)</label>
            <input
              type="number"
              value={reserve}
              onChange={(e) => setReserve(Number(e.target.value))}
              className="w-full p-3 bg-[#F5F7FA] dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:border-brand dark:text-white"
            />
          </div>

          <div className={`text-xs p-2 rounded text-center ${total === 100 ? 'text-accent-success bg-green-50 dark:bg-green-900/20' : 'text-accent-error bg-red-50 dark:bg-red-900/20'}`}>
            Total: {total}% (Deve ser 100%)
          </div>
        </Card>
      </section>

      {/* Receipt Issuer Settings */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Dados para Recibo
        </h2>
        <Card className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome do Emissor / Empresa</label>
            <input
              type="text"
              value={issuerName}
              onChange={(e) => setIssuerName(e.target.value)}
              placeholder="Ex: Transportes Silva"
              className="w-full p-3 bg-[#F5F7FA] dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:border-brand dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">CPF ou CNPJ</label>
            <input
              type="text"
              value={issuerDoc}
              onChange={(e) => setIssuerDoc(e.target.value)}
              placeholder="000.000.000-00"
              className="w-full p-3 bg-[#F5F7FA] dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:border-brand dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Telefone / Contato</label>
            <input
              type="text"
              value={issuerPhone}
              onChange={(e) => setIssuerPhone(e.target.value)}
              placeholder="(00) 00000-0000"
              className="w-full p-3 bg-[#F5F7FA] dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:border-brand dark:text-white"
            />
          </div>
        </Card>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          Endereço do Emissor
        </h2>
        <Card className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Logradouro (Rua, Av.)</label>
            <input
              type="text"
              value={issuerStreet}
              onChange={(e) => setIssuerStreet(e.target.value)}
              placeholder="Ex: Rua das Flores"
              className="w-full p-3 bg-[#F5F7FA] dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:border-brand dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Número</label>
              <input
                type="text"
                value={issuerNumber}
                onChange={(e) => setIssuerNumber(e.target.value)}
                placeholder="123"
                className="w-full p-3 bg-[#F5F7FA] dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:border-brand dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Bairro</label>
              <input
                type="text"
                value={issuerNeighborhood}
                onChange={(e) => setIssuerNeighborhood(e.target.value)}
                placeholder="Centro"
                className="w-full p-3 bg-[#F5F7FA] dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:border-brand dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Cidade</label>
              <input
                type="text"
                value={issuerCity}
                onChange={(e) => setIssuerCity(e.target.value)}
                placeholder="São Paulo"
                className="w-full p-3 bg-[#F5F7FA] dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:border-brand dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Estado (UF)</label>
              <input
                type="text"
                value={issuerState}
                onChange={(e) => setIssuerState(e.target.value)}
                placeholder="SP"
                className="w-full p-3 bg-[#F5F7FA] dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:border-brand dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">CEP</label>
            <input
              type="text"
              value={issuerZip}
              onChange={(e) => setIssuerZip(e.target.value)}
              placeholder="00000-000"
              className="w-full p-3 bg-[#F5F7FA] dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:border-brand dark:text-white"
            />
          </div>
        </Card>
      </section>

      <div className="pt-4">
        <Button fullWidth onClick={handleSave} disabled={total !== 100}>
          {isSaved ? 'Configurações Salvas!' : 'Salvar Tudo'}
        </Button>
      </div>

      <section className="space-y-3 pt-6 border-t border-slate-200 dark:border-slate-700">
        <h2 className="text-sm font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-2">
          <Info className="w-4 h-4" />
          Sobre o App
        </h2>
        <div className="text-center">
          <p className="text-xs text-slate-400 dark:text-slate-600">Control Frete v1.0</p>
        </div>
      </section>
    </div>
  );
};