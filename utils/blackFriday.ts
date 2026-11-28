// Black Friday 2026: plano PRO pela metade do preço até 30/11 às 23:59 (horário de Brasília).
// Tudo que usa este arquivo volta sozinho ao preço normal em 01/12/2026 00:00.
// O valor que é COBRADO de verdade vem do servidor (supabase/functions/_shared/pricing.ts),
// que usa a mesma data. Se mudar a data aqui, mude lá também.
export const BLACK_FRIDAY_END = new Date('2026-12-01T00:00:00-03:00').getTime();

export const isBlackFridayActive = (now: number = Date.now()) => now < BLACK_FRIDAY_END;

export const getPlanPrices = (now: number = Date.now()) => {
    const bf = isBlackFridayActive(now);
    return {
        blackFriday: bf,
        monthly: bf ? 'R$ 4,95' : 'R$ 9,90',
        monthlyOld: bf ? 'R$ 9,90' : undefined,
        annual: bf ? 'R$ 24,99' : 'R$ 49,99',
        annualOld: bf ? 'R$ 49,99' : undefined,
        annualPerMonth: bf ? 'R$ 2,08' : 'R$ 4,17',
    };
};
