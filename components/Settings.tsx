import React, { useState } from 'react';
import { AppSettings, User, ViewState } from '../types';
import { Card } from './Card';
import { Button } from './Button';
import { Settings as SettingsIcon, Info, FileText, Moon, Sun, MapPin, Crown, CheckCircle, Zap, ArrowRight, Shield, Camera, Loader2, User as UserIcon, MessageCircle, Megaphone, Users, DollarSign } from 'lucide-react';
import { supabase } from '../supabase';

import { useSubscription } from '../hooks/useSubscription';
import { ActivityHistory } from './ActivityHistory';

interface SettingsProps {
  settings: AppSettings;
  user: User;
  onSave: (newSettings: AppSettings) => Promise<void>;
  onNavigate: (view: ViewState) => void;
  onUpdateUser?: (user: User) => Promise<void>;
}

export const Settings: React.FC<SettingsProps> = ({ settings, user, onSave, onNavigate, onUpdateUser }) => {
  /* Removed handleStripeUpgrade */
  const { isTrial, isActive, daysRemaining } = useSubscription(user);

  // Initialize state with props
  const [company, setCompany] = useState(settings.defaultCompanyPercent);
  const [driver, setDriver] = useState(settings.defaultDriverPercent);
  const [reserve, setReserve] = useState(settings.defaultReservePercent);

  const [issuerName, setIssuerName] = useState(settings.issuerName || user?.name || '');
  const [issuerDoc, setIssuerDoc] = useState(settings.issuerDoc || '');
  const [issuerPhone, setIssuerPhone] = useState(settings.issuerPhone || '');

  const [issuerStreet, setIssuerStreet] = useState(settings.issuerAddressStreet || '');
  const [issuerNumber, setIssuerNumber] = useState(settings.issuerAddressNumber || '');
  const [issuerNeighborhood, setIssuerNeighborhood] = useState(settings.issuerAddressNeighborhood || '');
  const [issuerCity, setIssuerCity] = useState(settings.issuerAddressCity || '');
  const [issuerState, setIssuerState] = useState(settings.issuerAddressState || '');
  const [issuerZip, setIssuerZip] = useState(settings.issuerAddressZip || '');

  // Sync state with props when they change (e.g. initial fetch completes)
  React.useEffect(() => {
    setCompany(settings.defaultCompanyPercent);
    setDriver(settings.defaultDriverPercent);
    setReserve(settings.defaultReservePercent);
    setIssuerName(settings.issuerName || user?.name || '');
    setIssuerDoc(settings.issuerDoc || '');
    setIssuerPhone(settings.issuerPhone || '');
    setIssuerStreet(settings.issuerAddressStreet || '');
    setIssuerNumber(settings.issuerAddressNumber || '');
    setIssuerNeighborhood(settings.issuerAddressNeighborhood || '');
    setIssuerCity(settings.issuerAddressCity || '');
    setIssuerState(settings.issuerAddressState || '');
    setIssuerZip(settings.issuerAddressZip || '');
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
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const changesUsed = user.profile_photo_changes_used || 0;
  const freeChangesRemaining = Math.max(0, 3 - changesUsed);
  const isPaidChange = freeChangesRemaining === 0;

  const processImage = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const size = 300;
        canvas.width = size;
        canvas.height = size;
        const minDim = Math.min(img.width, img.height);
        const sx = (img.width - minDim) / 2;
        const sy = (img.height - minDim) / 2;
        if (ctx) {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, size, size);
          ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);
        }
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Canvas blob error'));
        }, 'image/webp', 0.85);
      };
      img.onerror = reject;
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      alert('Formato inválido. Use JPG ou PNG.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert('Arquivo muito grande. Máximo 2MB.');
      return;
    }

    // Check dimensions
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = async () => {
      if (img.width < 150 || img.height < 150) {
        alert('A imagem deve ter pelo menos 150x150 pixels.');
        return;
      }
      try {
        const processed = await processImage(file);
        setPreviewBlob(processed);
        setPreviewUrl(URL.createObjectURL(processed));
      } catch (err) {
        console.error(err);
        alert('Erro ao processar imagem.');
      }
    };
  };

  const handleConfirmUpload = async () => {
    if (!previewBlob) return;

    const cost = 0;

    try {
      setUploading(true);
      // Removed redundant 'avatars/' prefix since we are already IN the 'avatars' bucket
      const filePath = `${user.id}.webp`;
      const processedFile = new File([previewBlob], 'avatar.webp', { type: 'image/webp' });

      // Upload
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, processedFile, { upsert: true });

      if (uploadError) throw uploadError;

      // Get Public URL
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);

      // RPC to update profile
      const { error: rpcError } = await supabase.rpc('update_profile_avatar', {
        new_photo_url: `${publicUrl}?t=${Date.now()}`,
        cost: 0 // Logic handled in backend or irrelevant for free changes
      });

      if (rpcError) throw rpcError;

      if (onUpdateUser) await onUpdateUser({ ...user, profile_photo_url: publicUrl, profile_photo_changes_used: (user.profile_photo_changes_used || 0) + 1 });
      handleCancelPreview();
      alert('Foto de perfil atualizada com sucesso!');
    } catch (error: any) {
      console.error(error);
      alert('Erro ao salvar foto: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setUploading(false);
    }
  };

  const handleCancelPreview = () => {
    setPreviewUrl(null);
    setPreviewBlob(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false); // Add saving state

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await onSave({
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
      alert('Dados e configurações salvos com sucesso!');
    } catch (error: any) {
      console.error("Failed to save settings:", error);
      alert("Falha ao salvar configurações: " + (error.message || "Erro desconhecido"));
    } finally {
      setIsSaving(false);
    }
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

      {/* Profile Photo Section */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-2">
          <UserIcon className="w-4 h-4 text-brand" />
          Foto de Perfil
        </h2>
        <Card className="flex flex-col sm:flex-row items-center gap-6 p-6">
          <div className="relative group">
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-slate-100 dark:border-slate-800 shadow-lg">
              {previewUrl ? (
                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
              ) : user.profile_photo_url ? (
                <img src={user.profile_photo_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600">
                  <UserIcon className="w-12 h-12" />
                </div>
              )}
            </div>
            {uploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full z-10">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              </div>
            )}
          </div>

          <div className="flex-1 text-center sm:text-left space-y-3 w-full">
            <div>
              <h3 className="font-bold text-lg text-base-text dark:text-white mb-1">
                {previewUrl ? 'Confirmar Alteração?' : 'Sua Foto de Perfil'}
              </h3>
              {!previewUrl && (
                <p className={`text-xs font-medium px-2 py-1 rounded inline-block ${freeChangesRemaining > 0 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'}`}>
                  {freeChangesRemaining > 0
                    ? `${freeChangesRemaining} de 3 trocas gratuitas`
                    : 'Trocas gratuitas esgotadas'
                  }
                </p>
              )}
            </div>

            {previewUrl ? (
              <div className="flex items-center justify-center sm:justify-start gap-3">
                <button
                  onClick={handleConfirmUpload}
                  disabled={uploading}
                  className="flex items-center gap-2 bg-brand text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-brand-600 transition-colors"
                >
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  {freeChangesRemaining > 0 ? 'Salvar (Grátis)' : 'Salvar'}
                </button>
                <button
                  onClick={handleCancelPreview}
                  disabled={uploading}
                  className="flex items-center gap-2 bg-slate-100 text-slate-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-200 transition-colors dark:bg-slate-800 dark:text-slate-400"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/jpeg, image/png"
                  onChange={handleFileSelect}
                />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
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
        <Card className={`relative overflow-hidden border-2 transition-all ${isActive ? 'border-accent-success bg-green-50/50 dark:bg-green-900/10' : 'border-brand/20'}`}>
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="font-black text-slate-800 dark:text-white uppercase text-sm">
                Plano {user.plano === 'pro' ? 'Profissional' : (isTrial ? 'Período de Teste' : 'Gratuito')}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isActive
                  ? (isTrial ? `Status: Ativo (${daysRemaining} dias restantes)` : `Status: ${user.status_assinatura === 'ativa' ? 'Ativa' : 'Inadimplente'}`)
                  : 'Upgrade para liberar todas as funções'}
              </p>
            </div>
            {isActive ? (
              <div className={`p-2 rounded-full shadow-lg ${isTrial ? 'bg-brand text-white' : 'bg-accent-success text-white shadow-accent-success/30'}`}>
                {isTrial ? <Zap className="w-5 h-5" /> : <Shield className="w-5 h-5" />}
              </div>
            ) : (
              <Zap className="w-6 h-6 text-brand animate-pulse" />
            )}
          </div>

          {!isActive && (
            <div className="space-y-4">
              <button
                onClick={() => onNavigate('PAYMENT')}
                className="w-full bg-brand text-white py-3 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-brand-600 transition-all active:scale-95 shadow-lg shadow-brand/20"
              >
                <>
                  Assinar Plano Pro
                  <ArrowRight className="w-4 h-4" />
                </>
              </button>
            </div>
          )}

          {isTrial && (
            <div className="space-y-4">
              <button
                onClick={() => onNavigate('PAYMENT')}
                className="w-full bg-white text-brand border border-brand/20 py-3 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-50 transition-all active:scale-95 shadow-sm"
              >
                <>
                  Assinar Plano Pro
                  <ArrowRight className="w-4 h-4" />
                </>
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
          <Users className="w-4 h-4" />
          Indique e Ganhe
        </h2>
        <Card className="p-4 bg-gradient-to-r from-brand/10 to-brand-secondary/10 dark:from-brand/20 dark:to-brand-secondary/20 border-brand/20">
          <button
            onClick={() => onNavigate('REFERRALS')}
            className="w-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-lg hover:scale-[1.02]"
          >
            <Users className="w-5 h-5" />
            Acessar Painel de Indicações
          </button>
          <div className="flex items-center justify-center gap-4 mt-3">
            <div className="flex items-center gap-1 text-xs text-brand font-bold">
              <DollarSign className="w-3 h-3" />
              Ganhe 20%
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <CheckCircle className="w-3 h-3" />
              Sem limites
            </div>
          </div>
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
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-sm"
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