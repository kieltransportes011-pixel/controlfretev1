export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const formatDate = (dateString: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString + 'T12:00:00'); // Fix timezone offset issues by setting noon
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
};

export const formatMonthYear = (date: Date): string => {
  return new Intl.DateTimeFormat('pt-BR', {
    month: 'long',
    year: 'numeric',
  }).format(date);
};

export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

export const generateReferralCode = (name: string): string => {
  // Extrai apenas o primeiro nome para um código mais curto e limpo
  const firstName = name.trim().split(' ')[0].normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
  // Apenas 2 dígitos para manter o código curto
  const randomNum = Math.floor(10 + Math.random() * 90); 
  return `${firstName}${randomNum}`;
};

export const getWeekNumber = (d: Date): number => {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return weekNo;
};

// Calendar Helpers
export const getDaysInMonth = (month: number, year: number): number => {
  return new Date(year, month + 1, 0).getDate();
};

export const getFirstDayOfMonth = (month: number, year: number): number => {
  return new Date(year, month, 1).getDay();
};

export const getCalendarDays = (month: number, year: number) => {
  const daysInMonth = getDaysInMonth(month, year);
  const firstDay = getFirstDayOfMonth(month, year);
  
  const days = [];
  
  // Empty slots for previous month
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  
  // Days of current month
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(year, month, i));
  }
  
  return days;
};

// --- Auth Utilities ---

export const maskCPF = (value: string) => {
  return value
    .replace(/\D/g, '') // Remove non-digits
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1');
};

export const validateCPF = (cpf: string): boolean => {
  const strCPF = cpf.replace(/[^\d]+/g, '');
  if (strCPF.length !== 11 || /^(\d)\1+$/.test(strCPF)) return false;

  let sum = 0;
  let remainder;

  for (let i = 1; i <= 9; i++) sum += parseInt(strCPF.substring(i - 1, i)) * (11 - i);
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(strCPF.substring(9, 10))) return false;

  sum = 0;
  for (let i = 1; i <= 10; i++) sum += parseInt(strCPF.substring(i - 1, i)) * (12 - i);
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(strCPF.substring(10, 11))) return false;

  return true;
};

// Simple hash simulation for frontend demo
export const hashPassword = async (password: string): Promise<string> => {
  const msgBuffer = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};