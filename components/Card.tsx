import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, className = '', onClick }) => {
  // Verifica se a classe passada contém um override de cor de fundo
  const hasBgOverride = className.includes('bg-');
  const bgClass = hasBgOverride ? '' : 'bg-white dark:bg-slate-800';

  return (
    <div 
      onClick={onClick}
      className={`${bgClass} rounded-2xl p-5 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.06)] border border-slate-100 dark:border-slate-700 transition-all duration-200 ${className}`}
    >
      {children}
    </div>
  );
};