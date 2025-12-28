import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'success';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  fullWidth = false, 
  className = '', 
  ...props 
}) => {
  const baseStyles = "py-3.5 px-6 rounded-xl font-roboto font-medium transition-all duration-200 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-40 disabled:active:scale-100 disabled:cursor-not-allowed uppercase tracking-wide text-xs";
  
  const variants = {
    primary: "bg-brand text-white shadow-md shadow-brand/20 hover:bg-brand-hover dark:bg-brand-500",
    secondary: "bg-brand-secondary text-white hover:bg-brand-secondary/90 shadow-md shadow-brand-secondary/20",
    outline: "border border-slate-200 text-base-text hover:border-brand-secondary hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800",
    danger: "bg-accent-error/10 text-accent-error hover:bg-accent-error/20 dark:bg-red-900/20 dark:text-red-400",
    success: "bg-accent-success/10 text-accent-success hover:bg-accent-success/20"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};