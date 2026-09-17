import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmOptions {
    title?: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    danger?: boolean;
}

type ConfirmInput = ConfirmOptions | string;

interface ConfirmContextData {
    confirm: (options: ConfirmInput) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextData>({} as ConfirmContextData);

interface PendingConfirm {
    options: ConfirmOptions;
    resolve: (value: boolean) => void;
}

export const ConfirmProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [pending, setPending] = useState<PendingConfirm | null>(null);

    const confirm = useCallback((input: ConfirmInput) => {
        const options: ConfirmOptions = typeof input === 'string' ? { message: input } : input;
        return new Promise<boolean>((resolve) => {
            setPending({ options, resolve });
        });
    }, []);

    const close = (result: boolean) => {
        pending?.resolve(result);
        setPending(null);
    };

    return (
        <ConfirmContext.Provider value={{ confirm }}>
            {children}
            {pending && (
                <div
                    className="fixed inset-0 z-[9998] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
                    onClick={() => close(false)}
                >
                    <div
                        className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-scaleUp"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-start gap-3 mb-5">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${pending.options.danger ? 'bg-red-100 text-red-500 dark:bg-red-900/30' : 'bg-brand/10 text-brand'}`}>
                                <AlertTriangle className="w-5 h-5" />
                            </div>
                            <div>
                                {pending.options.title && (
                                    <h3 className="font-bold text-base text-slate-800 dark:text-white mb-1">{pending.options.title}</h3>
                                )}
                                <p className="text-slate-600 dark:text-slate-300 text-sm">{pending.options.message}</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => close(false)}
                                className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                            >
                                {pending.options.cancelLabel || 'Cancelar'}
                            </button>
                            <button
                                onClick={() => close(true)}
                                className={`flex-1 py-3 rounded-xl text-white font-bold text-sm transition-colors ${pending.options.danger ? 'bg-red-500 hover:bg-red-600' : 'bg-brand hover:bg-brand-hover'}`}
                            >
                                {pending.options.confirmLabel || 'Confirmar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </ConfirmContext.Provider>
    );
};

export const useConfirm = () => {
    const context = useContext(ConfirmContext);
    if (!context) {
        throw new Error('useConfirm must be used within a ConfirmProvider');
    }
    return context.confirm;
};
