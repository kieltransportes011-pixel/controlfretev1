
import React, { useEffect } from 'react';
import { Payment } from '@mercadopago/sdk-react';
import { supabase } from '../supabase';
import { Loader2 } from 'lucide-react';

interface InternalCheckoutProps {
    amount: number;
    description: string;
    onSuccess: (id: string) => void;
    onError: (error: string) => void;
    userEmail: string;
}

const MP_PUBLIC_KEY = import.meta.env.VITE_MP_PUBLIC_KEY;

export const InternalCheckout: React.FC<InternalCheckoutProps> = ({
    amount,
    description,
    onSuccess,
    onError,
    userEmail
}) => {

    useEffect(() => {
        if (!MP_PUBLIC_KEY) {
            console.error("VITE_MP_PUBLIC_KEY is missing!");
            onError("Configuração de pagamento incompleta (Chave Pública ausente).");
        }
    }, [onError]);

    if (!MP_PUBLIC_KEY) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-red-500">
                <p>Erro de Configuração: Chave Pública não encontrada.</p>
            </div>
        );
    }

    const initialization = {
        amount: amount,
        preferenceId: "<PREFERENCE_ID>", // Not needed for transparent payment if we handle processPayment
    };

    const customization = {
        paymentMethods: {
            ticket: "all",
            bankTransfer: "all",
            creditCard: "all",
            debitCard: "all",
            mercadoPago: "all",
        },
        visual: {
            style: {
                theme: 'bootstrap' as const, // 'default' | 'dark' | 'bootstrap' | 'flat'
            },
        },
    };


    const onSubmit = async ({ formData }: any) => {
        try {
            // Send data to our backend to process payment
            const { data, error } = await supabase.functions.invoke('create-payment', {
                body: {
                    ...formData,
                    description,
                    payer: {
                        ...formData.payer,
                        email: userEmail
                    }
                }
            });

            if (error) throw error;

            if (data && (data.status === 'approved' || data.status === 'in_process')) {
                onSuccess(data.id);
            } else {
                onError(data?.message || "Pagamento não aprovado.");
            }

        } catch (err: any) {
            console.error('Payment Error:', err);
            onError(err.message || "Erro ao processar pagamento.");
        }
    };

    return (
        <div className="w-full max-w-xl mx-auto bg-white p-4 rounded-lg">
            <Payment
                initialization={{ amount }}
                customization={customization}
                onSubmit={onSubmit}
                onError={(error) => console.error(error)}
            />
        </div>
    );
};
