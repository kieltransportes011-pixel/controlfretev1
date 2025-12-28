import React, { useState, useEffect } from 'react';
import { ViewState, Freight, Expense, AppSettings, User, Booking } from './types';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { AddFreight } from './components/AddFreight';
import { AddExpense } from './components/AddExpense';
import { History } from './components/History';
import { Schedule } from './components/Schedule';
import { Settings } from './components/Settings';
import { FreightCalculator } from './components/FreightCalculator';
import { Auth } from './components/Auth';
import { ReferralSystem } from './components/ReferralSystem';
import { MonthlyGoal } from './components/MonthlyGoal';
import { Button } from './components/Button';
import { Paywall } from './components/Paywall';
import { supabase } from './supabase';
import { Loader2, ShieldAlert, Cloud } from 'lucide-react';
import { useSubscription } from './hooks/useSubscription';
import { WorkCalendar } from './components/WorkCalendar';

const SAFE_DEFAULT_SETTINGS: AppSettings = {
  defaultCompanyPercent: 40,
  defaultDriverPercent: 40,
  defaultReservePercent: 20,
  theme: 'light'
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [view, setView] = useState<ViewState>('DASHBOARD');
  const [freights, setFreights] = useState<Freight[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [settings, setSettings] = useState<AppSettings>(SAFE_DEFAULT_SETTINGS);
  const [formData, setFormData] = useState<Partial<Freight> | undefined>(undefined);
  const [permissionError, setPermissionError] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [initializing, setInitializing] = useState(true);

  // Subscription Hook
  const { isActive, isExpired, daysRemaining, isTrial } = useSubscription(currentUser);

  // Initial Auth Check
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setInitializing(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        // Optionally refresh profile
        fetchUserProfile(session.user.id);
      } else {
        setCurrentUser(null);
        setInitializing(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (uid: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', uid)
      .single();

    if (data) {
      setCurrentUser({
        ...data,
        email: data.email || '',
        trialStart: data.trial_start,
        trialEnd: data.trial_end,
        referralCode: data.referral_code,
        referralBalance: data.referral_balance || 0,
        referralCount: data.referral_count || 0
      });
    } else if (error) {
      console.error("Error fetching profile", error);
    }
    setInitializing(false);
  };

  const fetchData = async () => {
    if (!currentUser) return;
    setSyncing(true);

    // Fetch Settings
    const { data: settingsData } = await supabase
      .from('settings')
      .select('*')
      .eq('user_id', currentUser.id)
      .single();

    if (settingsData) {
      setSettings({
        defaultCompanyPercent: settingsData.default_company_percent,
        defaultDriverPercent: settingsData.default_driver_percent,
        defaultReservePercent: settingsData.default_reserve_percent,
        theme: settingsData.theme as 'light' | 'dark',
        monthlyGoal: settingsData.monthly_goal,
      });
    }

    // Fetch Freights
    const { data: freightsData } = await supabase
      .from('freights')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('date', { ascending: false });

    if (freightsData) {
      setFreights(freightsData.map(f => ({
        ...f,
        companyPercent: 0, // Calculate or store? Assuming derived or stored differently
        driverPercent: 0,
        reservePercent: 0,
        // Map snake_case to CamelCase if needed or update Types. 
        // Ideally we should update Types to match DB or map here.
        // For simplicity, let's map manualy:
        companyValue: f.company_value,
        driverValue: f.driver_value,
        reserveValue: f.reserve_value,
        totalValue: f.total_value,
        receivedValue: f.received_value,
        pendingValue: f.pending_value,
        dueDate: f.due_date
      } as Freight)));
    }

    // Fetch Expenses
    const { data: expensesData } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('date', { ascending: false });

    if (expensesData) {
      setExpenses(expensesData as Expense[]);
    }

    // Fetch Bookings
    const { data: bookingsData } = await supabase
      .from('bookings')
      .select('*')
      .eq('user_id', currentUser.id);

    if (bookingsData) {
      const mappedBookings = bookingsData.map(b => ({
        ...b,
        estimatedValue: b.estimated_value
      }));
      setBookings(mappedBookings as Booking[]);
    }

    setSyncing(false);
  };

  // Fetch data when user changes
  useEffect(() => {
    if (currentUser) {
      fetchData();
    }
  }, [currentUser?.id]);

  // Dark Mode
  useEffect(() => {
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.theme]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
  };

  const handleUpdateUser = async (updatedUser: User) => {
    if (!currentUser) return;
    setCurrentUser(updatedUser);
    await supabase
      .from('profiles')
      .update({ is_premium: updatedUser.isPremium }) // Update other fields if needed
      .eq('id', currentUser.id);
  };


  if (initializing) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-brand animate-spin" />
        <p className="text-slate-400 font-medium animate-pulse">Carregando...</p>
      </div>
    );
  }

  if (!currentUser) {
    return <Auth onLogin={setCurrentUser} />;
  }

  if (isExpired && !currentUser.isPremium) {
    return <Paywall user={currentUser} onPaymentSuccess={() => {
      handleUpdateUser({ ...currentUser, isPremium: true });
      setView('DASHBOARD');
    }} />;
  }

  return (
    <Layout currentView={view} onNavigate={(v) => {
      setView(v);
      if (v !== 'ADD_FREIGHT') setFormData(undefined);
      if (window.location.hash) window.history.replaceState(null, '', ' ');
    }}>
      {syncing && (
        <div className="fixed top-2 right-2 z-50 bg-brand/10 backdrop-blur-sm p-1.5 rounded-full flex items-center gap-1.5 border border-brand/20">
          <Cloud className="w-3 h-3 text-brand animate-pulse" />
          <span className="text-[8px] font-bold text-brand uppercase tracking-tighter">Sincronizando...</span>
        </div>
      )}

      {view === 'DASHBOARD' && (
        <Dashboard
          user={currentUser}
          freights={freights}
          expenses={expenses}
          onAddFreight={() => { setFormData(undefined); setView('ADD_FREIGHT'); }}
          onAddExpense={() => setView('ADD_EXPENSE')}
          onViewSchedule={() => setView('RECEIVABLES')}
          onOpenCalculator={() => setView('CALCULATOR')}
          onViewGoals={() => setView('GOALS')}
          onViewAgenda={() => setView('AGENDA')}
        />
      )}

      {view === 'AGENDA' && (
        <WorkCalendar
          bookings={bookings}
          onAddBooking={async (b) => {
            const { data, error } = await supabase.from('bookings').insert([{
              user_id: currentUser.id,
              date: b.date,
              client: b.client,
              time: b.time,
              estimated_value: b.estimatedValue,
              status: b.status
            }]).select();
            if (data) fetchData();
          }}
          onDeleteBooking={async (id) => {
            await supabase.from('bookings').delete().eq('id', id);
            fetchData();
          }}
          onConvertBooking={(booking) => {
            setFormData({
              client: booking.client,
              totalValue: booking.estimatedValue || 0,
              date: booking.date
            });
            setView('ADD_FREIGHT');
          }}
        />
      )}

      {view === 'ADD_FREIGHT' && (
        <AddFreight
          settings={settings}
          onSave={async (f) => {
            if (!currentUser) return;
            await supabase.from('freights').insert([{
              // id: generated by DB
              user_id: currentUser.id,
              date: f.date,
              client: f.client,
              total_value: f.totalValue,
              company_value: f.companyValue,
              driver_value: f.driverValue,
              reserve_value: f.reserveValue,
              status: f.status,
              received_value: f.receivedValue,
              pending_value: f.pendingValue,
              due_date: f.dueDate
            }]);
            fetchData();
            setView('DASHBOARD');
          }}
          onCancel={() => setView('DASHBOARD')}
          initialData={formData}
        />
      )}

      {view === 'ADD_EXPENSE' && (
        <AddExpense
          onSave={async (e) => {
            if (!currentUser) return;
            await supabase.from('expenses').insert([{
              user_id: currentUser.id,
              date: e.date,
              description: e.description,
              value: e.value,
              source: e.source,
              category: e.category
            }]);
            fetchData();
            setView('DASHBOARD');
          }}
          onCancel={() => setView('DASHBOARD')}
        />
      )}

      {view === 'HISTORY' && (
        <History
          freights={freights}
          expenses={expenses}
          onDeleteFreight={async (id) => {
            if (!currentUser) return;
            await supabase.from('freights').delete().eq('id', id);
            fetchData();
          }}
          onDeleteExpense={async (id) => {
            if (!currentUser) return;
            await supabase.from('expenses').delete().eq('id', id);
            fetchData();
          }}
          onEditFreight={(f) => { setFormData(f); setView('ADD_FREIGHT'); }}
          settings={settings}
        />
      )}

      {view === 'RECEIVABLES' && (
        <Schedule
          freights={freights}
          onReceivePayment={async (freightId) => {
            try {
              const f = freights.find(item => item.id === freightId);
              if (f && currentUser) {
                await supabase.from('freights').update({
                  status: 'PAID',
                  received_value: f.totalValue,
                  pending_value: 0,
                  due_date: null
                }).eq('id', freightId);
                fetchData();
              }
            } catch (error) {
              console.error("Erro ao salvar recebimento:", error);
              alert("Erro ao salvar no banco de dados.");
            }
          }}
        />
      )}

      {view === 'CALCULATOR' && (
        <FreightCalculator onCancel={() => setView('DASHBOARD')} onRegister={(d) => { setFormData(d); setView('ADD_FREIGHT'); }} />
      )}

      {view === 'REFERRAL' && (
        <ReferralSystem user={currentUser} onUpdateUser={handleUpdateUser} onBack={() => setView('SETTINGS')} />
      )}

      {view === 'GOALS' && (
        <MonthlyGoal
          freights={freights}
          settings={settings}
          onUpdateSettings={async (s) => {
            if (!currentUser) return;
            setSettings(s);
            await supabase.from('settings').upsert({
              user_id: currentUser.id,
              monthly_goal: s.monthlyGoal
            });
          }}
          onBack={() => setView('DASHBOARD')}
        />
      )}

      {view === 'SETTINGS' && (
        <div className="space-y-6">
          <Settings
            settings={settings}
            user={currentUser}
            onSave={async (s) => {
              if (!currentUser) return;
              setSettings(s);
              await supabase.from('settings').upsert({
                user_id: currentUser.id,
                theme: s.theme,
                default_company_percent: s.defaultCompanyPercent,
                default_driver_percent: s.defaultDriverPercent,
                default_reserve_percent: s.defaultReservePercent,
                // issuer props...
              });
            }}
            onNavigate={setView}
          />
          <div className="px-4 pb-20">
            <button
              onClick={handleLogout}
              className="w-full py-3 rounded-xl border-2 border-red-100 text-red-600 font-bold hover:bg-red-50 dark:border-red-900/30 dark:bg-red-900/10 dark:text-red-400 transition-colors"
            >
              Sair da Conta
            </button>
          </div>
        </div>
      )}
    </Layout>
  );
};