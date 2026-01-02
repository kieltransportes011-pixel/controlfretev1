import React from 'react';
import { ViewState } from '../types';
import { LayoutGrid, List, Settings, Wallet } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentView, onNavigate }) => {
  // Telas que não devem exibir o menu inferior
  const hideNavViews: ViewState[] = ['ADD_FREIGHT', 'ADD_EXPENSE', 'GOALS', 'REFERRAL', 'PAYMENT', 'CALCULATOR'];
  const shouldShowNav = !hideNavViews.includes(currentView);

  return (
    <div className="min-h-screen bg-base-bg dark:bg-slate-900 text-base-text dark:text-slate-100 font-sans w-full max-w-screen-xl mx-auto relative shadow-2xl transition-colors duration-200">
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 px-4 py-3 flex items-center justify-center transition-colors duration-200">
        <img
          src="/logo.png"
          alt="Control Frete"
          className="h-10 w-auto max-w-[180px] object-contain dark:brightness-110"
        />
      </header>

      <main className="p-4 min-h-screen w-full">
        {children}
      </main>

      {/* Bottom Navigation */}
      {shouldShowNav && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 px-4 py-3 flex justify-between items-center z-40 w-full max-w-screen-xl mx-auto shadow-[0_-8px_20px_-8px_rgba(0,0,0,0.08)] transition-colors duration-200">
          <button
            onClick={() => onNavigate('DASHBOARD')}
            className={`flex flex-col items-center gap-1.5 transition-all flex-1 ${currentView === 'DASHBOARD' ? 'text-brand-secondary scale-105' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
          >
            <LayoutGrid className="w-5 h-5" strokeWidth={currentView === 'DASHBOARD' ? 2.5 : 2} />
            <span className="text-[10px] font-roboto font-medium uppercase tracking-wider">Início</span>
          </button>

          <button
            onClick={() => onNavigate('RECEIVABLES')}
            className={`flex flex-col items-center gap-1.5 transition-all flex-1 ${currentView === 'RECEIVABLES' ? 'text-brand-secondary scale-105' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
          >
            <Wallet className="w-5 h-5" strokeWidth={currentView === 'RECEIVABLES' ? 2.5 : 2} />
            <span className="text-[10px] font-roboto font-medium uppercase tracking-wider">Contas</span>
          </button>

          <button
            onClick={() => onNavigate('HISTORY')}
            className={`flex flex-col items-center gap-1.5 transition-all flex-1 ${currentView === 'HISTORY' ? 'text-brand-secondary scale-105' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
          >
            <List className="w-5 h-5" strokeWidth={currentView === 'HISTORY' ? 2.5 : 2} />
            <span className="text-[10px] font-roboto font-medium uppercase tracking-wider">Histórico</span>
          </button>

          <button
            onClick={() => onNavigate('SETTINGS')}
            className={`flex flex-col items-center gap-1.5 transition-all flex-1 ${currentView === 'SETTINGS' ? 'text-brand-secondary scale-105' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
          >
            <Settings className="w-5 h-5" strokeWidth={currentView === 'SETTINGS' ? 2.5 : 2} />
            <span className="text-[10px] font-roboto font-medium uppercase tracking-wider">Ajustes</span>
          </button>
        </nav>
      )}
    </div>
  );
};