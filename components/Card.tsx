import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, className = '', onClick }) => {
  // Verifica se a classe passada contém um override de cor de fundo
  const hasBgOverride = className.includes('bg-');
  const bgClass = hasBgOverride ? '' : 'bg-white dark:bg-slate-900';

  return (
    <div
      onClick={onClick}
      className={`${bgClass} rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800 transition-all duration-300 hover:shadow-md dark:hover:border-slate-700 ${className}`}
    >
      {children}
    </div>
  );
};