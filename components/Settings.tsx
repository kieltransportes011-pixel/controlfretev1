import React, { useState } from 'react';
import { AppSettings, User, ViewState, PercentageCategory } from '../types';
import { Card } from './Card';
import { Button } from './Button';
import { Settings as SettingsIcon, Info, FileText, Moon, Sun, MapPin, Crown, CheckCircle, Zap, ArrowRight, Shield, Camera, Loader2, User as UserIcon, MessageCircle, Megaphone, Users, DollarSign, AlertTriangle, Upload, Smartphone, Share, PlusSquare } from 'lucide-react';
import { supabase } from '../supabase';

import { useSubscription } from '../hooks/useSubscription';
import { ActivityHistory } from './ActivityHistory';
import { useImageUpload } from '../hooks/useImageUpload';
import { useToast } from '../contexts/ToastContext';

interface SettingsProps {
  settings: AppSettings;
  user: User;
  onSave: (newSettings: AppSettings) => Promise<void>;
  onNavigate: (view: ViewState) => void;
  onUpdateUser?: (user: User) => Promise<void>;
}

export const Settings: React.FC<SettingsProps> = ({ settings, user, onSave, onNavigate, onUpdateUser }) => {
  const { isTrial, isActive, daysRemaining } = useSubscription(user);
  const { success: toastSuccess, error: toastError } = useToast();

  // Hooks for Image Upload
  const avatarUpload = useImageUpload({ bucket: 'avatars', minDimension: 150 });
  const logoUpload = useImageUpload({ bucket: 'avatars', minDimension: 100 });

  // Initialize state with props
  const [percentages, setPercentages] = useState<PercentageCategory[]>(
    settings.customPercentages || [
      { id: 'company', label: 'Empresa', percent: settings.defaultCompanyPercent },
      { id: 'driver', label: 'Motorista', percent: settings.defaultDriverPercent },
      { id: 'reserve', label: 'Reserva', percent: settings.defaultReservePercent },
    ]
  );

  const [issuerName, setIssuerName] = useState(settings.issuerName || user?.name || '');
  const [issuerDoc, setIssuerDoc] = useState(settings.issuerDoc || '');
  const [issuerPhone, setIssuerPhone] = useState(settings.issuerPhone || '');

  const [issuerStreet, setIssuerStreet] = useState(settings.issuerAddressStreet || '');
  const [issuerNumber, setIssuerNumber] = useState(settings.issuerAddressNumber || '');
  const [issuerNeighborhood, setIssuerNeighborhood] = useState(settings.issuerAddressNeighborhood || '');
  const [issuerCity, setIssuerCity] = useState(settings.issuerAddressCity || '');
  const [issuerState, setIssuerState] = useState(settings.issuerAddressState || '');
  const [issuerZip, setIssuerZip] = useState(settings.issuerAddressZip || '');

  const [tempLogoUrl, setTempLogoUrl] = useState(settings.issuerLogoUrl || '');

  // Effects to sync with props
  React.useEffect(() => {
    setPercentages(settings.customPercentages || [
      { id: 'company', label: 'Empresa', percent: settings.defaultCompanyPercent },
      { id: 'driver', label: 'Motorista', percent: settings.defaultDriverPercent },
      { id: 'reserve', label: 'Reserva', percent: settings.defaultReservePercent },
    ]);
    setIssuerName(settings.issuerName || user?.name || '');
    setIssuerDoc(settings.issuerDoc || '');
    setIssuerPhone(settings.issuerPhone || '');
    setIssuerStreet(settings.issuerAddressStreet || '');
    setIssuerNumber(settings.issuerAddressNumber || '');
    setIssuerNeighborhood(settings.issuerAddressNeighborhood || '');
    setIssuerCity(settings.issuerAddressCity || '');
    setIssuerState(settings.issuerAddressState || '');
    setIssuerZip(settings.issuerAddressZip || '');
    setTempLogoUrl(settings.issuerLogoUrl || '');
  }, [settings, user?.name]);

  // Check Unread Notices
  const [unreadCount, setUnreadCount] = useState(0);
  React.useEffect(() => {
    const checkUnread = async () => {
      const { count: totalActive } = await supabase.from('platform_notices').select('id', { count: 'exact' }).eq('is_active', true);
      const { count: totalRead } = await supabase.from('notice_reads').select('id', { count: 'exact' }).eq('user_id', user.id);
      if (totalActive !== null && totalRead !== null) {
        setUnreadCount(Math.max(0, totalActive - totalRead));
      }
    };
    checkUnread();
  }, [user.id]);

  // Profile Photo Logic
  const changesUsed = user.profile_photo_changes_used || 0;
  const freeChangesRemaining = Math.max(0, 3 - changesUsed);
  const isPaidChange = freeChangesRemaining === 0;

  const handleProfileUpload = async () => {
    try {
      const publicUrl = await avatarUpload.upload(`${user.id}.webp`);

      // RPC to update profile
      const { error: rpcError } = await supabase.rpc('update_profile_avatar', {
        new_photo_url: publicUrl,
        cost: 0
      });

      if (rpcError) throw rpcError;

      if (onUpdateUser) await onUpdateUser({ ...user, profile_photo_url: publicUrl, profile_photo_changes_used: (user.profile_photo_changes_used || 0) + 1 });

      avatarUpload.cancel();
      toastSuccess('Foto de perfil atualizada com sucesso!');
    } catch (error: any) {
      console.error(error);
      toastError('Erro ao salvar foto: ' + (error.message || 'Erro desconhecido'));
    }
  };

  const handleLogoUpload = async () => {
    try {
      const publicUrl = await logoUpload.upload(`logos/${user.id}_logo.webp`);
      setTempLogoUrl(publicUrl);
      logoUpload.cancel();
      toastSuccess('Logo carregada! Clique em "Salvar Tudo" para confirmar.');
    } catch (error: any) {
      console.error(error);
      toastError('Erro ao salvar logo: ' + (error.message || 'Erro desconhecido'));
    }
  };

  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const total = percentages.reduce((acc, p) => acc + p.percent, 0);

  const handleSave = async () => {
    // Validation
    if (total !== 100) {
      toastError(`A soma das porcentagens é ${total}%. Deve ser exatamente 100%.`);
      return;
    }

    try {
      setIsSaving(true);
      await onSave({
        ...settings,
        defaultCompanyPercent: percentages.find(p => p.id === 'company')?.percent || 0,
        defaultDriverPercent: percentages.find(p => p.id === 'driver')?.percent || 0,
        defaultReservePercent: percentages.find(p => p.id === 'reserve')?.percent || 0,
        customPercentages: percentages,
        issuerName,
        issuerDoc,
        issuerPhone,
        issuerAddressStreet: issuerStreet,
        issuerAddressNumber: issuerNumber,
        issuerAddressNeighborhood: issuerNeighborhood,
        issuerAddressCity: issuerCity,
        issuerAddressState: issuerState,
        issuerAddressZip: issuerZip,
        issuerLogoUrl: tempLogoUrl,
      });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
      toastSuccess('Configurações salvas com sucesso!');
    } catch (error: any) {
      console.error("Failed to save settings:", error);
      toastError("Falha ao salvar: " + (error.message || "Erro desconhecido"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddCategory = () => {
    const newId = `custom_${Date.now()}`;
    setPercentages([...percentages, { id: newId, label: 'Nova Categoria', percent: 0 }]);
  };

  const handleRemoveCategory = (id: string) => {
    setPercentages(percentages.filter(p => p.id !== id));
  };

  const handleUpdateCategory = (id: string, updates: Partial<PercentageCategory>) => {
    setPercentages(percentages.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const toggleTheme = (theme: 'light' | 'dark') => {
    onSave({ ...settings, theme });
  };

  return (
    <div className="pb-24 space-y-6">
      <header className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-base-text dark:text-white">Configurações</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Preferências do usuário</p>
        </div>
      </header>

      {/* Profile Photo Section */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-2">
          <UserIcon className="w-4 h-4 text-brand" />
          Foto de Perfil
        </h2>
        <Card className="flex flex-col sm:flex-row items-center gap-6 p-6">
          <div className="relative group">
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-slate-100 dark:border-slate-800 shadow-lg">
              {avatarUpload.previewUrl ? (
                <img src={avatarUpload.previewUrl} alt="Preview" className="w-full h-full object-cover" />
              ) : user.profile_photo_url ? (
                <img src={user.profile_photo_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600">
                  <UserIcon className="w-12 h-12" />
                </div>
              )}
            </div>
            {avatarUpload.uploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full z-10">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              </div>
            )}
          </div>

          <div className="flex-1 text-center sm:text-left space-y-3 w-full">
            <div>
              <h3 className="font-bold text-lg text-base-text dark:text-white mb-1">
                {avatarUpload.previewUrl ? 'Confirmar Alteração?' : 'Sua Foto de Perfil'}
              </h3>
              {!avatarUpload.previewUrl && (
                <p className={`text-xs font-medium px-2 py-1 rounded inline-block ${freeChangesRemaining > 0 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'}`}>
                  {freeChangesRemaining > 0
                    ? `${freeChangesRemaining} de 3 trocas gratuitas`
                    : 'Trocas gratuitas esgotadas'
                  }
                </p>
              )}
            </div>

            {avatarUpload.previewUrl ? (
              <div className="flex items-center justify-center sm:justify-start gap-3">
                <button
                  onClick={handleProfileUpload}
                  disabled={avatarUpload.uploading}
                  className="flex items-center gap-2 bg-brand text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-brand-600 transition-colors"
                >
                  {avatarUpload.uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  {freeChangesRemaining > 0 ? 'Salvar (Grátis)' : 'Salvar'}
                </button>
                <button
                  onClick={avatarUpload.cancel}
                  disabled={avatarUpload.uploading}
                  className="flex items-center gap-2 bg-slate-100 text-slate-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-200 transition-colors dark:bg-slate-800 dark:text-slate-400"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <div>
                <input
                  type="file"
                  ref={avatarUpload.fileInputRef}
                  className="hidden"
                  accept="image/jpeg, image/png"
                  onChange={avatarUpload.handleFileSelect}
                />
                <Button
                  variant="outline"
                  onClick={() => avatarUpload.fileInputRef.current?.click()}
                  disabled={avatarUpload.uploading}
                  className="w-full sm:w-auto"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  {isPaidChange ? 'Alterar Foto (50 CF)' : 'Alterar Foto'}
                </Button>
                {isPaidChange && (
                  <p className="text-[10px] text-slate-400 mt-2">
                    Você atingiu o limite de trocas gratuitas.
                  </p>
                )}
              </div>
            )}
          </div>
        </Card>
      </section>

      {/* Subscription Section */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-2">
          <Crown className="w-4 h-4 text-brand" />
          Assinatura
        </h2>
        <Card className={`relative overflow-hidden transition-all ${isActive ? 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-full ${isActive ? 'bg-green-100 text-green-600 dark:bg-green-800 dark:text-green-300' : 'bg-slate-100 text-slate-400 dark:bg-slate-700'}`}>
                {isActive ? <Shield className="w-6 h-6" /> : <Zap className="w-6 h-6" />}
              </div>
              <div>
                <h3 className="font-bold text-slate-800 dark:text-white text-lg">
                  {user.plano === 'pro' ? 'Plano Profissional' : (isTrial ? 'Período de Teste' : 'Plano Gratuito')}
                </h3>
                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                  <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  {isActive ? (isTrial ? `${daysRemaining} dias restantes` : 'Assinatura Ativa') : 'Assinatura Inativa'}
                </div>
              </div>
            </div>

            {!isActive && (
              <Button onClick={() => onNavigate('PAYMENT')} className="w-full sm:w-auto bg-brand hover:bg-brand-600 text-white shadow-lg shadow-brand/20">
                <div className="flex items-center gap-2">
                  <Crown className="w-4 h-4" />
                  <span>Fazer Upgrade (R$ 39,99/ano)</span>
                </div>
              </Button>
            )}
            {isTrial && (
              <Button variant="outline" onClick={() => onNavigate('PAYMENT')} className="w-full sm:w-auto border-brand text-brand hover:bg-brand-50 dark:hover:bg-brand-900/20">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  <span>Assinar Definitivo</span>
                </div>
              </Button>
            )}
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
        <div className="flex justify-between items-center">
          <h2 className="text-sm font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-2">
            <SettingsIcon className="w-4 h-4" />
            Porcentagens Padrão
          </h2>
          <button
            onClick={handleAddCategory}
            className="text-xs font-bold text-brand hover:text-brand-600 transition-colors flex items-center gap-1"
          >
            <Upload className="w-3 h-3 rotate-45" /> Adicionar Categoria
          </button>
        </div>
        <Card className="space-y-4">
          {percentages.map((p) => (
            <div key={p.id} className="group relative flex items-end gap-3">
              <div className="flex-1">
                <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1 ml-1">Nome</label>
                <input
                  type="text"
                  value={p.label}
                  onChange={(e) => handleUpdateCategory(p.id, { label: e.target.value })}
                  className="w-full p-3 bg-[#F5F7FA] dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:border-brand dark:text-white text-sm"
                />
              </div>
              <div className="w-24">
                <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1 ml-1">Valor (%)</label>
                <input
                  type="number"
                  value={p.percent}
                  onChange={(e) => handleUpdateCategory(p.id, { percent: Number(e.target.value) })}
                  className="w-full p-3 bg-[#F5F7FA] dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:border-brand dark:text-white text-sm"
                />
              </div>
              {percentages.length > 1 && (
                <button
                  onClick={() => handleRemoveCategory(p.id)}
                  className="p-3 text-slate-400 hover:text-red-500 transition-colors bg-[#F5F7FA] dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700"
                >
                  <AlertTriangle className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}

          <div className={`text-xs p-2 rounded text-center font-bold ${total === 100 ? 'text-green-600 bg-green-50 dark:bg-green-900/20' : 'text-red-600 bg-red-50 dark:bg-red-900/20'}`}>
            Total: {total}% {total !== 100 && '(Deve ser exatamente 100%)'}
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
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
              Logotipo da Empresa
              {!isActive && <Crown className="w-3 h-3 text-brand" />}
            </label>
            <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
              <div className="w-16 h-16 rounded-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center overflow-hidden">
                {logoUpload.previewUrl ? (
                  <img src={logoUpload.previewUrl} alt="Logo Preview" className="w-full h-full object-contain" />
                ) : tempLogoUrl ? (
                  <img src={tempLogoUrl} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <Camera className="w-6 h-6 text-slate-300" />
                )}
              </div>
              <div className="flex-1">
                {logoUpload.previewUrl ? (
                  <div className="flex gap-2">
                    <button
                      onClick={handleLogoUpload}
                      disabled={logoUpload.uploading}
                      className="text-xs bg-brand text-white px-3 py-1.5 rounded-lg font-bold hover:bg-brand-600 disabled:opacity-50"
                    >
                      {logoUpload.uploading ? 'Carregando...' : 'Confirmar'}
                    </button>
                    <button
                      onClick={logoUpload.cancel}
                      className="text-xs bg-slate-200 text-slate-600 px-3 py-1.5 rounded-lg font-bold hover:bg-slate-300"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <>
                    <input
                      type="file"
                      ref={logoUpload.fileInputRef}
                      className="hidden"
                      accept="image/jpeg, image/png"
                      onChange={logoUpload.handleFileSelect}
                    />
                    <button
                      onClick={() => {
                        if (!isActive) {
                          toastError('Upload de logo é exclusivo para PRO');
                          return;
                        }
                        logoUpload.fileInputRef.current?.click();
                      }}
                      className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${isActive ? 'bg-white dark:bg-slate-800 text-brand border border-brand/20 hover:bg-slate-50' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
                    >
                      {tempLogoUrl ? 'Alterar Logo' : 'Adicionar Logo'}
                    </button>
                    <p className="text-[10px] text-slate-400 mt-1">
                      {isActive ? 'PNG ou JPG, máx 2MB' : 'Recurso disponível apenas no plano PRO'}
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
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
        <Button fullWidth onClick={handleSave} disabled={total !== 100 || isSaving}>
          {isSaving ? (
            <div className="flex items-center gap-2 justify-center">
              <Loader2 className="w-4 h-4 animate-spin" />
              Salvando...
            </div>
          ) : (
            isSaved ? 'Configurações Salvas!' : 'Salvar Tudo'
          )}
        </Button>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-2">
          <Megaphone className="w-4 h-4" />
          Comunicados Oficiais
        </h2>
        <Card className="p-4 bg-[#F5F7FA] dark:bg-slate-900 border-none">
          <button
            onClick={() => onNavigate('NOTICES')}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-sm relative overflow-hidden"
          >
            <Megaphone className="w-5 h-5" />
            Ver Central de Avisos
            {unreadCount > 0 && (
              <span className="ml-2 bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full shadow-sm animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>
          <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-2">
            Novidades, manutenções e atualizações importantes.
          </p>
        </Card>
      </section>



      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-2">
          <MessageCircle className="w-4 h-4" />
          Suporte & Ajuda
        </h2>
        <Card className="p-4 bg-[#F5F7FA] dark:bg-slate-900 border-none">
          <button
            onClick={() => onNavigate('SUPPORT')}
            className="w-full bg-brand hover:bg-brand-hover text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-sm"
          >
            <MessageCircle className="w-5 h-5" />
            Abrir Chamado de Suporte
          </button>
          <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-2">
            Precisa de ajuda? Abra um ticket e responderemos em breve.
          </p>
        </Card>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-2">
          <Shield className="w-4 h-4" />
          Segurança
        </h2>
        <Card className="p-0 border-none bg-transparent shadow-none">
          <ActivityHistory userId={user.id} />
        </Card>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-2">
          <Smartphone className="w-4 h-4" />
          Instalar Aplicativo (Celular)
        </h2>
        <Card className="p-5 space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
            O Control Frete pode ser instalado diretamente na tela inicial do seu celular para acesso rápido e experiência de aplicativo nativo.
          </p>
          
          <div className="space-y-3">
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-2">
                🍎 iPhone (iOS - Safari)
              </h3>
              <ol className="text-xs text-slate-600 dark:text-slate-400 space-y-2 list-decimal list-inside ml-1">
                <li>Abra o site no navegador <strong>Safari</strong>.</li>
                <li>Toque no botão de <strong>Compartilhar</strong> <Share className="inline w-3 h-3 mx-1" /> na barra inferior.</li>
                <li>Role para baixo e selecie <strong>"Adicionar à Tela de Início"</strong> <PlusSquare className="inline w-3 h-3 mx-1" />.</li>
                <li>Confirme clicando em <strong>Adicionar</strong> no canto superior direito.</li>
              </ol>
            </div>
            
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-2">
                🤖 Android (Chrome)
              </h3>
              <ol className="text-xs text-slate-600 dark:text-slate-400 space-y-2 list-decimal list-inside ml-1">
                <li>Abra o site no navegador <strong>Google Chrome</strong>.</li>
                <li>Toque nos <strong>Três Pontinhos (Menu)</strong> no canto superior direito.</li>
                <li>Selecione <strong>"Adicionar à tela inicial"</strong> ou <strong>"Instalar aplicativo"</strong>.</li>
                <li>Confirme clicando em <strong>Adicionar</strong>.</li>
              </ol>
            </div>
          </div>
        </Card>
      </section>

      <section className="space-y-3 pt-6 border-t border-slate-200 dark:border-slate-700">
        <h2 className="text-sm font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-2">
          <Info className="w-4 h-4" />
          Sobre o App
        </h2>
        <div className="text-center">
          <p className="text-xs text-slate-400 dark:text-slate-600">Control Frete v1.0</p>
          <p className="text-[10px] text-slate-300 dark:text-slate-700 mt-1">Desenvolvido por Kiel Tech Studio</p>
        </div>
      </section>
    </div>
  );
};