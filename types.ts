
export interface Freight {
  id: string;
  date: string; // ISO Date string
  client: string;
  totalValue: number;

  // Distribution values (Calculated based on Total)
  companyValue: number;
  driverValue: number;
  reserveValue: number;

  // Percentages
  companyPercent: number;
  driverPercent: number;
  reservePercent: number;

  // Payment Status
  status: 'PAID' | 'PARTIAL' | 'PENDING';
  receivedValue: number; // Amount actually received (Cash flow)
  pendingValue: number;  // Amount to receive (Receivable)
  dueDate?: string;      // Date to receive the pending amount
}

export interface OFretejaFreight {
  id: string;
  empresa_id: string;
  origin_cep: string;
  origin_address: string;
  origin_number: string;
  origin_complement?: string;
  delivery_cep: string;
  delivery_address: string;
  delivery_number: string;
  delivery_complement?: string;
  stops: Array<{ cep: string; address: string; number: string; complement?: string }>;
  vehicle_category_id: string;
  weight: number;
  contact_phone?: string;
  date: string;
  description?: string;
  status: 'AGUARDANDO_ANALISE' | 'AGUARDANDO_APROVACAO' | 'APROVADO' | 'REPROVADO' | 'IMPORTED' | 'CANCELLED';
  created_at: string;
  distance_km?: number;
  estimated_value?: number;
  rejection_reason?: string;
  // Extended info for join
  empresas_ofreteja?: { name: string; email: string; phone?: string };
  categorias_veiculos?: { name: string; capacity: string };
}

export interface Booking {
  id: string;
  date: string;
  client: string;
  time?: string;
  estimatedValue?: number;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
}

export type ExpenseSource = 'COMPANY' | 'DRIVER' | 'RESERVE';

export type ExpenseCategory = 'FUEL' | 'MAINTENANCE' | 'TOLL' | 'FOOD' | 'OTHER';

export interface Expense {
  id: string;
  date: string;
  description: string;
  value: number;
  source: ExpenseSource;
  category?: ExpenseCategory;
}

export interface User {
  id: string;
  name: string;
  cpf: string;
  email: string;
  password: string;
  createdAt: string; // ISO Date do cadastro
  isPremium: boolean; // Status da assinatura
  plano?: 'free' | 'pro';
  status_assinatura?: 'ativa' | 'cancelada' | 'inadimplente';

  // Referral System
  profile_photo_url?: string;
  profile_photo_changes_used?: number;
  premiumUntil?: string; // ISO Date string
  lastPaymentId?: string;
  trialStart?: string; // ISO Date string
  trialEnd?: string; // ISO Date string
  role?: 'user' | 'admin';
  account_status?: 'active' | 'suspended' | 'banned';
  privacy_accepted?: boolean;
  privacy_accepted_at?: string; // ISO Date string
  referrer_id?: string;
  referral_code?: string;
}

export interface GoalHistoryEntry {
  month: string; // YYYY-MM
  goal: number;
  achieved: number;
}

export interface AppSettings {
  defaultCompanyPercent: number;
  defaultDriverPercent: number;
  defaultReservePercent: number;
  theme: 'light' | 'dark';
  monthlyGoal?: number;
  monthlyGoalDeadline?: string;
  goalHistory?: GoalHistoryEntry[];

  // Receipt Issuer Details
  issuerName?: string;
  issuerDoc?: string;
  issuerPhone?: string;

  // Address Details
  issuerAddressStreet?: string;
  issuerAddressNumber?: string;
  issuerAddressNeighborhood?: string;
  issuerAddressCity?: string;
  issuerAddressState?: string;
  issuerAddressZip?: string;
}

export type ViewState = 'DASHBOARD' | 'ADD_FREIGHT' | 'ADD_EXPENSE' | 'HISTORY' | 'RECEIVABLES' | 'SETTINGS' | 'CALCULATOR' | 'AGENDA' | 'GOALS' | 'PAYMENT' | 'ADMIN' | 'SUPPORT' | 'NOTICES' | 'REFERRALS' | 'FREIGHT_INTEGRATION';

export interface DashboardStats {
  monthTotal: number;
  weekTotal: number;
  totalCompany: number;
  totalDriver: number;
  totalReserve: number;
  totalPending: number;
}

export interface AccountPayable {
  id: string;
  description: string;
  value: number;
  due_date: string; // ISO Date "YYYY-MM-DD"
  status: 'aberto' | 'pago';
  recurrence: 'unica' | 'mensal' | 'semanal';
  user_id: string;
  payment_source?: ExpenseSource;
}

export interface SupportTicket {
  id: string;
  user_id: string;
  title: string;
  category: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high';
  admin_reply?: string;
  attachment_url?: string;
  created_at: string;
  updated_at: string;
}

export interface AdminLog {
  id: string;
  admin_id: string;
  action: string;
  target_type: 'user' | 'support_ticket' | 'system';
  target_id?: string;
  description: string;
  created_at: string;
}

export interface PlatformNotice {
  id: string;
  title: string;
  summary?: string;
  content: string;
  level: 'info' | 'important' | 'critical';
  is_mandatory: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface NoticeRead {
  id: string;
  notice_id: string;
  user_id: string;
  read_at: string;
}

export interface AccountActivityLog {
  id: string;
  user_id: string;
  action: string;
  actor: 'user' | 'admin' | 'system';
  created_at: string;
}
