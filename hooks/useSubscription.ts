import { useMemo } from 'react';
import { User } from '../types';

export const useSubscription = (user: User | null) => {
    const subscriptionStatus = useMemo(() => {
        if (!user) return { daysRemaining: 0, isExpired: true, isActive: false, isPro: false };

        const now = new Date();

        // O PRO vale até premium_until. Sem data (PRO liberado manualmente), não vence.
        const notExpired = !user.premiumUntil || now <= new Date(user.premiumUntil);
        const isPro = user.plano === 'pro' && user.status_assinatura === 'ativa' && notExpired;
        const isPremium = (user.isPremium || isPro) && notExpired;

        // Trial Logic (7 days for Free users)
        let trialEndDate: Date;
        if (user.trialEnd) {
            trialEndDate = new Date(user.trialEnd);
        } else {
            const createdAt = new Date(user.createdAt);
            trialEndDate = new Date(createdAt);
            trialEndDate.setDate(trialEndDate.getDate() + 7);
        }

        const remainingTime = trialEndDate.getTime() - now.getTime();
        const daysRemaining = Math.max(0, Math.ceil(remainingTime / (1000 * 60 * 60 * 24)));

        const isTrialActive = remainingTime > 0;
        const isActive = isPremium || isTrialActive;

        return {
            daysRemaining: isPremium ? 365 : daysRemaining,
            isExpired: !isActive,
            isActive,
            isTrial: !isPremium && isTrialActive,
            isPro
        };
    }, [user]);

    return subscriptionStatus;
};
