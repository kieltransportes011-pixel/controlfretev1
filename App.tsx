import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ViewState, Freight, Expense, AppSettings, User, Booking, AccountPayable, OFretejaFreight, ExtraIncome, Client, Vehicle, MaintenanceLog, Document } from './types';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { AddFreight } from './components/AddFreight';
import { AddExpense } from './components/AddExpense';
import { History } from './components/History';
import { Schedule } from './components/Schedule';
import { Settings } from './components/Settings';
import { FreightCalculator } from './components/FreightCalculator';
import { Auth } from './components/Auth';
import { MonthlyGoal } from './components/MonthlyGoal';
import { Button } from './components/Button';
import { Paywall } from './components/Paywall';
import { PaymentSuccessModal } from './components/PaymentSuccessModal';
import { supabase } from './supabase';
import { Loader2, ShieldAlert, Cloud } from 'lucide-react';
import { useSubscription } from './hooks/useSubscription';
import { WorkCalendar } from './components/WorkCalendar';
import { LandingPage } from './components/LandingPage';
import { AdminDashboard } from './components/AdminDashboard';
import { PrivacyModal } from './components/PrivacyModal';
import { Support } from './components/Support';
import { MandatoryNoticeModal } from './components/MandatoryNoticeModal';
import { NoticesCenter } from './components/NoticesCenter';
import { ReferralSystem } from './components/ReferralSystem';
import { UpgradeModal } from './components/UpgradeModal';
import { FreightIntegration } from './components/FreightIntegration';
import { FreightNoticeModal } from './components/FreightNoticeModal';
import { Clients } from './components/Clients';
import { Fleet } from './components/Fleet';
import { MaintenanceLogs } from './components/MaintenanceLogs';
import { DocumentVault } from './components/DocumentVault';
import { Skeleton, CardSkeleton, ListSkeleton } from './components/Skeleton';


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
  const [accountsPayable, setAccountsPayable] = useState<AccountPayable[]>([]);
  const [ofretejaFreights, setOfretejaFreights] = useState<OFretejaFreight[]>([]);
  const [extraIncomes, setExtraIncomes] = useState<ExtraIncome[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [maintenanceLogs, setMaintenanceLogs] = useState<MaintenanceLog[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [settings, setSettings] = useState<AppSettings>(SAFE_DEFAULT_SETTINGS);
  const [formData, setFormData] = useState<Partial<Freight> | undefined>(undefined);
  const [permissionError, setPermissionError] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [showLanding, setShowLanding] = useState(true);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [upgradeModal, setUpgradeModal] = useState({
    open: false,
    title: '',
    description: ''
  });
  const [showFreightNotice, setShowFreightNotice] = useState(false);
  const [initialAuthView, setInitialAuthView] = useState<'LOGIN' | 'UPDATE_PASSWORD'>('LOGIN');
  const [isEmailConfirmed, setIsEmailConfirmed] = useState(true);

  // Mandatory confirmation only for users registered AFTER Jan 16, 2026
  const CUTOFF_DATE = new Date('2026-01-17T00:00:00Z').getTime();
  const userCreatedAt = currentUser ? new Date(currentUser.createdAt).getTime() : 0;
  const isNewUser = currentUser && userCreatedAt > CUTOFF_DATE;


  const handleOpenUpgrade = (reason: 'LIMIT' | 'FEATURE' | 'GENERAL' = 'GENERAL') => {
    let title = 'Desbloqueie o Pro';
    let description = 'Faça o upgrade para remover todas as restrições.';

    if (reason === 'LIMIT') {
      title = 'Limite Atingido';
      description = 'Você atingiu o limite de fretes do plano gratuito. Vire PRO para registros ilimitados.';
    } else if (reason === 'FEATURE') {
      title = 'Recurso Exclusivo';
      description = 'Esta funcionalidade está disponível apenas para assinantes PRO.';
    }

    setUpgradeModal({
      open: true,
      title,
      description
    });
  };

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
    } = supabase.auth.onAuthStateChange((event, session) => {
      // Handle standard password recovery link
      if (event === 'PASSWORD_RECOVERY') {
        setInitialAuthView('UPDATE_PASSWORD');
        setShowLanding(false);
        // Change URL to /reset-password for a cleaner UX
        window.history.replaceState(null, '', '/reset-password');
      }

      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setCurrentUser(null);
        setInitializing(false);
      }
    });

    // Check if we are on /reset-password manually (on refresh)
    if (window.location.pathname === '/reset-password') {
      setInitialAuthView('UPDATE_PASSWORD');
      setShowLanding(false);
    }

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
        createdAt: data.created_at || new Date().toISOString(),
        isPremium: data.is_premium || data.plano === 'pro',
        plano: data.plano || 'free',
        status_assinatura: data.status_assinatura || 'ativa',
        premiumUntil: data.premium_until,
        lastPaymentId: data.last_payment_id,
        trialStart: data.trial_start,
        trialEnd: data.trial_end,

        profile_photo_url: data.profile_photo_url,
        profile_photo_changes_used: data.profile_photo_changes_used || 0,
        role: data.role || 'user',
        referral_code: data.referral_code,

        account_status: data.account_status || 'active',
        privacy_policy_accepted_at: data.privacy_policy_accepted_at
      });

      // Show Privacy Modal if not accepted yet
      if (!data.privacy_accepted) {
        setShowPrivacyModal(true);
      }

    } else if (error) {
      console.error("Error fetching profile", error);
    }
    setInitializing(false);
  };

  // Check email confirmation status for new users
  useEffect(() => {
    if (currentUser && isNewUser) {
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user && !user.email_confirmed_at) {
          setIsEmailConfirmed(false);
        } else {
          setIsEmailConfirmed(true);
        }
      });
    } else {
      setIsEmailConfirmed(true);
    }
  }, [currentUser, isNewUser]);

  // Handle successful payment redirection
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'success') {
      window.history.replaceState(null, '', window.location.pathname);
      setShowSuccessModal(true);
      if (currentUser) fetchUserProfile(currentUser.id);
    }
  }, [currentUser?.id]);

  // Security Check: Ban Enforcement
  useEffect(() => {
    if (currentUser && (currentUser as any).account_status === 'banned') {
      alert("Sua conta foi suspensa. Entre em contato com o suporte.");
      supabase.auth.signOut();
      setCurrentUser(null);
      setShowLanding(true);
    }
  }, [currentUser]);

  // Admin Route Check
  useEffect(() => {
    if (!initializing && currentUser) {
      if (window.location.pathname === '/admin') {
        if (currentUser.role === 'admin') {
          setView('ADMIN');
          setShowLanding(false);
        } else {
          // Redirect unauthorized access to admin
          window.history.replaceState(null, '', '/');
          setView('DASHBOARD');
        }
      }
    }
  }, [initializing, currentUser]);

  const fetchData = async () => {
    if (!currentUser) return;
    setLoadingData(true);
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
        issuerName: settingsData.issuer_name,
        issuerDoc: settingsData.issuer_doc,
        issuerPhone: settingsData.issuer_phone,
        issuerAddressStreet: settingsData.issuer_address_street,
        issuerAddressNumber: settingsData.issuer_address_number,
        issuerAddressNeighborhood: settingsData.issuer_address_neighborhood,
        issuerAddressCity: settingsData.issuer_address_city,
        issuerAddressState: settingsData.issuer_address_state,
        issuerAddressZip: settingsData.issuer_address_zip,
        issuerLogoUrl: settingsData.issuer_logo_url
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
        dueDate: f.due_date,
        origin: f.origin,
        destination: f.destination,
        description: f.description,
        paymentMethod: f.payment_method,
        clientDoc: f.client_doc
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

    // Fetch Accounts Payable
    const { data: payablesData } = await supabase
      .from('contas_a_pagar')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('due_date', { ascending: true });

    if (payablesData) {
      setAccountsPayable(payablesData.map(p => ({
        ...p,
        payment_source: p.payment_source
      })) as AccountPayable[]);
    }

    // Fetch O FreteJá Freights (with joins)
    const { data: ofretejaData } = await supabase
      .from('fretes_ofreteja')
      .select('*, empresas_ofreteja(*), categorias_veiculos(*)')
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: false });

    if (ofretejaData) {
      setOfretejaFreights(ofretejaData as OFretejaFreight[]);
    }

    // Fetch Extra Incomes
    const { data: extraIncomesData } = await supabase
      .from('entradas_extras')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('date', { ascending: false });

    if (extraIncomesData) {
      setExtraIncomes(extraIncomesData as ExtraIncome[]);
    }

    // Fetch Clients
    const { data: clientsData } = await supabase
      .from('clients')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('name', { ascending: true });

    if (clientsData) {
      setClients(clientsData as Client[]);
    }

    // Fetch Vehicles
    const { data: vehiclesData } = await supabase
      .from('vehicles')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: false });
    if (vehiclesData) setVehicles(vehiclesData as Vehicle[]);

    // Fetch Maintenance Logs
    const { data: maintenanceData } = await supabase
      .from('maintenance_logs')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('date', { ascending: false });
    if (maintenanceData) setMaintenanceLogs(maintenanceData as MaintenanceLog[]);

    // Fetch Documents
    const { data: documentsData } = await supabase
      .from('documents')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('expiry_date', { ascending: true });
    if (documentsData) setDocuments(documentsData as Document[]);

    setSyncing(false);
    setLoadingData(false);
  };

  const viewVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
    exit: { opacity: 0, y: -10, transition: { duration: 0.2 } }
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
    setShowLanding(true);
  };

  const handleApproveOFreteja = async (of: OFretejaFreight) => {
    if (!currentUser) return;

    try {
      setSyncing(true);

      // 1. Prepare values
      const defaultVal = of.estimated_value ? of.estimated_value.toString() : "0";
      const valueStr = prompt("Informe o valor final para aprovação e importação:", defaultVal);
      const total = parseFloat(valueStr || defaultVal);

      // Create detailed description
      const stopsText = of.stops && of.stops.length > 0
        ? of.stops.map((s: any, i: number) => `Parada ${i + 1}: ${s.address}, ${s.number}${s.complement ? ` (${s.complement})` : ''}`).join('\n')
        : 'Sem paradas intermediárias';

      const detailedDesc = `[Veículo: ${of.categorias_veiculos?.name || 'Não informado'}]
Origem: ${of.origin_address}, ${of.origin_number}
${stopsText}
Destino: ${of.delivery_address}, ${of.delivery_number}
Peso: ${of.weight || '--'}kg
Contato: ${of.contact_phone || 'Não informado'}
Obs: ${of.description || 'Sem observações'}`;

      const companyVal = (total * settings.defaultCompanyPercent) / 100;
      const driverVal = (total * settings.defaultDriverPercent) / 100;
      const reserveVal = (total * settings.defaultReservePercent) / 100;

      // 2. Insert into main freights table
      const { error: insertError } = await supabase.from('freights').insert([{
        user_id: currentUser.id,
        date: of.date,
        client: of.empresas_ofreteja?.name || 'Cliente O FreteJá',
        total_value: total,
        company_value: companyVal,
        driver_value: driverVal,
        reserve_value: reserveVal,
        status: 'PENDING',
        received_value: 0,
        pending_value: total,
        description: detailedDesc,
        origin: `${of.origin_address}, ${of.origin_number}`,
        destination: `${of.delivery_address}, ${of.delivery_number}`,
        payment_method: 'OUTRO'
      }]);

      if (insertError) throw insertError;

      // 3. Mark as APROVADO and also IMPORTED (internal flag) in ofreteja table
      const { error: updateError } = await supabase
        .from('fretes_ofreteja')
        .update({ status: 'APROVADO' })
        .eq('id', of.id);

      if (updateError) throw updateError;

      await fetchData();
      alert("Frete aprovado e importado para o ControlFrete.");
    } catch (error: any) {
      console.error("Erro na aprovação:", error);
      alert("Erro ao aprovar: " + error.message);
    } finally {
      setSyncing(false);
    }
  };

  const handleRejectOFreteja = async (of: OFretejaFreight) => {
    if (!currentUser) return;
    const reason = prompt("Informe o motivo da reprovação (opcional):", "");
    if (reason === null) return; // Cancelled prompt

    try {
      setSyncing(true);
      const { error } = await supabase
        .from('fretes_ofreteja')
        .update({
          status: 'REPROVADO',
          rejection_reason: reason
        })
        .eq('id', of.id);

      if (error) throw error;
      await fetchData();
      alert("Solicitação reprovada.");
    } catch (error: any) {
      console.error("Erro ao reprovar:", error);
      alert("Erro ao reprovar: " + error.message);
    } finally {
      setSyncing(false);
    }
  };

  const handleCancelOFreteja = async (of: OFretejaFreight) => {
    if (!currentUser) return;
    if (!confirm("Deseja realmente cancelar esta solicitação?")) return;

    try {
      setSyncing(true);
      const { error } = await supabase
        .from('fretes_ofreteja')
        .update({ status: 'CANCELLED' })
        .eq('id', of.id);

      if (error) throw error;
      await fetchData();
    } catch (error: any) {
      console.error("Erro ao cancelar:", error);
      alert("Erro ao cancelar: " + error.message);
    } finally {
      setSyncing(false);
    }
  };

  const handleUpdateUser = async (updatedUser: User) => {
    if (!currentUser) return;
    setCurrentUser(updatedUser);
    await supabase
      .from('profiles')
      .update({ is_premium: updatedUser.isPremium }) // Update other fields if needed
      .eq('id', currentUser.id);
  };

  const handleSaveClient = async (client: Partial<Client>) => {
    if (!currentUser) return;
    try {
      if (client.id) {
        // Update
        const { error } = await supabase
          .from('clients')
          .update({
            name: client.name,
            doc: client.doc,
            phone: client.phone,
            email: client.email,
            street: client.street,
            number: client.number,
            neighborhood: client.neighborhood,
            city: client.city,
            state: client.state,
            zip: client.zip
          })
          .eq('id', client.id);
        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase
          .from('clients')
          .insert([{
            user_id: currentUser.id,
            name: client.name,
            doc: client.doc,
            phone: client.phone,
            email: client.email,
            street: client.street,
            number: client.number,
            neighborhood: client.neighborhood,
            city: client.city,
            state: client.state,
            zip: client.zip
          }]);
        if (error) throw error;
      }
      fetchData();
    } catch (error: any) {
      console.error("Erro ao salvar cliente:", error);
      alert("Erro ao salvar cliente: " + (error.message || "Tente novamente."));
    }
  };

  const handleDeleteClient = async (id: string) => {
    if (!currentUser) return;
    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id);
      if (error) throw error;
      fetchData();
    } catch (error: any) {
      console.error("Erro ao excluir cliente:", error);
      alert("Erro ao excluir cliente: " + (error.message || "Tente novamente."));
    }
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
    if (showLanding) {
      return <LandingPage onLogin={() => setShowLanding(false)} />;
    }
    return (
      <Auth
        onLogin={setCurrentUser}
        onBack={() => {
          setShowLanding(true);
          setInitialAuthView('LOGIN');
          window.history.replaceState(null, '', '/');
        }}
        initialView={initialAuthView}
      />
    );
  }

  // --- Visual Barrier for Unconfirmed New Users ---
  if (!isEmailConfirmed && isNewUser && view !== 'PAYMENT') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-center z-[9999]">
        <div className="max-w-md bg-white rounded-3xl p-10 shadow-2xl animate-scaleUp">
          <div className="bg-amber-100 text-amber-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldAlert size={40} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-4 uppercase tracking-tight">Confirme seu E-mail</h2>
          <p className="text-slate-600 mb-8 leading-relaxed">
            Para garantir a segurança da sua conta, você precisa confirmar seu endereço de e-mail antes de acessar o sistema.
          </p>
          <div className="space-y-4">
            <Button fullWidth onClick={() => window.location.reload()}>
              JÁ CONFIRMEI, ATUALIZAR
            </Button>
            <button
              onClick={handleLogout}
              className="text-slate-400 hover:text-red-500 text-xs font-bold uppercase tracking-widest transition-colors"
            >
              Sair da conta
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Blocking Paywall removed to comply with "No forced redirect" rule.

  if (view === 'PAYMENT') {
    console.log("App: Switching to PAYMENT view", { hasUser: !!currentUser });
    return <Paywall
      user={currentUser}
      onPaymentSuccess={() => {
        handleUpdateUser({ ...currentUser, isPremium: true });
        setView('DASHBOARD');
      }}
      onCancel={() => setView('DASHBOARD')}
    />;
  }

  if (view === 'ADMIN' && currentUser?.role === 'admin') {
    return <AdminDashboard
      currentUser={currentUser}
      onBack={() => {
        window.history.replaceState(null, '', '/');
        setView('DASHBOARD');
      }}
    />;
  }

  return (
    <Layout currentView={view} onNavigate={(v) => {
      // Intercept Freight Integration for temporary notice
      if (v === 'FREIGHT_INTEGRATION') {
        setShowFreightNotice(true);
        return;
      }

      // Pro Features Guard

      const proFeatures: ViewState[] = ['AGENDA', 'GOALS', 'SUPPORT'];
      const hasProAccess = isActive; // isActive is true if Pro OR Trial

      if (proFeatures.includes(v) && !hasProAccess) {
        handleOpenUpgrade('FEATURE');
        return;
      }

      setView(v);
      if (v !== 'ADD_FREIGHT') setFormData(undefined);
      if (window.location.hash) window.history.replaceState(null, '', ' ');
    }}>
      <AnimatePresence mode="wait">
        {syncing && (
          <div className="fixed top-2 right-2 z-50 bg-brand/10 backdrop-blur-sm p-1.5 rounded-full flex items-center gap-1.5 border border-brand/20">
            <Cloud className="w-3 h-3 text-brand animate-pulse" />
            <span className="text-[8px] font-bold text-brand uppercase tracking-tighter">Sincronizando...</span>
          </div>
        )}

        {view === 'DASHBOARD' && (
          <motion.div key="dashboard" variants={viewVariants} initial="initial" animate="animate" exit="exit">
            <Dashboard
              user={currentUser}
              freights={freights}
              expenses={expenses}
              accountsPayable={accountsPayable}
              extraIncomes={extraIncomes}
              loading={loadingData}
              onAddFreight={() => { setFormData(undefined); setView('ADD_FREIGHT'); }}
              onAddExpense={() => setView('ADD_EXPENSE')}
              onViewSchedule={() => setView('RECEIVABLES')}
              onOpenCalculator={() => setView('CALCULATOR')}
              onViewGoals={() => setView('GOALS')}
              onUpgrade={() => setView('PAYMENT')}
              onViewAgenda={() => setView('AGENDA')}
              onRequestUpgrade={() => handleOpenUpgrade('GENERAL')}
              onViewReferrals={() => setView('REFERRALS')}
              onViewClients={() => setView('CLIENTS')}
              onViewFleet={() => {
                if (!isActive) return handleOpenUpgrade('FEATURE');
                setView('FLEET');
              }}
              onViewMaintenance={() => {
                if (!isActive) return handleOpenUpgrade('FEATURE');
                setView('MAINTENANCE');
              }}
              onViewDocuments={() => {
                if (!isActive) return handleOpenUpgrade('FEATURE');
                setView('DOCUMENTS');
              }}
              onAddExtraIncome={async (ei) => {
                if (!currentUser) return;
                const { error } = await supabase.from('entradas_extras').insert([{
                  user_id: currentUser.id,
                  description: ei.description,
                  value: ei.value,
                  source: ei.source,
                  date: ei.date
                }]);
                if (!error) fetchData();
              }}
              onDeleteExtraIncome={async (id) => {
                const { error } = await supabase.from('entradas_extras').delete().eq('id', id);
                if (!error) fetchData();
              }}
            />
          </motion.div>
        )}

        {view === 'AGENDA' && (
          <motion.div key="agenda" variants={viewVariants} initial="initial" animate="animate" exit="exit">
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
          </motion.div>
        )}

        {view === 'ADD_FREIGHT' && (
          <motion.div key="add-freight" variants={viewVariants} initial="initial" animate="animate" exit="exit">
            <AddFreight
              settings={settings}
              clients={clients}
              onSave={async (f) => {
                if (!currentUser) return;
                try {
                  // Strict separation: Check if ID exists and is valid (not empty)
                  if (f.id && f.id.length > 10) {
                    // Update existing freight
                    const { error } = await supabase.from('freights').update({
                      date: f.date,
                      client: f.client,
                      total_value: f.totalValue,
                      company_value: f.companyValue,
                      driver_value: f.driverValue,
                      reserve_value: f.reserveValue,
                      status: f.status,
                      received_value: f.receivedValue,
                      pending_value: f.pendingValue,
                      due_date: f.dueDate,
                      origin: f.origin,
                      destination: f.destination,
                      description: f.description,
                      payment_method: f.paymentMethod,
                      client_doc: f.clientDoc
                    }).eq('id', f.id);
                    if (error) throw error;
                  } else {
                    // Insert new freight
                    const { error } = await supabase.from('freights').insert([{
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
                      due_date: f.dueDate,
                      origin: f.origin,
                      destination: f.destination,
                      description: f.description,
                      payment_method: f.paymentMethod,
                      client_doc: f.clientDoc
                    }]);
                    if (error) throw error;
                  }

                  fetchData();
                  setView('DASHBOARD');
                } catch (error: any) {
                  console.error("Erro ao salvar:", error);
                  if (error.message && error.message.includes('Limite do Plano Gratuito')) {
                    handleOpenUpgrade('LIMIT');
                  } else {
                    alert("Erro ao salvar: " + (error.message || "Tente novamente."));
                  }
                }
              }}
              onCancel={() => setView('DASHBOARD')}
              initialData={formData}
            />
          </motion.div>
        )}

        {view === 'ADD_EXPENSE' && (
          <motion.div key="add-expense" variants={viewVariants} initial="initial" animate="animate" exit="exit">
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
          </motion.div>
        )}

        {view === 'HISTORY' && (
          <motion.div key="history" variants={viewVariants} initial="initial" animate="animate" exit="exit">
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
              isPremium={isActive}
              onRequestUpgrade={() => handleOpenUpgrade('FEATURE')}
            />
          </motion.div>
        )}

        {view === 'RECEIVABLES' && (
          <motion.div key="receivables" variants={viewVariants} initial="initial" animate="animate" exit="exit">
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
              accountsPayable={accountsPayable}
              onAddAccountPayable={async (acc) => {
                if (!currentUser) return;
                const { data, error } = await supabase.from('contas_a_pagar').insert([{
                  ...acc,
                  user_id: currentUser.id
                }]).select();
                if (data) fetchData();
              }}
              onDeleteAccountPayable={async (id) => {
                if (!currentUser) return;
                await supabase.from('contas_a_pagar').delete().eq('id', id);
                fetchData();
              }}
              onUpdateAccountPayable={async (acc) => {
                if (!currentUser) return;
                const { error } = await supabase.from('contas_a_pagar').update({
                  description: acc.description,
                  value: acc.value,
                  due_date: acc.due_date,
                  recurrence: acc.recurrence,
                  status: acc.status
                }).eq('id', acc.id);
                if (error) {
                  console.error("Error updating account payable:", error);
                  throw error;
                }
                fetchData();
              }}
              onToggleAccountPayableStatus={async (acc, source) => {
                if (!currentUser) return;
                const newStatus = acc.status === 'aberto' ? 'pago' : 'aberto';
                await supabase.from('contas_a_pagar').update({
                  status: newStatus,
                  payment_source: newStatus === 'pago' ? source : null
                }).eq('id', acc.id);
                fetchData();
              }}
            />
          </motion.div>
        )}

        {view === 'CALCULATOR' && (
          <motion.div key="calculator" variants={viewVariants} initial="initial" animate="animate" exit="exit">
            <FreightCalculator onCancel={() => setView('DASHBOARD')} onRegister={(d) => { setFormData(d); setView('ADD_FREIGHT'); }} />
          </motion.div>
        )}



        {view === 'GOALS' && (
          <motion.div key="goals" variants={viewVariants} initial="initial" animate="animate" exit="exit">
            <MonthlyGoal
              freights={freights}
              settings={settings}
              onUpdateSettings={async (s) => {
                if (!currentUser) return;
                setSettings(s);
                await supabase.from('settings').upsert({
                  user_id: currentUser.id,
                  theme: s.theme,
                  default_company_percent: s.defaultCompanyPercent,
                  default_driver_percent: s.defaultDriverPercent,
                  default_reserve_percent: s.defaultReservePercent,
                  monthly_goal: s.monthlyGoal,
                  issuer_name: s.issuerName,
                  issuer_doc: s.issuerDoc,
                  issuer_phone: s.issuerPhone,
                  issuer_address_street: s.issuerAddressStreet,
                  issuer_address_number: s.issuerAddressNumber,
                  issuer_address_neighborhood: s.issuerAddressNeighborhood,
                  issuer_address_city: s.issuerAddressCity,
                  issuer_address_state: s.issuerAddressState,
                  issuer_address_zip: s.issuerAddressZip,
                  issuer_logo_url: s.issuerLogoUrl
                }, { onConflict: 'user_id' });
              }}
              onBack={() => setView('DASHBOARD')}
            />
          </motion.div>
        )}

        {view === 'SETTINGS' && (
          <motion.div key="settings" variants={viewVariants} initial="initial" animate="animate" exit="exit" className="space-y-6">
            <Settings
              settings={settings}
              user={currentUser}
              onSave={async (s) => {
                if (!currentUser) return;
                setSettings(s);
                const { error } = await supabase.from('settings').upsert({
                  user_id: currentUser.id,
                  theme: s.theme,
                  default_company_percent: s.defaultCompanyPercent,
                  default_driver_percent: s.defaultDriverPercent,
                  default_reserve_percent: s.defaultReservePercent,
                  monthly_goal: s.monthlyGoal,
                  issuer_name: s.issuerName,
                  issuer_doc: s.issuerDoc,
                  issuer_phone: s.issuerPhone,
                  issuer_address_street: s.issuerAddressStreet,
                  issuer_address_number: s.issuerAddressNumber,
                  issuer_address_neighborhood: s.issuerAddressNeighborhood,
                  issuer_address_city: s.issuerAddressCity,
                  issuer_address_state: s.issuerAddressState,
                  issuer_address_zip: s.issuerAddressZip,
                  issuer_logo_url: s.issuerLogoUrl
                }, { onConflict: 'user_id' });

                if (error) {
                  console.error("Error saving settings to Supabase:", error);
                  throw error;
                }
              }}
              onNavigate={setView}
              onUpdateUser={async (u) => {
                // We refresh profile to get latest data from DB (changes_used, url)
                if (currentUser) fetchUserProfile(currentUser.id);
              }}
            />
            <div className="px-4 pb-20">
              <button
                onClick={handleLogout}
                className="w-full py-3 rounded-xl border-2 border-red-100 text-red-600 font-bold hover:bg-red-50 dark:border-red-900/30 dark:bg-red-900/10 dark:text-red-400 transition-colors"
              >
                Sair da Conta
              </button>
            </div>
          </motion.div>
        )}

        {view === 'REFERRALS' && currentUser && (
          <motion.div key="referrals" variants={viewVariants} initial="initial" animate="animate" exit="exit">
            <ReferralSystem
              user={currentUser}
            />
          </motion.div>
        )}

        {view === 'SUPPORT' && (
          <motion.div key="support" variants={viewVariants} initial="initial" animate="animate" exit="exit">
            <Support user={currentUser!} onBack={() => setView('SETTINGS')} />
          </motion.div>
        )}

        {showSuccessModal && (
          <PaymentSuccessModal onClose={() => setShowSuccessModal(false)} />
        )}

        {showPrivacyModal && currentUser && (
          <PrivacyModal
            userId={currentUser.id}
            onAccept={() => {
              setShowPrivacyModal(false);
              // Update local user state instantly to prevent flicker
              setCurrentUser(prev => prev ? ({ ...prev, privacy_accepted: true }) : null);
            }}
          />
        )}

        {view === 'FREIGHT_INTEGRATION' && (
          <FreightIntegration
            freights={freights}
            ofretejaFreights={ofretejaFreights}
            onApprove={handleApproveOFreteja}
            onReject={handleRejectOFreteja}
            onCancel={handleCancelOFreteja}
            onBack={() => setView('DASHBOARD')}
          />
        )}

        {view === 'CLIENTS' && (
          <motion.div key="clients" variants={viewVariants} initial="initial" animate="animate" exit="exit">
            <Clients
              clients={clients}
              onSaveClient={handleSaveClient}
              onDeleteClient={handleDeleteClient}
              onBack={() => setView('DASHBOARD')}
            />
          </motion.div>
        )}

        {view === 'FLEET' && (
          <motion.div key="fleet" variants={viewVariants} initial="initial" animate="animate" exit="exit">
            <Fleet
              vehicles={vehicles}
              onAddVehicle={async (v) => {
                if (!currentUser) return;
                const { error } = await supabase.from('vehicles').insert([{ ...v, user_id: currentUser.id }]);
                if (error) throw error;
                fetchData();
              }}
              onEditVehicle={async (v) => {
                const { error } = await supabase.from('vehicles').update({
                  plate: v.plate,
                  brand: v.brand,
                  model: v.model,
                  year: v.year,
                  current_km: v.current_km
                }).eq('id', v.id);
                if (error) throw error;
                fetchData();
              }}
              onDeleteVehicle={async (id) => {
                const { error } = await supabase.from('vehicles').delete().eq('id', id);
                if (error) throw error;
                fetchData();
              }}
              onViewDetails={(v) => { /* Could implement details view later */ }}
              onBack={() => setView('DASHBOARD')}
            />
          </motion.div>
        )}

        {view === 'MAINTENANCE' && (
          <motion.div key="maintenance" variants={viewVariants} initial="initial" animate="animate" exit="exit">
            <MaintenanceLogs
              logs={maintenanceLogs}
              vehicles={vehicles}
              onAddLog={async (l) => {
                if (!currentUser) return;
                const { error } = await supabase.from('maintenance_logs').insert([{ ...l, user_id: currentUser.id }]);
                if (error) throw error;
                fetchData();
              }}
              onDeleteLog={async (id) => {
                const { error } = await supabase.from('maintenance_logs').delete().eq('id', id);
                if (error) throw error;
                fetchData();
              }}
              onBack={() => setView('DASHBOARD')}
            />
          </motion.div>
        )}

        {view === 'DOCUMENTS' && currentUser && (
          <motion.div key="documents" variants={viewVariants} initial="initial" animate="animate" exit="exit">
            <DocumentVault
              documents={documents}
              vehicles={vehicles}
              user={currentUser}
              onAddDocument={async (d) => {
                if (!currentUser) return;
                const { error } = await supabase.from('documents').insert([{ ...d, user_id: currentUser.id }]);
                if (error) throw error;
                fetchData();
              }}
              onDeleteDocument={async (id) => {
                // Delete from Storage first if image exists? 
                // For now, simple DB delete.
                const { error } = await supabase.from('documents').delete().eq('id', id);
                if (error) throw error;
                fetchData();
              }}
              onBack={() => setView('DASHBOARD')}
            />
          </motion.div>
        )}

        {view === 'NOTICES' && currentUser && (
          <motion.div key="notices" variants={viewVariants} initial="initial" animate="animate" exit="exit">
            <NoticesCenter user={currentUser} onBack={() => setView('DASHBOARD')} />
          </motion.div>
        )}
      </AnimatePresence>

      {currentUser && (
        <MandatoryNoticeModal user={currentUser} />
      )}
      <UpgradeModal
        isOpen={upgradeModal.open}
        title={upgradeModal.title}
        description={upgradeModal.description}
        onClose={() => setUpgradeModal(prev => ({ ...prev, open: false }))}
        onUpgrade={() => {
          setUpgradeModal(prev => ({ ...prev, open: false }));
          setView('PAYMENT');
        }}
      />
      {showFreightNotice && (
        <FreightNoticeModal onClose={() => setShowFreightNotice(false)} />
      )}
    </Layout>

  );
};