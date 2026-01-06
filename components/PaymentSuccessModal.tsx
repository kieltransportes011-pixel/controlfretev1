import React from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { CheckCircle2, Crown, PartyPopper } from 'lucide-react';

interface PaymentSuccessModalProps {
    onClose: () => void;
}

export const PaymentSuccessModal: React.FC<PaymentSuccessModalProps> = ({ onClose }) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fadeIn">
            <Card className="w-full max-w-md bg-white dark:bg-slate-900 border-none relative overflow-hidden shadow-2xl p-0">

                {/* Background Decoration */}
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-green-500 to-emerald-600 opacity-10 dark:opacity-20" />

                <div className="p-8 text-center relative z-10">
                    <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6 ring-8 ring-green-50 dark:ring-green-900/10">
                        <div className="relative">
                            <Crown className="w-10 h-10 text-green-600 dark:text-green-400 absolute -top-1 -right-1" strokeWidth={2.5} />
                            <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
                        </div>
                    </div>

                    <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2 uppercase tracking-tight">
                        Pagamento Confirmado!
                    </h2>

                    <div className="flex items-center justify-center gap-2 mb-6">
                        <PartyPopper className="w-5 h-5 text-yellow-500 animate-bounce" />
                        <p className="text-lg font-bold text-brand">Você agora é PRO</p>
                        <PartyPopper className="w-5 h-5 text-yellow-500 animate-bounce" />
                    </div>

                    <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
                        Sua assinatura anual foi ativada com sucesso. Aproveite o acesso ilimitado a todos os recursos exclusivos do Control Frete.
                    </p>

                    <Button
                        onClick={onClose}
                        className="w-full py-4 text-base font-bold bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/20 transition-all transform hover:scale-[1.02]"
                    >
                        Começar a Usar
                    </Button>
                </div>
            </Card>
        </div>
    );
};
