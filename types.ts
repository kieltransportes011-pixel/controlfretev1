
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
  referralCode?: string;
  referredBy?: string;
  referralBalance?: number;
  referralCount?: number;
  profile_photo_url?: string;
  profile_photo_changes_used?: number;
  premiumUntil?: string; // ISO Date string
  lastPaymentId?: string;
  trialStart?: string; // ISO Date string
  trialEnd?: string; // ISO Date string
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

export type ViewState = 'DASHBOARD' | 'ADD_FREIGHT' | 'ADD_EXPENSE' | 'HISTORY' | 'RECEIVABLES' | 'SETTINGS' | 'CALCULATOR' | 'AGENDA' | 'REFERRAL' | 'GOALS' | 'PAYMENT';

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
}