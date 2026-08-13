import React from 'react';
import { ViewState } from '../types';
import { LayoutGrid, List, Settings, Wallet, Truck, Users } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname;

  // Telas que não devem exibir o menu inferior
  const hideNavPaths = ['/add-freight', '/add-expense', '/goals', '/payment', '/calculator'];
  const shouldShowNav = !hideNavPaths.includes(path);

  const getIsActive = (targetPath: string) => {
    if (targetPath === '/' && path === '/') return true;
    if (targetPath !== '/' && path.startsWith(targetPath)) return true;
    return false;
  };

  return (
    <div className="min-h-screen bg-base-bg dark:bg-slate-900 text-base-text dark:text-slate-100 font-sans w-full max-w-screen-xl mx-auto relative shadow-2xl transition-colors duration-200">
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 px-4 py-3 flex items-center justify-center transition-colors duration-200">
        <img
          src="/logo-official.png"
          alt="Control Frete"
          className="h-10 w-auto max-w-[180px] object-contain dark:brightness-110"
        />
      </header>

      <main className="p-4 min-h-screen w-full">
        {children}
      </main>

      {/* Bottom Navigation */}
      {shouldShowNav && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-slate-800/90 backdrop-blur-lg border-t border-slate-100 dark:border-slate-700 px-2 py-3 flex justify-between items-center z-40 w-full max-w-screen-xl mx-auto shadow-[0_-8px_20px_-8px_rgba(0,0,0,0.08)] transition-colors duration-200">
          <button
            onClick={() => navigate('/')}
            className={`flex flex-col items-center gap-1 transition-all flex-1 ${getIsActive('/') ? 'text-blue-600 dark:text-blue-400 scale-105' : 'text-slate-400 hover:text-blue-500 dark:hover:text-blue-400'}`}
          >
            <LayoutGrid className="w-5 h-5" strokeWidth={getIsActive('/') ? 2.5 : 2} />
            <span className="text-[9px] font-roboto font-medium uppercase tracking-wider">Início</span>
          </button>

          <button
            onClick={() => navigate('/receivables')}
            className={`flex flex-col items-center gap-1 transition-all flex-1 ${getIsActive('/receivables') ? 'text-emerald-600 dark:text-emerald-400 scale-105' : 'text-slate-400 hover:text-emerald-500 dark:hover:text-emerald-400'}`}
          >
            <Wallet className="w-5 h-5" strokeWidth={getIsActive('/receivables') ? 2.5 : 2} />
            <span className="text-[9px] font-roboto font-medium uppercase tracking-wider">Contas</span>
          </button>

          <button
            onClick={() => navigate('/history')}
            className={`flex flex-col items-center gap-1 transition-all flex-1 ${getIsActive('/history') ? 'text-orange-600 dark:text-orange-400 scale-105' : 'text-slate-400 hover:text-orange-500 dark:hover:text-orange-400'}`}
          >
            <List className="w-5 h-5" strokeWidth={getIsActive('/history') ? 2.5 : 2} />
            <span className="text-[9px] font-roboto font-medium uppercase tracking-wider">Histórico</span>
          </button>

          <button
            onClick={() => navigate('/settings')}
            className={`flex flex-col items-center gap-1 transition-all flex-1 ${getIsActive('/settings') ? 'text-slate-800 dark:text-white scale-105' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
          >
            <Settings className="w-5 h-5" strokeWidth={getIsActive('/settings') ? 2.5 : 2} />
            <span className="text-[9px] font-roboto font-medium uppercase tracking-wider">Ajustes</span>
          </button>
        </nav>
      )}
    </div>
  );
};