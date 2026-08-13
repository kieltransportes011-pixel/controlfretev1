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
        <nav className="fixed bottom-0 left-0 right-0 glass border-t px-2 py-2.5 flex justify-between items-center z-40 w-full max-w-screen-xl mx-auto transition-colors duration-200">
          {[
            { to: '/', icon: LayoutGrid, label: 'Início' },
            { to: '/receivables', icon: Wallet, label: 'Contas' },
            { to: '/history', icon: List, label: 'Histórico' },
            { to: '/settings', icon: Settings, label: 'Ajustes' },
          ].map(({ to, icon: Icon, label }) => {
            const active = getIsActive(to);
            return (
              <button
                key={to}
                onClick={() => navigate(to)}
                className="relative flex flex-col items-center gap-1 flex-1 py-1 group"
              >
                {active && (
                  <span className="absolute -top-2.5 h-1 w-6 rounded-full bg-brand dark:bg-brand-400" />
                )}
                <Icon
                  className={`w-5 h-5 transition-all ${active ? 'text-brand dark:text-brand-400 scale-110' : 'text-slate-400 group-hover:text-brand/70 dark:group-hover:text-brand-400/70'}`}
                  strokeWidth={active ? 2.5 : 2}
                />
                <span className={`text-[9px] font-roboto font-medium uppercase tracking-wider transition-colors ${active ? 'text-brand dark:text-brand-400' : 'text-slate-400'}`}>
                  {label}
                </span>
              </button>
            );
          })}
        </nav>
      )}
    </div>
  );
};