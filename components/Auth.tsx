import React, { useState } from 'react';
import { User } from '../types';
import { Button } from './Button';
import { validateCPF, maskCPF, generateReferralCode } from '../utils';
import { Truck, Mail, Lock, User as UserIcon, Eye, EyeOff, FileText, ArrowRight, Loader2, Ticket, CheckCircle, ChevronLeft } from 'lucide-react';
import { supabase } from '../supabase';

interface AuthProps {
  onLogin: (user: User) => void;
}

type AuthView = 'LOGIN_OFFER' | 'REGISTER_FLOW' | 'FORGOT' | 'REGISTER_SUCCESS';

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [view, setView] = useState<AuthView>('LOGIN_OFFER');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [registeredUser, setRegisteredUser] = useState<User | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    cpf: '',
    password: '',
    confirmPassword: '',
    referralCode: ''
  });

  const handleChange = (field: string, value: string) => {
    let finalValue = value;
    if (field === 'cpf') finalValue = maskCPF(value);
    if (field === 'referralCode') finalValue = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    setFormData(prev => ({ ...prev, [field]: finalValue }));
    setError('');
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      setError('Preencha e-mail e senha.');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      });

      if (error) throw error;

      if (data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (profile) {
          // Adapt profile to User type if needed, or ensure table matches
          const user: User = {
            ...profile,
            // Ensure these fields exist or handle undefined
            email: data.user.email!,
            password: '' // Don't keep password in memory
          };
          onLogin(user);
        } else {
          setError('Perfil não encontrado.');
        }
      }
    } catch (err: any) {
      console.error(err);
      setError('E-mail ou senha incorretos.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) { setError('Nome obrigatório.'); return; }
    if (!validateCPF(formData.cpf)) { setError('CPF inválido.'); return; }
    if (!formData.email.includes('@')) { setError('E-mail inválido.'); return; }
    if (formData.password.length < 6) { setError('Senha curta (min 6).'); return; }
    if (formData.password !== formData.confirmPassword) { setError('Senhas não conferem.'); return; }

    setLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password
      });

      if (authError) throw authError;

      if (authData.user) {
        const newUser: Partial<User> = {
          id: authData.user.id,
          name: formData.name,
          cpf: formData.cpf,
          email: formData.email,
          createdAt: new Date().toISOString(),
          isPremium: false,
          referralCode: generateReferralCode(formData.name),
          referralBalance: 0,
          referralCount: 0,
          trialStart: new Date().toISOString(),
          trialEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        };

        if (formData.referralCode) {
          newUser.referredBy = formData.referralCode;
        }

        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: newUser.id,
              name: newUser.name,
              cpf: newUser.cpf,
              email: newUser.email,
              is_premium: newUser.isPremium,
              referred_by: newUser.referredBy || null,
              referral_code: newUser.referralCode,
              referral_balance: 0,
              referral_count: 0,
              trial_start: newUser.trialStart,
              trial_end: newUser.trialEnd
            }
          ]);

        if (profileError) {
          console.error("Profile creation failed", profileError);
          throw profileError;
        }

        // Create default settings
        await supabase.from('settings').insert([{ user_id: newUser.id }]);

        setRegisteredUser(newUser as User);
        setView('REGISTER_SUCCESS');
      }
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes('profiles_cpf_key') || err.message?.includes('duplicate key value')) {
        setError('CPF já cadastrado. Tente fazer login.');
      } else if (err.message?.includes('profiles_email_key')) {
        setError('E-mail já está em uso.');
      } else if (err.message?.includes('User already registered')) {
        setError('E-mail já cadastrado no sistema.');
      } else {
        setError('Erro ao criar conta: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const renderInput = (
    label: string,
    id: keyof typeof formData,
    type: string = 'text',
    icon: React.ReactNode,
    isPasswordToggle = false,
    optional = false
  ) => (
    <div className="relative group">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-secondary transition-colors">
        {icon}
      </div>
      <input
        type={isPasswordToggle ? (showPassword ? 'text' : 'password') : type}
        value={formData[id as keyof typeof formData]}
        onChange={(e) => handleChange(id as string, e.target.value)}
        placeholder={label}
        className="w-full pl-12 pr-10 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-brand-secondary focus:bg-white dark:focus:bg-slate-800 transition-all text-base-text dark:text-white placeholder-slate-400 text-sm font-medium"
      />
      {isPasswordToggle && (
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
        >
          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>
      )}
      {optional && !formData[id as keyof typeof formData] && (
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-roboto font-bold text-slate-400 uppercase">
          Opcional
        </span>
      )}
    </div>
  );

  if (view === 'REGISTER_SUCCESS') {
    return (
      <div className="min-h-screen bg-base-bg dark:bg-slate-950 flex flex-col justify-center p-6 animate-fadeIn items-center text-center">
        <div className="bg-brand text-white p-6 rounded-3xl shadow-xl shadow-brand/20 mb-8">
          <CheckCircle className="w-16 h-16" />
        </div>
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-4 tracking-tight uppercase">Bem-vindo ao Control Frete!</h1>
        <p className="text-slate-500 dark:text-slate-400 max-w-xs mb-8">
          Sua conta foi criada com sucesso. Você tem <span className="text-brand dark:text-brand-300 font-bold">7 dias de acesso total gratuito</span> para testar todas as funcionalidades.
        </p>
        <Button fullWidth onClick={() => registeredUser && onLogin(registeredUser)} className="h-16">
          COMEÇAR AGORA <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
        <p className="mt-6 text-[10px] text-slate-400 font-bold uppercase tracking-widest">Login automático realizado</p>
      </div>
    );
  }

  if (view === 'LOGIN_OFFER') {
    return (
      <div className="min-h-screen bg-base-bg dark:bg-slate-950 flex flex-col justify-center p-6 animate-fadeIn">
        <div className="max-w-md mx-auto w-full space-y-10">
          <header className="text-center space-y-3">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-brand rounded-2xl shadow-xl shadow-brand/20 mb-4">
              <Truck className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-base-text dark:text-white tracking-tight uppercase">CONTROL FRETE</h1>
            <p className="text-base-subtext dark:text-slate-400 text-[10px] font-roboto font-bold uppercase tracking-[0.2em]">Gestão Profissional para Autônomos</p>
          </header>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            {renderInput('Seu e-mail', 'email', 'email', <Mail className="w-5 h-5" />)}
            {renderInput('Sua senha', 'password', 'password', <Lock className="w-5 h-5" />, true)}

            {error && (
              <div className="text-accent-error text-[10px] text-center font-roboto font-bold uppercase tracking-wider bg-red-50 dark:bg-red-900/20 p-2.5 rounded-lg border border-red-100">
                {error}
              </div>
            )}

            <Button type="submit" fullWidth disabled={loading} className="py-4 mt-2">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Entrar no sistema'}
            </Button>
          </form>

          <div className="text-center">
            <button
              onClick={() => setView('REGISTER_FLOW')}
              className="text-brand-secondary font-roboto font-bold text-[10px] uppercase tracking-widest hover:underline"
            >
              Não tem conta? Ganhe 7 dias grátis
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'REGISTER_FLOW') {
    return (
      <div className="min-h-screen bg-base-bg dark:bg-slate-950 flex flex-col justify-center p-6 animate-slideUp">
        <div className="max-w-md mx-auto w-full">
          <button onClick={() => setView('LOGIN_OFFER')} className="flex items-center text-base-subtext font-roboto font-bold text-[10px] mb-8 uppercase tracking-widest transition-colors hover:text-brand">
            <ChevronLeft className="w-5 h-5 mr-1" /> Voltar
          </button>

          <div className="space-y-6">
            <div className="px-1">
              <h2 className="text-2xl font-bold text-base-text dark:text-white tracking-tight uppercase">Criar Conta</h2>
              <p className="text-base-subtext text-xs mt-1">Leva menos de 1 minuto para começar.</p>
            </div>

            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              {renderInput('Nome Completo', 'name', 'text', <UserIcon className="w-5 h-5" />)}
              {renderInput('Seu CPF', 'cpf', 'tel', <FileText className="w-5 h-5" />)}
              {renderInput('E-mail Profissional', 'email', 'email', <Mail className="w-5 h-5" />)}
              {renderInput('Senha de Acesso', 'password', 'password', <Lock className="w-5 h-5" />, true)}
              {renderInput('Confirmar Senha', 'confirmPassword', 'password', <Lock className="w-5 h-5" />, true)}

              <div className="pt-2">
                {renderInput('Código de Indicação', 'referralCode', 'text', <Ticket className="w-5 h-5 text-accent-success" />, false, true)}
              </div>

              {error && (
                <div className="p-3 bg-red-50 text-accent-error text-[10px] font-roboto font-bold uppercase tracking-wider rounded-lg border border-red-100">
                  {error}
                </div>
              )}

              <Button type="submit" fullWidth disabled={loading} className="py-4 mt-4">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Ativar meus 7 dias grátis'}
              </Button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return null;
};