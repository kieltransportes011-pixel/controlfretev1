import React, { useState } from 'react';
import { User } from '../types';
import { Button } from './Button';
import { validateCPF, maskCPF } from '../utils';
import { Mail, Lock, User as UserIcon, Eye, EyeOff, FileText, ArrowRight, Loader2, CheckCircle, ChevronLeft } from 'lucide-react';
import { supabase } from '../supabase';

interface AuthProps {
  onLogin: (user: User) => void;
  onBack?: () => void;
}

type AuthView = 'LOGIN' | 'REGISTER' | 'SUCCESS';

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

export const Auth: React.FC<AuthProps> = ({ onLogin, onBack }) => {
  const [view, setView] = useState<AuthView>('LOGIN');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [justRegisteredUser, setJustRegisteredUser] = useState<User | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    cpf: '',
    password: '',
    confirmPassword: ''
  });

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
      }
    } catch (err: any) {
      console.error(err);
      setError('E-mail ou senha incorretos.');
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
      // 2. Auth Creation
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password
      });

      if (authError) throw authError;

      if (authData.user) {
        const userId = authData.user.id;

        // 3. Profile Creation (Manual & Explicit)
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            email: formData.email,
            name: formData.name,
            cpf: formData.cpf,
            plano: 'FREE' // Enforce logic
          });

        if (profileError) {
          // If it's a "duplicate" error, handle gracefully.
          if (profileError.code === '23505') {
            throw new Error('Já existe um usuário com estes dados.');
          }
          throw profileError;
        }

        // 4. Settings Creation (Optional but good)
        await supabase.from('settings').insert({ user_id: userId });

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
        setJustRegisteredUser(newUser);
        setView('SUCCESS');
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

  // --- RENDERS ---

  if (view === 'SUCCESS') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-900 animate-fadeIn text-center">
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
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl overflow-hidden">

        {/* Header */}
        <div className="bg-brand p-8 text-center text-white">
          <img src="/logo-official.png" className="h-12 mx-auto mb-4 drop-shadow-md brightness-0 invert" alt="Logo" />
          <h1 className="text-2xl font-bold tracking-tight uppercase">Control Frete</h1>
          <p className="text-blue-100 text-xs font-bold uppercase tracking-widest mt-1">
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

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setView('REGISTER')}
                  className="text-slate-500 hover:text-brand text-xs font-bold uppercase tracking-wider transition-colors"
                >
                  Não tem conta? Cadastre-se
                </button>
              </div>
            </form>
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