// Limites do plano gratuito (definidos em 28/11/2026).
// Quem está no teste PRO de 7 dias ou é PRO não tem esses limites.
export const FREE_MONTHLY_FREIGHTS = 5;
export const FREE_HISTORY_DAYS = 30;

// Fretes cadastrados no mês atual (pela data de cadastro; se não tiver, pela data do frete).
export const countFreightsThisMonth = (freights: Array<{ created_at?: string; date: string }>, now = new Date()) =>
    freights.filter((f) => {
        const d = new Date(f.created_at || f.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;

// Data mais antiga (YYYY-MM-DD) que o histórico do plano gratuito mostra.
export const freeHistoryCutoff = (now = new Date()) => {
    const d = new Date(now);
    d.setDate(d.getDate() - FREE_HISTORY_DAYS);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
