import React, { useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { User } from '../types';
import { Button } from './Button';
import { validateCPF, maskCPF } from '../utils';
import { Mail, Lock, User as UserIcon, Eye, EyeOff, FileText, ArrowRight, Loader2, CheckCircle, ChevronLeft } from 'lucide-react';
import { supabase } from '../supabase';

interface AuthProps {
  onLogin: (user: User) => void;
  onBack?: () => void;
  initialView?: AuthView;
}

type AuthView = 'LOGIN' | 'REGISTER' | 'SUCCESS' | 'FORGOT_PASSWORD' | 'UPDATE_PASSWORD' | 'CONFIRM_EMAIL';

// Defined OUTSIDE to prevent re-mounting on every render (Fixes focus loss issue)
const InputField = ({
  label, value, onChange, type = 'text', icon, isPass, onTogglePass, passVisible
}: any) => (
  <div className="space-y-1">
    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">{label}</label>
    <div className="relative group">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand transition-colors">
        {icon}
      </div>
      <input
        type={isPass ? (passVisible ? 'text' : 'password') : type}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full pl-10 pr-10 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all dark:text-white font-medium"
      />
      {isPass && (
        <button
          type="button"
          onClick={onTogglePass}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
        >
          {passVisible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      )}
    </div>
  </div>
);

export const Auth: React.FC<AuthProps> = ({ onLogin, onBack, initialView = 'LOGIN' }) => {
  const [view, setView] = useState<AuthView>(initialView);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [recoveryStep, setRecoveryStep] = useState<'VALIDATE' | 'RESET'>('VALIDATE');
  const [justRegisteredUser, setJustRegisteredUser] = useState<User | null>(null);
  const [resendLoading, setResendLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    cpf: '',
    password: '',
    confirmPassword: ''
  });

  // Se o usuário fechar a aba de login do Google sem concluir, não deixa o
  // spinner girando pra sempre.
  React.useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const listenerPromise = Browser.addListener('browserFinished', () => {
      setLoading(false);
    });
    return () => {
      listenerPromise.then(listener => listener.remove());
    };
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email.includes('@')) { setError('Informe um e-mail válido.'); return; }
    if (!validateCPF(formData.cpf)) { setError('CPF inválido.'); return; }

    setLoading(true);
    setError(null);

    try {
      // E-mail + CPF só confirmam que a conta existe. A troca de senha em si
      // só acontece depois que a pessoa clica no link enviado para o e-mail
      // cadastrado (fluxo tratado em UPDATE_PASSWORD via handleUpdatePassword).
      const { data, error } = await supabase.functions.invoke('reset-password-admin', {
        body: {
          email: formData.email,
          cpf: formData.cpf
        }
      });

      if (!error && !data?.error) {
        alert('Enviamos um link de redefinição de senha para ' + formData.email + '. Verifique sua caixa de entrada (e o SPAM).');
        setView('LOGIN');
        return;
      }

      // Se a Edge Function retornar erro de validação (ex: CPF incorreto)
      if (data?.error) {
        throw new Error(data.error);
      }

      // Se falhar o envio para a Edge Function (ex: função não implantada no Supabase), ativa fallback via e-mail
      console.warn('Edge Function indisponível. Ativando envio por e-mail...', error);
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(formData.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (resetErr) throw resetErr;

      alert('Enviamos um e-mail de recuperação para ' + formData.email + '. Verifique sua caixa de entrada ou SPAM.');
      setView('LOGIN');

    } catch (err: any) {
      setError(err.message || 'Erro ao solicitar redefinição de senha. Verifique seus dados.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password.length < 6) { setError('Senha deve ter min. 6 caracteres.'); return; }
    if (formData.password !== formData.confirmPassword) { setError('As senhas não coincidem.'); return; }

    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.updateUser({
        password: formData.password
      });

      if (error) throw error;

      alert('Senha atualizada com sucesso!');
      setView('LOGIN');
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar senha.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    if (!formData.email) return;
    setResendLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: formData.email,
        options: {
          emailRedirectTo: window.location.origin
        }
      });
      if (error) throw error;
      alert('Link de confirmação reenviado!');
    } catch (err: any) {
      setError(err.message || 'Erro ao reenviar confirmação.');
    } finally {
      setResendLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    let v = value;
    if (field === 'cpf') v = maskCPF(value);

    // Correct pattern: preserves previous state
    setFormData(prev => ({ ...prev, [field]: v }));
    setError(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      });

      if (error) throw error;

      if (data.user) {
        // Fetch Profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        // Robustness: If profile missing (shouldn't happen with new flow), treat as basic user
        const userName = profile?.name || 'Usuário';
        const userCpf = profile?.cpf || '';
        const userPlan = profile?.plano || 'FREE';

        const userObj: User = {
          id: data.user.id,
          email: data.user.email!,
          name: userName,
          cpf: userCpf,
          password: '', // do not keep in memory
          createdAt: profile?.created_at || new Date().toISOString(),
          isPremium: userPlan === 'PRO',
          plano: userPlan === 'PRO' ? 'pro' : 'free',
          // Default others to avoid crashes
          trialStart: new Date().toISOString(),
          trialEnd: new Date().toISOString()
        };

        onLogin(userObj);

        // Security Log: Login
        supabase.from('account_activity_logs').insert([{
          user_id: data.user.id,
          action: 'Login realizado',
          actor: 'user'
        }]).then(); // Fire and forget
      }
    } catch (err: any) {
      console.error(err);
      // Supabase retorna "Email not confirmed" quando a conta existe mas o
      // e-mail nunca foi confirmado. Sem essa checagem, isso caía no mesmo
      // "E-mail ou senha incorretos" de sempre — a pessoa achava que tinha
      // digitado a senha errada, quando na verdade só faltava confirmar o
      // e-mail. Manda direto pra tela de confirmação, com o botão de reenvio.
      if (err?.message?.toLowerCase().includes('email not confirmed')) {
        setView('CONFIRM_EMAIL');
      } else {
        setError('E-mail ou senha incorretos.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 1. Basic Validation
    if (!formData.name.trim()) { setError('Nome é obrigatório.'); return; }
    if (!validateCPF(formData.cpf)) { setError('CPF inválido.'); return; }
    if (!formData.email.includes('@')) { setError('E-mail inválido.'); return; }
    if (formData.password.length < 6) { setError('Senha deve ter min. 6 caracteres.'); return; }
    if (formData.password !== formData.confirmPassword) { setError('As senhas não coincidem.'); return; }

    setLoading(true);

    try {
      // 1.5. Validate CPF uniqueness on backend
      const { data: cpfExists, error: rpcError } = await supabase.rpc('check_cpf_exists', {
        p_cpf: formData.cpf
      });
      if (cpfExists) {
        setError('Este CPF já está cadastrado no sistema.');
        setLoading(false);
        return;
      }

      // 1.6 Resolve Referral Code (Before Signup)
      let finalReferrerId = null;
      const params = new URLSearchParams(window.location.search);
      const refCode = params.get('ref');

      if (refCode) {
        try {
          // Check if it's a UUID (Legacy) or a Short Code (New)
          const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(refCode);

          if (isUUID) {
            finalReferrerId = refCode;
          } else {
            // Resolve Short Code to UUID
            const { data: refProfile } = await supabase
              .from('profiles')
              .select('id')
              .eq('referral_code', refCode.toUpperCase())
              .single();

            if (refProfile) {
              finalReferrerId = refProfile.id;
            }
          }
        } catch (e) {
          console.warn("Could not resolve referral", e);
        }
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            name: formData.name,
            cpf: formData.cpf,
            referrer_id: finalReferrerId || undefined
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        const userId = authData.user.id;

        // Se o Supabase exigir confirmação, identities ou session dirão.
        // Se session for null, provavelmente enviou o email.
        const needsConfirmation = !authData.session;

        // Profile and Settings are handled by 'handle_new_user' trigger on auth.users insert.
        // No need to manually insert here.

        // 5. Success
        const newUser: User = {
          id: userId,
          name: formData.name,
          cpf: formData.cpf,
          email: formData.email,
          createdAt: new Date().toISOString(),
          isPremium: false,
          plano: 'free',
          password: ''
        };

        if (needsConfirmation) {
          setView('CONFIRM_EMAIL');
        } else {
          setJustRegisteredUser(newUser);
          setView('SUCCESS');
        }

        // Security Log: Register
        supabase.from('account_activity_logs').insert([{
          user_id: userId,
          action: 'Conta criada',
          actor: 'user'
        }]).then();
      }
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes('already registered')) {
        setError('Este e-mail já possui conta.');
      } else {
        setError(err.message || 'Erro ao criar conta.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      if (Capacitor.isNativePlatform()) {
        // WebViews embutidas são bloqueadas pelo Google pra login OAuth, então
        // abrimos numa aba de navegador in-app (Custom Tab) e voltamos pro app
        // via link profundo (com.controlfrete.app://login-callback), capturado
        // em App.tsx pelo listener appUrlOpen.
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: 'com.controlfrete.app://login-callback',
            skipBrowserRedirect: true,
          },
        });
        if (error) throw error;
        if (data?.url) {
          await Browser.open({ url: data.url });
        }
        // O loading fica ativo até o listener appUrlOpen completar a sessão
        // (que muda currentUser e desmonta essa tela) ou o usuário cancelar.
      } else {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${window.location.origin}/`,
          }
        });
        if (error) throw error;
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro ao iniciar login com Google.');
      setLoading(false);
    }
  };

  // --- RENDERS ---

  if (view === 'SUCCESS') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 animate-fadeIn text-center">
        <div className="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 p-4 rounded-full mb-6">
          <CheckCircle size={48} />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Conta Criada!</h2>
        <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-sm">
          Seu cadastro foi realizado com sucesso no plano FREE.
        </p>
        <Button
          fullWidth
          onClick={() => justRegisteredUser && onLogin(justRegisteredUser)}
          className="max-w-xs"
        >
          ACESSAR SISTEMA <ArrowRight className="inline ml-2" size={18} />
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md glass rounded-2xl overflow-hidden fintech-shadow animate-scaleUp">

        {/* Header */}
        <div className="bg-brand p-8 text-center text-white relative overflow-hidden">
          <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
          <img src="/logo-official.png" className="h-12 mx-auto mb-4 drop-shadow-md brightness-0 invert relative" alt="Logo" />
          <h1 className="text-2xl font-bold tracking-tight uppercase relative">Control Frete</h1>
          <p className="text-blue-100 text-xs font-bold uppercase tracking-widest mt-1 relative">
            {view === 'LOGIN' ? 'Login Seguro' : 'Criar Nova Conta'}
          </p>
        </div>

        <div className="p-8">
          {error && (
            <div className="mb-6 mx-auto bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-bold uppercase tracking-wide p-3 rounded-lg border border-red-100 dark:border-red-900/30 text-center animate-shake">
              {error}
            </div>
          )}

          {view === 'LOGIN' ? (
            <div className="space-y-5">
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center justify-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors group"
              >
                <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
                <span className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide group-hover:text-slate-900 dark:group-hover:text-white">
                  Entrar com Google
                </span>
              </button>

              <div className="relative flex items-center justify-center">
                <div className="border-t border-slate-200 dark:border-slate-700 w-full absolute"></div>
                <span className="bg-white dark:bg-slate-900 px-3 text-[10px] text-slate-400 font-bold uppercase tracking-widest relative z-10">
                  Ou continue com e-mail
                </span>
              </div>

              <form onSubmit={handleLogin} className="space-y-5">
                <InputField
                  label="E-mail"
                  value={formData.email}
                  onChange={(v: string) => handleChange('email', v)}
                  icon={<Mail size={18} />}
                />
                <InputField
                  label="Senha"
                  value={formData.password}
                  onChange={(v: string) => handleChange('password', v)}
                  type="password"
                  icon={<Lock size={18} />}
                  isPass
                  passVisible={showPassword}
                  onTogglePass={() => setShowPassword(!showPassword)}
                />

                <Button type="submit" fullWidth disabled={loading} className="py-4">
                  {loading ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'ENTRAR'}
                </Button>

                {import.meta.env.DEV && (
                  <button
                    type="button"
                    onClick={() => {
                      onLogin({
                        id: 'dev-mode-user',
                        email: 'dev@localhost',
                        name: 'Usuário de Teste (Dev)',
                        cpf: '000.000.000-00',
                        password: '',
                        createdAt: new Date().toISOString(),
                        isPremium: true,
                        plano: 'pro',
                        account_status: 'active'
                      });
                    }}
                    className="w-full py-2.5 border border-dashed border-slate-300 dark:border-slate-600 text-slate-400 dark:text-slate-500 rounded-lg font-bold text-[10px] uppercase tracking-widest hover:border-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                  >
                    ⚙ Entrar como Teste (Localhost)
                  </button>
                )}

                <div className="flex flex-col items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setView('FORGOT_PASSWORD')}
                    className="text-slate-400 hover:text-brand text-[10px] font-bold uppercase tracking-wider transition-colors"
                  >
                    Esqueceu sua senha?
                  </button>
                  <div className="w-full border-t border-slate-100 dark:border-slate-800 my-1"></div>
                  <button
                    type="button"
                    onClick={() => setView('REGISTER')}
                    className="text-slate-500 hover:text-brand text-xs font-bold uppercase tracking-wider transition-colors"
                  >
                    Não tem conta? Cadastre-se
                  </button>
                </div>
              </form>
            </div>
          ) : view === 'FORGOT_PASSWORD' ? (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <button
                type="button"
                onClick={() => setView('LOGIN')}
                className="flex items-center text-slate-400 hover:text-slate-600 text-[10px] font-bold uppercase tracking-widest mb-2 transition-colors"
              >
                <ChevronLeft size={14} className="mr-1" /> Voltar para Login
              </button>

              <div className="text-center mb-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Recuperar Senha</h3>
                <p className="text-slate-500 text-xs">Confirme seu E-mail e CPF cadastrados. Vamos enviar um link de redefinição de senha para o seu e-mail.</p>
              </div>

              <InputField
                label="E-mail"
                value={formData.email}
                onChange={(v: string) => handleChange('email', v)}
                icon={<Mail size={18} />}
              />

              <InputField
                label="CPF"
                value={formData.cpf}
                onChange={(v: string) => handleChange('cpf', v)}
                icon={<FileText size={18} />}
              />

              <Button type="submit" fullWidth disabled={loading} className="py-4 mt-2">
                {loading ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'ENVIAR LINK DE REDEFINIÇÃO'}
              </Button>
            </form>
          ) : view === 'UPDATE_PASSWORD' ? (
            <form onSubmit={handleUpdatePassword} className="space-y-5">
              <div className="text-center mb-6">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Nova Senha</h3>
                <p className="text-slate-500 text-xs">Crie uma nova senha de acesso para sua conta.</p>
              </div>

              <InputField
                label="Nova Senha"
                value={formData.password}
                onChange={(v: string) => handleChange('password', v)}
                type="password"
                icon={<Lock size={18} />}
                isPass
                passVisible={showPassword}
                onTogglePass={() => setShowPassword(!showPassword)}
              />
              <InputField
                label="Confirmar Nova Senha"
                value={formData.confirmPassword}
                onChange={(v: string) => handleChange('confirmPassword', v)}
                type="password"
                icon={<Lock size={18} />}
                isPass
                passVisible={showConfirmPassword}
                onTogglePass={() => setShowConfirmPassword(!showConfirmPassword)}
              />

              <Button type="submit" fullWidth disabled={loading} className="py-4">
                {loading ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'SALVAR NOVA SENHA'}
              </Button>
            </form>
          ) : view === 'CONFIRM_EMAIL' ? (
            <div className="text-center py-6 animate-fadeIn">
              <div className="bg-brand/10 text-brand p-4 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                <Mail size={40} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 uppercase tracking-tight">Verifique seu E-mail</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm mb-8 leading-relaxed">
                Enviamos um link de confirmação para <span className="font-bold text-slate-800 dark:text-white">{formData.email}</span>.
                Por favor, acesse seu e-mail para ativar sua conta.
              </p>

              <div className="space-y-3">
                <Button fullWidth onClick={handleResendConfirmation} disabled={resendLoading} variant="outline">
                  {resendLoading ? <Loader2 className="animate-spin mx-auto" size={18} /> : 'REENVIAR LINK'}
                </Button>
                <button
                  onClick={() => setView('LOGIN')}
                  className="w-full py-3 text-slate-400 hover:text-brand text-[10px] font-bold uppercase tracking-widest transition-colors"
                >
                  Voltar para Login
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <button
                type="button"
                onClick={() => setView('LOGIN')}
                className="flex items-center text-slate-400 hover:text-slate-600 text-[10px] font-bold uppercase tracking-widest mb-4 transition-colors"
              >
                <ChevronLeft size={14} className="mr-1" /> Voltar para Login
              </button>

              <div className="grid grid-cols-1 gap-4">
                <InputField
                  label="Nome Completo"
                  value={formData.name}
                  onChange={(v: string) => handleChange('name', v)}
                  icon={<UserIcon size={18} />}
                />
                <InputField
                  label="CPF"
                  value={formData.cpf}
                  onChange={(v: string) => handleChange('cpf', v)}
                  icon={<FileText size={18} />}
                />
                <InputField
                  label="E-mail"
                  value={formData.email}
                  onChange={(v: string) => handleChange('email', v)}
                  icon={<Mail size={18} />}
                />
                <InputField
                  label="Senha"
                  value={formData.password}
                  onChange={(v: string) => handleChange('password', v)}
                  type="password"
                  icon={<Lock size={18} />}
                  isPass
                  passVisible={showPassword}
                  onTogglePass={() => setShowPassword(!showPassword)}
                />
                <InputField
                  label="Confirmar Senha"
                  value={formData.confirmPassword}
                  onChange={(v: string) => handleChange('confirmPassword', v)}
                  type="password"
                  icon={<Lock size={18} />}
                  isPass
                  passVisible={showConfirmPassword}
                  onTogglePass={() => setShowConfirmPassword(!showConfirmPassword)}
                />
              </div>

              <Button type="submit" fullWidth disabled={loading} className="py-4 mt-2">
                {loading ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'CRIAR CONTA GRÁTIS'}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};