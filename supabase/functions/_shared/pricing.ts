// Preços e duração dos planos PRO. É daqui que sai o valor cobrado no Mercado Pago.
//
// Black Friday 2026: metade do preço até 30/11 às 23:59 (horário de Brasília).
// Em 01/12/2026 00:00 volta sozinho ao preço normal. A mesma data está em
// utils/blackFriday.ts (o que aparece nas telas). Se mudar aqui, mude lá também.
export const BLACK_FRIDAY_END = new Date('2026-12-01T00:00:00-03:00').getTime();

export const isBlackFridayActive = (now: number = Date.now()) => now < BLACK_FRIDAY_END;

export type PlanType = 'monthly' | 'annual' | 'annual_promo';

export const getCheckoutItem = (planType: string, now: number = Date.now()) => {
    const bf = isBlackFridayActive(now);
    const suffix = bf ? ' (Black Friday)' : '';

    if (planType === 'monthly') {
        return {
            id: 'pro_monthly',
            title: `Assinatura Mensal Control Frete Pro${suffix}`,
            description: 'Acesso completo - 1 Mês',
            quantity: 1,
            currency_id: 'BRL',
            unit_price: bf ? 4.95 : 9.90,
        };
    }

    // 'annual' e 'annual_promo' (padrão) são o mesmo plano anual.
    return {
        id: planType === 'annual' ? 'pro_annual' : 'pro_annual_promo',
        title: `Assinatura Anual Control Frete Pro${suffix}`,
        description: 'Acesso completo - 1 Ano',
        quantity: 1,
        currency_id: 'BRL',
        unit_price: bf ? 24.99 : 49.99,
    };
};

// Descobre qual plano foi pago, a partir dos dados do pagamento no Mercado Pago.
// Pagamentos antigos (sem essa informação) continuam valendo como anual.
export const getPaidPlan = (paymentData: any): 'monthly' | 'annual' => {
    const fromMetadata = paymentData?.metadata?.plan;
    const itemId = paymentData?.additional_info?.items?.[0]?.id;
    if (fromMetadata === 'monthly' || itemId === 'pro_monthly') return 'monthly';
    return 'annual';
};

// Até quando o PRO vale: 1 mês para o mensal, 1 ano para o anual,
// contando da data de aprovação do pagamento (assim, reprocessar o mesmo
// pagamento não estica o prazo).
export const getPremiumUntil = (paymentData: any): Date => {
    const approved = paymentData?.date_approved ? new Date(paymentData.date_approved) : new Date();
    const until = new Date(approved);
    if (getPaidPlan(paymentData) === 'monthly') {
        until.setMonth(until.getMonth() + 1);
    } else {
        until.setFullYear(until.getFullYear() + 1);
    }
    return until;
};
