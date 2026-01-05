import React, { useState } from 'react';
import { useSupabaseError } from '../hooks/useSupabaseError';
import { User } from '../types';
import { Button } from './Button';
import { validateCPF, maskCPF } from '../utils';
import { Truck, Mail, Lock, User as UserIcon, Eye, EyeOff, FileText, ArrowRight, Loader2, CheckCircle, ChevronLeft } from 'lucide-react';
import { supabase } from '../supabase';


interface AuthProps {
  onLogin: (user: User) => void;
  onBack?: () => void;
}

type AuthView = 'LOGIN_OFFER' | 'REGISTER_FLOW' | 'FORGOT' | 'REGISTER_SUCCESS';

export const Auth: React.FC<AuthProps> = ({ onLogin, onBack }) => {
  const [view, setView] = useState<AuthView>('LOGIN_OFFER');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const handleSupabaseError = useSupabaseError(setError);
  const [showPassword, setShowPassword] = useState(false);
  const [registeredUser, setRegisteredUser] = useState<User | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    cpf: '',
    password: '',
    confirmPassword: ''
  });

  const handleChange = (field: string, value: string) => {
    let finalValue = value;
    if (field === 'cpf') finalValue = maskCPF(value);
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
        // Fetch profile to get plan details
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          console.error('Profile fetch error:', profileError);
        }

        const plan = profile?.plano || 'FREE';

        const user: User = {
          id: data.user.id,
          email: data.user.email!,
          name: profile?.name || '',
          cpf: profile?.cpf || '',
          password: '', // Security: don't store
          createdAt: profile?.created_at || new Date().toISOString(),
          isPremium: plan === 'PRO',
          plano: plan === 'PRO' ? 'pro' : 'free',
          // Map other fields as necessary or use defaults
          trialStart: profile?.trial_start,
          trialEnd: profile?.trial_end
        };
        onLogin(user);
      }
    } catch (err: any) {
      handleSupabaseError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validations
    if (!formData.name) { setError('Nome obrigatório.'); return; }
    if (!validateCPF(formData.cpf)) { setError('CPF inválido.'); return; }
    if (!formData.email.includes('@')) { setError('E-mail inválido.'); return; }
    if (formData.password.length < 6) { setError('Senha curta (min 6).'); return; }
    if (formData.password !== formData.confirmPassword) { setError('Senhas não conferem.'); return; }

    setLoading(true);
    try {
      // 1. Create Auth User
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (authError) throw authError;

      if (authData.user) {
        const userId = authData.user.id;
        const now = new Date().toISOString();

        // 2. Insert Profile (Client-side, relying on policies)
        // We use upsert to be safe, but conceptually it's an insert for a new user.
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: userId,
            email: formData.email,
            name: formData.name,
            cpf: formData.cpf,
            plano: 'FREE', // ALWAYS FREE INITIALLY
            created_at: now
          }, { onConflict: 'id' });

        if (profileError) {
          console.error('Profile creation error:', profileError);
          throw new Error('Erro ao criar perfil de usuário.');
        }

        // 3. Insert Settings (Optional but recommended for app stability)
        const { error: settingsError } = await supabase
          .from('settings')
          .upsert({ user_id: userId }, { onConflict: 'user_id' });

        if (settingsError) {
          console.warn('Settings creation warning:', settingsError);
          // We don't block signup on settings error, but log it.
        }

        // Success State
        const newUser: User = {
          id: userId,
          name: formData.name,
          cpf: formData.cpf,
          email: formData.email,
          createdAt: now,
          isPremium: false,
          plano: 'free',
          password: ''
        };

        setRegisteredUser(newUser);
        setView('REGISTER_SUCCESS');
      }
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes('already registered') || err.message?.includes('violates unique constraint')) {
        setError('Este e-mail ou CPF já está cadastrado.');
      } else {
        setError('Erro no cadastro: ' + (err.message || 'Tente novamente.'));
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
          Sua conta foi criada com sucesso. Aproveite o plano FREE para começar.
        </p>
        <Button fullWidth onClick={() => registeredUser && onLogin(registeredUser)} className="h-16">
          ACESSAR SISTEMA <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    );
  }

  if (view === 'LOGIN_OFFER') {
    return (
      <div className="min-h-screen bg-base-bg dark:bg-slate-950 flex flex-col justify-center p-6 animate-fadeIn">
        <div className="max-w-md mx-auto w-full space-y-10">
          {onBack && (
            <button
              onClick={onBack}
              className="absolute top-6 left-6 flex items-center text-slate-500 hover:text-brand font-medium text-sm transition-colors"
            >
              <ChevronLeft className="w-5 h-5 mr-1" />
              Voltar
            </button>
          )}

          <header className="text-center space-y-3 flex flex-col items-center">
            <img
              src="/logo-official.png"
              alt="Control Frete"
              className="h-20 w-auto object-contain mb-2 dark:brightness-110 drop-shadow-xl"
            />
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
              Criar nova conta
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
              <p className="text-base-subtext text-xs mt-1">Preencha seus dados para começar.</p>
            </div>

            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              {renderInput('Nome Completo', 'name', 'text', <UserIcon className="w-5 h-5" />)}
              {renderInput('Seu CPF', 'cpf', 'tel', <FileText className="w-5 h-5" />)}
              {renderInput('E-mail Profissional', 'email', 'email', <Mail className="w-5 h-5" />)}
              {renderInput('Senha de Acesso', 'password', 'password', <Lock className="w-5 h-5" />, true)}
              {renderInput('Confirmar Senha', 'confirmPassword', 'password', <Lock className="w-5 h-5" />, true)}

              {error && (
                <div className="p-3 bg-red-50 text-accent-error text-[10px] font-roboto font-bold uppercase tracking-wider rounded-lg border border-red-100">
                  {error}
                </div>
              )}

              <Button type="submit" fullWidth disabled={loading} className="py-4 mt-4">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Criar Conta Grátis'}
              </Button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return null;
};